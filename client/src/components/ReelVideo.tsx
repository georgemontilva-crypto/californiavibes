import { cn } from "@/lib/utils";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * A vertical clip that plays muted while it is on screen and stops when it
 * isn't.
 *
 * Nothing is downloaded until the clip is close to the viewport: with a poster
 * in place `preload="none"` shows the frame without touching the file, which
 * matters on a home page that may carry several clips of tens of megabytes
 * each. Visitors who asked for reduced motion get the poster and a play
 * button instead of autoplay.
 */
export function ReelVideo({
  src,
  poster,
  title,
  className,
}: {
  src: string;
  poster: string | null;
  title: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [manual] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const video = ref.current;
    if (!video || manual) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Autoplay can be refused (data saver, low power). The poster stays
          // up and the native controls are not needed for a muted loop, so the
          // rejection is deliberately ignored.
          video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [manual]);

  return (
    <div className={cn("relative aspect-[9/16] overflow-hidden bg-black", className)}>
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        muted={muted}
        loop
        playsInline
        controls={manual}
        preload={poster ? "none" : "metadata"}
        aria-label={title}
        className="h-full w-full object-cover"
      />
      {!manual && (
        <button
          type="button"
          onClick={() => setMuted(m => !m)}
          aria-label={muted ? `Turn sound on for ${title}` : `Mute ${title}`}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-white hover:text-black"
        >
          {muted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
        </button>
      )}
    </div>
  );
}
