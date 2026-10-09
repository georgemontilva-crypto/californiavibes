import { WHOLESALE_COOKIE_NAME } from "@shared/const";
import { isUsState } from "@shared/store";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { WHOLESALE_STATUSES, type WholesaleAccount } from "../../drizzle/schema";
import { appCookieOptions, hashPassword, signAppSession, verifyPassword } from "../auth";
import { adminAuthedProcedure, appRouterFactory, publicProc } from "../appTrpc";
import * as db from "../db";
import { notifyWholesaleApplication, sendWholesaleApproved } from "../mailer";
import { currentWholesale } from "../wholesaleSession";

/** What the buyer's own browser may see about their account. */
function publicAccount(a: WholesaleAccount) {
  return {
    id: a.id,
    email: a.email,
    businessName: a.businessName,
    contactName: a.contactName,
    phone: a.phone,
    state: a.state,
    status: a.status,
  };
}

/** Same throttle idea as the contact form: blunt scripts, not people. */
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();
function allow(key: string, max: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  if (list.length >= max) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) {
    hits.forEach((times, k) => {
      if (times.every(t => now - t >= WINDOW_MS)) hits.delete(k);
    });
  }
  return true;
}

const text = (max: number) => z.string().trim().max(max);

export const wholesaleRouter = appRouterFactory({
  /** The logged-in, approved wholesale account, or null. */
  me: publicProc.query(async ({ ctx }) => {
    const a = await currentWholesale(ctx);
    return a ? publicAccount(a) : null;
  }),

  submitApplication: publicProc
    .input(
      z.object({
        businessName: text(255).min(2, "Business name is required"),
        contactName: text(255).min(2, "Your name is required"),
        email: text(320).email("That email doesn't look right"),
        phone: text(64).min(7, "A phone number is required"),
        state: z.string().trim().toUpperCase().refine(isUsState, "Pick a state"),
        taxId: text(128).optional(),
        website: text(500).optional(),
        message: text(2000).optional(),
        password: z.string().min(8, "Use at least 8 characters").max(200),
        /** Honeypot: hidden from people, so a value means a script. */
        company: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.company) return { success: true };
      const ip = ctx.req.ip ?? "unknown";
      if (!allow(`apply:${ip}`, 5)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many applications from this connection. Try again in an hour.",
        });
      }
      const email = input.email.toLowerCase();
      if (await db.getWholesaleByEmail(email)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "There's already an application with that email. Log in, or contact us if you need help.",
        });
      }
      const account = {
        email,
        passwordHash: await hashPassword(input.password),
        businessName: input.businessName,
        contactName: input.contactName,
        phone: input.phone,
        state: input.state,
        taxId: input.taxId || null,
        website: input.website || null,
        message: input.message || null,
        status: "pending" as const,
      };
      await db.createWholesale(account);
      void notifyWholesaleApplication(account);
      return { success: true };
    }),

  login: publicProc
    .input(z.object({ email: z.string().trim().email(), password: z.string().min(1).max(200) }))
    .mutation(async ({ input, ctx }) => {
      const ip = ctx.req.ip ?? "unknown";
      if (!allow(`login:${ip}`, 20)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Try again later." });
      }
      const a = await db.getWholesaleByEmail(input.email.toLowerCase());
      if (!a || !(await verifyPassword(input.password, a.passwordHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Wrong email or password." });
      }
      if (a.status === "pending") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your application is still under review. We'll email you as soon as it's approved.",
        });
      }
      if (a.status !== "approved") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This wholesale account isn't active. Contact us for help.",
        });
      }
      await db.updateWholesale(a.id, { lastSignedIn: new Date() });
      const token = await signAppSession({ sub: a.id, kind: "wholesale", email: a.email });
      ctx.res.cookie(WHOLESALE_COOKIE_NAME, token, appCookieOptions(ctx.req));
      return { success: true, account: publicAccount(a) };
    }),

  logout: publicProc.mutation(({ ctx }) => {
    const { maxAge: _maxAge, ...opts } = appCookieOptions(ctx.req);
    ctx.res.clearCookie(WHOLESALE_COOKIE_NAME, opts);
    return { success: true };
  }),

  /* ─── Admin ─────────────────────────────────────────────────────────────── */

  adminList: adminAuthedProcedure.query(async () => {
    const rows = await db.listWholesale();
    return rows.map(({ passwordHash: _hash, ...rest }) => rest);
  }),

  adminUpdate: adminAuthedProcedure
    .input(
      z.object({
        id: z.number().int(),
        status: z.enum(WHOLESALE_STATUSES).optional(),
        adminNote: text(4000).nullable().optional(),
        /** Email the buyer when moving to "approved". */
        notify: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const current = await db.getWholesaleById(input.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      const { id, notify, ...rest } = input;
      const updated = await db.updateWholesale(id, rest);
      if (updated && notify && rest.status === "approved" && current.status !== "approved") {
        const siteUrl = `${ctx.req.protocol}://${ctx.req.get("host")}`;
        void sendWholesaleApproved({ email: updated.email, contactName: updated.contactName, siteUrl });
      }
      return { success: true };
    }),

  adminDelete: adminAuthedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.deleteWholesale(input.id);
      return { success: true };
    }),
});
