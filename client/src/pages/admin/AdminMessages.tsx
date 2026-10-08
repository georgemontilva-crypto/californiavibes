import { AdminLayout } from "@/components/AdminLayout";
import { Pagination } from "@/components/admin/AdminTable";
import { trpc } from "@/lib/trpc";
import { Check, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 25;

export default function AdminMessages() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const messages = trpc.site.messages.useQuery(
    { page, pageSize: PAGE_SIZE },
    { retry: false }
  );

  const refresh = () => {
    utils.site.messages.invalidate();
    utils.adminAuth.dashboardOverview.invalidate();
  };

  const setHandled = trpc.site.setMessageHandled.useMutation({ onSuccess: refresh });
  const remove = trpc.site.deleteMessage.useMutation({
    onSuccess: () => {
      refresh();
      toast.success("Message deleted");
    },
  });

  return (
    <AdminLayout title="Messages">
      {messages.data && !messages.data.mailConfigured && (
        <p className="mb-5 text-sm text-white/45">
          Messages are saved here only. To also get each one by email, set{" "}
          <span className="font-mono text-white/70">RESEND_API_KEY</span>,{" "}
          <span className="font-mono text-white/70">RESEND_FROM_EMAIL</span> and{" "}
          <span className="font-mono text-white/70">CONTACT_TO_EMAIL</span> in
          Railway.
        </p>
      )}

      {messages.isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      ) : messages.data?.rows.length ? (
        <>
          <ul className="space-y-3">
            {messages.data.rows.map(m => (
              <li
                key={m.id}
                className={`rounded-2xl border bg-[#1a1029] p-5 ${
                  m.handled ? "border-white/10 opacity-60" : "border-white/25"
                }`}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold">{m.name}</span>
                  <a
                    href={`mailto:${m.email}`}
                    className="text-sm text-white/60 underline underline-offset-2 hover:text-white"
                  >
                    {m.email}
                  </a>
                  {m.phone && <span className="text-sm text-white/60">{m.phone}</span>}
                  {m.topic && (
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/70">
                      {m.topic}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-white/40">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/85">
                  {m.message}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to California Vibes")}`}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-white/85"
                  >
                    Reply by email
                  </a>
                  <button
                    onClick={() => setHandled.mutate({ id: m.id, handled: !m.handled })}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    {m.handled ? (
                      <RotateCcw className="h-3.5 w-3.5" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {m.handled ? "Mark as not answered" : "Mark as answered"}
                  </button>
                  <button
                    title="Delete message"
                    onClick={() => {
                      if (confirm(`Delete the message from ${m.name}?`)) {
                        remove.mutate({ id: m.id });
                      }
                    }}
                    className="ml-auto rounded-lg p-1.5 text-white/40 hover:bg-red-500/15 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={messages.data.total}
            onChange={setPage}
          />
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">
          No messages yet. They arrive from the Contact Us page.
        </div>
      )}
    </AdminLayout>
  );
}
