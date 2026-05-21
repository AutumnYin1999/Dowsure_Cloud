import { Brain, Database, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnalyzingPageProps {
  /** 分析完成时回调,父组件随后切换到结果页。 */
  onDone: () => void;
}

const STAGES = [
  {
    icon: Database,
    label: "归一化服务商画像",
    detail: "对齐字段、规范类型、计算预算档位",
  },
  {
    icon: Brain,
    label: "检索豆服云权益知识库",
    detail: "RAG mock: 匹配类别 + 关键词命中",
  },
  {
    icon: Sparkles,
    label: "规则引擎打分与组合",
    detail: "13 条规则 · 优先级合并 · 预算约束",
  },
  {
    icon: Wand2,
    label: "Agent 生成自然语言解释",
    detail: "把推荐理由翻译成可读的方案陈述",
  },
];

export function AnalyzingPage({ onDone }: AnalyzingPageProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length));
    }, 420);
    const doneTimer = setTimeout(onDone, 1800);
    return () => {
      clearInterval(stageTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className="dow-glass-card mx-auto max-w-2xl animate-fade-in p-6 sm:p-10 text-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
            style={{
              background:
                "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
              boxShadow: "0 14px 40px -10px rgba(167,87,255,0.6)",
            }}
          >
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
          <div
            aria-hidden
            className="absolute inset-0 -z-10 animate-pulse rounded-2xl blur-2xl"
            style={{ background: "rgba(167,87,255,0.35)" }}
          />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            正在为你智能分析
          </h2>
          <p className="max-w-md text-sm text-[rgba(226,219,255,0.7)]">
            Agent 正在根据你的问卷答案，检索权益知识库，并生成 TermPay 推荐组合方案
          </p>
        </div>
      </div>

      <ol className="mt-8 space-y-2.5">
        {STAGES.map((s, idx) => {
          const active = idx === stage;
          const done = idx < stage;
          return (
            <li
              key={s.label}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 transition-all",
                done &&
                  "border-[rgba(34,211,238,0.4)] bg-[rgba(34,211,238,0.08)]",
                active &&
                  "border-[rgba(167,87,255,0.55)] bg-white/[0.06] shadow-[0_0_0_1px_rgba(167,87,255,0.35),0_18px_40px_-18px_rgba(167,87,255,0.55)]",
                !done &&
                  !active &&
                  "border-white/10 bg-white/[0.025] opacity-70"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  done && "bg-[rgba(34,211,238,0.18)] text-[#a7f3ff]",
                  active &&
                    "text-white [background:linear-gradient(135deg,#ff5bb0,#a757ff_50%,#5b87ff)]",
                  !done && !active && "bg-white/[0.04] text-[rgba(226,219,255,0.6)]"
                )}
              >
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{s.label}</p>
                  {active ? (
                    <span
                      className="h-4 w-12 rounded-md"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
                        backgroundSize: "200px 100%",
                        animation: "shimmer 1.4s linear infinite",
                      }}
                    />
                  ) : done ? (
                    <span className="text-xs font-medium text-[#a7f3ff]">
                      完成
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-[rgba(226,219,255,0.6)]">
                  {s.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
