import {
  AdminLayout,
  Field,
  buttonClass,
  ghostButtonClass,
  inputClass,
} from "@/components/AdminLayout";
import type { RouterOutputs } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { formatMoney, ORDER_STATUS_LABEL } from "@shared/store";
import { ChevronDown, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type AdminOrder = RouterOutputs["store"]["orders"]["rows"][number];

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled", "refunded", "failed"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_TONE: Record<Status, string> = {
  pending: "bg-amber-400/15 text-amber-200",
  paid: "bg-emerald-400/15 text-emerald-200",
  shipped: "bg-sky-400/15 text-sky-200",
  delivered: "bg-white/10 text-white/70",
  cancelled: "bg-white/10 text-white/45",
  refunded: "bg-white/10 text-white/45",
  failed: "bg-red-500/15 text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_TONE[status as Status] ?? "bg-white/10"
      )}
    >
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function AdminOrders() {
  const [status, setStatus] = useState<Status | "">("");
  const [page, setPage] = useState(1);
  const orders = trpc.store.orders.useQuery(
    { status: status || undefined, page, pageSize: 50 },
    { retry: false }
  );
  const pages = Math.max(1, Math.ceil((orders.data?.total ?? 0) / 50));

  return (
    <AdminLayout title="Orders">
      <div className="flex flex-wrap gap-2">
        {(["", ...STATUSES] as const).map(s => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              status === s ? "bg-white text-black" : "bg-white/[0.06] text-white/60 hover:text-white"
            )}
          >
            {s ? ORDER_STATUS_LABEL[s] : "All"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {orders.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        ) : orders.data?.rows.length ? (
          orders.data.rows.map(o => <OrderRow key={o.id} order={o} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">
            No orders {status ? `marked "${ORDER_STATUS_LABEL[status]}"` : "yet"}.
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center gap-3 text-sm">
          <button className={ghostButtonClass} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </button>
          <span className="text-white/50">
            Page {page} of {pages}
          </span>
          <button className={ghostButtonClass} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
}

function OrderRow({ order: o }: { order: AdminOrder }) {
  const [open, setOpen] = useState(false);
  const count = o.lines.reduce((n, l) => n + l.qty, 0);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1029]">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left"
      >
        <span className="font-mono text-sm font-semibold">{o.number}</span>
        <StatusBadge status={o.status} />
        <span className="min-w-0 flex-1 truncate text-sm text-white/70">
          {o.firstName} {o.lastName} · {count} item{count === 1 ? "" : "s"}
        </span>
        <span className="font-semibold tabular-nums">{formatMoney(o.totalCents)}</span>
        <span className="text-xs text-white/40">{new Date(o.createdAt).toLocaleString()}</span>
        <ChevronDown className={cn("h-4 w-4 text-white/40 transition-transform", open && "rotate-180")} />
      </button>
      {open && <OrderEditor order={o} />}
    </div>
  );
}

function OrderEditor({ order: o }: { order: AdminOrder }) {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<Status>(o.status);
  const [tracking, setTracking] = useState(o.trackingNumber ?? "");
  const [note, setNote] = useState(o.adminNote ?? "");
  const [notify, setNotify] = useState(true);

  const update = trpc.store.updateOrder.useMutation({
    onSuccess: () => {
      utils.store.orders.invalidate();
      utils.adminAuth.dashboardOverview.invalidate();
      toast.success("Order updated");
    },
    onError: e => toast.error(e.message || "Could not save"),
  });

  return (
    <div className="grid gap-6 border-t border-white/10 p-5 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
          {o.lines.map(l => (
            <li key={l.productId} className="flex items-center gap-3 px-3 py-2 text-sm">
              {l.imageUrl && <img src={l.imageUrl} alt="" className="h-10 w-10 object-contain" />}
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{l.name}</span>
                <span className="block text-xs text-white/45">{l.line}</span>
              </span>
              <span className="text-white/60">
                {l.qty} × {formatMoney(l.priceCents)}
              </span>
              <span className="w-20 text-right font-semibold">{formatMoney(l.qty * l.priceCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 text-sm text-white/60">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatMoney(o.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{formatMoney(o.shippingCents)}</dd>
          </div>
          <div className="flex justify-between font-semibold text-white">
            <dt>Total</dt>
            <dd>{formatMoney(o.totalCents)}</dd>
          </div>
        </dl>

        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Customer</p>
            <p className="mt-1">
              {o.firstName} {o.lastName}
            </p>
            <a href={`mailto:${o.email}?subject=${encodeURIComponent(`Your California Vibes order ${o.number}`)}`} className="text-white/70 underline underline-offset-2">
              {o.email}
            </a>
            {o.phone && <p className="text-white/70">{o.phone}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Ship to</p>
            <p className="mt-1 whitespace-pre-line text-white/80">
              {[o.address1, o.address2, `${o.city}, ${o.state} ${o.zip}`].filter(Boolean).join("\n")}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Payment</p>
            <p className="mt-1 text-white/80">
              {o.paymentMethod === "card" ? "Card (Authorize.net)" : "To arrange by email"}
            </p>
            {o.transactionId && <p className="font-mono text-xs text-white/50">Txn {o.transactionId}</p>}
            {o.cardLast4 && <p className="font-mono text-xs text-white/50">{o.cardLast4}</p>}
            {o.paymentError && <p className="mt-1 text-xs text-red-300">{o.paymentError}</p>}
          </div>
          {o.customerNote && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Customer note</p>
              <p className="mt-1 text-white/80">{o.customerNote}</p>
            </div>
          )}
        </div>
      </div>

      <form
        className="grid content-start gap-4"
        onSubmit={e => {
          e.preventDefault();
          update.mutate({
            id: o.id,
            status,
            trackingNumber: tracking.trim() || null,
            adminNote: note.trim() || null,
            notifyCustomer: notify,
          });
        }}
      >
        <Field label="Status">
          <select value={status} onChange={e => setStatus(e.target.value as Status)} className={inputClass}>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tracking number">
          <input value={tracking} onChange={e => setTracking(e.target.value)} className={inputClass} />
        </Field>
        {status === "shipped" && o.status !== "shipped" && (
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />
            Email the customer that it shipped
          </label>
        )}
        <Field label="Internal note" hint="Only visible here.">
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className={inputClass} />
        </Field>
        <div>
          <button type="submit" disabled={update.isPending} className={buttonClass}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save order
          </button>
        </div>
      </form>
    </div>
  );
}
