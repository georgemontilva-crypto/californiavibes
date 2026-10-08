/**
 * Card payments through Authorize.net (Accept.js + the JSON API).
 *
 * The card number never touches this server: the browser hands it to
 * Accept.js, which returns a one-time token ("opaque data"), and that token is
 * what gets charged here. That keeps the site out of PCI scope beyond SAQ A-EP.
 *
 * Env:
 *   AUTHNET_API_LOGIN_ID      API Login ID
 *   AUTHNET_TRANSACTION_KEY   Transaction Key (server only, never sent to the browser)
 *   AUTHNET_CLIENT_KEY        Public Client Key (Account → Security Settings → Manage Public Client Key)
 *   AUTHNET_ENV               "production" or "sandbox" (default sandbox)
 *
 * With any of the first three missing the store still takes orders, as
 * "Awaiting payment", and the team arranges payment by email.
 */

const LOGIN_ID = (process.env.AUTHNET_API_LOGIN_ID ?? "").trim();
const TRANSACTION_KEY = (process.env.AUTHNET_TRANSACTION_KEY ?? "").trim();
const CLIENT_KEY = (process.env.AUTHNET_CLIENT_KEY ?? "").trim();
const IS_PRODUCTION = (process.env.AUTHNET_ENV ?? "").trim().toLowerCase() === "production";

const API_URL = IS_PRODUCTION
  ? "https://api.authorize.net/xml/v1/request.api"
  : "https://apitest.authorize.net/xml/v1/request.api";

export function isCardPaymentConfigured(): boolean {
  return Boolean(LOGIN_ID && TRANSACTION_KEY && CLIENT_KEY);
}

/** What the browser needs to load Accept.js. Public by design. */
export function publicPaymentConfig() {
  if (!isCardPaymentConfigured()) return { mode: "manual" as const };
  return {
    mode: "card" as const,
    apiLoginId: LOGIN_ID,
    clientKey: CLIENT_KEY,
    acceptJsUrl: IS_PRODUCTION
      ? "https://js.authorize.net/v1/Accept.js"
      : "https://jstest.authorize.net/v1/Accept.js",
  };
}

type Address = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};

export type ChargeResult =
  | { ok: true; transactionId: string; cardLast4: string | null; heldForReview: boolean }
  | { ok: false; message: string };

function cut(value: string, max: number) {
  return value.slice(0, max);
}

function addressBlock(a: Address) {
  // Authorize.net rejects fields over its length limits rather than truncating.
  return {
    firstName: cut(a.firstName, 50),
    lastName: cut(a.lastName, 50),
    address: cut(a.address, 60),
    city: cut(a.city, 40),
    state: cut(a.state, 40),
    zip: cut(a.zip, 20),
    country: "US",
  };
}

export async function chargeCard(input: {
  amountCents: number;
  orderNumber: string;
  description: string;
  email: string;
  ip: string;
  opaqueData: { dataDescriptor: string; dataValue: string };
  address: Address;
}): Promise<ChargeResult> {
  if (!isCardPaymentConfigured()) {
    return { ok: false, message: "Card payments are not set up." };
  }

  // Element order matters: the JSON API is a translation of an XML schema and
  // rejects a request whose keys are out of sequence.
  const body = {
    createTransactionRequest: {
      merchantAuthentication: { name: LOGIN_ID, transactionKey: TRANSACTION_KEY },
      refId: cut(input.orderNumber, 20),
      transactionRequest: {
        transactionType: "authCaptureTransaction",
        amount: (input.amountCents / 100).toFixed(2),
        payment: { opaqueData: input.opaqueData },
        order: {
          invoiceNumber: cut(input.orderNumber, 20),
          description: cut(input.description, 255),
        },
        customer: { email: cut(input.email, 255) },
        billTo: addressBlock(input.address),
        shipTo: addressBlock(input.address),
        customerIP: cut(input.ip, 15),
      },
    },
  };

  let json: any;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // The API prefixes its JSON with a byte-order mark.
    const text = (await res.text()).replace(/^﻿/, "");
    json = JSON.parse(text);
  } catch (err) {
    console.error("[payments] could not reach Authorize.net:", err);
    return {
      ok: false,
      message: "We couldn't reach the payment processor. Your card was not charged. Please try again.",
    };
  }

  const tr = json?.transactionResponse;
  const code = String(tr?.responseCode ?? "");
  if (code === "1" || code === "4") {
    return {
      ok: true,
      transactionId: String(tr.transId ?? ""),
      cardLast4: tr.accountNumber ? String(tr.accountNumber) : null,
      heldForReview: code === "4",
    };
  }

  const reason =
    tr?.errors?.[0]?.errorText ??
    json?.messages?.message?.[0]?.text ??
    "The card was declined.";
  console.warn(`[payments] ${input.orderNumber} not approved (code ${code || "?"}): ${reason}`);
  return { ok: false, message: String(reason) };
}
