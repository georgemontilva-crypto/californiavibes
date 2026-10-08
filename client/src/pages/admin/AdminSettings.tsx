import {
  AdminLayout,
  Card,
  Field,
  buttonClass,
  inputClass,
} from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import type { ContactDetails } from "@shared/const";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const details = trpc.site.contactDetails.useQuery();
  const [form, setForm] = useState<ContactDetails | null>(null);

  // Filled once from the server; after that the form is the source of truth
  // so a background refetch can't overwrite what is being typed.
  useEffect(() => {
    if (details.data && !form) setForm(details.data);
  }, [details.data, form]);

  const save = trpc.site.updateContactDetails.useMutation({
    onSuccess: () => {
      utils.site.contactDetails.invalidate();
      toast.success("Contact details saved");
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

  const set = (key: keyof ContactDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => (f ? { ...f, [key]: e.target.value } : f));

  return (
    <AdminLayout title="Contact details">
      <div className="max-w-2xl">
        <Card
          title="Shown on the site"
          description="These appear in the footer and on the Contact Us page. Leave a field empty to hide it."
        >
          {!form ? (
            <Loader2 className="h-5 w-5 animate-spin text-white/40" />
          ) : (
            <form
              className="grid gap-4"
              onSubmit={e => {
                e.preventDefault();
                save.mutate(form);
              }}
            >
              <Field label="Company name">
                <input value={form.company} onChange={set("company")} className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone">
                  <input value={form.phone} onChange={set("phone")} className={inputClass} />
                </Field>
              </div>
              <Field label="Address">
                <input value={form.address} onChange={set("address")} className={inputClass} />
              </Field>
              <Field label="Instagram link" hint="The full link, starting with https://">
                <input
                  value={form.instagram}
                  onChange={set("instagram")}
                  placeholder="https://instagram.com/…"
                  className={inputClass}
                />
              </Field>
              <div>
                <button type="submit" disabled={save.isPending} className={buttonClass}>
                  {save.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save contact details
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
