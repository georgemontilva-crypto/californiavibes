/**
 * Optional email through Resend: contact form notifications and order emails.
 *
 * Everything is stored in the database first and shown in the admin, so email
 * is a convenience on top, not the record. That is why it is skipped silently
 * when the variables are missing and why a failure is logged rather than
 * surfaced to the visitor.
 *
 * Env: RESEND_API_KEY, RESEND_FROM_EMAIL (a sender on a domain verified in
 * Resend), CONTACT_TO_EMAIL (where notifications go).
 */
import { BRAND_NAME } from "@shared/const";
import { formatMoney, type OrderLine } from "@shared/store";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "";
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? "";

export function isMailConfigured(): boolean {
  return Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL && CONTACT_TO_EMAIL);
}

/** Customer emails only need a sender; the team address is for notifications. */
function canSend(): boolean {
  return Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL);
}

async function send(mail: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [mail.to],
        reply_to: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
      }),
    });
    if (!res.ok) {
      console.warn(`[mailer] Resend replied ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.warn("[mailer] could not send:", err);
  }
}

export async function notifyContactMessage(msg: {
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  message: string;
}): Promise<void> {
  if (!isMailConfigured()) return;
  const text = [
    `From: ${msg.name} <${msg.email}>`,
    msg.phone ? `Phone: ${msg.phone}` : null,
    msg.topic ? `About: ${msg.topic}` : null,
    "",
    msg.message,
  ]
    .filter(line => line !== null)
    .join("\n");
  await send({
    to: CONTACT_TO_EMAIL,
    replyTo: msg.email,
    subject: `${BRAND_NAME} contact: ${msg.topic ?? "New message"} — ${msg.name}`,
    text,
  });
}

type OrderMail = {
  number: string;
  status: string;
  paymentMethod: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  customerNote: string | null;
};

function orderSummary(o: OrderMail): string {
  return [
    ...o.lines.map(
      l => `${l.qty} × ${l.line ? `${l.line} — ` : ""}${l.name}   ${formatMoney(l.priceCents * l.qty)}`
    ),
    "",
    `Subtotal: ${formatMoney(o.subtotalCents)}`,
    `Shipping: ${o.shippingCents === 0 ? "Free" : formatMoney(o.shippingCents)}`,
    `Total:    ${formatMoney(o.totalCents)}`,
    "",
    "Ship to:",
    `${o.firstName} ${o.lastName}`,
    o.address1,
    o.address2,
    `${o.city}, ${o.state} ${o.zip}`,
  ]
    .filter(line => line !== null)
    .join("\n");
}

export async function sendOrderEmails(o: OrderMail): Promise<void> {
  if (!canSend()) return;

  const paid = o.status === "paid";
  const customerIntro = paid
    ? `Thanks for your order, ${o.firstName}! Your payment went through and we're getting it ready to ship. We'll email you the tracking number as soon as it's on its way.`
    : `Thanks for your order, ${o.firstName}! We've received it and will email you shortly with how to complete payment. Your order ships once payment is confirmed.`;

  await send({
    to: o.email,
    replyTo: CONTACT_TO_EMAIL || undefined,
    subject: `${BRAND_NAME} order ${o.number}`,
    text: [customerIntro, "", `Order ${o.number}`, "", orderSummary(o)].join("\n"),
  });

  if (CONTACT_TO_EMAIL) {
    await send({
      to: CONTACT_TO_EMAIL,
      replyTo: o.email,
      subject: `New order ${o.number} — ${formatMoney(o.totalCents)} (${paid ? "PAID" : "awaiting payment"})`,
      text: [
        `Customer: ${o.firstName} ${o.lastName} <${o.email}>${o.phone ? `  ${o.phone}` : ""}`,
        `Payment: ${o.paymentMethod === "card" ? "card" : "to arrange by email"}`,
        o.customerNote ? `Note: ${o.customerNote}` : null,
        "",
        orderSummary(o),
      ]
        .filter(line => line !== null)
        .join("\n"),
    });
  }
}

export async function sendShippedEmail(o: {
  number: string;
  email: string;
  firstName: string;
  trackingNumber: string | null;
}): Promise<void> {
  if (!canSend()) return;
  await send({
    to: o.email,
    replyTo: CONTACT_TO_EMAIL || undefined,
    subject: `${BRAND_NAME} order ${o.number} has shipped`,
    text: [
      `Good news, ${o.firstName}: order ${o.number} is on its way.`,
      o.trackingNumber ? `Tracking number: ${o.trackingNumber}` : null,
      "",
      "Smoke less. Feel more.",
    ]
      .filter(line => line !== null)
      .join("\n"),
  });
}
