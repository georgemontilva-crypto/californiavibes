import type { TrpcContext } from "./_core/context";
import { getWholesaleSessionToken, verifyAppSession } from "./auth";
import * as db from "./db";

/**
 * The approved wholesale account behind this request, or null.
 *
 * Re-read from the database on every call rather than trusted from the
 * cookie: suspending an account in the admin has to take effect on the
 * buyer's next click, not when their 30-day cookie runs out.
 */
export async function currentWholesale(ctx: TrpcContext) {
  const session = await verifyAppSession(getWholesaleSessionToken(ctx.req), "wholesale");
  if (!session) return null;
  const account = await db.getWholesaleById(session.sub).catch(() => null);
  if (!account || account.status !== "approved") return null;
  return account;
}

/** The price a buyer pays: wholesale when they have an approved account and one is set. */
export function priceFor(
  p: { priceCents: number; wholesalePriceCents: number | null },
  wholesale: boolean
): number {
  if (wholesale && p.wholesalePriceCents && p.wholesalePriceCents > 0) {
    return p.wholesalePriceCents;
  }
  return p.priceCents;
}
