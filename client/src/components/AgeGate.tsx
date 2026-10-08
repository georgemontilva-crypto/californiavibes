import { AgeBadge } from "@/components/Brand";
import { Lockup, Palm } from "@/components/Logo";
import { useEffect, useState } from "react";

const KEY = "cv_age_ok";

function readStored(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    // Private mode or storage disabled: ask every visit rather than never.
    return false;
  }
}

/**
 * 21+ gate, as the label requires. Sits over the public pages until the
 * visitor answers; the answer is remembered on this device only.
 */
export function AgeGate() {
  const [ok, setOk] = useState(true);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    setOk(readStored());
  }, []);

  // The page behind must not scroll while the question is up.
  useEffect(() => {
    if (ok) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [ok]);

  if (ok) return null;

  const confirm = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* not stored; they'll be asked again next visit */
    }
    setOk(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-title"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-night p-4"
    >
      <div className="bg-sunset absolute inset-0 opacity-80" aria-hidden />
      <Palm className="pointer-events-none absolute -bottom-6 -left-16 h-[70vh] w-auto text-night" />
      <Palm flip className="pointer-events-none absolute -bottom-10 -right-16 h-[78vh] w-auto text-night" />
      <div className="holo-border relative w-full max-w-md rounded-[2rem]">
        <div className="rounded-[calc(2rem-2px)] bg-night/95 px-6 py-9 text-center sm:px-10">
          <Lockup className="text-[3.2rem]" />
          <AgeBadge className="mx-auto mt-6 h-16 w-16 text-2xl" />
          {declined ? (
            <>
              <h1 id="age-title" className="mt-5 text-4xl text-cream">
                This site is for adults
              </h1>
              <p className="mt-3 text-haze">
                You need to be 21 or older to visit California Vibes.
              </p>
              <button
                type="button"
                onClick={() => setDeclined(false)}
                className="btn btn-ghost mt-7"
              >
                Go back
              </button>
            </>
          ) : (
            <>
              <h1 id="age-title" className="mt-5 text-4xl text-cream">
                Are you 21 or older?
              </h1>
              <p className="mt-3 text-haze">
                Our products are hemp-derived botanicals for adults only.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button type="button" onClick={confirm} className="btn btn-gold">
                  Yes, I'm 21+
                </button>
                <button
                  type="button"
                  onClick={() => setDeclined(true)}
                  className="btn btn-ghost"
                >
                  No
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
