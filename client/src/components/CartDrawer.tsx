import { QtyStepper } from "@/components/QtyStepper";
import { accentStyle, useCartLines, useStoreConfig } from "@/lib/catalog";
import { formatMoney, shippingFor } from "@shared/store";
import { ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

export function CartDrawer() {
  const { lines, subtotalCents, cart } = useCartLines();
  const config = useStoreConfig();
  const [location] = useLocation();
  const { open, setOpen } = cart;

  // Navigating anywhere closes it, and Escape does too.
  useEffect(() => setOpen(false), [location, setOpen]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, setOpen]);

  if (!open) return null;

  const shipping = shippingFor(subtotalCents, config);
  const toFree =
    config.freeShippingOverCents > 0 ? config.freeShippingOverCents - subtotalCents : 0;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Your cart">
      <button
        type="button"
        aria-label="Close cart"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />
      <aside className="drawer-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-dusk shadow-2xl">
        <div className="flex h-[72px] shrink-0 items-center justify-between px-5">
          <h2 className="text-3xl text-cream">Your cart</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="flex h-10 w-10 items-center justify-center rounded-full text-cream hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="holo-rule !h-[3px]" aria-hidden />

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <ShoppingBag className="h-12 w-12 text-gold" strokeWidth={1.4} />
            <p className="mt-4 text-xl font-bold text-cream">Your cart is empty</p>
            <p className="mt-1 text-haze">Pick a strain and a format to get started.</p>
            <Link href="/products" className="btn btn-gold mt-6">
              Shop products
            </Link>
          </div>
        ) : (
          <>
            {toFree > 0 && (
              <p className="bg-panel px-5 py-3 text-sm text-haze">
                Add <span className="font-bold text-gold">{formatMoney(toFree)}</span> more
                for free shipping.
              </p>
            )}
            <ul className="flex-1 divide-y divide-rule overflow-y-auto px-5">
              {lines.map(({ product: p, qty }) => (
                <li key={p.id} className="flex gap-4 py-4" style={accentStyle(p.accentColor)}>
                  <Link
                    href={`/products/${p.slug}`}
                    className="card h-24 w-24 shrink-0 !rounded-2xl p-1.5"
                  >
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt="" className="h-full w-full object-contain" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${p.slug}`}
                          className="script block truncate text-xl text-cream hover:text-gold"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-haze">
                          {p.collection}
                        </p>
                      </div>
                      <p className="shrink-0 font-bold text-cream">
                        {formatMoney(p.priceCents * qty)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <QtyStepper
                        value={qty}
                        onChange={v => cart.setQty(p.id, v)}
                        label={`${p.name} ${p.collection ?? ""}`}
                        size="sm"
                      />
                      <button
                        type="button"
                        onClick={() => cart.remove(p.id)}
                        aria-label={`Remove ${p.name} ${p.collection ?? ""}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-haze hover:bg-white/10 hover:text-coral"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {!p.inStock && (
                      <p className="mt-2 text-sm font-semibold text-coral">
                        Out of stock — remove it to check out.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="shrink-0 border-t border-rule bg-panel px-5 py-5">
              <dl className="space-y-1.5 text-haze">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="text-cream">{formatMoney(subtotalCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd className="text-cream">{shipping === 0 ? "Free" : formatMoney(shipping)}</dd>
                </div>
                <div className="flex justify-between pt-2 text-lg font-extrabold text-cream">
                  <dt>Total</dt>
                  <dd>{formatMoney(subtotalCents + shipping)}</dd>
                </div>
              </dl>
              <Link href="/checkout" className="btn btn-gold mt-5 w-full">
                Checkout
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 w-full text-center text-sm font-semibold text-haze underline-offset-4 hover:text-cream hover:underline"
              >
                Keep shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
