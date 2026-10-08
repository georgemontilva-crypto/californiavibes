import { CLAIMS, ClaimBadge, LabReportsButton } from "@/components/Brand";
import { Palm } from "@/components/Logo";
import { ProductShot } from "@/components/ProductShot";
import { PageHeader, PublicLayout } from "@/components/PublicLayout";
import { accentStyle, useTitle } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { BRAND_SLOGAN, DEFAULT_CONTACT } from "@shared/const";
import { groupByLine } from "@shared/lines";
import { Link } from "wouter";

const FORMATS = [
  {
    term: "CBG Flower",
    detail:
      "Premium indoor CBG flower, 3.5 grams to a holographic jar. Grown under controlled light and air, THC free.",
  },
  {
    term: "Pre-Rolls",
    detail:
      "A 2-pack of one-gram pre-rolls made from our premium botanical blend and infused with blue lotus.",
  },
  {
    term: "Disposables",
    detail:
      "One gram of the same blue lotus botanical blend in a black and gold disposable. Nothing to fill, nothing to charge first.",
  },
];

export default function About() {
  useTitle("About Us");
  const products = trpc.catalog.publicProducts.useQuery();
  const details = trpc.site.contactDetails.useQuery().data ?? DEFAULT_CONTACT;
  const faces = groupByLine(products.data ?? [])
    .map((g, i) => g.items[[1, 4, 3][i] ?? 0] ?? g.items[0])
    .filter(Boolean);

  return (
    <PublicLayout>
      <PageHeader title="About us" eyebrow="Premium botanicals">
        California Vibes is the West Coast sunset in a jar: botanicals made to
        slow the day down, with nothing you don't want in them.
      </PageHeader>

      <div className="container py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <h2 className="text-balance text-5xl text-cream md:text-6xl">
              <span className="script text-logo normal-case">{BRAND_SLOGAN}</span>
            </h2>
            <div className="mt-6 max-w-xl space-y-4 text-lg text-cream/85">
              <p>
                We started California Vibes for the moment the sun touches the
                water: that slow, golden stretch at the end of the day. Our
                products are made to feel like it.
              </p>
              <p>
                That means THC-free botanicals, indoor CBG flower and blends
                infused with blue lotus, in packs as bright as a Pacific sunset.
                It also means proof: every product is lab tested, and the
                certificates are one click away.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/products" className="btn btn-gold">
                Shop the lineup
              </Link>
              <LabReportsButton className="btn btn-ghost" label="Read the lab reports" />
            </div>
          </div>

          {faces.length > 0 && (
            <ul className="grid grid-cols-3 items-end gap-2">
              {faces.map(p => (
                <li key={p.id} style={accentStyle(p.accentColor)}>
                  <Link href={`/products/${p.slug}`} aria-label={`${p.name} ${p.collection ?? ""}`}>
                    <ProductShot src={p.imageUrl} alt="" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="bg-dusk">
        <div className="holo-rule" aria-hidden />
        <div className="container grid gap-10 py-14 md:py-20 lg:grid-cols-[320px_1fr]">
          <div>
            <p className="eyebrow">The lineup</p>
            <h2 className="mt-3 text-5xl text-cream md:text-6xl">Three ways to unwind</h2>
          </div>
          <dl className="grid gap-x-10 gap-y-8 md:grid-cols-3">
            {FORMATS.map(item => (
              <div key={item.term} className="border-t-[3px] border-gold pt-4">
                <dt className="font-display text-3xl uppercase text-cream">{item.term}</dt>
                <dd className="mt-2 text-haze">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container grid gap-10 py-14 md:py-20 lg:grid-cols-[320px_1fr]">
        <div>
          <p className="eyebrow">Our standard</p>
          <h2 className="mt-3 text-5xl text-cream md:text-6xl">What the label means</h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {CLAIMS.map(c => (
            <li key={c.label} className="rounded-3xl bg-panel p-6 ring-1 ring-rule">
              <ClaimBadge icon={c.icon} label={c.label} />
              <p className="mt-3 text-haze">{c.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container">
        <div className="relative overflow-hidden rounded-[2rem]">
          <div className="bg-sunset absolute inset-0" aria-hidden />
          <Palm className="pointer-events-none absolute -bottom-6 -left-6 h-[130%] w-auto text-night/80" />
          <div className="relative flex flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-12">
            <div className="md:pl-20">
              <h2 className="text-4xl text-cream md:text-5xl">
                Carry California Vibes, or just have a question?
              </h2>
              <p className="mt-2 text-cream/85">
                {details.address ? `${details.company}, ${details.address}.` : "We'd love to hear from you."}
              </p>
            </div>
            <Link href="/contact" className="btn btn-gold shrink-0">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
