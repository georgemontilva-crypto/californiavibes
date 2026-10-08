import { cn } from "@/lib/utils";

/**
 * A product cut-out on its halo. The packs are dark with dark palms, so on the
 * night background they need the strain's colour behind them to have an edge.
 */
export function ProductShot({
  src,
  alt,
  className,
  eager,
}: {
  src: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <div className={cn("relative aspect-square", className)}>
      <div className="glow absolute inset-[6%]" aria-hidden />
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="relative h-full w-full object-contain drop-shadow-[0_22px_24px_rgba(0,0,0,0.6)]"
        />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center text-xs font-bold uppercase tracking-widest text-white/40">
          No photo yet
        </div>
      )}
    </div>
  );
}
