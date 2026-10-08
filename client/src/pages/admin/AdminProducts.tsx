import {
  AdminLayout,
  Card,
  Field,
  buttonClass,
  ghostButtonClass,
  inputClass,
} from "@/components/AdminLayout";
import { useR2Upload } from "@/hooks/useR2Upload";
import type { RouterOutputs } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { STRAINS, isHexColor, type Strain } from "@shared/const";
import { formatMoney, parseMoney } from "@shared/store";
import { groupByLine, LINES } from "@shared/lines";
import {
  ChevronDown,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type AdminProduct = RouterOutputs["catalog"]["adminProducts"][number];

const DEFAULT_ACCENT = "#ff8a2b";

export default function AdminProducts() {
  const utils = trpc.useUtils();
  const products = trpc.catalog.adminProducts.useQuery(undefined, {
    retry: false,
  });

  const [name, setName] = useState("");
  const [collection, setCollection] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [strain, setStrain] = useState<Strain | "">("");
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [price, setPrice] = useState("");

  const refresh = () => {
    utils.catalog.invalidate();
    utils.adminAuth.dashboardOverview.invalidate();
  };

  const create = trpc.catalog.createProduct.useMutation({
    onSuccess: () => {
      setName("");
      refresh();
      toast.success("Product created. Open it below to add the photo and description.");
    },
    onError: e => toast.error(e.message || "Could not create product"),
  });

  // Lines already in use, plus the four standard ones, as suggestions.
  const lineNames = Array.from(
    new Set([
      ...LINES.map(l => l.name),
      ...(products.data ?? []).map(p => p.collection).filter(Boolean),
    ])
  ) as string[];

  const groups = groupByLine(products.data ?? []);

  return (
    <AdminLayout title="Products">
      <datalist id="line-names">
        {lineNames.map(n => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <Card
        title="New product"
        description="One product per strain and format. Lab reports are attached to a product, so it has to exist first."
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!name.trim()) {
              toast.error("The product needs a name");
              return;
            }
            const priceCents = price.trim() ? parseMoney(price) : 0;
            if (priceCents === null) {
              toast.error("Write the price like 34.99");
              return;
            }
            create.mutate({
              priceCents,
              name: name.trim(),
              collection: collection.trim() || null,
              subtitle: subtitle.trim() || null,
              strain: strain || null,
              accentColor: accent,
            });
          }}
          className="grid gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Product line" hint="The heading it's grouped under.">
              <input
                list="line-names"
                value={collection}
                onChange={e => setCollection(e.target.value)}
                placeholder="CBG Flower"
                className={inputClass}
              />
            </Field>
            <Field label="Strain name">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="OG Kush"
                className={inputClass}
              />
            </Field>
            <Field label="Type">
              <StrainSelect value={strain} onChange={setStrain} />
            </Field>
            <Field label="Label colour">
              <AccentInput value={accent} onChange={setAccent} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <Field label="Format" hint="The line under the name on the site.">
              <input
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="3.5G jar · Premium indoor CBG flower"
                className={inputClass}
              />
            </Field>
            <Field label="Price (USD)">
              <input
                inputMode="decimal"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="34.99"
                className={inputClass}
              />
            </Field>
          </div>
          <div>
            <button type="submit" disabled={create.isPending} className={buttonClass}>
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create product
            </button>
          </div>
        </form>
      </Card>

      <div className="mt-8 space-y-8">
        {products.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        ) : groups.length ? (
          groups.map(group => (
            <section key={group.name}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
                {group.name} · {group.items.length}
              </h2>
              <div className="space-y-2">
                {group.items.map(p => (
                  <ProductRow key={p.id} product={p} onChanged={refresh} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">
            No products yet. Create the first one above.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StrainSelect({
  value,
  onChange,
}: {
  value: Strain | "";
  onChange: (value: Strain | "") => void;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as Strain | "")}
      className={inputClass}
    >
      <option value="">Not set</option>
      {STRAINS.map(s => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  );
}

/** Colour picker and hex field kept in step: pick by eye or paste the value. */
function AccentInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="color"
        aria-label="Pick the label colour"
        value={isHexColor(value) && value.length === 7 ? value : DEFAULT_ACCENT}
        onChange={e => onChange(e.target.value)}
        className="h-[42px] w-12 shrink-0 cursor-pointer rounded-xl border border-white/15 bg-black p-1"
      />
      <input
        value={value}
        onChange={e => onChange(e.target.value.trim())}
        placeholder="#f5b52e"
        className={`${inputClass} font-mono`}
      />
    </div>
  );
}

function ProductRow({
  product,
  onChanged,
}: {
  product: AdminProduct;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1029]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
      >
        <span
          className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black"
          style={{ boxShadow: `inset 0 -3px 0 ${product.accentColor ?? "transparent"}` }}
        >
          {product.imageUrl && (
            <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-1" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{product.name}</span>
          <span className="block truncate text-xs text-white/45">
            {[
              product.priceCents > 0 ? formatMoney(product.priceCents) : "No price",
              !product.inStock ? "Out of stock" : null,
              product.subtitle,
              `${product.reports.length} report${product.reports.length === 1 ? "" : "s"}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        {!product.published && (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/60">
            Hidden
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {/* Mounted only while open: twenty-four forms' worth of state would
          otherwise sit in memory for rows nobody is editing. */}
      {open && <ProductEditor product={product} onChanged={onChanged} />}
    </div>
  );
}

function ProductEditor({
  product,
  onChanged,
}: {
  product: AdminProduct;
  onChanged: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [collection, setCollection] = useState(product.collection ?? "");
  const [subtitle, setSubtitle] = useState(product.subtitle ?? "");
  const [strain, setStrain] = useState<Strain | "">(product.strain ?? "");
  const [accent, setAccent] = useState(product.accentColor ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [sortOrder, setSortOrder] = useState(product.sortOrder);
  const [facts, setFacts] = useState(product.facts ?? "");
  const [price, setPrice] = useState(product.priceCents ? (product.priceCents / 100).toFixed(2) : "");
  const [compareAt, setCompareAt] = useState(
    product.compareAtCents ? (product.compareAtCents / 100).toFixed(2) : ""
  );
  const { upload, progress, isUploading } = useR2Upload();

  const update = trpc.catalog.updateProduct.useMutation({
    onSuccess: () => {
      onChanged();
      toast.success("Saved");
    },
    onError: e => toast.error(e.message || "Could not save"),
  });

  const remove = trpc.catalog.deleteProduct.useMutation({
    onSuccess: () => {
      onChanged();
      toast.success("Product deleted");
    },
    onError: e => toast.error(e.message || "Could not delete"),
  });

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const up = await upload(file, "product-image");
      update.mutate({
        id: product.id,
        imageUrl: up.publicUrl,
        imageKey: up.storageKey,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const save = () => {
    if (!name.trim()) {
      toast.error("The product needs a name");
      return;
    }
    if (accent && !isHexColor(accent)) {
      toast.error("The label colour must be a hex value like #f5b52e");
      return;
    }
    const priceCents = price.trim() ? parseMoney(price) : 0;
    const compareAtCents = compareAt.trim() ? parseMoney(compareAt) : null;
    if (priceCents === null || (compareAt.trim() && compareAtCents === null)) {
      toast.error("Write prices like 34.99");
      return;
    }
    update.mutate({
      priceCents,
      compareAtCents,
      facts: facts.trim() || null,
      id: product.id,
      name: name.trim(),
      collection: collection.trim() || null,
      subtitle: subtitle.trim() || null,
      strain: strain || null,
      accentColor: accent || null,
      description: description.trim() || null,
      sortOrder,
    });
  };

  return (
    <div className="border-t border-white/10 p-5">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="shrink-0">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl bg-black">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-contain p-1.5"
              />
            ) : (
              <ImagePlus className="h-6 w-6 text-white/50" />
            )}
          </div>
          <label className="mt-2 block cursor-pointer text-center text-xs font-semibold text-white/60 underline underline-offset-2 hover:text-white">
            {isUploading ? `Uploading ${progress}%` : "Change photo"}
            <input type="file" accept="image/*" onChange={onImage} className="hidden" />
          </label>
          <p className="mt-1 w-28 text-center text-[11px] leading-tight text-white/35">
            Transparent PNG or WebP looks best
          </p>
        </div>

        <div className="grid flex-1 gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Product line">
              <input
                list="line-names"
                value={collection}
                onChange={e => setCollection(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Strain name">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Type">
              <StrainSelect value={strain} onChange={setStrain} />
            </Field>
            <Field label="Label colour">
              <AccentInput value={accent} onChange={setAccent} />
            </Field>
          </div>
          <Field label="Format">
            <input
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (USD)" hint="Empty or 0 = can't be bought yet.">
              <input
                inputMode="decimal"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="34.99"
                className={inputClass}
              />
            </Field>
            <Field label="Was price (optional)" hint="Shown struck through.">
              <input
                inputMode="decimal"
                value={compareAt}
                onChange={e => setCompareAt(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Stock">
              <button
                type="button"
                onClick={() =>
                  update.mutate({ id: product.id, inStock: !product.inStock })
                }
                className={`${inputClass} text-left font-semibold ${product.inStock ? "text-emerald-300" : "text-red-300"}`}
              >
                {product.inStock ? "In stock (click to mark sold out)" : "Sold out (click to restock)"}
              </button>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
          <Field label="Product facts" hint="One per line, as Label: value. Shown on the product page.">
            <textarea
              value={facts}
              onChange={e => setFacts(e.target.value)}
              rows={4}
              className={`${inputClass} font-mono text-xs`}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort order" hint="Lower appears first within its line.">
              <input
                type="number"
                value={sortOrder}
                onChange={e => setSortOrder(Number(e.target.value) || 0)}
                className={inputClass}
              />
            </Field>
            <Field label="Page address">
              <input
                value={`/products/${product.slug}`}
                readOnly
                className={`${inputClass} bg-white/[0.04] text-white/50`}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={save} disabled={update.isPending} className={buttonClass}>
              {update.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </button>

            <button
              onClick={() =>
                update.mutate({ id: product.id, published: !product.published })
              }
              className={ghostButtonClass}
            >
              {product.published ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              {product.published ? "Published" : "Hidden"}
            </button>

            <button
              onClick={() => {
                if (
                  confirm(
                    `Delete "${product.name}"? Its ${product.reports.length} lab report(s) and their PDFs will be deleted too.`
                  )
                ) {
                  remove.mutate({ id: product.id });
                }
              }}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/40 hover:bg-red-500/15 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
