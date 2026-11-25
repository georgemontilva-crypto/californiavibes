import { PageHeader, PublicLayout } from "@/components/PublicLayout";
import { useTitle } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { POLICIES, policyBySlug } from "@shared/policies";
import { Fragment } from "react";
import { Link, useLocation } from "wouter";

/** Plain text with any email address turned into a mailto link. */
function Linked({ text }: { text: string }) {
  const parts = text.split(/([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={`mailto:${part}`} className="text-gold underline-offset-4 hover:underline">
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

export default function Policy() {
  const [location] = useLocation();
  const policy = policyBySlug(location.replace(/^\//, "")) ?? POLICIES[0];
  useTitle(policy.title);

  return (
    <PublicLayout>
      <PageHeader title={policy.title} eyebrow={policy.subtitle} />

      <div className="container grid gap-10 py-12 lg:grid-cols-[240px_1fr] lg:gap-16">
        <nav aria-label="Policies" className="lg:sticky lg:top-28 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {POLICIES.map(p => (
              <li key={p.slug}>
                <Link
                  href={`/${p.slug}`}
                  aria-current={p.slug === policy.slug ? "page" : undefined}
                  className={cn(
                    "block rounded-full px-4 py-2 text-sm font-bold transition-colors lg:rounded-xl",
                    p.slug === policy.slug
                      ? "bg-gold text-night"
                      : "bg-white/[0.06] text-haze hover:text-cream lg:bg-transparent"
                  )}
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="max-w-3xl">
          {policy.sections.map(s => (
            <section key={s.heading} className="border-b border-rule py-7 first:pt-0 last:border-b-0">
              <h2 className="font-sans text-xl font-extrabold normal-case tracking-normal text-cream md:text-2xl">
                {s.heading}
              </h2>
              {s.body.map((para, i) => (
                <p key={i} className="mt-3 text-lg leading-relaxed text-cream/80">
                  <Linked text={para} />
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </PublicLayout>
  );
}
