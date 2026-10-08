import { cn } from "@/lib/utils";
import { MAX_QTY_PER_LINE } from "@shared/store";
import { Minus, Plus } from "lucide-react";

export function QtyStepper({
  value,
  onChange,
  label,
  min = 1,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  size?: "sm" | "md";
}) {
  const btn = cn(
    "flex items-center justify-center rounded-full text-cream transition-colors hover:bg-white/15 disabled:opacity-30",
    size === "sm" ? "h-8 w-8" : "h-11 w-11"
  );
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-black/35 ring-1 ring-rule",
        size === "sm" ? "p-0.5" : "p-1"
      )}
      role="group"
      aria-label={`Quantity of ${label}`}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span
        className={cn("text-center font-extrabold tabular-nums text-cream", size === "sm" ? "w-7 text-sm" : "w-9")}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QTY_PER_LINE}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
