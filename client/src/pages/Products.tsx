import { PageHeader, PublicLayout } from "@/components/PublicLayout";
import { ProductCard } from "@/components/ProductCard";
import { useTitle } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { groupByLine, lineSlug } from "@shared/lines";
import { useLocation, useSearch } from "wouter";

function strainSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Both filters live in the URL, not in state: a filtered view can be linked
 * from the home page ("?line=pre-rolls"), shared, and survives Back.
 */
export default function Products() {
  useTitle("Products");
  const [, navigate] = useLocation();
  const params = new URLSearchParams(useSearch());
  const line = params.get("line") ?? "";
  const strain = params.get("strain") ?? "";

  const products = trpc.catalog.publicProducts.useQuery();
  const all = products.data ?? [];
  const allGroups = groupByLine(all);
  const strainNames = Array.from(new Set(all.map(p => p.name)));

  const groups = allGroups
    .filter(g => !line || lineSlug(g.name) === line)
    .map(g => ({
      ...g,
      items: g.items.filter(p => !strain || strainSlug(p.name) === strain),
    }))
    .filter(g => g.items.length > 0);

  const setFilter = (key: "line" | "strain", value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    navigate(qs ? `/products?${qs}` : "/products", { replace: true });
  };

  return (
    <PublicLayout>
      <PageHeader title="Products" eyebrow="Shop California Vibes">
        Six strains in three formats: CBG flower, blue lotus pre-rolls and
        disposables. THC free and lab tested.
      </PageHeader>

      <div className="container py-10">
        <div className="flex flex-col gap-4">
          <FilterRow
            label="Format"
            value={line}
            onChange={v => setFilter("line", v)}
            options={[
              { value: "", label: "All formats" },
              ...allGroups.map(g => ({ value: lineSlug(g.name), label: g.name })),
            ]}
          />
          <FilterRow
            label="Strain"
            script
            value={strain}
            onChange={v => setFilter("strain", v)}
            options={[
              { value: "", label: "All strains" },
              ...strainNames.map(n => ({ value: strainSlug(n), label: n })),
            ]}
          />
        </div>

        {products.isLoading ? (
          <p className="mt-12 text-haze">Loading products…</p>
        ) : products.isError ? (
          <p className="mt-12 text-haze">
            The products couldn't be loaded. Reload the page to try again.
          </p>
        ) : groups.length === 0 ? (
          <div className="mt-12 max-w-xl">
            <p className="text-lg text-cream">Nothing matches those filters.</p>
            <button
              type="button"
              onClick={() => navigate("/products", { replace: true })}
              className="btn btn-ghost mt-5"
            >
              Show all products
            </button>
          </div>
        ) : (
          <div className="mt-12 space-y-16">
            {groups.map(group => (
              <section key={group.name} aria-labelledby={`line-${lineSlug(group.name)}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-rule pb-4">
                  <h2
                    id={`line-${lineSlug(group.name)}`}
                    className="text-4xl text-cream md:text-5xl"
                  >
                    {group.name}
                  </h2>
                  {group.info && (
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-gold">
                      {group.info.format}
                    </p>
                  )}
                </div>
                <div className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">
                  {group.items.map(p => (
                    <ProductCard key={p.id} product={p} showLine={false} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

function FilterRow({
  label,
  value,
  options,
  onChange,
  script,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  script?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value || "all"}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-4 py-2 transition-colors",
            script && o.value
              ? "script text-lg"
              : "text-xs font-extrabold uppercase tracking-[0.14em]",
            value === o.value
              ? "bg-gold text-night"
              : "bg-white/[0.07] text-haze hover:bg-white/15 hover:text-cream"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
