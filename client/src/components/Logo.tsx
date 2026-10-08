import { cn } from "@/lib/utils";

/**
 * The California Vibes marks, redrawn from the packaging: the gold lotus that
 * sits over "Premium Botanicals", the script wordmark with its palm, and the
 * palm silhouettes of the sunset art.
 */

/** Gold lotus. Petals are filled, separated by a hairline of the background. */
export function Emblem({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 50"
      className={cn("h-8 w-auto", className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="cv-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="0.5" stopColor="#f3c55b" />
          <stop offset="1" stopColor="#c98b25" />
        </linearGradient>
      </defs>
      <g fill="url(#cv-gold)" stroke="#0a0612" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M32 40 C24 32 13 28 3 29 C7 37 18 43 32 40 Z" />
        <path d="M32 40 C40 32 51 28 61 29 C57 37 46 43 32 40 Z" />
        <path d="M32 40 C33 27 28 15 16 10 C13 23 19 35 32 40 Z" />
        <path d="M32 40 C31 27 36 15 48 10 C51 23 45 35 32 40 Z" />
        <path d="M32 2 C39 13 39 29 32 40 C25 29 25 13 32 2 Z" />
      </g>
      <path
        d="M14 45 Q32 50 50 45"
        fill="none"
        stroke="url(#cv-gold)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Palm tree silhouette. `currentColor`, so it takes the text colour. */
export function Palm({ className, flip }: { className?: string; flip?: boolean }) {
  const frond = "M0 0 C30 -26 70 -26 104 6 C74 -8 40 -6 0 8 Z";
  const angles = [-58, -28, 2, 30, 58];
  return (
    <svg
      viewBox="0 0 220 320"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
      focusable="false"
    >
      <g fill="currentColor">
        <path d="M104 74 C96 150 92 230 96 322 L114 322 C108 232 110 150 116 76 Z" />
        {angles.map(a => (
          <path key={`r${a}`} d={frond} transform={`translate(110 72) rotate(${a})`} />
        ))}
        {angles.map(a => (
          <path
            key={`l${a}`}
            d={frond}
            transform={`translate(110 72) scale(-1 1) rotate(${a})`}
          />
        ))}
        <path d={frond} transform="translate(110 72) rotate(-92) scale(0.7 1)" />
        <circle cx="106" cy="80" r="6" />
        <circle cx="116" cy="82" r="5" />
      </g>
    </svg>
  );
}

/**
 * The script wordmark. `variant="logo"` uses the pouch gradient; `gold` is the
 * foil version printed on the device and the jar body.
 */
export function Wordmark({
  className,
  variant = "logo",
  inline,
}: {
  className?: string;
  variant?: "logo" | "gold";
  /** One line, for the header. */
  inline?: boolean;
}) {
  const fill = variant === "gold" ? "text-gold" : "text-logo";
  if (inline) {
    return (
      <span
        className={cn("script inline-flex items-end whitespace-nowrap leading-none", className)}
        style={{ filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.55))" }}
      >
        <span className={cn(fill, "pb-[0.08em] pr-[0.06em]")}>California Vibes</span>
        <Palm
          className={cn(
            "-ml-[0.1em] mb-[0.2em] h-[0.85em] w-auto",
            variant === "gold" ? "text-gold-deep" : "text-[#ff9a2e]"
          )}
        />
      </span>
    );
  }
  return (
    <span
      className={cn("script inline-flex flex-col leading-[0.82]", className)}
      style={{ filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.55))" }}
    >
      <span className={cn(fill, "-rotate-[5deg] pr-[0.08em]")}>California</span>
      <span className="ml-[1.4em] inline-flex -rotate-[5deg] items-end">
        <span className={fill}>Vibes</span>
        <Palm
          className={cn(
            "-ml-[0.05em] mb-[0.12em] h-[0.78em] w-auto",
            variant === "gold" ? "text-gold-deep" : "text-[#ffb347]"
          )}
        />
      </span>
    </span>
  );
}

/** Emblem over the wordmark, as on the front of every pack. */
export function Lockup({
  className,
  variant = "logo",
}: {
  className?: string;
  variant?: "logo" | "gold";
}) {
  return (
    <span className={cn("inline-flex flex-col items-center", className)}>
      <Emblem className="h-[0.7em]" />
      <span className="mt-[0.12em] font-sans text-[0.13em] font-bold tracking-[0.3em] text-gold">
        PREMIUM BOTANICALS
      </span>
      <Wordmark variant={variant} className="mt-[0.1em]" />
    </span>
  );
}
