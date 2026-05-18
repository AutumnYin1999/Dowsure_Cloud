import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  title: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  multi?: boolean;
}

/**
 * 选项卡 —— 可被点击的卡片,问卷单选 / 多选都用它。
 * 点击切换选中态由外部控制。
 */
export function OptionCard({
  selected,
  onClick,
  title,
  hint,
  icon,
  multi,
}: OptionCardProps) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "ds-focus group relative flex w-full flex-col items-start gap-1 rounded-xl border bg-white p-3.5 text-left transition-all sm:p-4",
        selected
          ? "border-brand-500 bg-brand-50/40 shadow-[0_0_0_3px_rgba(42,92,255,0.08)]"
          : "border-surface-line hover:border-brand-200 hover:bg-surface-alt"
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {icon ? (
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                selected
                  ? "bg-brand-100 text-brand-700"
                  : "bg-surface-alt text-ink-muted"
              )}
            >
              {icon}
            </div>
          ) : null}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-ink">{title}</span>
            {hint ? (
              <span className="mt-0.5 text-xs text-ink-soft">{hint}</span>
            ) : null}
          </div>
        </div>
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center transition-all",
            multi ? "rounded-md border" : "rounded-full border",
            selected
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-surface-line bg-white text-transparent"
          )}
          aria-hidden
        >
          {multi ? (
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          ) : (
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-white",
                !selected && "opacity-0"
              )}
            />
          )}
        </div>
      </div>
    </button>
  );
}
