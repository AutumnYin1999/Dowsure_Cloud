import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type FlowStep = "welcome" | "questionnaire" | "analyzing" | "result";

const STEPS: { key: FlowStep; label: string }[] = [
  { key: "welcome", label: "填写资料" },
  { key: "questionnaire", label: "智能分析" },
  { key: "analyzing", label: "套餐推荐" },
  { key: "result", label: "方案确认" },
];

interface StepsHeaderProps {
  current: FlowStep;
}

/**
 * 流程进度条 —— 顶部展示当前在哪一步。
 * 桌面端横向 / 移动端紧凑横向滚动。
 */
export function StepsHeader({ current }: StepsHeaderProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="ds-card animate-fade-in p-3 sm:p-4">
      <ol className="flex items-center gap-2 overflow-x-auto sm:gap-3">
        {STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <li key={step.key} className="flex shrink-0 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done && "border-brand-600 bg-brand-600 text-white",
                  active &&
                    "border-brand-600 bg-white text-brand-700 ring-4 ring-brand-100",
                  !done && !active && "border-surface-line bg-white text-ink-soft"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : idx + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium sm:text-sm",
                  active && "text-brand-700",
                  done && "text-ink",
                  !done && !active && "text-ink-soft"
                )}
              >
                {step.label}
              </span>
              {idx < STEPS.length - 1 ? (
                <span
                  className={cn(
                    "mx-1 hidden h-px w-8 sm:inline-block",
                    done ? "bg-brand-300" : "bg-surface-line"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
