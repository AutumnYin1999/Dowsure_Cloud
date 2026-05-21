import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type FlowStep = "welcome" | "questionnaire" | "analyzing" | "result";

const STEPS: { key: FlowStep; label: string; eyebrow: string }[] = [
  { key: "welcome", label: "填写资料", eyebrow: "01 · INTAKE" },
  { key: "questionnaire", label: "智能分析", eyebrow: "02 · SIGNAL" },
  { key: "analyzing", label: "套餐推荐", eyebrow: "03 · ENGINE" },
  { key: "result", label: "方案确认", eyebrow: "04 · BRIEFING" },
];

interface StepsHeaderProps {
  current: FlowStep;
}

/**
 * 顶部流程进度 —— 深色 Agent OS 风格 step tabs。
 * 桌面端横向；移动端横向滚动。
 */
export function StepsHeader({ current }: StepsHeaderProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="dow-glass-card mx-auto w-full max-w-5xl animate-fade-in p-2 sm:p-2.5">
      <ol className="flex items-stretch gap-2 overflow-x-auto">
        {STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <li key={step.key} className="flex min-w-[140px] flex-1 shrink-0">
              <div
                className={cn(
                  "dow-step-tab w-full",
                  done && "dow-step-tab-done",
                  active && "dow-step-tab-active"
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span
                    className="text-[10px] font-semibold tracking-[0.18em]"
                    style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}
                  >
                    {step.eyebrow}
                  </span>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                      done && "border-[#22d3ee]/60 bg-[#22d3ee]/15 text-[#a7f3ff]",
                      active &&
                        "border-white/40 bg-white/10 text-white",
                      !done &&
                        !active &&
                        "border-white/15 bg-white/5 text-[rgba(226,219,255,0.6)]"
                    )}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : idx + 1}
                  </div>
                </div>
                <span className="mt-0.5 text-sm font-medium">{step.label}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
