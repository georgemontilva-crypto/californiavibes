import { DEFAULT_STORE, type StoreSettings } from "@shared/const";
import {
  isUsState,
  MAX_LINES_PER_ORDER,
  MAX_QTY_PER_LINE,
  parseStateList,
  shippingFor,
  subtotalOf,
  type OrderLine,
} from "@shared/store";
import { TRPCError } from "@trpc/server";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { ORDER_STATUSES, type Order } from "../../drizzle/schema";
import { adminAuthedProcedure, appRouterFactory, publicProc } from "../appTrpc";
import * as db from "../db";
import { sendOrderEmails, sendShippedEmail } from "../mailer";
import { chargeCard, isCardPaymentConfigured, publicPaymentConfig } from "../payments";
import { currentWholesale, priceFor } from "../wholesaleSession";

/* ─── Settings ────────────────────────────────────────────────────────────── */

function toCents(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

export async function storeSettings(): Promise<StoreSettings> {
  const s = await db.getSettings().catch(() => ({}) as Record<string, string>);
  return {
    labReportsUrl: s.labReportsUrl?.trim() || DEFAULT_STORE.labReportsUrl,
    shippingCents: toCents(s.shippingCents, DEFAULT_STORE.shippingCents),
    freeShippingOverCents: toCents(
      s.freeShippingOverCents,
      DEFAULT_STORE.freeShippingOverCents
    ),
    blockedStates:
      s.blockedStates !== undefined
        ? parseStateList(s.blockedStates)
        : DEFAULT_STORE.blockedStates,
    wholesaleMinCents: toCents(s.wholesaleMinCents, DEFAULT_STORE.wholesaleMinCents),
  };
}

/* ─── Order placement ─────────────────────────────────────────────────────── */

/** "CV-" + six digits. Retried on the rare collision. */
async function newOrderNumber(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const n = `CV-${randomInt(100000, 999999)}`;
    if (!(await db.getOrderByNumber(n))) return n;
  }
  throw new Error("Could not allocate an order number");
}

/** Ten checkouts an hour per address: enough for a real customer retrying a card. */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const recent = new Map<string, number[]>();
function allowCheckout(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(ip, hits);
    return false;
  }
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) {
    recent.forEach((times, key) => {
      if (times.every(t => now - t >= WINDOW_MS)) recent.delete(key);
    });
  }
  return true;
}

function parseLines(raw: string): OrderLine[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** The order as the admin sees it: lines parsed, nothing else hidden. */
function adminOrder(o: Order) {
  return { ...o, lines: parseLines(o.items) };
}

const text = (max: number) => z.string().trim().max(max);

const checkoutInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
      })
    )
    .min(1, "Your cart is empty")
    .max(MAX_LINES_PER_ORDER),
  email: text(320).email("That email doesn't look right"),
  phone: text(64).optional(),
  firstName: text(120).min(1, "First name is required"),
  lastName: text(120).min(1, "Last name is required"),
  address1: text(255).min(3, "Street address is required"),
  address2: text(255).optional(),
  city: text(120).min(1, "City is required"),
  state: z.string().trim().toUpperCase().refine(isUsState, "Pick a state"),
  zip: text(16).regex(/^\d{5}(-\d{4})?$/, "Use a 5-digit ZIP code"),
  note: text(1000).optional(),
  ageConfirmed: z.literal(true, { message: "Please confirm you are 21 or older" }),
  opaqueData: z
    .object({
      dataDescriptor: z.string().min(1).max(200),
      dataValue: z.string().min(1).max(4000),
    })
    .optional(),
});

export const storeRouter = appRouterFactory({
  /** Everything the storefront needs that isn't the catalogue. */
  config: publicProc.query(async () => {
    const s = await storeSettings();
    return { ...s, payment: publicPaymentConfig() };
  }),

  placeOrder: publicProc.input(checkoutInput).mutation(async ({ input, ctx }) => {
    const ip = (ctx.req.ip ?? "unknown").replace(/^::ffff:/, "");
    if (!allowCheckout(ip)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many checkout attempts. Please wait a while or contact us.",
      });
    }

    const settings = await storeSettings();
    const wholesale = await currentWholesale(ctx);
    if (settings.blockedStates.includes(input.state)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Sorry, we can't ship to ${input.state}.`,
      });
    }

    const cardMode = isCardPaymentConfigured();
    if (cardMode && !input.opaqueData) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Card details are missing." });
    }

    // Prices come from the database, never from the browser.
    const catalog = await db.listProducts({ publishedOnly: true });
    const byId = new Map(catalog.map(p => [p.id, p]));
    const merged = new Map<number, number>();
    for (const item of input.items) {
      merged.set(item.productId, Math.min(MAX_QTY_PER_LINE, (merged.get(item.productId) ?? 0) + item.qty));
    }

    const lines: OrderLine[] = [];
    for (const [productId, qty] of Array.from(merged.entries())) {
      const p = byId.get(productId);
      if (!p) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An item in your cart is no longer available. Please review your cart.",
        });
      }
      if (!p.inStock || p.priceCents <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${p.name} (${p.collection ?? ""}) is out of stock. Remove it to continue.`,
        });
      }
      lines.push({
        productId: p.id,
        slug: p.slug,
        name: p.name,
        line: p.collection,
        imageUrl: p.imageUrl,
        priceCents: priceFor(p, !!wholesale),
        qty,
      });
    }

    const subtotalCents = subtotalOf(lines);
    if (wholesale && settings.wholesaleMinCents > 0 && subtotalCents < settings.wholesaleMinCents) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Wholesale orders need a subtotal of at least $${(settings.wholesaleMinCents / 100).toFixed(2)}.`,
      });
    }
    const shippingCents = shippingFor(subtotalCents, settings);
    const totalCents = subtotalCents + shippingCents;
    const number = await newOrderNumber();

    const base = {
      number,
      channel: wholesale ? ("wholesale" as const) : ("retail" as const),
      wholesaleAccountId: wholesale?.id ?? null,
      paymentMethod: cardMode ? "card" : "manual",
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      firstName: input.firstName,
      lastName: input.lastName,
      address1: input.address1,
      address2: input.address2 || null,
      city: input.city,
      state: input.state,
      zip: input.zip,
      items: JSON.stringify(lines),
      subtotalCents,
      shippingCents,
      totalCents,
      customerNote: input.note || null,
      ip: ip.slice(0, 64),
    };

    // The row exists before the charge, so a charge that succeeds and a
    // database that then fails can't leave a payment with no order behind it.
    const order = await db.createOrder({ ...base, status: "pending" });
    if (!order) throw new Error("Order was not saved");

    let status: Order["status"] = "pending";
    if (cardMode && input.opaqueData) {
      const result = await chargeCard({
        amountCents: totalCents,
        orderNumber: number,
        description: lines.map(l => `${l.qty}x ${l.name} ${l.line ?? ""}`.trim()).join(", "),
        email: base.email,
        ip,
        opaqueData: input.opaqueData,
        address: {
          firstName: input.firstName,
          lastName: input.lastName,
          address: [input.address1, input.address2].filter(Boolean).join(" "),
          city: input.city,
          state: input.state,
          zip: input.zip,
        },
      });
      if (!result.ok) {
        await db.updateOrder(order.id, {
          status: "failed",
          paymentError: result.message.slice(0, 500),
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Payment not approved: ${result.message}`,
        });
      }
      status = result.heldForReview ? "pending" : "paid";
      await db.updateOrder(order.id, {
        status,
        transactionId: result.transactionId.slice(0, 64),
        cardLast4: result.cardLast4?.slice(0, 16) ?? null,
        adminNote: result.heldForReview
          ? "Authorize.net held this payment for review. Approve it in the Authorize.net dashboard."
          : null,
      });
    }

    void sendOrderEmails({ ...base, status, lines, businessName: wholesale?.businessName ?? null });

    return {
      number,
      status,
      paymentMethod: base.paymentMethod,
      email: base.email,
      lines,
      subtotalCents,
      shippingCents,
      totalCents,
    };
  }),

  /* ─── Admin ─────────────────────────────────────────────────────────────── */

  orders: adminAuthedProcedure
    .input(
      z.object({
        status: z.enum(ORDER_STATUSES).optional(),
        channel: z.enum(["retail", "wholesale"]).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const result = await db.listOrders({
        status: input.status,
        channel: input.channel,
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
      });
      return { total: result.total, rows: result.rows.map(adminOrder) };
    }),

  updateOrder: adminAuthedProcedure
    .input(
      z.object({
        id: z.number().int(),
        status: z.enum(ORDER_STATUSES).optional(),
        trackingNumber: text(128).nullable().optional(),
        adminNote: text(4000).nullable().optional(),
        /** Email the customer the tracking number when moving to "shipped". */
        notifyCustomer: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const current = await db.getOrderById(input.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      const { id, notifyCustomer, ...rest } = input;
      const updated = await db.updateOrder(id, rest);
      if (
        updated &&
        notifyCustomer &&
        rest.status === "shipped" &&
        current.status !== "shipped"
      ) {
        void sendShippedEmail(updated);
      }
      return { success: true, order: updated ? adminOrder(updated) : null };
    }),

  updateSettings: adminAuthedProcedure
    .input(
      z.object({
        labReportsUrl: z
          .string()
          .trim()
          .max(1000)
          .refine(v => v === "" || /^https:\/\//i.test(v), "Paste the full link, starting with https://"),
        shippingCents: z.number().int().min(0).max(100000),
        freeShippingOverCents: z.number().int().min(0).max(10000000),
        blockedStates: z.array(z.string()).max(60),
        wholesaleMinCents: z.number().int().min(0).max(100000000).default(0),
      })
    )
    .mutation(async ({ input }) => {
      await db.setSetting("labReportsUrl", input.labReportsUrl);
      await db.setSetting("shippingCents", String(input.shippingCents));
      await db.setSetting("freeShippingOverCents", String(input.freeShippingOverCents));
      await db.setSetting("blockedStates", parseStateList(input.blockedStates.join(",")).join(","));
      await db.setSetting("wholesaleMinCents", String(input.wholesaleMinCents));
      return { success: true, settings: await storeSettings() };
    }),
});
