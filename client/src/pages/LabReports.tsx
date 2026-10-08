import { LabReportsButton } from "@/components/Brand";
import { PageHeader, PublicLayout } from "@/components/PublicLayout";
import { ReportRow } from "@/components/ReportRow";
import {
  accentStyle,
    useTitle,
  type ReportProduct,
} from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { groupByLine } from "@shared/lines";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";

/** Letters and digits only, so "08-2601", "082601" and "#082601" all match. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * A product matches on its strain or line name; otherwise only the reports
 * whose batch or title match are kept. Searching a batch number therefore
 * narrows a strain with five batches down to the one in the visitor's hand.
 */
function filterProduct(product: ReportProduct, query: string): ReportProduct | null {
  // With no search every strain is listed, reported or not: the ones still
  // waiting on their certificate show a "Coming soon" tag instead.
  if (!query) return product;
  const byName = normalize(`${product.name} ${product.collection ?? ""}`).includes(query);
  if (byName) return product;
  const reports = product.reports.filter(r =>
    normalize(`${r.batch ?? ""} ${r.title}`).includes(query)
  );
  return reports.length > 0 ? { ...product, reports } : null;
}

export default function LabReports() {
  useTitle("Lab Reports");
  const initial = new URLSearchParams(useSearch()).get("q") ?? "";
  const [query, setQuery] = useState(initial);
  // The home page search lands here with ?q=…; a second search from there
  // must replace what is in the box, not be ignored because state already exists.
  useEffect(() => setQuery(initial), [initial]);

  const data = trpc.catalog.publicReports.useQuery();
  const all = data.data ?? [];
  const q = normalize(query);

  const matches = all
    .map(p => filterProduct(p, q))
    .filter((p): p is ReportProduct => p !== null);
  const groups = groupByLine(matches);

  return (
    <PublicLayout>
      <PageHeader title="Lab reports" eyebrow="Tested batch by batch">
        Every product is third-party lab tested. Open the full folder of
        certificates, or find a product below.
      </PageHeader>

      <div className="container py-10">
        <div className="mb-8 flex flex-col items-start gap-4 rounded-[2rem] bg-dusk p-6 ring-1 ring-rule sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg text-cream/85">
            All of our certificates of analysis live in one shared folder.
          </p>
          <LabReportsButton className="btn btn-gold" label="Open all lab reports" />
        </div>
        <div className="relative max-w-xl">
          <label htmlFor="report-search" className="sr-only">
            Strain or batch number
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-haze"
            aria-hidden
          />
          <input
            id="report-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Strain, format or batch number"
            className="field !pl-12 !pr-12 text-lg"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-haze hover:text-cream"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="mt-10" aria-live="polite">
          {data.isLoading ? (
            <p className="text-haze">Loading reports…</p>
          ) : data.isError ? (
            <p className="text-haze">
              The reports couldn't be loaded. Reload the page to try again.
            </p>
          ) : all.length === 0 ? (
            <EmptyState title="Lab reports coming soon">
              Use the button above to open the folder with every certificate.
            </EmptyState>
          ) : groups.length === 0 ? (
            <EmptyState title={`No report matches "${query.trim()}"`}>
              Try the strain name, or{" "}
              <Link href="/contact" className="underline underline-offset-4 hover:text-cream">
                ask us for the report
              </Link>
              .
            </EmptyState>
          ) : (
            <div className="space-y-14">
              {groups.map(group => (
                <section key={group.name}>
                  <h2 className="border-b border-rule pb-3 text-4xl text-cream md:text-5xl">
                    {group.name}
                  </h2>
                  <ul>
                    {group.items.map(product => (
                      <li
                        key={product.id}
                        style={accentStyle(product.accentColor)}
                        className="grid gap-x-6 gap-y-2 border-b border-rule py-5 md:grid-cols-[250px_1fr]"
                      >
                        <Link
                          href={`/products/${product.slug}`}
                          className="group flex items-center gap-4 self-start"
                        >
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt=""
                              loading="lazy"
                              className="h-16 w-16 shrink-0 object-contain"
                            />
                          )}
                          <span>
                            <span className="script block text-2xl leading-none text-cream group-hover:text-gold">
                              {product.name}
                            </span>
                            <span className="mt-1 block text-sm font-bold uppercase tracking-[0.12em] text-accent">
                              {product.collection}
                            </span>
                          </span>
                        </Link>

                        {product.reports.length > 0 ? (
                          <ul className="divide-y divide-rule">
                            {product.reports.map(r => (
                              <ReportRow key={r.id} report={r} />
                            ))}
                          </ul>
                        ) : (
                          <div className="flex flex-col gap-3 self-center sm:flex-row sm:items-center sm:justify-between">
                            <span className="self-start rounded-full border-2 border-accent px-4 py-1 text-sm font-bold uppercase tracking-wider text-accent">
                              In the folder
                            </span>
                            <LabReportsButton
                              className="inline-flex items-center gap-1.5 text-haze underline-offset-4 hover:text-cream hover:underline"
                              label="Open the lab reports folder"
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-xl border-l-[3px] border-gold pl-5">
      <p className="text-xl font-semibold text-cream">{title}</p>
      <p className="mt-2 text-haze">{children}</p>
    </div>
  );
}
