import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "brand"
  | "emerald"
  | "gold"
  | "violet"
  | "neutral"
  | "outline"
  | "solid";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  emerald: "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30",
  gold: "bg-accent-gold/10 text-accent-gold border-accent-gold/20",
  violet: "bg-accent-violet/10 text-accent-violet border-accent-violet/20",
  neutral: "bg-surface-alt text-ink-muted border-surface-line",
  outline: "bg-white text-ink-muted border-surface-line",
  solid: "bg-brand-600 text-white border-brand-600",
};

export function Badge({ className, tone = "neutral", ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        toneClasses[tone],
        className
      )}
      {...rest}
    />
  );
}
