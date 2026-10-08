import { useStoreConfig } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Crown, FlaskConical, Gem, Leaf, ShieldCheck } from "lucide-react";

/** The strain name in its label pill: crown, script name, crown. */
export function StrainPill({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span className={cn("strain-pill", className)}>
      <Crown className="h-[0.7em] w-[0.7em] text-gold" fill="currentColor" aria-hidden />
      <span className="script text-gold pb-[0.05em]">{name}</span>
      <Crown className="h-[0.7em] w-[0.7em] text-gold" fill="currentColor" aria-hidden />
    </span>
  );
}

/** The four claims down the side of every label. */
export const CLAIMS = [
  { icon: Leaf, label: "THC free", detail: "Hemp-derived botanicals with no THC." },
  { icon: FlaskConical, label: "Lab tested", detail: "Every batch goes to a third-party lab." },
  { icon: ShieldCheck, label: "Pesticide free", detail: "Grown and blended without pesticides." },
  { icon: Gem, label: "Premium quality", detail: "Indoor flower and a premium botanical blend." },
];

export function ClaimBadge({
  icon: Icon,
  label,
  className,
}: {
  icon: typeof Leaf;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-gold/70 text-gold">
        <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
      </span>
      <span className="text-sm font-bold uppercase tracking-[0.14em] text-cream">
        {label}
      </span>
    </span>
  );
}

/** The gold 21+ roundel from the label. */
export function AgeBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold font-display text-lg text-gold",
        className
      )}
    >
      21+
    </span>
  );
}

/** Opens the Dropbox folder with every certificate (URL from Store settings). */
export function LabReportsButton({
  className,
  label = "Lab reports",
}: {
  className?: string;
  label?: string;
}) {
  const { labReportsUrl } = useStoreConfig();
  return (
    <a href={labReportsUrl} target="_blank" rel="noopener noreferrer" className={className}>
      <FlaskConical className="h-4 w-4" />
      {label}
      <ArrowUpRight className="h-4 w-4 opacity-70" />
    </a>
  );
}
