/** Admin session cookie. */
export const ADMIN_COOKIE_NAME = "cv_admin_session";
export const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

/**
 * Brand-facing strings. Everything the visitor reads that isn't managed from the
 * admin panel lives here, so changing it is one edit rather than a grep.
 */
export const BRAND_NAME = "California Vibes";
export const BRAND_TAGLINE = "Premium Botanicals";
export const BRAND_SLOGAN = "Smoke less. Feel more.";

/**
 * Where the LAB REPORTS button goes: the shared Dropbox folder with every
 * certificate. The admin can point it somewhere else under Store settings.
 */
export const DEFAULT_LAB_REPORTS_URL =
  "https://www.dropbox.com/scl/fo/cv4o9gdup08u0j1esrvfz/ABOYFsfWB1ABixJjy2E_EZ0?rlkey=1o8domgfc1agqdogp1zmpvy7g&st=ztij7x2q&dl=0";

/**
 * Contact details. These are the defaults; the admin can override each one
 * under Settings without a deploy.
 */
export const DEFAULT_CONTACT = {
  company: "California Vibes",
  email: "",
  phone: "",
  address: "",
  instagram: "",
} as const;

export type ContactDetails = {
  -readonly [K in keyof typeof DEFAULT_CONTACT]: string;
};

/** Keys of the contact form in the admin. */
export const SETTING_KEYS = [
  "company",
  "email",
  "phone",
  "address",
  "instagram",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

/**
 * Store settings. Money is kept in cents, as text, because site_settings is a
 * plain key/value table.
 */
export const DEFAULT_STORE = {
  labReportsUrl: DEFAULT_LAB_REPORTS_URL,
  /** Flat shipping per order, in cents. */
  shippingCents: 599,
  /** Orders at or above this subtotal ship free, in cents. 0 turns it off. */
  freeShippingOverCents: 7500,
  /** Two-letter states the store does not ship to. */
  blockedStates: [] as string[],
};

export type StoreSettings = typeof DEFAULT_STORE;

export const STORE_SETTING_KEYS = [
  "labReportsUrl",
  "shippingCents",
  "freeShippingOverCents",
  "blockedStates",
] as const;

export const STRAINS = ["indica", "sativa", "hybrid"] as const;
export type Strain = (typeof STRAINS)[number];

export const CONTACT_TOPICS = [
  "Order question",
  "Product question",
  "Lab report",
  "Wholesale",
  "Something else",
] as const;

/**
 * Parses the "Product facts" textarea: one fact per line as `Label: value`.
 * Lines without a colon are kept as a label with no value rather than dropped,
 * so a typo in the admin shows up on the page instead of vanishing.
 */
export function parseFacts(
  raw: string | null | undefined
): { label: string; value: string }[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const at = line.indexOf(":");
      if (at === -1) return { label: line, value: "" };
      return {
        label: line.slice(0, at).trim(),
        value: line.slice(at + 1).trim(),
      };
    });
}

/** Accepts #rgb / #rrggbb only, so a stored value is always safe to inline. */
export function isHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}
