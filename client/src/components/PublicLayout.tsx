import { AgeGate } from "@/components/AgeGate";
import { BackToTop } from "@/components/BackToTop";
import { AgeBadge } from "@/components/Brand";
import { CartDrawer } from "@/components/CartDrawer";
import { Emblem, Palm, Wordmark } from "@/components/Logo";
import { useCart } from "@/lib/cart";
import { useStoreConfig } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { BRAND_NAME, BRAND_SLOGAN, DEFAULT_CONTACT } from "@shared/const";
import { ArrowUpRight, Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Link, useLocation } from "wouter";

type NavItem = { label: string; href: string; external?: boolean };

/** LAB REPORTS opens the shared Dropbox folder; its URL comes from the store settings. */
function useNav(): NavItem[] {
  const { labReportsUrl } = useStoreConfig();
  return [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Products", href: "/products" },
    { label: "Lab Reports", href: labReportsUrl, external: true },
    { label: "Contact Us", href: "/contact" },
  ];
}

function isActive(location: string, href: string) {
  return href === "/" ? location === "/" : location.startsWith(href);
}

function NavLink({
  item,
  className,
  activeClass,
  location,
}: {
  item: NavItem;
  className: string;
  activeClass: string;
  location: string;
}) {
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {item.label}
        <ArrowUpRight className="ml-0.5 inline h-3.5 w-3.5 opacity-70" aria-hidden />
      </a>
    );
  }
  const active = isActive(location, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(className, active && activeClass)}
    >
      {item.label}
    </Link>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);
  const cart = useCart();
  const nav = useNav();

  // A link in the mobile menu changes the route; the menu shouldn't stay up.
  useEffect(() => setOpen(false), [location]);

  return (
    <div className="flex min-h-screen flex-col">
      <AgeGate />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 bg-night/85 backdrop-blur-md">
        <div className="container flex h-[72px] items-center justify-between gap-4">
          <Link
            href="/"
            aria-label={`${BRAND_NAME} home`}
            className="flex items-center gap-2.5"
          >
            <Emblem className="h-8 sm:h-9" />
            <Wordmark inline className="text-[1.45rem] sm:text-[1.7rem]" />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {nav.map(item => (
              <NavLink
                key={item.label}
                item={item}
                location={location}
                className="rounded-full px-4 py-2 text-[0.8rem] font-extrabold uppercase tracking-[0.16em] text-haze transition-colors hover:text-cream"
                activeClass="!text-gold"
              />
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => cart.setOpen(true)}
              className="relative flex h-11 items-center gap-2 rounded-full px-3 text-cream hover:bg-white/10"
              aria-label={`Open cart, ${cart.count} item${cart.count === 1 ? "" : "s"}`}
            >
              <ShoppingBag className="h-5.5 w-5.5" />
              <span className="hidden text-[0.8rem] font-extrabold uppercase tracking-[0.16em] sm:inline">
                Cart
              </span>
              {cart.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.7rem] font-extrabold text-black sm:static sm:h-6 sm:min-w-6">
                  {cart.count}
                </span>
              )}
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-cream hover:bg-white/10 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(o => !o)}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        <div className="holo-rule !h-[3px]" aria-hidden />

        {open && (
          <nav id="mobile-nav" aria-label="Main" className="bg-night lg:hidden">
            <div className="container flex flex-col py-3">
              {nav.map(item => (
                <NavLink
                  key={item.label}
                  item={item}
                  location={location}
                  className="border-b border-rule py-4 font-display text-3xl uppercase text-cream last:border-b-0"
                  activeClass="!text-gold"
                />
              ))}
            </div>
          </nav>
        )}
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter footerRef={footerRef} nav={nav} />
      <BackToTop footerRef={footerRef} />
      <CartDrawer />
    </div>
  );
}

function SiteFooter({
  footerRef,
  nav,
}: {
  footerRef: RefObject<HTMLElement | null>;
  nav: NavItem[];
}) {
  const details = trpc.site.contactDetails.useQuery().data ?? DEFAULT_CONTACT;
  const [location] = useLocation();

  return (
    <footer ref={footerRef} className="relative mt-24 overflow-hidden bg-dusk">
      <div className="holo-rule" aria-hidden />
      {/* Palms at the edges, as on the side of the pouch. */}
      <Palm className="pointer-events-none absolute -bottom-6 -left-10 h-72 w-auto text-black/60" />
      <Palm flip className="pointer-events-none absolute -bottom-10 -right-12 h-80 w-auto text-black/60" />

      <div className="container relative py-14">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3" aria-label={`${BRAND_NAME} home`}>
              <Emblem className="h-11" />
              <Wordmark className="text-[2.1rem]" />
            </Link>
            <p className="mt-5 max-w-sm text-haze">
              Premium botanicals. CBG flower, pre-rolls and disposables, THC
              free and lab tested.
            </p>
            <p className="script mt-3 text-2xl text-gold">{BRAND_SLOGAN}</p>
            <div className="mt-6 inline-flex items-center gap-3">
              <AgeBadge />
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-cream">
                Adults 21+ only
              </span>
            </div>
          </div>

          <nav aria-label="Footer">
            <h2 className="eyebrow">Explore</h2>
            <ul className="mt-4 space-y-2.5">
              {nav.map(item => (
                <li key={item.label}>
                  <NavLink
                    item={item}
                    location={location}
                    className="text-cream hover:text-gold"
                    activeClass=""
                  />
                </li>
              ))}
              <li>
                <Link href="/lab-reports" className="text-cream hover:text-gold">
                  Reports by product
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow">Get in touch</h2>
            <address className="mt-4 space-y-2.5 not-italic text-cream">
              <p>{details.company}</p>
              {details.address && <p className="text-haze">{details.address}</p>}
              {details.email && (
                <p>
                  <a href={`mailto:${details.email}`} className="hover:text-gold">
                    {details.email}
                  </a>
                </p>
              )}
              {details.phone && (
                <p>
                  <a
                    href={`tel:${details.phone.replace(/[^\d+]/g, "")}`}
                    className="hover:text-gold"
                  >
                    {details.phone}
                  </a>
                </p>
              )}
              {details.instagram && (
                <p>
                  <a
                    href={details.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gold"
                  >
                    Instagram
                  </a>
                </p>
              )}
              <p>
                <Link href="/contact" className="text-gold underline-offset-4 hover:underline">
                  Send us a message
                </Link>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-12 border-t border-rule pt-8 text-sm leading-relaxed text-haze">
          <p className="max-w-4xl">
            These products are hemp-derived botanicals intended for adults 21 and
            older. Keep out of reach of children and pets. Do not use if
            pregnant or nursing. Consult a healthcare provider before use if you
            have a medical condition or take medication. These statements have
            not been evaluated by the Food and Drug Administration. These
            products are not intended to diagnose, treat, cure or prevent any
            disease. Check your local laws before ordering.
          </p>
          <p className="mt-5">
            © {new Date().getFullYear()} {details.company}. For adults 21 and older.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Shared page heading: the title on a slice of sunset, with the holo stripe under it. */
export function PageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden">
      <div className="bg-sunset absolute inset-0 opacity-90" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-night/40 via-transparent to-night" aria-hidden />
      <Palm className="pointer-events-none absolute -bottom-4 -left-8 h-[120%] w-auto text-night/90" />
      <Palm flip className="pointer-events-none absolute -bottom-6 -right-10 h-[115%] w-auto text-night/90" />
      <div className="container relative pb-12 pt-16 text-center md:pb-16 md:pt-24">
        {eyebrow && <p className="eyebrow !text-cream/90">{eyebrow}</p>}
        <h1 className="mt-3 text-balance text-6xl text-cream drop-shadow-[0_4px_0_rgba(0,0,0,0.35)] md:text-8xl">
          {title}
        </h1>
        {children && (
          <p className="mx-auto mt-5 max-w-2xl text-lg text-cream/85 md:text-xl">{children}</p>
        )}
      </div>
      <div className="holo-rule relative" aria-hidden />
    </div>
  );
}
