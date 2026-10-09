import {
  bigint,
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Admin accounts. Email + bcrypt hash, session carried in a signed JWT cookie.
 */
export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * One strain in one format — "OG Kush" in the 3.5G CBG flower jar, "Gelato" in
 * the pre-roll 2-pack. Lab reports hang off a product (a product can have many).
 */
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    /** URL-safe identifier used in public links, e.g. "flower-28g-sour-diesel". */
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    /** The strain name as printed on the label, e.g. "Sour Diesel". */
    name: varchar("name", { length: 255 }).notNull(),
    /**
     * Product line this belongs to, e.g. "THC Hash Holes".
     *
     * Free text rather than its own table: the grouping exists to put a heading
     * above a row of jars, and a lookup table would mean two admin screens and a
     * foreign key to express a string that is typed once per line.
     */
    collection: varchar("collection", { length: 255 }),
    /** Format line under the name, e.g. "10 count · 2.5G per pre-roll". */
    subtitle: varchar("subtitle", { length: 255 }),
    strain: mysqlEnum("strain", ["indica", "sativa", "hybrid"]),
    /**
     * The label colour of this strain as a hex value. Every jar has its own,
     * and the public pages take their accent from it.
     */
    accentColor: varchar("accentColor", { length: 16 }),
    description: text("description"),
    /**
     * The "Product facts" panel, one fact per line as `Label: value`.
     * Plain text on purpose: it is typed straight off the label, and a JSON
     * editor in the admin would be a worse tool for that than a textarea.
     */
    facts: text("facts"),
    /** Product shot. Either a file shipped with the site or an R2 upload. */
    imageUrl: varchar("imageUrl", { length: 1024 }),
    /** Empty for images shipped with the site: there is nothing in R2 to delete. */
    imageKey: varchar("imageKey", { length: 512 }),
    /**
     * Price in cents. Integer cents so a total is never off by a fraction of a
     * cent after adding up a cart. 0 means "not priced yet" and the product
     * can't be added to the cart.
     */
    priceCents: int("priceCents").default(0).notNull(),
    /** Optional struck-through "was" price, in cents. */
    compareAtCents: int("compareAtCents"),
    /**
     * Price for approved wholesale accounts, in cents. Empty means wholesale
     * buyers pay the retail price until one is set.
     */
    wholesalePriceCents: int("wholesalePriceCents"),
    /** Out of stock products stay on the site but can't be bought. */
    inStock: boolean("inStock").default(true).notNull(),
    /** Lower sorts first; ties break on name. */
    sortOrder: int("sortOrder").default(0).notNull(),
    published: boolean("published").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  t => ({
    collectionIdx: index("product_collection_idx").on(t.collection),
    sortIdx: index("product_sort_idx").on(t.sortOrder),
  })
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Certificates of analysis. One product can have several (one per batch), so
 * this is a child table rather than a column on `products`.
 *
 * The PDF itself lives in R2; only the public URL and the object key are kept
 * here, the key so the file can be removed from the bucket when the row is
 * deleted.
 */
export const labReports = mysqlTable(
  "lab_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    /** e.g. "Full panel COA" */
    title: varchar("title", { length: 255 }).notNull(),
    /** Batch number as printed on the jar. Free text on purpose. */
    batch: varchar("batch", { length: 128 }),
    lab: varchar("lab", { length: 255 }),
    /** Date the sample was tested, as a plain date string (YYYY-MM-DD). */
    testedOn: varchar("testedOn", { length: 32 }),
    fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
    /** Empty for a report linked from another site. */
    fileKey: varchar("fileKey", { length: 512 }).notNull(),
    fileName: varchar("fileName", { length: 255 }),
    sizeBytes: bigint("sizeBytes", { mode: "number" }),
    published: boolean("published").default(true).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  t => ({
    productIdx: index("lab_report_product_idx").on(t.productId),
    publishedIdx: index("lab_report_published_idx").on(t.published),
    batchIdx: index("lab_report_batch_idx").on(t.batch),
  })
);

export type LabReport = typeof labReports.$inferSelect;
export type InsertLabReport = typeof labReports.$inferInsert;

/**
 * Vertical clips shown on the home page.
 *
 * The file goes straight from the admin's browser to R2. The poster is a frame
 * grabbed in the browser at upload time, so the page can show something before
 * a single byte of video has been requested.
 */
export const videos = mysqlTable(
  "videos",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
    fileKey: varchar("fileKey", { length: 512 }).notNull(),
    posterUrl: varchar("posterUrl", { length: 1024 }),
    posterKey: varchar("posterKey", { length: 512 }),
    sizeBytes: bigint("sizeBytes", { mode: "number" }),
    /** The clip that plays in the home page hero. At most one at a time. */
    featured: boolean("featured").default(false).notNull(),
    published: boolean("published").default(true).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  t => ({
    publishedIdx: index("video_published_idx").on(t.published),
  })
);

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/** Messages sent through the Contact page. */
export const contactMessages = mysqlTable(
  "contact_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 64 }),
    /** What the message is about, picked from a short list on the form. */
    topic: varchar("topic", { length: 64 }),
    message: text("message").notNull(),
    handled: boolean("handled").default(false).notNull(),
    ip: varchar("ip", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  t => ({
    createdIdx: index("contact_created_idx").on(t.createdAt),
    handledIdx: index("contact_handled_idx").on(t.handled),
  })
);

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

/**
 * Key/value store for the contact details shown on the site.
 * Deliberately schemaless so adding a field to the admin needs no migration.
 */
export const siteSettings = mysqlTable("site_settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "failed",
] as const;

/**
 * A placed order. The lines are a JSON snapshot of what was bought at the
 * price it was bought at, so editing or deleting a product later can't change
 * an order that already happened.
 */
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Public order number, e.g. "CV-48213". */
    number: varchar("number", { length: 32 }).notNull().unique(),
    status: mysqlEnum("status", ORDER_STATUSES).default("pending").notNull(),
    /** "retail" for the public store, "wholesale" for a logged-in wholesale account. */
    channel: mysqlEnum("channel", ["retail", "wholesale"]).default("retail").notNull(),
    wholesaleAccountId: int("wholesaleAccountId"),
    /** "card" when charged online, "manual" when payment is arranged by email. */
    paymentMethod: varchar("paymentMethod", { length: 32 }).notNull(),
    transactionId: varchar("transactionId", { length: 64 }),
    /** Last four of the card, as the gateway reports it ("XXXX1111"). */
    cardLast4: varchar("cardLast4", { length: 16 }),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 64 }),
    firstName: varchar("firstName", { length: 120 }).notNull(),
    lastName: varchar("lastName", { length: 120 }).notNull(),
    address1: varchar("address1", { length: 255 }).notNull(),
    address2: varchar("address2", { length: 255 }),
    city: varchar("city", { length: 120 }).notNull(),
    state: varchar("state", { length: 8 }).notNull(),
    zip: varchar("zip", { length: 16 }).notNull(),
    /** JSON array of OrderLine (see shared/store.ts). */
    items: text("items").notNull(),
    subtotalCents: int("subtotalCents").notNull(),
    shippingCents: int("shippingCents").notNull(),
    totalCents: int("totalCents").notNull(),
    customerNote: text("customerNote"),
    /** Internal note, only seen in the admin. */
    adminNote: text("adminNote"),
    trackingNumber: varchar("trackingNumber", { length: 128 }),
    /** Why a card was declined, as the gateway put it. Admin only. */
    paymentError: varchar("paymentError", { length: 500 }),
    ip: varchar("ip", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  t => ({
    statusIdx: index("order_status_idx").on(t.status),
    channelIdx: index("order_channel_idx").on(t.channel),
    emailIdx: index("order_email_idx").on(t.email),
    createdIdx: index("order_created_idx").on(t.createdAt),
  })
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const WHOLESALE_STATUSES = ["pending", "approved", "rejected", "suspended"] as const;

/**
 * Wholesale buyers. They apply from the site, an admin approves them, and
 * from then on they log in to see and pay wholesale prices.
 */
export const wholesaleAccounts = mysqlTable(
  "wholesale_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
    businessName: varchar("businessName", { length: 255 }).notNull(),
    contactName: varchar("contactName", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }),
    /** Two-letter US state. */
    state: varchar("state", { length: 8 }),
    /** Resale permit / tax ID, as typed. */
    taxId: varchar("taxId", { length: 128 }),
    website: varchar("website", { length: 500 }),
    /** What the applicant wrote about their business. */
    message: text("message"),
    status: mysqlEnum("status", WHOLESALE_STATUSES).default("pending").notNull(),
    /** Internal note, only seen in the admin. */
    adminNote: text("adminNote"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn"),
  },
  t => ({
    statusIdx: index("wholesale_status_idx").on(t.status),
  })
);

export type WholesaleAccount = typeof wholesaleAccounts.$inferSelect;
export type InsertWholesaleAccount = typeof wholesaleAccounts.$inferInsert;
