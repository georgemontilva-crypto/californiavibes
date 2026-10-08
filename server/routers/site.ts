import {
  CONTACT_TOPICS,
  DEFAULT_CONTACT,
  SETTING_KEYS,
  type ContactDetails,
} from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminAuthedProcedure, appRouterFactory, publicProc } from "../appTrpc";
import * as db from "../db";
import { isMailConfigured, notifyContactMessage } from "../mailer";

/** Stored values win over the label defaults; an empty stored value falls back. */
async function contactDetails(): Promise<ContactDetails> {
  const stored = await db.getSettings().catch(() => ({}) as Record<string, string>);
  const details: ContactDetails = { ...DEFAULT_CONTACT };
  for (const key of SETTING_KEYS) {
    const value = stored[key];
    if (value !== undefined) details[key] = value;
  }
  return details;
}

/**
 * Contact form throttle: five messages an hour per address.
 *
 * In memory on purpose. The site runs as a single container, the limit only
 * has to blunt a script hammering the form, and a counter that resets on
 * deploy costs nothing — whereas a table for it would be one more thing to
 * migrate and prune.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function allowMessage(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(ip, hits);
    return false;
  }
  hits.push(now);
  recent.set(ip, hits);
  // Keep the map from growing without bound on a long-lived process.
  if (recent.size > 5000) {
    recent.forEach((times, key) => {
      if (times.every(t => now - t >= WINDOW_MS)) recent.delete(key);
    });
  }
  return true;
}

export const siteRouter = appRouterFactory({
  contactDetails: publicProc.query(() => contactDetails()),

  sendMessage: publicProc
    .input(
      z.object({
        name: z.string().trim().min(1, "Tell us your name").max(255),
        email: z.string().trim().email("That email doesn't look right").max(320),
        phone: z.string().trim().max(64).optional(),
        topic: z.enum(CONTACT_TOPICS).optional(),
        message: z
          .string()
          .trim()
          .min(10, "Write at least a sentence so we can help")
          .max(5000),
        /**
         * Honeypot. The field is hidden from people; a filled value means a
         * script wrote it, and the message is dropped while reporting success
         * so the script has nothing to adapt to.
         */
        website: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.website) return { success: true };

      const ip = ctx.req.ip ?? "unknown";
      if (!allowMessage(ip)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "That's a lot of messages in a short time. Try again in an hour, or email us directly.",
        });
      }

      const message = {
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone || null,
        topic: input.topic ?? null,
        message: input.message,
      };
      await db.createContactMessage({ ...message, ip: ip.slice(0, 64) });
      // Not awaited: the visitor shouldn't wait on a third-party API for a
      // message that is already saved.
      void notifyContactMessage(message);
      return { success: true };
    }),

  /* ─── Admin ─────────────────────────────────────────────────────────────── */

  messages: adminAuthedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      })
    )
    .query(async ({ input }) => {
      const result = await db.listContactMessages({
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
      });
      return { ...result, mailConfigured: isMailConfigured() };
    }),

  setMessageHandled: adminAuthedProcedure
    .input(z.object({ id: z.number().int(), handled: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.setContactMessageHandled(input.id, input.handled);
      return { success: true };
    }),

  deleteMessage: adminAuthedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.deleteContactMessage(input.id);
      return { success: true };
    }),

  updateContactDetails: adminAuthedProcedure
    .input(
      z.object({
        company: z.string().trim().max(255),
        email: z.string().trim().max(320),
        phone: z.string().trim().max(64),
        address: z.string().trim().max(500),
        instagram: z
          .string()
          .trim()
          .max(500)
          .refine(
            v => v === "" || /^https:\/\//i.test(v),
            "Paste the full link, starting with https://"
          ),
      })
    )
    .mutation(async ({ input }) => {
      for (const key of SETTING_KEYS) {
        await db.setSetting(key, input[key]);
      }
      return { success: true, details: await contactDetails() };
    }),
});
