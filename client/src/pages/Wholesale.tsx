import { PageHeader, PublicLayout } from "@/components/PublicLayout";
import { useStoreConfig, useTitle } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { formatMoney, US_STATES } from "@shared/store";
import { BadgeCheck, CheckCircle2, Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useSearch } from "wouter";

/** Zod errors arrive as a JSON list; the first message is what the visitor can act on. */
function readable(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  try {
    const issues = JSON.parse(message) as { message?: string }[];
    if (Array.isArray(issues) && issues[0]?.message) return issues[0].message;
  } catch {
    /* already a sentence */
  }
  return message;
}

export default function Wholesale() {
  useTitle("Wholesale");
  const me = trpc.wholesale.me.useQuery();
  const initialTab = new URLSearchParams(useSearch()).get("tab") === "apply" ? "apply" : "login";
  const [tab, setTab] = useState<"login" | "apply">(initialTab);

  return (
    <PublicLayout>
      <PageHeader title="Wholesale" eyebrow="For stores & distributors">
        Carry California Vibes in your shop. Approved wholesale accounts log in
        here to see wholesale pricing and order online.
      </PageHeader>

      <div className="container max-w-3xl py-12">
        {me.isLoading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold" />
        ) : me.data ? (
          <Account account={me.data} />
        ) : (
          <>
            <div role="tablist" className="mx-auto flex w-fit gap-1 rounded-full bg-panel p-1 ring-1 ring-rule">
              {(["login", "apply"] as const).map(t => (
                <button
                  key={t}
                  role="tab"
                  type="button"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-full px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.14em] transition-colors",
                    tab === t ? "bg-gold text-night" : "text-haze hover:text-cream"
                  )}
                >
                  {t === "login" ? "Log in" : "Apply for an account"}
                </button>
              ))}
            </div>
            <div className="mt-8">
              {tab === "login" ? <LoginForm onApply={() => setTab("apply")} /> : <ApplyForm />}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[2rem] bg-dusk ring-1 ring-rule">
      <div className="holo-rule" aria-hidden />
      <div className="p-6 sm:p-9">{children}</div>
    </div>
  );
}

function Field({
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

/* ─── Logged in ─────────────────────────────────────────────────────────── */

function Account({
  account,
}: {
  account: { businessName: string; contactName: string; email: string };
}) {
  const utils = trpc.useUtils();
  const { wholesaleMinCents } = useStoreConfig();
  const logout = trpc.wholesale.logout.useMutation({
    // Every price on the site depends on the session, so drop all of it.
    onSuccess: () => utils.invalidate(),
  });

  return (
    <Panel>
      <BadgeCheck className="h-10 w-10 text-gold" strokeWidth={1.6} />
      <h2 className="mt-4 text-4xl text-cream">{account.businessName}</h2>
      <p className="mt-1 text-haze">
        {account.contactName} · {account.email}
      </p>
      <p className="mt-5 max-w-lg text-cream/85">
        You're logged in to your wholesale account. Every price on the site now
        shows your wholesale price, and orders you place are sent to our
        wholesale team.
        {wholesaleMinCents > 0 && (
          <> Wholesale orders have a minimum of {formatMoney(wholesaleMinCents)}.</>
        )}
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/products" className="btn btn-gold">
          Shop wholesale
        </Link>
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="btn btn-ghost"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </Panel>
  );
}

/* ─── Log in ────────────────────────────────────────────────────────────── */

function LoginForm({ onApply }: { onApply: () => void }) {
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.wholesale.login.useMutation({
    onSuccess: () => utils.invalidate(),
  });

  return (
    <Panel>
      <h2 className="text-4xl text-cream">Wholesale login</h2>
      <form
        className="mt-6 grid gap-4"
        onSubmit={e => {
          e.preventDefault();
          login.mutate({ email, password });
        }}
      >
        <Field label="Email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        <Field label="Password" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
        {login.error && (
          <p role="alert" className="rounded-2xl bg-coral/15 p-3 text-sm font-semibold text-coral">
            {readable(login.error.message, "Couldn't log in. Try again.")}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="submit" disabled={login.isPending} className="btn btn-gold">
            {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Log in
          </button>
          <p className="text-sm text-haze">
            No account yet?{" "}
            <button type="button" onClick={onApply} className="font-semibold text-gold underline-offset-4 hover:underline">
              Apply for wholesale
            </button>
          </p>
        </div>
        <p className="text-sm text-haze">
          Forgot your password?{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-cream">
            Contact us
          </Link>{" "}
          and we'll reset it.
        </p>
      </form>
    </Panel>
  );
}

/* ─── Apply ─────────────────────────────────────────────────────────────── */

function ApplyForm() {
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    state: "",
    taxId: "",
    website: "",
    message: "",
    password: "",
    company: "",
  });
  const apply = trpc.wholesale.submitApplication.useMutation();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  if (apply.isSuccess) {
    return (
      <Panel>
        <CheckCircle2 className="h-10 w-10 text-gold" strokeWidth={1.6} />
        <h2 className="mt-4 text-4xl text-cream">Application received</h2>
        <p className="mt-3 max-w-lg text-cream/85">
          Thanks, {form.contactName.split(" ")[0] || "we got it"}. Our team will
          review {form.businessName || "your business"} and email{" "}
          {form.email} once your account is approved. Then you can log in here
          with the password you just chose.
        </p>
        <Link href="/products" className="btn btn-ghost mt-7">
          Keep browsing
        </Link>
      </Panel>
    );
  }

  return (
    <Panel>
      <h2 className="text-4xl text-cream">Apply for wholesale</h2>
      <p className="mt-2 text-haze">
        Tell us about your business. Once we approve it, you'll log in with the
        email and password below.
      </p>
      <form
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={e => {
          e.preventDefault();
          apply.mutate({
            ...form,
            taxId: form.taxId || undefined,
            website: form.website || undefined,
            message: form.message || undefined,
            company: form.company || undefined,
          });
        }}
      >
        <Field label="Business name" required value={form.businessName} onChange={set("businessName")} autoComplete="organization" />
        <Field label="Your name" required value={form.contactName} onChange={set("contactName")} autoComplete="name" />
        <Field label="Email" type="email" required value={form.email} onChange={set("email")} autoComplete="email" />
        <Field label="Phone" type="tel" required value={form.phone} onChange={set("phone")} autoComplete="tel" />
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-haze">State</span>
          <select required className="field" value={form.state} onChange={set("state")}>
            <option value="">Select</option>
            {US_STATES.map(s => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Resale permit / Tax ID (optional)" value={form.taxId} onChange={set("taxId")} />
        <Field className="sm:col-span-2" label="Website or Instagram (optional)" value={form.website} onChange={set("website")} />
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold text-haze">
            About your business (optional)
          </span>
          <textarea rows={3} className="field" value={form.message} onChange={set("message")} maxLength={2000} placeholder="Type of store, locations, what you'd like to carry…" />
        </label>
        <Field
          className="sm:col-span-2"
          label="Choose a password (8+ characters)"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
        />
        <div className="absolute -left-[9999px]" aria-hidden>
          <label>
            Company
            <input tabIndex={-1} autoComplete="off" value={form.company} onChange={set("company")} />
          </label>
        </div>
        {apply.error && (
          <p role="alert" className="rounded-2xl bg-coral/15 p-3 text-sm font-semibold text-coral sm:col-span-2">
            {readable(apply.error.message, "Couldn't send the application. Try again.")}
          </p>
        )}
        <div className="sm:col-span-2">
          <button type="submit" disabled={apply.isPending} className="btn btn-gold">
            {apply.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send application
          </button>
        </div>
      </form>
    </Panel>
  );
}
