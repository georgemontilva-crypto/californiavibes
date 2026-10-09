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
import { Check, ChevronDown, Loader2, Pause, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Account = RouterOutputs["wholesale"]["adminList"][number];
type Status = Account["status"];

const LABEL: Record<Status, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};
const TONE: Record<Status, string> = {
  pending: "bg-amber-400/15 text-amber-200",
  approved: "bg-emerald-400/15 text-emerald-200",
  rejected: "bg-white/10 text-white/45",
  suspended: "bg-red-500/15 text-red-300",
};

export default function AdminWholesale() {
  const list = trpc.wholesale.adminList.useQuery(undefined, { retry: false });
  const [filter, setFilter] = useState<Status | "">("");
  const rows = (list.data ?? []).filter(a => !filter || a.status === filter);
  const counts = (s: Status) => (list.data ?? []).filter(a => a.status === s).length;

  return (
    <AdminLayout title="Wholesale">
      <p className="max-w-2xl text-sm text-white/50">
        Stores apply from the site's Wholesale page. Approve an account and its
        owner can log in to see the wholesale price of each product (set it in
        Products). Pending, rejected and suspended accounts buy at retail.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {(["", "pending", "approved", "suspended", "rejected"] as const).map(s => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              filter === s ? "bg-white text-black" : "bg-white/[0.06] text-white/60 hover:text-white"
            )}
          >
            {s ? `${LABEL[s]} · ${counts(s)}` : `All · ${list.data?.length ?? 0}`}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {list.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        ) : rows.length ? (
          rows.map(a => <AccountRow key={a.id} account={a} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">
            No wholesale accounts {filter ? `marked "${LABEL[filter]}"` : "yet"}.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function AccountRow({ account: a }: { account: Account }) {
  const [open, setOpen] = useState(a.status === "pending");
  const utils = trpc.useUtils();
  const [note, setNote] = useState(a.adminNote ?? "");
  const refresh = () => {
    utils.wholesale.adminList.invalidate();
    utils.adminAuth.dashboardOverview.invalidate();
  };
  const update = trpc.wholesale.adminUpdate.useMutation({
    onSuccess: () => {
      refresh();
      toast.success("Account updated");
    },
    onError: e => toast.error(e.message || "Could not save"),
  });
  const remove = trpc.wholesale.adminDelete.useMutation({
    onSuccess: () => {
      refresh();
      toast.success("Account deleted");
    },
    onError: e => toast.error(e.message || "Could not delete"),
  });
  const setStatus = (status: Status) => update.mutate({ id: a.id, status });

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1029]">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left"
      >
        <span className="font-semibold">{a.businessName}</span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", TONE[a.status])}>
          {LABEL[a.status]}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-white/60">
          {a.contactName} · {a.email}
        </span>
        <span className="text-xs text-white/40">{new Date(a.createdAt).toLocaleDateString()}</span>
        <ChevronDown className={cn("h-4 w-4 text-white/40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="grid gap-6 border-t border-white/10 p-5 lg:grid-cols-[1.2fr_1fr]">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Contact", a.contactName],
              ["Email", a.email],
              ["Phone", a.phone],
              ["State", a.state],
              ["Resale permit / Tax ID", a.taxId],
              ["Website", a.website],
              ["Last login", a.lastSignedIn ? new Date(a.lastSignedIn).toLocaleString() : "Never"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-white/45">{k}</dt>
                <dd className="mt-0.5 break-words text-white/85">{v || "—"}</dd>
              </div>
            ))}
            {a.message && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-white/45">About the business</dt>
                <dd className="mt-0.5 whitespace-pre-line text-white/85">{a.message}</dd>
              </div>
            )}
          </dl>

          <div className="grid content-start gap-4">
            <div className="flex flex-wrap gap-2">
              {a.status !== "approved" && (
                <button className={buttonClass} disabled={update.isPending} onClick={() => setStatus("approved")}>
                  <Check className="h-4 w-4" />
                  Approve
                </button>
              )}
              {a.status === "pending" && (
                <button className={ghostButtonClass} disabled={update.isPending} onClick={() => setStatus("rejected")}>
                  <X className="h-4 w-4" />
                  Reject
                </button>
              )}
              {a.status === "approved" && (
                <button className={ghostButtonClass} disabled={update.isPending} onClick={() => setStatus("suspended")}>
                  <Pause className="h-4 w-4" />
                  Suspend
                </button>
              )}
            </div>
            {a.status === "pending" && (
              <p className="text-xs text-white/40">
                Approving emails the buyer that they can log in (if email is set up).
              </p>
            )}
            <Field label="Internal note" hint="Only visible here.">
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className={inputClass} />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={ghostButtonClass}
                disabled={update.isPending}
                onClick={() => update.mutate({ id: a.id, adminNote: note.trim() || null })}
              >
                <Save className="h-4 w-4" />
                Save note
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete the wholesale account for ${a.businessName}? Their past orders stay.`)) {
                    remove.mutate({ id: a.id });
                  }
                }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/40 hover:bg-red-500/15 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
