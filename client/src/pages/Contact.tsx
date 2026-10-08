import { PageHeader, PublicLayout } from "@/components/PublicLayout";
import { useTitle } from "@/lib/catalog";
import { trpc } from "@/lib/trpc";
import { CONTACT_TOPICS, DEFAULT_CONTACT } from "@shared/const";
import { Check, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";

type Topic = (typeof CONTACT_TOPICS)[number];

export default function Contact() {
  useTitle("Contact Us");
  const details = trpc.site.contactDetails.useQuery().data ?? DEFAULT_CONTACT;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState<Topic>(CONTACT_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [sent, setSent] = useState(false);

  const send = trpc.site.sendMessage.useMutation({
    onSuccess: () => {
      setSent(true);
      setMessage("");
    },
  });

  /* Zod's validation errors arrive as a JSON string in `message`; the first
     issue's own sentence is what the visitor can act on. Anything else (rate
     limit, server down) is already a sentence. */
  const errorText = (() => {
    if (!send.error) return null;
    try {
      const issues = JSON.parse(send.error.message) as { message?: string }[];
      if (Array.isArray(issues) && issues[0]?.message) return issues[0].message;
    } catch {
      /* not a validation error */
    }
    return (
      send.error.message ||
      "The message couldn't be sent. Try again, or email us directly."
    );
  })();

  return (
    <PublicLayout>
      <PageHeader title="Contact us" eyebrow="Say hello">
        Questions about an order, a product, a lab report or carrying California
        Vibes in your store. We read every message.
      </PageHeader>

      <div className="container grid gap-12 py-12 md:py-16 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div>
          {sent ? (
            <div className="rounded-[2rem] bg-dusk ring-1 ring-rule">
              <div className="px-7 py-10">
                <Check className="h-10 w-10 text-gold" strokeWidth={2.5} />
                <h2 className="mt-4 text-4xl text-cream md:text-5xl">Message sent</h2>
                <p className="mt-3 max-w-md text-haze">
                  Thanks, {name.trim().split(" ")[0] || "we got it"}. We'll reply
                  to {email.trim()}.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="btn btn-ghost mt-7"
                >
                  Send another message
                </button>
              </div>
            </div>
          ) : (
            <form
              className="grid gap-5"
              onSubmit={e => {
                e.preventDefault();
                send.mutate({
                  name,
                  email,
                  phone: phone || undefined,
                  topic,
                  message,
                  website: website || undefined,
                });
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Labeled label="Name" htmlFor="c-name">
                  <input
                    id="c-name"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="field"
                  />
                </Labeled>
                <Labeled label="Email" htmlFor="c-email">
                  <input
                    id="c-email"
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="field"
                  />
                </Labeled>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Labeled label="Phone (optional)" htmlFor="c-phone">
                  <input
                    id="c-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="field"
                  />
                </Labeled>
                <Labeled label="What's it about?" htmlFor="c-topic">
                  <select
                    id="c-topic"
                    value={topic}
                    onChange={e => setTopic(e.target.value as Topic)}
                    className="field"
                  >
                    {CONTACT_TOPICS.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Labeled>
              </div>
              <Labeled
                label="Message"
                htmlFor="c-message"
                hint="Asking about an order? Include your order number (CV-…)."
              >
                <textarea
                  id="c-message"
                  required
                  minLength={10}
                  rows={6}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="field resize-y"
                />
              </Labeled>

              {/* Honeypot: off-screen and out of the tab order, so only a
                  script fills it. */}
              <div className="absolute -left-[9999px]" aria-hidden>
                <label>
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                  />
                </label>
              </div>

              {errorText && (
                <p role="alert" className="border-l-[3px] border-coral pl-4 text-coral">
                  {errorText}
                </p>
              )}

              <div>
                <button type="submit" disabled={send.isPending} className="btn btn-gold">
                  {send.isPending && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                  Send message
                </button>
              </div>
            </form>
          )}
        </div>

        <aside>
          <div className="overflow-hidden rounded-[2rem] bg-dusk ring-1 ring-rule">
            <div className="holo-rule" aria-hidden />
            <div className="px-7 py-8">
              <h2 className="text-3xl text-cream">{details.company}</h2>
              {!details.email && !details.phone && !details.address && (
                <p className="mt-4 text-haze">
                  Use the form and we'll get back to you by email.
                </p>
              )}
              <ul className="mt-6 space-y-5">
                {details.email && (
                  <Detail icon={Mail} label="Email">
                    <a href={`mailto:${details.email}`} className="hover:text-gold">
                      {details.email}
                    </a>
                  </Detail>
                )}
                {details.phone && (
                  <Detail icon={Phone} label="Phone">
                    <a
                      href={`tel:${details.phone.replace(/[^\d+]/g, "")}`}
                      className="hover:text-gold"
                    >
                      {details.phone}
                    </a>
                  </Detail>
                )}
                {details.address && (
                  <Detail icon={MapPin} label="Address">
                    {details.address}
                  </Detail>
                )}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </PublicLayout>
  );
}

function Labeled({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-bold uppercase tracking-[0.12em] text-cream"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-sm text-haze">{hint}</p>}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={1.7} />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-haze">
          {label}
        </p>
        <p className="text-cream">{children}</p>
      </div>
    </li>
  );
}
