import { CLAIMS, ClaimBadge, LabReportsButton } from "@/components/Brand";
import { FaqSection } from "@/components/HomeSections";
import { Lockup, Palm } from "@/components/Logo";
import { ProductCard } from "@/components/ProductCard";
import { ProductShot } from "@/components/ProductShot";
import { PublicLayout } from "@/components/PublicLayout";
import { ReelVideo } from "@/components/ReelVideo";
import {
  accentStyle,
  useTitle,
  type CatalogProduct,
  type PublicVideo,
} from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { BRAND_SLOGAN } from "@shared/const";
import { groupByLine } from "@shared/lines";
import { ArrowRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";

/** Strains in the order they first appear, each with its products across lines. */
function groupByStrain(products: CatalogProduct[]) {
  const map = new Map<string, CatalogProduct[]>();
  for (const p of products) {
    const key = p.name.trim().toLowerCase();
    map.set(key, [...(map.get(key) ?? []), p]);
  }
  return Array.from(map.values()).map(items => ({
    name: items[0].name,
    accent: items[0].accentColor,
    items: groupByLine(items).flatMap(g => g.items),
  }));
}

export default function Home() {
  useTitle("");
  const products = trpc.catalog.publicProducts.useQuery();
  const videos = trpc.videos.publicList.useQuery();

  const all = products.data ?? [];
  const heroVideo = videos.data?.find(v => v.featured) ?? null;
  const reels = (videos.data ?? []).filter(v => !v.featured);

  return (
    <PublicLayout>
      <Hero products={all} video={heroVideo} />
      <ClaimsTicker />
      <StrainPicker products={all} loading={products.isLoading} />
      {reels.length > 0 && <Reels videos={reels} />}
      <BrandPromise />
      <LabBand />
      <FaqSection />
    </PublicLayout>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────────────
   The postcard on the pack: a striped sun sinking into the sea between two
   palms, with the three formats standing on the shore. */

function Hero({
  products,
  video,
}: {
  products: CatalogProduct[];
  video: PublicVideo | null;
}) {
  // One of each format, in the same strain so the trio reads as a set.
  const trio = useMemo(() => {
    const groups = groupByLine(products);
    const strain = "og kush";
    return groups
      .map(g => g.items.find(p => p.name.toLowerCase() === strain) ?? g.items[0])
      .filter(Boolean)
      .slice(0, 3);
  }, [products]);

  return (
    <section className="relative isolate overflow-hidden">
      <div className="bg-sunset absolute inset-0 -z-10" aria-hidden />
      {/* Sun */}
      <div
        className="sun absolute left-1/2 top-[66%] -z-10 aspect-square w-[min(110vw,640px)] -translate-x-1/2 -translate-y-1/2 opacity-95 lg:left-[68%] lg:top-[46%] lg:w-[min(92vw,640px)]"
        aria-hidden
      />
      {/* Sea */}
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-[16%] bg-gradient-to-b lg:h-[30%] from-[#2b1a5c] via-[#140b2e] to-night"
        aria-hidden
      >
        <div className="absolute inset-x-0 top-0 h-px bg-[#ffc65a]/60" />
        <div className="absolute left-1/2 top-2 h-[3px] w-[38%] -translate-x-1/2 rounded-full bg-[#ffc65a]/40 blur-[1px] lg:left-[68%]" />
        <div className="absolute left-1/2 top-6 h-[3px] w-[26%] -translate-x-1/2 rounded-full bg-[#ff8a2b]/35 blur-[1px] lg:left-[68%]" />
        <div className="absolute left-1/2 top-11 h-[2px] w-[16%] -translate-x-1/2 rounded-full bg-[#ff4f6d]/30 lg:left-[68%]" />
      </div>
      <Palm className="sway pointer-events-none absolute -bottom-6 -left-24 -z-10 h-[46%] w-auto text-night sm:-left-16 lg:h-[88%]" />
      <Palm flip className="sway pointer-events-none absolute -bottom-10 -right-28 -z-10 h-[52%] w-auto text-night [animation-delay:-3s] sm:-right-20 lg:h-[96%]" />

      <div className="container grid items-center gap-6 pb-14 pt-10 md:pt-14 lg:min-h-[680px] lg:grid-cols-[1fr_1.05fr] lg:gap-4 lg:pb-20">
        <div className="rise text-center lg:text-left">
          <Lockup className="text-[4.2rem] sm:text-[5.4rem] lg:items-start lg:text-[6.4rem]" />
          <h1 className="mt-5 text-balance text-5xl text-cream drop-shadow-[0_3px_0_rgba(0,0,0,0.35)] sm:text-6xl xl:text-7xl">
            {BRAND_SLOGAN}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg font-medium text-cream/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.45)] lg:mx-0">
            CBG flower, blue lotus pre-rolls and disposables. THC free, pesticide
            free and lab tested, batch after batch.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/products" className="btn btn-gold">
              Shop now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <LabReportsButton className="btn btn-ghost !bg-black/40" />
          </div>
        </div>

        <div className="rise relative mx-auto w-full max-w-[620px] [animation-delay:120ms] lg:max-w-none">
          {video ? (
            <div className="relative mx-auto w-[62%] max-w-[300px] sm:w-[54%]">
              <div className="holo-border rounded-[2rem] shadow-2xl">
                <div className="overflow-hidden rounded-[calc(2rem-2px)]">
                  <ReelVideo src={video.fileUrl} poster={video.posterUrl} title={video.title} />
                </div>
              </div>
              {trio[0] && (
                <Link
                  href={`/products/${trio[0].slug}`}
                  className="absolute -bottom-8 -left-[48%] block w-[78%]"
                  aria-label={`${trio[0].name} ${trio[0].collection ?? ""}`}
                  style={accentStyle(trio[0].accentColor)}
                >
                  <ProductShot src={trio[0].imageUrl} alt="" eager />
                </Link>
              )}
              {trio[1] && (
                <Link
                  href={`/products/${trio[1].slug}`}
                  className="absolute -bottom-6 -right-[44%] block w-[70%]"
                  aria-label={`${trio[1].name} ${trio[1].collection ?? ""}`}
                  style={accentStyle(trio[1].accentColor)}
                >
                  <ProductShot src={trio[1].imageUrl} alt="" eager />
                </Link>
              )}
            </div>
          ) : trio.length > 0 ? (
            <div className="relative aspect-[1.05] w-full">
              {trio[1] && (
                <Link
                  href={`/products/${trio[1].slug}`}
                  className="absolute bottom-[5%] -left-[4%] w-[54%] transition-transform duration-500 hover:-translate-y-2"
                  aria-label={`${trio[1].name} ${trio[1].collection ?? ""}`}
                >
                  <img src={trio[1].imageUrl ?? ""} alt="" className="w-full drop-shadow-[0_24px_24px_rgba(0,0,0,0.55)]" />
                </Link>
              )}
              {trio[2] && (
                <Link
                  href={`/products/${trio[2].slug}`}
                  className="absolute bottom-[5%] -right-[4%] w-[54%] transition-transform duration-500 hover:-translate-y-2"
                  aria-label={`${trio[2].name} ${trio[2].collection ?? ""}`}
                >
                  <img src={trio[2].imageUrl ?? ""} alt="" className="w-full drop-shadow-[0_24px_24px_rgba(0,0,0,0.55)]" />
                </Link>
              )}
              {trio[0] && (
                <Link
                  href={`/products/${trio[0].slug}`}
                  className="absolute -bottom-[2%] left-1/2 w-[64%] -translate-x-1/2 transition-transform duration-500 hover:-translate-y-2"
                  aria-label={`${trio[0].name} ${trio[0].collection ?? ""}`}
                >
                  <img src={trio[0].imageUrl ?? ""} alt="" className="w-full drop-shadow-[0_28px_26px_rgba(0,0,0,0.6)]" />
                </Link>
              )}
            </div>
          ) : (
            <div className="aspect-[1.15] w-full" aria-hidden />
          )}
        </div>
      </div>
      <div className="holo-rule" aria-hidden />
    </section>
  );
}

/* ─── Claims ticker ─────────────────────────────────────────────────────── */

function ClaimsTicker() {
  const items = [...CLAIMS.map(c => c.label), "Smoke less. Feel more.", "21+ only"];
  const row = (hidden?: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map(label => (
        <li key={label} className="flex items-center">
          <span className="whitespace-nowrap px-6 font-display text-2xl uppercase tracking-wide text-gold md:text-3xl">
            {label}
          </span>
          <span className="text-xl text-coral" aria-hidden>
            ✦
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden border-b border-rule bg-dusk py-4">
      <div className="marquee flex w-max">
        {row()}
        {row(true)}
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}

/* ─── Strain picker ─────────────────────────────────────────────────────────
   Six strains, three formats each. Picking a strain repaints the section in
   that pack's colour and lays its three formats side by side. */

function StrainPicker({
  products,
  loading,
}: {
  products: CatalogProduct[];
  loading: boolean;
}) {
  const strains = useMemo(() => groupByStrain(products), [products]);
  const [index, setIndex] = useState(0);
  const current = strains[Math.min(index, Math.max(0, strains.length - 1))];

  return (
    <section
      className="relative overflow-hidden py-16 transition-colors duration-500 md:py-24"
      style={accentStyle(current?.accent)}
    >
      <div
        className="absolute inset-0 -z-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 100%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="container relative">
        <div className="text-center">
          <p className="eyebrow">Six strains · Three formats</p>
          <h2 className="mt-3 text-5xl text-cream md:text-7xl">
            Pick your <span className="script text-logo normal-case">vibe</span>
          </h2>
        </div>

        {loading ? (
          <p className="mt-10 text-center text-haze">Loading the lineup…</p>
        ) : strains.length === 0 ? (
          <p className="mt-10 text-center text-haze">The lineup is on its way. Check back shortly.</p>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Strains"
              className="no-scrollbar -mx-4 mt-9 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
            >
              {strains.map((s, i) => {
                const active = s === current;
                return (
                  <button
                    key={s.name}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setIndex(i)}
                    style={accentStyle(s.accent)}
                    className={cn(
                      "script shrink-0 rounded-full border-2 px-5 py-2 text-xl transition-all",
                      active
                        ? "border-accent bg-accent text-night"
                        : "border-accent/50 bg-black/30 text-cream hover:border-accent"
                    )}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>

            {current && (
              <div key={current.name} className="rise mt-10" role="tabpanel" aria-label={current.name}>
                <StrainCarousel items={current.items} />
                <div className="mt-8 text-center">
                  <Link href="/products" className="btn btn-ghost">
                    See every product
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ─── Strain carousel ─────────────────────────────────────────────────────
   On phones the three formats of a strain slide sideways, one card at a time
   with the next one peeking in; from tablet up they sit side by side. */

function StrainCarousel({ items }: { items: CatalogProduct[] }) {
  const ref = useRef<HTMLUListElement | null>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    const step = card.offsetWidth + 12;
    setActive(Math.min(items.length - 1, Math.round(el.scrollLeft / step)));
  };

  const goTo = (i: number) => {
    const el = ref.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 16, behavior: "smooth" });
  };

  return (
    <div>
      <ul
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3"
        aria-label="Formats"
      >
        {items.map(p => (
          <li key={p.id} className="w-[80%] shrink-0 snap-start sm:w-auto">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      {items.length > 1 && (
        <div className="mt-4 flex justify-center gap-2 sm:hidden" role="group" aria-label="Choose a format">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={p.collection ?? p.name}
              aria-current={i === active || undefined}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                i === active ? "w-8 bg-accent" : "w-2.5 bg-white/25"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Reels ─────────────────────────────────────────────────────────────── */

function Reels({ videos }: { videos: PublicVideo[] }) {
  return (
    <section className="py-16 md:py-24">
      <div className="container text-center">
        <p className="eyebrow">On camera</p>
        <h2 className="mt-3 text-5xl text-cream md:text-7xl">
          Catch the <span className="script text-logo normal-case">vibes</span>
        </h2>
      </div>
      <ul className="no-scrollbar container mt-10 flex snap-x gap-4 overflow-x-auto pb-2 lg:justify-center">
        {videos.map(v => (
          <li key={v.id} className="w-[64vw] max-w-[280px] shrink-0 snap-start">
            <div className="holo-border rounded-[1.6rem]">
              <div className="overflow-hidden rounded-[calc(1.6rem-2px)]">
                <ReelVideo src={v.fileUrl} poster={v.posterUrl} title={v.title} />
              </div>
            </div>
            <p className="mt-3 text-center text-sm font-bold uppercase tracking-[0.14em] text-cream">
              {v.title}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ─── The promise ───────────────────────────────────────────────────────── */

function BrandPromise() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Premium botanicals</p>
          <h2 className="mt-3 text-balance text-5xl text-cream md:text-7xl">
            Everything on the label, <span className="text-gold">nothing you don't want</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-haze">
            Our CBG flower is grown indoors. Our pre-rolls and disposables are a
            premium botanical blend infused with blue lotus. All of it is THC
            free, pesticide free and sent to a lab before it reaches you.
          </p>
          <Link href="/about" className="btn btn-ghost mt-8">
            Our story
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {CLAIMS.map(c => (
            <li key={c.label} className="rounded-3xl bg-panel p-6 ring-1 ring-rule">
              <ClaimBadge icon={c.icon} label={c.label} />
              <p className="mt-3 text-haze">{c.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─── Lab reports band ──────────────────────────────────────────────────── */

function LabBand() {
  return (
    <section className="container">
      <div className="holo-border rounded-[2rem]">
        <div className="relative overflow-hidden rounded-[calc(2rem-2px)] bg-night">
          <div className="bg-sunset absolute inset-0 opacity-35" aria-hidden />
          <Palm flip className="pointer-events-none absolute -bottom-8 -right-10 h-[130%] w-auto text-night/80" />
          <div className="relative flex flex-col items-start gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-12 md:py-14">
            <div className="max-w-xl">
              <h2 className="text-balance text-4xl text-cream md:text-6xl">
                Every batch, <span className="script text-gold normal-case">tested</span>
              </h2>
              <p className="mt-3 text-lg text-cream/85">
                Read the certificate of analysis for any product. All our lab
                reports are in one folder.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LabReportsButton className="btn btn-gold" label="Open lab reports" />
              <Link href="/lab-reports" className="btn btn-ghost !bg-black/30">
                By product
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

