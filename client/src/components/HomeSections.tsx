import { ChevronDown } from "lucide-react";
import { Link } from "wouter";

/* ─── Questions ─────────────────────────────────────────────────────────────
   Native <details>, so they open with the keyboard and without any script. */

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Do your products contain THC?",
    a: "No. California Vibes products are THC free: hemp-derived CBG flower and a premium botanical blend infused with blue lotus.",
  },
  {
    q: "What is blue lotus?",
    a: "Blue lotus (Nymphaea caerulea) is a water lily that has been part of botanical blends for centuries. Our pre-rolls and disposables are infused with it.",
  },
  {
    q: "Where can I read the lab reports?",
    a: (
      <>
        Every certificate of analysis is in our lab reports folder, linked from
        the <strong>Lab Reports</strong> button at the top of every page. You
        can also see them{" "}
        <Link href="/lab-reports" className="underline underline-offset-4 hover:text-cream">
          product by product
        </Link>
        .
      </>
    ),
  },
  {
    q: "How much is shipping?",
    a: "Shipping is a flat rate per order and free above the amount shown in your cart. Orders ship within the United States, where local law allows.",
  },
  {
    q: "Who can buy California Vibes?",
    a: "Adults 21 and older only. Keep every product out of reach of children and pets.",
  },
  {
    q: "Can my store carry California Vibes?",
    a: (
      <>
        Yes. Send us a message through the{" "}
        <Link href="/contact" className="underline underline-offset-4 hover:text-cream">
          Contact Us
        </Link>{" "}
        page and choose "Wholesale".
      </>
    ),
  },
];

export function FaqSection() {
  return (
    <section className="container grid gap-10 py-16 md:py-24 lg:grid-cols-[340px_1fr] lg:gap-16">
      <div>
        <p className="eyebrow">FAQ</p>
        <h2 className="mt-3 text-5xl text-cream md:text-6xl">Good to know</h2>
      </div>
      <div className="border-t border-rule">
        {FAQ.map(item => (
          <details key={item.q} className="group border-b border-rule">
            <summary className="flex list-none items-center justify-between gap-6 py-5 text-lg font-bold text-cream marker:hidden hover:text-gold [&::-webkit-details-marker]:hidden md:text-xl">
              {item.q}
              <ChevronDown
                className="h-5 w-5 shrink-0 text-gold transition-transform duration-200 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="max-w-2xl pb-6 text-lg text-haze">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
