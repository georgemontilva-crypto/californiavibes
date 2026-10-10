/**
 * Carga inicial del catálogo de California Vibes: las 6 cepas en las 3 líneas
 * (CBG Flower 3.5G, Pre-Rolls 2-pack y Disposables 1G), con la foto que viene
 * en el repo (client/public/products) y los datos impresos en los empaques.
 *
 * Es idempotente y aditivo. Un producto cuyo slug ya existe se deja tal cual,
 * así que correrlo contra una base que ya se editó desde el panel no puede
 * deshacer ese trabajo. Dos formas de correrlo, la misma lógica en las dos:
 *
 *   SEED_CATALOG=true                    (en Railway; corre una vez al arrancar)
 *   DATABASE_URL="…" pnpm seed           (desde una máquina que alcance la BD)
 *
 * Precios retail y mayorista del cliente; se cambian en /admin/products.
 * No carga reportes de laboratorio: esos se suben desde /admin/lab-reports.
 */
import "dotenv/config";
import { LINES } from "@shared/lines";
import * as db from "./db";

/** Las seis cepas, con el color de su empaque. */
const STRAINS: { name: string; slug: string; accent: string }[] = [
  { name: "SoCal GAS", slug: "socal-gas", accent: "#ff6a2b" },
  { name: "OG Kush", slug: "og-kush", accent: "#f5b52e" },
  { name: "King Louis", slug: "king-louis", accent: "#ef3b3b" },
  { name: "Gelato", slug: "gelato", accent: "#3a9bff" },
  { name: "Toad Venom", slug: "toad-venom", accent: "#f03ea8" },
  { name: "Skunk OG", slug: "skunk-og", accent: "#3fcf5e" },
];

type SeedLine = {
  /** Debe coincidir con un nombre de shared/lines.ts. */
  collection: string;
  /** Prefijo del slug y del archivo de la foto. */
  prefix: string;
  subtitle: string;
  priceCents: number;
  wholesalePriceCents: number;
  describe: (name: string) => string;
  facts: string[];
};

const CATALOG: SeedLine[] = [
  {
    collection: "CBG Flower",
    prefix: "cbg-flower",
    subtitle: "3.5G jar · Premium indoor CBG flower",
    priceCents: 3499,
    wholesalePriceCents: 1750,
    describe: name =>
      `${name} premium indoor CBG flower, packed in our holographic 3.5 gram jar. Grown indoors, lab tested, pesticide free and THC free. Smoke less. Feel more.`,
    facts: [
      "Net weight: 3.5 G (0.123 oz)",
      "Type: Premium indoor CBG flower",
      "THC: Free",
      "Lab tested: Yes",
      "Pesticide free: Yes",
    ],
  },
  {
    collection: "Pre-Rolls",
    prefix: "pre-rolls",
    subtitle: "2-pack · 2 × 1G · Blue Lotus infused",
    priceCents: 1999,
    wholesalePriceCents: 999,
    describe: name =>
      `Two ${name} pre-rolls of our premium botanical blend, each one gram and infused with blue lotus. THC free and lab tested. Smoke less. Feel more.`,
    facts: [
      "Count: 2 pre-rolls",
      "Net weight: 2 × 1 G (2 G total)",
      "Blend: Premium botanical blend, blue lotus infused",
      "THC: Free",
      "Lab tested: Yes",
    ],
  },
  {
    collection: "Disposables",
    prefix: "disposable",
    subtitle: "1G disposable · Blue Lotus infused",
    priceCents: 3999,
    wholesalePriceCents: 1750,
    describe: name =>
      `The ${name} disposable: a black and gold device holding one gram of premium botanical blend infused with blue lotus. THC free and lab tested. Smoke less. Feel more.`,
    facts: [
      "Net weight: 1 G (0.035 oz)",
      "Blend: Premium botanical blend, blue lotus infused",
      "THC: Free",
      "Lab tested: Yes",
    ],
  },
];

export async function seedCatalog(): Promise<void> {
  let created = 0;

  for (const line of CATALOG) {
    // El orden de las líneas sale del mismo sitio que usa la web pública, para
    // que el panel y el sitio no puedan quedar ordenados distinto.
    const lineIndex = Math.max(
      0,
      LINES.findIndex(l => l.name === line.collection)
    );

    for (let i = 0; i < STRAINS.length; i++) {
      const s = STRAINS[i];
      const slug = `${line.prefix}-${s.slug}`;

      if (await db.getProductBySlug(slug)) {
        console.log(`= ${line.collection} / ${s.name} (already present)`);
        continue;
      }

      await db.createProduct({
        slug,
        name: s.name,
        collection: line.collection,
        subtitle: line.subtitle,
        strain: null,
        accentColor: s.accent,
        description: line.describe(s.name),
        facts: line.facts.join("\n"),
        // La foto viaja con el sitio, así que no hay clave de R2 que borrar.
        imageUrl: `/products/${slug}.webp`,
        imageKey: null,
        priceCents: line.priceCents,
        wholesalePriceCents: line.wholesalePriceCents,
        compareAtCents: null,
        inStock: true,
        sortOrder: (lineIndex + 1) * 100 + i,
        published: true,
      });
      created++;
      console.log(`+ ${line.collection} / ${s.name}`);
    }
  }

  console.log(`[Seed] Done. ${created} product(s) added.`);
}

/**
 * Boot hook. Va detrás de SEED_CATALOG para que un redeploy no lo vuelva a
 * disparar en cada reinicio del contenedor: pones la variable, esperas el
 * deploy y la borras. Un fallo se registra y se traga: el catálogo es
 * contenido, y el sitio debe arrancar igual sin él.
 */
export async function seedCatalogIfRequested(): Promise<void> {
  if (process.env.SEED_CATALOG !== "true") return;
  try {
    console.log("[Seed] SEED_CATALOG is set — loading the California Vibes catalogue…");
    await seedCatalog();
  } catch (err) {
    console.error("[Seed] FAILED — the site will start without it:", err);
  }
}

/** CLI entry point: `pnpm seed`. */
const isCli =
  process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js");
if (isCli) {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  seedCatalog()
    .then(() => process.exit(0))
    .catch(err => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
