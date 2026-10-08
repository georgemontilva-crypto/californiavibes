import { Lockup } from "@/components/Logo";
import { PublicLayout } from "@/components/PublicLayout";
import { useTitle } from "@/lib/catalog";
import { SUCCESS_KEY } from "@/pages/Checkout";
import { formatMoney, type OrderLine } from "@shared/store";
import { CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "wouter";

type Placed = {
  number: string;
  status: string;
  paymentMethod: string;
  email: string;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

export default function OrderSuccess() {
  const { number = "" } = useParams<{ number: string }>();
  useTitle(`Order ${number}`);

  // The order details come from the checkout that just happened in this tab;
  // there is no public endpoint that hands out an order by its number.
  const order = useMemo<Placed | null>(() => {
    try {
      const raw = sessionStorage.getItem(SUCCESS_KEY);
      const parsed = raw ? (JSON.parse(raw) as Placed) : null;
      return parsed?.number === number ? parsed : null;
    } catch {
      return null;
    }
  }, [number]);

  const paid = order?.status === "paid";

  return (
    <PublicLayout>
      <div className="container max-w-2xl py-14 text-center md:py-20">
        <Lockup className="text-[3.4rem]" />
        <CheckCircle2 className="mx-auto mt-8 h-14 w-14 text-gold" strokeWidth={1.5} />
        <h1 className="mt-4 text-5xl text-cream md:text-6xl">Thank you!</h1>
        <p className="mt-3 text-lg text-cream/85">
          Your order <strong className="text-gold">{number}</strong> is in.
        </p>
        <p className="mx-auto mt-3 max-w-lg text-haze">
          {paid
            ? "Your payment went through. We'll email you the tracking number as soon as it ships."
            : `We'll email ${order?.email ?? "you"} shortly with how to complete payment. Your order ships once payment is confirmed.`}
        </p>

        {order && (
          <div className="mt-10 rounded-[2rem] bg-dusk p-6 text-left ring-1 ring-rule">
            <ul className="divide-y divide-rule">
              {order.lines.map(l => (
                <li key={l.productId} className="flex items-center gap-3 py-3">
                  {l.imageUrl && <img src={l.imageUrl} alt="" className="h-14 w-14 object-contain" />}
                  <div className="min-w-0 flex-1">
                    <p className="script text-lg text-cream">{l.name}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-haze">
                      {l.line} · Qty {l.qty}
                    </p>
                  </div>
                  <p className="font-bold text-cream">{formatMoney(l.priceCents * l.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-rule pt-3 text-haze">
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd className="text-cream">
                  {order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)}
                </dd>
              </div>
              <div className="flex justify-between text-lg font-extrabold text-cream">
                <dt>Total</dt>
                <dd>{formatMoney(order.totalCents)}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/products" className="btn btn-gold">
            Keep shopping
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Questions? Contact us
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
