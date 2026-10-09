import { ADMIN_COOKIE_NAME, THIRTY_DAYS_MS, WHOLESALE_COOKIE_NAME } from "@shared/const";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";

/**
 * Admin authentication.
 * Sessions are signed JWTs stored in a dedicated httpOnly cookie.
 */

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function getSecret() {
  return new TextEncoder().encode(ENV.cookieSecret || "californiavibes-dev-secret-change-me");
}

export type AppSessionKind = "admin" | "wholesale";

export type AppSessionPayload = {
  sub: number;
  kind: AppSessionKind;
  email: string;
};

export async function signAppSession(
  payload: AppSessionPayload,
  expiresInMs: number = THIRTY_DAYS_MS
): Promise<string> {
  const expSeconds = Math.floor((Date.now() + expiresInMs) / 1000);
  return new SignJWT({ sub: String(payload.sub), kind: payload.kind, email: payload.email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expSeconds)
    .sign(getSecret());
}

export async function verifyAppSession(
  token: string | undefined | null,
  expectedKind: AppSessionKind
): Promise<AppSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    const sub = Number(payload.sub);
    const kind = payload.kind as AppSessionKind;
    const email = payload.email as string;
    if (!Number.isFinite(sub) || kind !== expectedKind || !email) return null;
    return { sub, kind, email };
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const parsed = parseCookieHeader(req.headers.cookie ?? "");
  return parsed[name];
}

export function getAdminSessionToken(req: Request): string | undefined {
  return readCookie(req, ADMIN_COOKIE_NAME);
}

export function getWholesaleSessionToken(req: Request): string | undefined {
  return readCookie(req, WHOLESALE_COOKIE_NAME);
}

export function appCookieOptions(req: Request) {
  const forwardedProto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0];
  const proto = forwardedProto || req.protocol;
  const secure = proto === "https";
  return {
    httpOnly: true,
    path: "/",
    // "none" is only accepted together with Secure, so plain-http local
    // development falls back to "lax" instead of having the cookie dropped.
    sameSite: secure ? ("none" as const) : ("lax" as const),
    secure,
    maxAge: THIRTY_DAYS_MS,
  };
}

/* ─── Password reset links ────────────────────────────────────────────────
   Stateless: the token is a signed JWT that carries a fingerprint of the
   current password hash. Once the password changes the fingerprint no longer
   matches, so a link works exactly once and needs no table to track it. */

const RESET_TTL_SECONDS = 60 * 60;

function hashFingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 24);
}

export async function signResetToken(accountId: number, passwordHash: string): Promise<string> {
  return new SignJWT({ sub: String(accountId), kind: "wholesale-reset", fp: hashFingerprint(passwordHash) })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor(Date.now() / 1000) + RESET_TTL_SECONDS)
    .sign(getSecret());
}

/** The account id the link was issued for, or null if it's invalid, expired or already used. */
export async function verifyResetToken(
  token: string,
  currentHashFor: (id: number) => Promise<string | null>
): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    if (payload.kind !== "wholesale-reset" || !Number.isFinite(id)) return null;
    const hash = await currentHashFor(id);
    if (!hash || payload.fp !== hashFingerprint(hash)) return null;
    return id;
  } catch {
    return null;
  }
}
