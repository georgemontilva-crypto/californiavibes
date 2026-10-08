import { DEFAULT_STORE, isHexColor } from "@shared/const";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/lib/cart";
import type { inferRouterOutputs } from "@trpc/server";
import type { CSSProperties } from "react";
import { useEffect } from "react";
import type { AppRouter } from "../../../server/routers";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type CatalogProduct = RouterOutputs["catalog"]["publicProducts"][number];
export type ProductDetail = RouterOutputs["catalog"]["productBySlug"];
export type ReportProduct = RouterOutputs["catalog"]["publicReports"][number];
export type PublicVideo = RouterOutputs["videos"]["publicList"][number];

/**
 * Sets --accent for a subtree. Returns nothing when the stored value isn't a
 * plain hex colour, so the subtree keeps the site default instead of inheriting
 * a broken declaration.
 */
export function accentStyle(color: string | null | undefined): CSSProperties {
  if (!color || !isHexColor(color)) return {};
  return { "--accent": color } as CSSProperties;
}

export function strainLabel(strain: string | null | undefined): string {
  if (!strain) return "";
  return strain.charAt(0).toUpperCase() + strain.slice(1);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  // A bare YYYY-MM-DD parses as UTC midnight and can print as the day before
  // in the Americas; pin it to local noon so the date shown is the date typed.
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title
      ? `${title} — California Vibes`
      : "California Vibes — Premium Botanicals";
  }, [title]);
}

/** Store settings with the defaults filled in while the query loads. */
export function useStoreConfig() {
  const q = trpc.store.config.useQuery();
  return (
    q.data ?? {
      ...DEFAULT_STORE,
      payment: { mode: "manual" as const },
    }
  );
}

/** Cart items joined to the live catalogue, dropping anything unpublished. */
export function useCartLines() {
  const cart = useCart();
  const catalog = trpc.catalog.publicProducts.useQuery();
  const byId = new Map((catalog.data ?? []).map(p => [p.id, p]));
  const lines = cart.items
    .map(i => {
      const product = byId.get(i.productId);
      return product ? { product, qty: i.qty } : null;
    })
    .filter((l): l is { product: CatalogProduct; qty: number } => l !== null);
  const subtotalCents = lines.reduce((s, l) => s + l.product.priceCents * l.qty, 0);
  return { lines, subtotalCents, loading: catalog.isLoading, cart };
}

export function canBuy(p: { inStock: boolean; priceCents: number }) {
  return p.inStock && p.priceCents > 0;
}
