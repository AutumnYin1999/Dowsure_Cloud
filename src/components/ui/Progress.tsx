import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0 - 100
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  const safe = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-surface-line",
        className
      )}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-brand-gradient transition-all"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
