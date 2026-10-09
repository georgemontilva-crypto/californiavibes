import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  adminUsers,
  contactMessages,
  type InsertAdminUser,
  type InsertContactMessage,
  type InsertLabReport,
  type InsertOrder,
  type InsertWholesaleAccount,
  type InsertProduct,
  type InsertVideo,
  labReports,
  orders,
  products,
  siteSettings,
  videos,
  wholesaleAccounts,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

/* ─── Admin accounts ──────────────────────────────────────────────────────── */

export async function countAdmins(): Promise<number> {
  const db = await requireDb();
  const rows = await db.select({ c: sql<number>`count(*)` }).from(adminUsers);
  return Number(rows[0]?.c ?? 0);
}

export async function createAdmin(data: InsertAdminUser) {
  const db = await requireDb();
  await db.insert(adminUsers).values(data);
}

export async function getAdminByEmail(email: string) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAdminById(id: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listAdmins() {
  const db = await requireDb();
  return db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      createdAt: adminUsers.createdAt,
      lastSignedIn: adminUsers.lastSignedIn,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.id));
}

export async function updateAdminLastSignedIn(id: number) {
  const db = await requireDb();
  await db
    .update(adminUsers)
    .set({ lastSignedIn: new Date() })
    .where(eq(adminUsers.id, id));
}

export async function updateAdminPassword(id: number, passwordHash: string) {
  const db = await requireDb();
  await db
    .update(adminUsers)
    .set({ passwordHash })
    .where(eq(adminUsers.id, id));
}

export async function deleteAdmin(id: number) {
  const db = await requireDb();
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
}

/* ─── Products ────────────────────────────────────────────────────────────── */

export async function listProducts(opts: { publishedOnly?: boolean } = {}) {
  const db = await requireDb();
  const base = db.select().from(products);
  return opts.publishedOnly
    ? base
        .where(eq(products.published, true))
        .orderBy(asc(products.sortOrder), asc(products.name))
    : base.orderBy(asc(products.sortOrder), asc(products.name));
}

export async function getProductById(id: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getProductBySlug(slug: string) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function createProduct(data: InsertProduct) {
  const db = await requireDb();
  await db.insert(products).values(data);
  return getProductBySlug(data.slug);
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await requireDb();
  if (Object.keys(data).length > 0) {
    await db.update(products).set(data).where(eq(products.id, id));
  }
  return getProductById(id);
}

export async function deleteProduct(id: number) {
  const db = await requireDb();
  await db.delete(labReports).where(eq(labReports.productId, id));
  await db.delete(products).where(eq(products.id, id));
}

/* ─── Lab reports ─────────────────────────────────────────────────────────── */

/** Products with their reports nested. */
export async function listProductsWithReports(
  opts: { publishedOnly?: boolean } = {}
) {
  const db = await requireDb();
  const prodRows = await listProducts(opts);
  const base = db.select().from(labReports);
  const reportRows = opts.publishedOnly
    ? await base
        .where(eq(labReports.published, true))
        .orderBy(asc(labReports.sortOrder), desc(labReports.id))
    : await base.orderBy(asc(labReports.sortOrder), desc(labReports.id));

  const byProduct = new Map<number, typeof reportRows>();
  for (const r of reportRows) {
    const list = byProduct.get(r.productId) ?? [];
    list.push(r);
    byProduct.set(r.productId, list);
  }
  return prodRows.map(p => ({ ...p, reports: byProduct.get(p.id) ?? [] }));
}

export async function listLabReports(
  productId?: number,
  opts: { publishedOnly?: boolean } = {}
) {
  const db = await requireDb();
  const base = db.select().from(labReports);
  if (!productId) return base.orderBy(desc(labReports.id));
  return base
    .where(
      opts.publishedOnly
        ? and(
            eq(labReports.productId, productId),
            eq(labReports.published, true)
          )
        : eq(labReports.productId, productId)
    )
    .orderBy(asc(labReports.sortOrder), desc(labReports.id));
}

export async function getLabReportById(id: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(labReports)
    .where(eq(labReports.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createLabReport(data: InsertLabReport) {
  const db = await requireDb();
  await db.insert(labReports).values(data);
}

export async function updateLabReport(
  id: number,
  data: Partial<InsertLabReport>
) {
  const db = await requireDb();
  if (Object.keys(data).length > 0) {
    await db.update(labReports).set(data).where(eq(labReports.id, id));
  }
  return getLabReportById(id);
}

export async function deleteLabReport(id: number) {
  const db = await requireDb();
  await db.delete(labReports).where(eq(labReports.id, id));
}

/* ─── Videos ──────────────────────────────────────────────────────────────── */

export async function listVideos(opts: { publishedOnly?: boolean } = {}) {
  const db = await requireDb();
  const base = db.select().from(videos);
  return opts.publishedOnly
    ? base
        .where(eq(videos.published, true))
        .orderBy(asc(videos.sortOrder), desc(videos.id))
    : base.orderBy(asc(videos.sortOrder), desc(videos.id));
}

export async function getVideoById(id: number) {
  const db = await requireDb();
  const rows = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createVideo(data: InsertVideo) {
  const db = await requireDb();
  await db.insert(videos).values(data);
}

export async function updateVideo(id: number, data: Partial<InsertVideo>) {
  const db = await requireDb();
  if (Object.keys(data).length > 0) {
    await db.update(videos).set(data).where(eq(videos.id, id));
  }
  return getVideoById(id);
}

/**
 * Makes one clip the hero clip and clears the flag on every other one.
 *
 * The hero has room for exactly one video. Leaving the old one flagged would
 * make which clip plays depend on sort order, which nobody looking at the admin
 * could predict.
 */
export async function setFeaturedVideo(id: number, featured: boolean) {
  const db = await requireDb();
  if (featured) {
    await db.update(videos).set({ featured: false }).where(ne(videos.id, id));
  }
  await db.update(videos).set({ featured }).where(eq(videos.id, id));
}

export async function deleteVideo(id: number) {
  const db = await requireDb();
  await db.delete(videos).where(eq(videos.id, id));
}

/* ─── Contact messages ────────────────────────────────────────────────────── */

export async function createContactMessage(data: InsertContactMessage) {
  const db = await requireDb();
  await db.insert(contactMessages).values(data);
}

export async function listContactMessages(opts: {
  limit: number;
  offset: number;
}) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.id))
    .limit(opts.limit)
    .offset(opts.offset);
  const count = await db
    .select({ c: sql<number>`count(*)` })
    .from(contactMessages);
  return { rows, total: Number(count[0]?.c ?? 0) };
}

export async function setContactMessageHandled(id: number, handled: boolean) {
  const db = await requireDb();
  await db
    .update(contactMessages)
    .set({ handled })
    .where(eq(contactMessages.id, id));
}

export async function deleteContactMessage(id: number) {
  const db = await requireDb();
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
}

/* ─── Orders ──────────────────────────────────────────────────────────────── */

export async function createOrder(data: InsertOrder) {
  const db = await requireDb();
  await db.insert(orders).values(data);
  return getOrderByNumber(data.number);
}

export async function getOrderByNumber(number: string) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.number, number))
    .limit(1);
  return rows[0] ?? null;
}

export async function getOrderById(id: number) {
  const db = await requireDb();
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateOrder(id: number, data: Partial<InsertOrder>) {
  const db = await requireDb();
  if (Object.keys(data).length > 0) {
    await db.update(orders).set(data).where(eq(orders.id, id));
  }
  return getOrderById(id);
}

export async function listOrders(opts: {
  status?: InsertOrder["status"];
  channel?: "retail" | "wholesale";
  limit: number;
  offset: number;
}) {
  const db = await requireDb();
  const conds = [
    opts.status ? eq(orders.status, opts.status) : undefined,
    opts.channel ? eq(orders.channel, opts.channel) : undefined,
  ].filter(Boolean);
  const where = conds.length ? and(...(conds as any[])) : undefined;
  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.id))
    .limit(opts.limit)
    .offset(opts.offset);
  const count = await db
    .select({ c: sql<number>`count(*)` })
    .from(orders)
    .where(where);
  return { rows, total: Number(count[0]?.c ?? 0) };
}

/* ─── Wholesale accounts ────────────────────────────────────────────────── */

export async function getWholesaleByEmail(email: string) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(wholesaleAccounts)
    .where(eq(wholesaleAccounts.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function getWholesaleById(id: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(wholesaleAccounts)
    .where(eq(wholesaleAccounts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createWholesale(data: InsertWholesaleAccount) {
  const db = await requireDb();
  await db.insert(wholesaleAccounts).values(data);
  return getWholesaleByEmail(data.email);
}

export async function updateWholesale(id: number, data: Partial<InsertWholesaleAccount>) {
  const db = await requireDb();
  if (Object.keys(data).length > 0) {
    await db.update(wholesaleAccounts).set(data).where(eq(wholesaleAccounts.id, id));
  }
  return getWholesaleById(id);
}

export async function deleteWholesale(id: number) {
  const db = await requireDb();
  await db.delete(wholesaleAccounts).where(eq(wholesaleAccounts.id, id));
}

export async function listWholesale() {
  const db = await requireDb();
  return db.select().from(wholesaleAccounts).orderBy(desc(wholesaleAccounts.id));
}

/* ─── Dashboard ───────────────────────────────────────────────────────────── */

export async function getDashboardStats() {
  const db = await requireDb();
  const count = async (query: Promise<{ c: number }[]>) =>
    Number((await query)[0]?.c ?? 0);

  const totalProducts = await count(
    db.select({ c: sql<number>`count(*)` }).from(products)
  );
  const totalReports = await count(
    db.select({ c: sql<number>`count(*)` }).from(labReports)
  );
  const totalVideos = await count(
    db.select({ c: sql<number>`count(*)` }).from(videos)
  );
  const openMessages = await count(
    db
      .select({ c: sql<number>`count(*)` })
      .from(contactMessages)
      .where(eq(contactMessages.handled, false))
  );
  /* Products on the public site with no published report: the number that
     tells the admin what is still missing before a jar's QR can be trusted. */
  const withReport = await count(
    db
      .select({ c: sql<number>`count(distinct ${labReports.productId})` })
      .from(labReports)
      .innerJoin(products, eq(labReports.productId, products.id))
      .where(and(eq(labReports.published, true), eq(products.published, true)))
  );
  const publishedProducts = await count(
    db
      .select({ c: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.published, true))
  );

  const openOrders = await count(
    db
      .select({ c: sql<number>`count(*)` })
      .from(orders)
      .where(sql`${orders.status} in ('pending','paid')`)
  );
  const revenueRows = await db
    .select({ c: sql<number>`coalesce(sum(${orders.totalCents}),0)` })
    .from(orders)
    .where(sql`${orders.status} in ('paid','shipped','delivered')`);
  const revenueCents = Number(revenueRows[0]?.c ?? 0);

  const pendingWholesale = await count(
    db
      .select({ c: sql<number>`count(*)` })
      .from(wholesaleAccounts)
      .where(eq(wholesaleAccounts.status, "pending"))
  );

  return {
    pendingWholesale,
    openOrders,
    revenueCents,
    totalProducts,
    totalReports,
    totalVideos,
    openMessages,
    productsMissingReport: Math.max(0, publishedProducts - withReport),
  };
}

/* ─── Site settings ───────────────────────────────────────────────────────── */

export async function getSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(siteSettings);
  return Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));
}

export async function setSetting(key: string, value: string) {
  const db = await requireDb();
  await db
    .insert(siteSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}
