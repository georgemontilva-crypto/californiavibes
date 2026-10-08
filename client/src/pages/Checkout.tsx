import { PublicLayout } from "@/components/PublicLayout";
import { QtyStepper } from "@/components/QtyStepper";
import { useCart } from "@/lib/cart";
import { accentStyle, useCartLines, useStoreConfig, useTitle } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { formatMoney, shippingFor, US_STATES } from "@shared/store";
import { CreditCard, Loader2, Lock, Mail, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

/* ─── Accept.js ─────────────────────────────────────────────────────────────
   Authorize.net's script turns the card into a one-time token in the browser,
   so the number never reaches our server. Loaded only on this page, only when
   card payments are switched on. */

type AcceptResponse = {
  messages: { resultCode: "Ok" | "Error"; message: { code: string; text: string }[] };
  opaqueData?: { dataDescriptor: string; dataValue: string };
};

declare global {
  interface Window {
    Accept?: {
      dispatchData: (data: unknown, cb: (r: AcceptResponse) => void) => void;
    };
  }
}

function loadAccept(src: string): Promise<void> {
  if (window.Accept) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    const s = existing ?? document.createElement("script");
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => reject(new Error("Could not load the payment form")));
    if (!existing) {
      s.src = src;
      s.charset = "utf-8";
      document.body.appendChild(s);
    }
  });
}

function tokenize(
  auth: { apiLoginId: string; clientKey: string },
  card: { number: string; month: string; year: string; cvv: string; zip: string; name: string }
): Promise<{ dataDescriptor: string; dataValue: string }> {
  return new Promise((resolve, reject) => {
    if (!window.Accept) return reject(new Error("The payment form isn't ready yet"));
    window.Accept.dispatchData(
      {
        authData: { clientKey: auth.clientKey, apiLoginID: auth.apiLoginId },
        cardData: {
          cardNumber: card.number.replace(/\D/g, ""),
          month: card.month,
          year: card.year,
          cardCode: card.cvv,
          zip: card.zip,
          fullName: card.name,
        },
      },
      r => {
        if (r.messages.resultCode === "Ok" && r.opaqueData) resolve(r.opaqueData);
        else reject(new Error(r.messages.message.map(m => m.text).join(" ") || "Card rejected"));
      }
    );
  });
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

const SUCCESS_KEY = "cv_last_order";

export default function Checkout() {
  useTitle("Checkout");
  const [, navigate] = useLocation();
  const cart = useCart();
  const { lines, subtotalCents, loading } = useCartLines();
  const config = useStoreConfig();
  const payment = config.payment;
  const cardMode = payment.mode === "card";

  const [form, setForm] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    note: "",
  });
  const [card, setCard] = useState({ number: "", exp: "", cvv: "" });
  const [age, setAge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (payment.mode === "card") {
      loadAccept(payment.acceptJsUrl).catch(() =>
        setError("The secure card form couldn't load. Refresh the page to try again.")
      );
    }
  }, [payment]);

  const place = trpc.store.placeOrder.useMutation();

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const blocked = form.state !== "" && config.blockedStates.includes(form.state);
  const shipping = shippingFor(subtotalCents, config);
  const total = subtotalCents + shipping;
  const unavailable = lines.filter(l => !l.product.inStock || l.product.priceCents <= 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!age) return setError("Please confirm you are 21 or older.");
    if (blocked) return setError(`Sorry, we can't ship to ${form.state}.`);
    if (unavailable.length) return setError("Remove the out-of-stock items to continue.");

    setBusy(true);
    try {
      let opaqueData: { dataDescriptor: string; dataValue: string } | undefined;
      if (payment.mode === "card") {
        const [mm, yy] = card.exp.split("/").map(s => s.trim());
        if (!/^\d{2}$/.test(mm ?? "") || !/^\d{2}$/.test(yy ?? "")) {
          throw new Error("Enter the card expiry as MM/YY.");
        }
        opaqueData = await tokenize(payment, {
          number: card.number,
          month: mm,
          year: `20${yy}`,
          cvv: card.cvv,
          zip: form.zip,
          name: `${form.firstName} ${form.lastName}`.trim(),
        });
      }

      const result = await place.mutateAsync({
        items: lines.map(l => ({ productId: l.product.id, qty: l.qty })),
        email: form.email,
        phone: form.phone || undefined,
        firstName: form.firstName,
        lastName: form.lastName,
        address1: form.address1,
        address2: form.address2 || undefined,
        city: form.city,
        state: form.state,
        zip: form.zip,
        note: form.note || undefined,
        ageConfirmed: true,
        opaqueData,
      });
      try {
        sessionStorage.setItem(SUCCESS_KEY, JSON.stringify(result));
      } catch {
        /* the success page falls back to just the number */
      }
      cart.clear();
      navigate(`/order/${result.number}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!loading && lines.length === 0) {
    return (
      <PublicLayout>
        <div className="container max-w-xl py-24 text-center">
          <h1 className="text-5xl text-cream">Your cart is empty</h1>
          <p className="mt-3 text-haze">Add a product or two, then come back here to check out.</p>
          <Link href="/products" className="btn btn-gold mt-8">
            Shop products
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container py-10 md:py-14">
        <h1 className="text-5xl text-cream md:text-6xl">Checkout</h1>
        <div className="holo-rule mt-5 max-w-[160px] rounded-full" aria-hidden />

        <form
          onSubmit={submit}
          className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start"
          noValidate={false}
        >
          <div className="space-y-10">
            <Fieldset title="Contact">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
                <Input label="Phone (optional)" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
              </div>
            </Fieldset>

            <Fieldset title="Shipping address">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="First name" required autoComplete="given-name" value={form.firstName} onChange={set("firstName")} />
                <Input label="Last name" required autoComplete="family-name" value={form.lastName} onChange={set("lastName")} />
                <Input className="sm:col-span-2" label="Street address" required autoComplete="address-line1" value={form.address1} onChange={set("address1")} />
                <Input className="sm:col-span-2" label="Apartment, suite, etc. (optional)" autoComplete="address-line2" value={form.address2} onChange={set("address2")} />
                <Input label="City" required autoComplete="address-level2" value={form.city} onChange={set("city")} />
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-haze">State</span>
                    <select required className="field" value={form.state} onChange={set("state")} autoComplete="address-level1">
                      <option value="">Select</option>
                      {US_STATES.map(s => (
                        <option key={s.code} value={s.code} disabled={config.blockedStates.includes(s.code)}>
                          {s.code}
                          {config.blockedStates.includes(s.code) ? " (no shipping)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input label="ZIP" required inputMode="numeric" pattern="\d{5}(-\d{4})?" autoComplete="postal-code" value={form.zip} onChange={set("zip")} />
                </div>
              </div>
              {blocked && (
                <p className="mt-3 text-sm font-semibold text-coral">
                  Sorry, we can't ship to {form.state}.
                </p>
              )}
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-haze">Order note (optional)</span>
                <textarea rows={2} className="field" value={form.note} onChange={set("note")} maxLength={1000} />
              </label>
            </Fieldset>

            <Fieldset title="Payment">
              {cardMode ? (
                <div className="rounded-3xl bg-panel p-5 ring-1 ring-rule">
                  <p className="mb-4 flex items-center gap-2 text-sm text-haze">
                    <Lock className="h-4 w-4 text-gold" />
                    Card details are encrypted and sent straight to our payment processor.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-[1fr_120px_100px]">
                    <Input
                      label="Card number"
                      required
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 1234 1234 1234"
                      value={card.number}
                      onChange={e =>
                        setCard(c => ({
                          ...c,
                          number: e.target.value.replace(/[^\d ]/g, "").slice(0, 23),
                        }))
                      }
                    />
                    <Input
                      label="Expiry"
                      required
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      value={card.exp}
                      onChange={e => {
                        const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setCard(c => ({ ...c, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }));
                      }}
                    />
                    <Input
                      label="CVV"
                      required
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      value={card.cvv}
                      onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 rounded-3xl bg-panel p-5 ring-1 ring-rule">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <p className="text-haze">
                    Place your order now and we'll email you at the address above
                    with how to complete payment. Your order ships as soon as
                    payment is confirmed.
                  </p>
                </div>
              )}
            </Fieldset>

            <label className="flex items-start gap-3 rounded-2xl bg-panel p-4 ring-1 ring-rule">
              <input
                type="checkbox"
                checked={age}
                onChange={e => setAge(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#f3c55b]"
                required
              />
              <span className="text-cream">
                I confirm I am <strong>21 or older</strong> and that these products are
                legal where I live.
              </span>
            </label>
          </div>

          {/* Summary */}
          <aside className="rounded-[2rem] bg-dusk p-6 ring-1 ring-rule lg:sticky lg:top-24">
            <h2 className="text-3xl text-cream">Your order</h2>
            <ul className="mt-4 divide-y divide-rule">
              {lines.map(({ product: p, qty }) => (
                <li key={p.id} className="flex gap-3 py-3" style={accentStyle(p.accentColor)}>
                  <div className="card h-16 w-16 shrink-0 !rounded-xl p-1">
                    {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="script truncate text-lg leading-tight text-cream">{p.name}</p>
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-haze">
                      {p.collection}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <QtyStepper size="sm" value={qty} onChange={v => cart.setQty(p.id, v)} label={p.name} />
                      <button
                        type="button"
                        onClick={() => cart.remove(p.id)}
                        aria-label={`Remove ${p.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-haze hover:text-coral"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {(!p.inStock || p.priceCents <= 0) && (
                      <p className="mt-1 text-xs font-semibold text-coral">Out of stock</p>
                    )}
                  </div>
                  <p className="shrink-0 font-bold text-cream">{formatMoney(p.priceCents * qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-rule pt-4 text-haze">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="text-cream">{formatMoney(subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd className="text-cream">{shipping === 0 ? "Free" : formatMoney(shipping)}</dd>
              </div>
              <div className="flex justify-between pt-2 text-xl font-extrabold text-cream">
                <dt>Total</dt>
                <dd>{formatMoney(total)}</dd>
              </div>
            </dl>

            {error && (
              <p role="alert" className="mt-4 rounded-2xl bg-coral/15 p-3 text-sm font-semibold text-coral">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy || loading} className={cn("btn btn-gold mt-5 w-full")}>
              {busy ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : cardMode ? (
                <CreditCard className="h-4.5 w-4.5" />
              ) : null}
              {busy ? "Placing order…" : cardMode ? `Pay ${formatMoney(total)}` : "Place order"}
            </button>
            <p className="mt-3 text-center text-xs text-haze">
              Questions about an order?{" "}
              <Link href="/contact" className="underline underline-offset-4 hover:text-cream">
                Contact us
              </Link>
            </p>
          </aside>
        </form>
      </div>
    </PublicLayout>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-4 font-display text-3xl uppercase text-cream">{title}</legend>
      {children}
    </fieldset>
  );
}

function Input({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-haze">{label}</span>
      <input className="field" {...props} />
    </label>
  );
}

export { SUCCESS_KEY };
