/**
 * Money and cart rules shared by the browser and the server.
 *
 * The browser uses them to show a total; the server runs the same functions
 * again on the prices in the database when the order is placed, so a cart
 * edited in devtools can't change what is charged.
 */

/** One line of a placed order, frozen at the moment of purchase. */
export type OrderLine = {
  productId: number;
  slug: string;
  name: string;
  line: string | null;
  imageUrl: string | null;
  priceCents: number;
  qty: number;
};

export const MAX_QTY_PER_LINE = 20;
export const MAX_LINES_PER_ORDER = 40;

export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/** "12.50" / "$12.50" / "12" → 1250. Returns null for anything else. */
export function parseMoney(input: string): number | null {
  const clean = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

export function shippingFor(
  subtotalCents: number,
  rule: { shippingCents: number; freeShippingOverCents: number }
): number {
  if (subtotalCents <= 0) return 0;
  if (rule.freeShippingOverCents > 0 && subtotalCents >= rule.freeShippingOverCents) {
    return 0;
  }
  return Math.max(0, rule.shippingCents);
}

export function subtotalOf(lines: { priceCents: number; qty: number }[]): number {
  return lines.reduce((sum, l) => sum + l.priceCents * l.qty, 0);
}

export const US_STATES: { code: string; name: string }[] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"],
  ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"],
  ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"],
  ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"],
  ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
  ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"],
].map(([code, name]) => ({ code, name }));

export function isUsState(code: string): boolean {
  return US_STATES.some(s => s.code === code);
}

/** "la, tx ,  ID" → ["LA","TX","ID"], unknown codes dropped. */
export function parseStateList(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map(s => s.trim().toUpperCase())
        .filter(isUsState)
    )
  );
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Payment failed",
};
