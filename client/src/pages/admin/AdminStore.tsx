import {
  AdminLayout,
  Card,
  Field,
  Notice,
  buttonClass,
  inputClass,
} from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { DEFAULT_LAB_REPORTS_URL } from "@shared/const";
import { formatMoney, parseMoney, US_STATES } from "@shared/store";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminStore() {
  const utils = trpc.useUtils();
  const config = trpc.store.config.useQuery();
  const [form, setForm] = useState<{
    labReportsUrl: string;
    shipping: string;
    freeOver: string;
    blocked: string[];
  } | null>(null);

  useEffect(() => {
    if (config.data && !form) {
      setForm({
        labReportsUrl: config.data.labReportsUrl,
        shipping: (config.data.shippingCents / 100).toFixed(2),
        freeOver: (config.data.freeShippingOverCents / 100).toFixed(2),
        blocked: config.data.blockedStates,
      });
    }
  }, [config.data, form]);

  const save = trpc.store.updateSettings.useMutation({
    onSuccess: () => {
      utils.store.config.invalidate();
      toast.success("Store settings saved");
    },
    onError: e => {
      let message = e.message;
      try {
        const issues = JSON.parse(e.message) as { message?: string }[];
        if (Array.isArray(issues) && issues[0]?.message) message = issues[0].message;
      } catch {
        /* already a sentence */
      }
      toast.error(message || "Could not save");
    },
  });

  return (
    <AdminLayout title="Store settings">
      <div className="max-w-2xl space-y-6">
        {config.data?.payment.mode === "manual" && (
          <Notice>
            <p className="font-semibold">Card payments are off</p>
            <p className="mt-1">
              Orders are being taken as "Awaiting payment" and you arrange
              payment by email. To charge cards at checkout, set{" "}
              <span className="font-mono text-xs">
                AUTHNET_API_LOGIN_ID, AUTHNET_TRANSACTION_KEY, AUTHNET_CLIENT_KEY
              </span>{" "}
              and <span className="font-mono text-xs">AUTHNET_ENV=production</span> in Railway.
            </p>
          </Notice>
        )}

        {!form ? (
          <Loader2 className="h-5 w-5 animate-spin text-white/40" />
        ) : (
          <form
            className="space-y-6"
            onSubmit={e => {
              e.preventDefault();
              const shippingCents = parseMoney(form.shipping);
              const freeShippingOverCents = parseMoney(form.freeOver || "0");
              if (shippingCents === null || freeShippingOverCents === null) {
                toast.error("Use plain amounts like 5.99");
                return;
              }
              save.mutate({
                labReportsUrl: form.labReportsUrl.trim(),
                shippingCents,
                freeShippingOverCents,
                blockedStates: form.blocked,
              });
            }}
          >
            <Card
              title="Lab reports button"
              description="Where the LAB REPORTS button in the menu and on the pages takes visitors."
            >
              <Field label="Link" hint="Leave empty to go back to the original Dropbox folder.">
                <input
                  value={form.labReportsUrl}
                  onChange={e => setForm({ ...form, labReportsUrl: e.target.value })}
                  placeholder={DEFAULT_LAB_REPORTS_URL}
                  className={inputClass}
                />
              </Field>
            </Card>

            <Card title="Shipping" description="One flat rate per order, free above a subtotal.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Flat rate (USD)">
                  <input
                    inputMode="decimal"
                    value={form.shipping}
                    onChange={e => setForm({ ...form, shipping: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Free shipping from (USD)" hint="0 turns free shipping off.">
                  <input
                    inputMode="decimal"
                    value={form.freeOver}
                    onChange={e => setForm({ ...form, freeOver: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              {config.data && (
                <p className="mt-3 text-xs text-white/40">
                  Live now: {formatMoney(config.data.shippingCents)} shipping
                  {config.data.freeShippingOverCents > 0
                    ? `, free from ${formatMoney(config.data.freeShippingOverCents)}`
                    : ""}
                  .
                </p>
              )}
            </Card>

            <Card
              title="States you don't ship to"
              description="Checkout won't accept an address in these states."
            >
              <div className="grid grid-cols-4 gap-x-3 gap-y-1.5 sm:grid-cols-6">
                {US_STATES.map(s => (
                  <label key={s.code} className="flex items-center gap-1.5 text-sm text-white/70" title={s.name}>
                    <input
                      type="checkbox"
                      checked={form.blocked.includes(s.code)}
                      onChange={e =>
                        setForm({
                          ...form,
                          blocked: e.target.checked
                            ? [...form.blocked, s.code]
                            : form.blocked.filter(c => c !== s.code),
                        })
                      }
                    />
                    {s.code}
                  </label>
                ))}
              </div>
            </Card>

            <button type="submit" disabled={save.isPending} className={buttonClass}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save store settings
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
