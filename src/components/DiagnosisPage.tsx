import {
  AlertCircle,
  ArrowRight,
  Check,
  Coins,
  ListChecks,
  ScanSearch,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  buildActionPlan,
  crossInsights,
  diagnose,
  painSolutions,
  summarize,
  type DiagnosisDimension,
  type DiagnosisTone,
} from "@/core/diagnosis";
import type { ProviderProfile } from "@/types";
import { cn } from "@/lib/utils";

interface DiagnosisPageProps {
  profile: ProviderProfile;
  /** 进入推荐（权益方案）页。 */
  onContinue: () => void;
  /** 返回修改问卷。 */
  onBack: () => void;
}

const DIM_ICON: Record<DiagnosisDimension["key"], LucideIcon> = {
  acquisition: ScanSearch,
  receivables: Coins,
  pressure: TrendingUp,
  cashflow: Wallet,
};

const TONE_STYLE: Record<DiagnosisTone, { chip: string; dot: string }> = {
  good: {
    chip: "border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.12)] text-[#34D399]",
    dot: "bg-[#34D399]",
  },
  warn: {
    chip: "border-[rgba(245,166,35,0.4)] bg-[rgba(245,166,35,0.12)] text-[#F5A623]",
    dot: "bg-[#F5A623]",
  },
  risk: {
    chip: "border-[rgba(251,113,133,0.4)] bg-[rgba(251,113,133,0.12)] text-[#FB7185]",
    dot: "bg-[#FB7185]",
  },
};

export function DiagnosisPage({ profile, onContinue, onBack }: DiagnosisPageProps) {
  const dimensions = diagnose(profile);
  const overall = summarize(profile, dimensions);
  const crosses = crossInsights(profile);
  const actionPlan = buildActionPlan(profile, dimensions, crosses);
  const solutions = painSolutions(profile);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* header */}
      <section className="dow-console-panel relative overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.28), transparent)" }}
        />
        <span className="dow-eyebrow dow-eyebrow-dot">DIAGNOSIS · 经营现状诊断</span>
        <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-white sm:text-[32px]">
          {profile.companyName || "你的团队"} 的
          <span className="dow-gradient-text">经营现状诊断</span>
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[color:var(--fg-mute)] sm:text-base">
          基于你填写的经营现状，从获客、回款、经营压力和资金周转四个维度给出客观判断。诊断仅用于帮助理解现状，不构成任何承诺。
        </p>
      </section>

      {/* A · 整体结论 */}
      <section
        className="dow-glass-card relative overflow-hidden p-5 sm:p-6"
        style={{ borderColor: "rgba(139,92,246,0.35)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.3), transparent)" }}
        />
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, #6366F1, #8B5CF6 55%, #EC4899)",
              boxShadow: "0 10px 28px -10px rgba(139,92,246,0.7)",
            }}
          >
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-lg font-semibold text-white">整体结论</p>
            <p className="mt-2 text-base leading-relaxed text-[color:var(--fg-dim)] sm:text-lg">
              {overall}
            </p>
          </div>
        </div>
      </section>

      {/* B/D · 4 维度卡片 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {dimensions.map((d) => {
          const Icon = DIM_ICON[d.key];
          const tone = TONE_STYLE[d.tone];
          const expanded = d.tone !== "good" && (d.meaning || (d.actions && d.actions.length));
          return (
            <div key={d.key} className="dow-glass-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(99,102,241,0.28), rgba(139,92,246,0.28), rgba(236,72,153,0.24))",
                      border: "1px solid rgba(139,92,246,0.28)",
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-lg font-semibold text-white">{d.title}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium",
                    tone.chip
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                  {d.tag}
                </span>
              </div>

              {expanded ? (
                <div className="mt-3 space-y-3">
                  <DimSection label="现状" body={d.insight} />
                  {d.meaning ? <DimSection label="意味着" body={d.meaning} /> : null}
                  {d.actions && d.actions.length ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--fg-faint)]">
                        建议这么做
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {d.actions.map((a, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-relaxed text-[color:var(--fg-dim)]">
                            <span className="mt-0.5 font-mono text-xs text-[color:var(--violet)]">{i + 1}.</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--fg-dim)]">{d.insight}</p>
              )}

              {d.metrics && d.metrics.length ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[color:var(--border)] pt-3">
                  {d.metrics.map((m) => (
                    <span
                      key={m.label}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border-2)] bg-[color:var(--bg-3)] px-2.5 py-1 text-xs text-[color:var(--fg-mute)]"
                    >
                      {m.label}
                      <b className="font-mono font-semibold text-[color:var(--fg)]">{m.value}</b>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* E · 交叉洞察 */}
      {crosses.length ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#F5A623]" />
            <span className="text-[15px] font-semibold text-white">交叉洞察 · 信号叠加</span>
          </div>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            {crosses.map((c) => {
              const tone = TONE_STYLE[c.tone];
              return (
                <div
                  key={c.id}
                  className="dow-glass-card relative overflow-hidden p-5"
                  style={{
                    borderColor:
                      c.tone === "risk" ? "rgba(251,113,133,0.45)" : "rgba(245,166,35,0.45)",
                  }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full opacity-40 blur-3xl"
                    style={{
                      background:
                        c.tone === "risk"
                          ? "radial-gradient(closest-side, rgba(251,113,133,0.4), transparent)"
                          : "radial-gradient(closest-side, rgba(245,166,35,0.4), transparent)",
                    }}
                  />
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg border",
                        tone.chip
                      )}
                    >
                      <Zap className="h-4 w-4" />
                    </span>
                    <p className="text-[15px] font-semibold text-white">{c.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--fg-dim)]">{c.body}</p>
                  <p className="mt-3 flex gap-2 border-t border-[color:var(--border)] pt-3 text-sm leading-relaxed text-white">
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#F5A623]" />
                    <span>{c.action}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 行动优先级清单 */}
      {actionPlan.length ? (
        <section className="dow-glass-card p-5 sm:p-6" style={{ borderColor: "rgba(139,92,246,0.32)" }}>
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-[color:var(--violet)]" />
            <span className="text-[15px] font-semibold text-white">建议的行动优先级</span>
          </div>
          <ol className="mt-4 space-y-2.5">
            {actionPlan.map((item, i) => {
              const tone = TONE_STYLE[item.tone];
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-2)] p-3.5"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6 55%, #EC4899)" }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-[color:var(--fg-dim)]">{item.text}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 self-start rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      tone.chip
                    )}
                  >
                    {item.timing}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {/* 开放题回显（如有） */}
      {profile.openConcern ? (
        <div className="dow-glass-card p-5">
          <span className="text-[15px] font-semibold text-white">你的原话</span>
          <p className="mt-2 border-l-2 border-[color:var(--border-2)] pl-3 text-sm italic leading-relaxed text-[color:var(--fg-dim)]">
            “{profile.openConcern}”
          </p>
        </div>
      ) : null}

      {/* A · 痛点 → 方案方向 过渡卡 */}
      <section className="dow-glass-card p-5 sm:p-6" style={{ borderColor: "rgba(139,92,246,0.32)" }}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[color:var(--violet)]" />
          <span className="text-lg font-semibold text-white">针对你的问题，我们准备了这些方向</span>
        </div>
        {solutions.length ? (
          <>
            <p className="mt-1.5 text-sm text-[color:var(--fg-mute)]">
              下面把诊断出的问题，对应到可以发力的方向——具体能力与方案在下一步展开。
            </p>
            <div className="mt-4 space-y-2.5">
              {solutions.map((s) => (
                <div
                  key={s.key}
                  className="flex flex-col gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-2)] p-3.5 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[rgba(251,113,133,0.14)] text-[#FB7185]">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm text-[color:var(--fg-dim)]">{s.problem}</span>
                  </div>
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-[color:var(--fg-faint)] sm:block" />
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[rgba(52,211,153,0.14)] text-[#34D399]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-medium text-white">{s.direction}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--fg-dim)]">
            当前经营较为稳健，没有突出风险。下一步可以看看能锦上添花的权益，按需取舍即可。
          </p>
        )}
      </section>

      {/* CTA */}
      <div className="dow-glass-card flex flex-col items-start justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
        <p className="text-sm text-[color:var(--fg-mute)]">
          {solutions.length
            ? "对症的方向已理清，下一步看看每个方向对应的具体权益。"
            : "下一步看看有哪些能锦上添花的权益。"}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="darkOutline" size="md" onClick={onBack}>
            返回修改
          </Button>
          <Button variant="gradient" size="md" onClick={onContinue}>
            查看适合你的权益方案
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DimSection({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--fg-faint)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm leading-relaxed text-[color:var(--fg-dim)]">{body}</p>
    </div>
  );
}
