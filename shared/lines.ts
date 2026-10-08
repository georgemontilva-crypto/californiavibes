/**
 * The product lines, in the order the site shows them.
 *
 * A line is just the `collection` text on a product; this file only adds the
 * order and the copy each line gets on the public pages. A line created from
 * the admin that isn't listed here still shows up, after these, without a blurb.
 */
export type LineInfo = {
  name: string;
  /** Used in the URL filter on the Products page. */
  slug: string;
  /** Short format line shown next to the name. */
  format: string;
  blurb: string;
};

export const LINES: LineInfo[] = [
  {
    name: "CBG Flower",
    slug: "cbg-flower",
    format: "3.5G jar · Premium indoor CBG flower",
    blurb:
      "Indoor-grown CBG flower in the holographic jar. THC free, lab tested and pesticide free.",
  },
  {
    name: "Pre-Rolls",
    slug: "pre-rolls",
    format: "2-pack · 2 × 1G · Blue Lotus infused",
    blurb:
      "Two one-gram pre-rolls of our premium botanical blend, infused with blue lotus.",
  },
  {
    name: "Disposables",
    slug: "disposables",
    format: "1G disposable · Blue Lotus infused",
    blurb:
      "A gold-finish disposable filled with one gram of premium botanical blend, infused with blue lotus.",
  },
];

export function lineInfo(name: string | null | undefined): LineInfo | null {
  if (!name) return null;
  return LINES.find(l => l.name.toLowerCase() === name.toLowerCase()) ?? null;
}

export function lineSlug(name: string | null | undefined): string {
  const known = lineInfo(name);
  if (known) return known.slug;
  return (name ?? "other")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Groups products by line, known lines first in the order above, then any
 * others alphabetically. Products without a line land in a final "Other" group.
 */
export function groupByLine<T extends { collection: string | null }>(
  items: T[]
): { name: string; info: LineInfo | null; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.collection?.trim() || "Other";
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  const rank = (name: string) => {
    const at = LINES.findIndex(
      l => l.name.toLowerCase() === name.toLowerCase()
    );
    if (at !== -1) return at;
    return name === "Other" ? Number.MAX_SAFE_INTEGER : LINES.length;
  };
  return Array.from(groups.entries())
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([name, list]) => ({ name, info: lineInfo(name), items: list }));
}
