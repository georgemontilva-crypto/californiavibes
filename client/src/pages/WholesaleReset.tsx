import { PageHeader, PublicLayout } from "@/components/PublicLayout";
import { useTitle } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { readable } from "@/pages/Wholesale";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useSearch } from "wouter";

export default function WholesaleReset() {
  useTitle("Reset password");
  const token = new URLSearchParams(useSearch()).get("token") ?? "";
  const utils = trpc.useUtils();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const reset = trpc.wholesale.resetPassword.useMutation({
    // A successful reset of an approved account also logs the buyer in, and
    // every price depends on that session.
    onSuccess: () => utils.invalidate(),
  });

  return (
    <PublicLayout>
      <PageHeader title="New password" eyebrow="Wholesale account" />
      <div className="container max-w-xl py-12">
        <div className="overflow-hidden rounded-[2rem] bg-dusk ring-1 ring-rule">
          <div className="holo-rule" aria-hidden />
          <div className="p-6 sm:p-9">
            {!token ? (
              <>
                <p className="text-lg font-bold text-cream">This link is incomplete</p>
                <p className="mt-2 text-haze">
                  Open the link from the email again, or ask for a new one on the
                  wholesale login page.
                </p>
                <Link href="/wholesale" className="btn btn-gold mt-6">
                  Wholesale login
                </Link>
              </>
            ) : reset.isSuccess ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-gold" strokeWidth={1.6} />
                <h2 className="mt-4 text-4xl text-cream">Password updated</h2>
                <p className="mt-2 text-haze">
                  {reset.data.loggedIn
                    ? "You're logged in to your wholesale account."
                    : "Your new password is saved. You can log in once your account is approved."}
                </p>
                <Link href={reset.data.loggedIn ? "/products" : "/wholesale"} className="btn btn-gold mt-6">
                  {reset.data.loggedIn ? "Shop wholesale" : "Wholesale login"}
                </Link>
              </>
            ) : (
              <form
                className="grid gap-4"
                onSubmit={e => {
                  e.preventDefault();
                  if (password !== confirm) return setMismatch(true);
                  setMismatch(false);
                  reset.mutate({ token, password });
                }}
              >
                <h2 className="text-4xl text-cream">Choose a new password</h2>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-haze">New password (8+ characters)</span>
                  <input type="password" required minLength={8} autoComplete="new-password" className="field" value={password} onChange={e => setPassword(e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-haze">Repeat it</span>
                  <input type="password" required minLength={8} autoComplete="new-password" className="field" value={confirm} onChange={e => setConfirm(e.target.value)} />
                </label>
                {(mismatch || reset.error) && (
                  <p role="alert" className="rounded-2xl bg-coral/15 p-3 text-sm font-semibold text-coral">
                    {mismatch
                      ? "The two passwords don't match."
                      : readable(reset.error?.message, "Couldn't update the password.")}
                  </p>
                )}
                {reset.error && !mismatch && (
                  <Link href="/wholesale" className="text-sm text-gold underline-offset-4 hover:underline">
                    Ask for a new link
                  </Link>
                )}
                <div>
                  <button type="submit" disabled={reset.isPending} className="btn btn-gold">
                    {reset.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save new password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
