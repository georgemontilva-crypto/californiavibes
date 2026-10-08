import {
  AdminLayout,
  Card,
  Field,
  Notice,
  buttonClass,
  inputClass,
} from "@/components/AdminLayout";
import { useR2Upload } from "@/hooks/useR2Upload";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Grabs a frame from the chosen file to use as the poster.
 *
 * Done in the browser, at upload time, so the public page has an image to show
 * without requesting any video. Resolves to null instead of rejecting: a codec
 * the browser can't decode shouldn't block the upload, the clip just goes up
 * without a poster.
 */
function capturePoster(file: File): Promise<File | null> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const done = (result: File | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timer = window.setTimeout(() => done(null), 8000);

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => {
      window.clearTimeout(timer);
      done(null);
    };
    // The very first frame is often black; half a second in is usually picture.
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      window.clearTimeout(timer);
      try {
        const scale = Math.min(1, 720 / (video.videoWidth || 720));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round((video.videoWidth || 720) * scale);
        canvas.height = Math.round((video.videoHeight || 1280) * scale);
        canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          blob =>
            done(
              blob
                ? new File([blob], file.name.replace(/\.[^.]+$/, "") + "-poster.jpg", {
                    type: "image/jpeg",
                  })
                : null
            ),
          "image/jpeg",
          0.82
        );
      } catch {
        done(null);
      }
    };
    video.src = url;
  });
}

function formatSize(bytes?: number | null): string {
  if (!bytes) return "";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminVideos() {
  const utils = trpc.useUtils();
  const videos = trpc.videos.adminList.useQuery(undefined, { retry: false });
  const storage = trpc.catalog.storageStatus.useQuery(undefined, { retry: false });

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"idle" | "poster" | "video">("idle");
  const { upload, progress } = useR2Upload();

  const refresh = () => {
    utils.videos.invalidate();
    utils.adminAuth.dashboardOverview.invalidate();
  };

  const create = trpc.videos.create.useMutation({
    onSuccess: () => {
      setTitle("");
      setFile(null);
      refresh();
      toast.success("Video published");
    },
    onError: e => toast.error(e.message || "Could not save the video"),
  });

  const update = trpc.videos.update.useMutation({
    onSuccess: refresh,
    onError: e => toast.error(e.message || "Could not save"),
  });

  const remove = trpc.videos.delete.useMutation({
    onSuccess: () => {
      refresh();
      toast.success("Video deleted");
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Choose the video file to upload");
      return;
    }
    if (!title.trim()) {
      toast.error("Give the video a title");
      return;
    }
    if (storage.data && !storage.data.configured) {
      toast.error(
        `Uploads are off until R2 is set up in Railway. Missing: ${storage.data.missing.join(", ")}`
      );
      return;
    }

    try {
      setStage("poster");
      const posterFile = await capturePoster(file);
      const poster = posterFile
        ? await upload(posterFile, "video-poster").catch(() => null)
        : null;

      setStage("video");
      const up = await upload(file, "video");
      create.mutate({
        title: title.trim(),
        fileUrl: up.publicUrl,
        fileKey: up.storageKey,
        posterUrl: poster?.publicUrl ?? null,
        posterKey: poster?.storageKey ?? null,
        sizeBytes: up.sizeBytes,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setStage("idle");
    }
  };

  const busy = stage !== "idle" || create.isPending;

  return (
    <AdminLayout title="Videos">
      {storage.data && !storage.data.configured && (
        <Notice>
          <p className="font-semibold">Uploads are off: R2 isn't configured.</p>
          <p className="mt-1">
            Missing in Railway:{" "}
            <span className="font-mono">{storage.data.missing.join(", ")}</span>
          </p>
        </Notice>
      )}

      <Card
        title="Upload a video"
        description="Vertical clips (9:16) in MP4 work best. Keep them short: under 30 seconds and under 30 MB plays well on a phone."
      >
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" hint="Shown under the clip on the home page.">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Rolling Hash Holes"
                className={inputClass}
              />
            </Field>
            <Field label="Video file">
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={e => {
                  const picked = e.target.files?.[0] ?? null;
                  setFile(picked);
                  if (picked && !title.trim()) {
                    setTitle(picked.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
                  }
                }}
                className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
              />
            </Field>
          </div>

          {stage === "video" && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
          )}

          <div>
            <button type="submit" disabled={busy} className={buttonClass}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {stage === "poster"
                ? "Preparing…"
                : stage === "video"
                  ? `Uploading ${progress ?? 0}%`
                  : "Publish video"}
            </button>
          </div>
        </form>
      </Card>

      <p className="mt-6 text-sm text-white/45">
        The starred clip plays in the big frame at the top of the home page.
        The rest appear in the "On camera" row. With no star, the top of the
        home page shows the jars instead.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        ) : videos.data?.length ? (
          videos.data.map(v => (
            <div
              key={v.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a1029]"
            >
              <video
                src={v.fileUrl}
                poster={v.posterUrl ?? undefined}
                controls
                preload="none"
                className="aspect-[9/16] w-full bg-black object-cover"
              />
              <div className="p-4">
                <input
                  defaultValue={v.title}
                  aria-label="Title"
                  onBlur={e => {
                    const next = e.target.value.trim();
                    if (next && next !== v.title) {
                      update.mutate(
                        { id: v.id, title: next },
                        { onSuccess: () => toast.success("Title saved") }
                      );
                    }
                  }}
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-white/40">
                  {[formatSize(v.sizeBytes), v.published ? null : "Hidden"]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-3 flex items-center gap-1">
                  <button
                    title={v.featured ? "Remove from the top of the home page" : "Play at the top of the home page"}
                    aria-pressed={v.featured}
                    onClick={() =>
                      update.mutate(
                        { id: v.id, featured: !v.featured },
                        {
                          onSuccess: () =>
                            toast.success(
                              v.featured
                                ? "Removed from the top of the home page"
                                : "Now playing at the top of the home page"
                            ),
                        }
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      v.featured
                        ? "bg-white text-black"
                        : "text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Star className="h-3.5 w-3.5" fill={v.featured ? "currentColor" : "none"} />
                    {v.featured ? "Home hero" : "Set as hero"}
                  </button>
                  <button
                    title={v.published ? "Hide from the site" : "Publish"}
                    onClick={() =>
                      update.mutate(
                        { id: v.id, published: !v.published },
                        {
                          onSuccess: () =>
                            toast.success(v.published ? "Video hidden" : "Video published"),
                        }
                      )
                    }
                    className="ml-auto rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                  >
                    {v.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    title="Delete video"
                    onClick={() => {
                      if (confirm(`Delete "${v.title}"? The file is removed from storage too.`)) {
                        remove.mutate({ id: v.id });
                      }
                    }}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/15 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">
            No videos yet. Upload the first one above.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
