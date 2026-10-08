import { AgeBadge, CLAIMS, ClaimBadge, StrainPill } from "@/components/Brand";
import { Price, ProductCard, useAddToCart } from "@/components/ProductCard";
import { ProductShot } from "@/components/ProductShot";
import { PublicLayout } from "@/components/PublicLayout";
import { QtyStepper } from "@/components/QtyStepper";
import { accentStyle, canBuy, useStoreConfig, useTitle } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { parseFacts } from "@shared/const";
import { lineSlug } from "@shared/lines";
import { ArrowUpRight, ChevronLeft, FileText, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";

export default function ProductDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const product = trpc.catalog.productBySlug.useQuery({ slug }, { retry: false });
  const catalog = trpc.catalog.publicProducts.useQuery();
  const { labReportsUrl } = useStoreConfig();
  const add = useAddToCart();
  const [qty, setQty] = useState(1);
  const p = product.data;
  useTitle(p ? `${p.name} ${p.collection ?? ""}`.trim() : "Product");

  if (product.isLoading) {
    return (
      <PublicLayout>
        <div className="container py-24 text-haze">Loading…</div>
      </PublicLayout>
    );
  }

  if (!p) {
    return (
      <PublicLayout>
        <div className="container max-w-2xl py-24">
          <h1 className="text-5xl text-cream md:text-6xl">That product isn't here</h1>
          <p className="mt-4 text-lg text-haze">
            It may have been renamed or taken out of the lineup.
          </p>
          <Link href="/products" className="btn btn-gold mt-8">
            See all products
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const others = catalog.data ?? [];
  const sameStrain = others.filter(
    o => o.name.toLowerCase() === p.name.toLowerCase() && o.id !== p.id
  );
  const sameLine = others.filter(o => o.collection === p.collection && o.id !== p.id);
  const facts = parseFacts(p.facts);
  const report = p.reports[0];
  const buyable = canBuy(p);

  return (
    <PublicLayout>
      <div style={accentStyle(p.accentColor)}>
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 70% at 30% 55%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 70%)",
            }}
            aria-hidden
          />
          <div className="container relative pt-6">
            <Link
              href={p.collection ? `/products?line=${lineSlug(p.collection)}` : "/products"}
              className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-[0.16em] text-haze hover:text-cream"
            >
              <ChevronLeft className="h-4 w-4" />
              {p.collection ?? "Products"}
            </Link>
          </div>

          <div className="container relative grid gap-8 pb-14 pt-4 lg:grid-cols-2 lg:items-center lg:gap-14">
            <ProductShot
              src={p.imageUrl}
              alt={`${p.name} ${p.collection ?? ""}`}
              eager
              className="rise mx-auto w-full max-w-[560px]"
            />

            <div>
              {p.collection && (
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-accent">
                  {p.collection}
                </p>
              )}
              <h1 className="mt-3">
                <StrainPill name={p.name} className="text-4xl sm:text-5xl" />
              </h1>
              {p.subtitle && <p className="mt-4 text-lg font-semibold text-haze">{p.subtitle}</p>}

              <Price
                cents={p.priceCents}
                compareAt={p.compareAtCents}
                className="mt-5 block text-3xl font-extrabold text-cream"
              />

              {p.description && (
                <p className="mt-5 max-w-xl whitespace-pre-line text-lg text-cream/85">
                  {p.description}
                </p>
              )}

              {buyable ? (
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <QtyStepper value={qty} onChange={setQty} label={p.name} />
                  <button
                    type="button"
                    onClick={() => {
                      add(p, qty);
                      setQty(1);
                    }}
                    className="btn btn-gold flex-1 sm:flex-none"
                  >
                    <ShoppingBag className="h-4.5 w-4.5" />
                    Add to cart
                  </button>
                </div>
              ) : (
                <p className="mt-7 inline-block rounded-full bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-wider text-haze">
                  {p.inStock ? "Coming soon" : "Sold out for now"}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                {report ? (
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    <FileText className="h-4 w-4" />
                    Lab report{report.batch ? ` · Batch ${report.batch}` : ""}
                  </a>
                ) : (
                  <a
                    href={labReportsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    <FileText className="h-4 w-4" />
                    Lab reports
                    <ArrowUpRight className="h-4 w-4 opacity-70" />
                  </a>
                )}
              </div>

              {sameStrain.length > 0 && (
                <div className="mt-8">
                  <p className="eyebrow">{p.name} also comes as</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sameStrain.map(o => (
                      <Link
                        key={o.id}
                        href={`/products/${o.slug}`}
                        className="flex items-center gap-2 rounded-full bg-black/30 py-1 pl-1 pr-4 ring-1 ring-rule hover:ring-accent"
                      >
                        {o.imageUrl && (
                          <img src={o.imageUrl} alt="" className="h-10 w-10 object-contain" />
                        )}
                        <span className="text-sm font-bold text-cream">{o.collection}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="holo-rule relative" aria-hidden />
        </section>

        <section className="container grid gap-10 py-14 md:py-16 lg:grid-cols-2">
          {facts.length > 0 && (
            <div>
              <h2 className="text-4xl text-cream">Product facts</h2>
              <dl className="mt-5 divide-y divide-rule border-y border-rule">
                {facts.map(f => (
                  <div key={f.label} className="flex justify-between gap-6 py-3">
                    <dt className="text-haze">{f.label}</dt>
                    <dd className="text-right font-semibold text-cream">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className={cn(facts.length === 0 && "lg:col-span-2")}>
            <h2 className="text-4xl text-cream">On every label</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {CLAIMS.map(c => (
                <li key={c.label}>
                  <ClaimBadge icon={c.icon} label={c.label} />
                </li>
              ))}
              <li className="flex items-center gap-2.5">
                <AgeBadge className="h-9 w-9 text-sm" />
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-cream">
                  Adults only
                </span>
              </li>
            </ul>
            {p.reports.length > 1 && (
              <div className="mt-8">
                <p className="eyebrow">All reports for this product</p>
                <ul className="mt-3 space-y-2">
                  {p.reports.map(r => (
                    <li key={r.id}>
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-cream underline-offset-4 hover:text-gold hover:underline"
                      >
                        <FileText className="h-4 w-4 text-gold" />
                        {r.title}
                        {r.batch ? ` · Batch ${r.batch}` : ""}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>

      {sameLine.length > 0 && (
        <section className="container">
          <h2 className="text-4xl text-cream md:text-5xl">More {p.collection}</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {sameLine.map(s => (
              <ProductCard key={s.id} product={s} showLine={false} />
            ))}
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
