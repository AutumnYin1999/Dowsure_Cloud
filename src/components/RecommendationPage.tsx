import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Copy,
  Gift,
  ImagePlus,
  Layers,
  PhoneCall,
  Plug,
  RefreshCcw,
  RotateCcw,
  Sliders,
  Unlock,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { recommend } from "@/core/recommender";
import { cn, formatCNY, formatCNYShort } from "@/lib/utils";
import {
  BUDGET_BANDS,
  GOALS,
  PROVIDER_TYPES,
} from "@/schema/questionnaireSchema";
import type {
  BenefitCategory,
  BudgetBand,
  ProviderProfile,
  RecommendationPlan,
  RecommendedBenefit,
} from "@/types";
import { BenefitCard } from "./BenefitCard";
import { CATEGORY_META } from "./categoryMeta";
import { TermPayFlowCard } from "./TermPayFlowCard";
import { TermPayValueSection } from "./TermPayValueSection";

interface RecommendationPageProps {
  profile: ProviderProfile;
  onRestart: () => void;
  onEditQuestionnaire: () => void;
  onProfileChange: (next: ProviderProfile) => void;
}

const CATEGORY_GROUP_ORDER: BenefitCategory[] = [
  "base",
  "growth",
  "value-added",
  "finance",
  "premium",
  "exclusive",
  "gift",
];

const NEXT_STEP_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "phone-call": PhoneCall,
  "image-plus": ImagePlus,
  "calendar-clock": CalendarClock,
  plug: Plug,
  users: Users,
};

export function RecommendationPage({
  profile,
  onRestart,
  onEditQuestionnaire,
  onProfileChange,
}: RecommendationPageProps) {
  const plan = useMemo(() => recommend(profile), [profile]);
  const [activeGoal, setActiveGoal] = useState<string | null>(null);
  const [showFullList, setShowFullList] = useState(false);
  const [showQuickAdjust, setShowQuickAdjust] = useState(false);

  const grouped = useMemo(() => groupByCategory(plan.items), [plan.items]);
  const paidCount = plan.items.filter(
    (i) => i.priority !== "gift" && i.priority !== "unlock"
  ).length;
  const giftCount = plan.items.filter((i) => i.priority === "gift").length;
  const unlockCount = plan.items.filter((i) => i.priority === "unlock").length;
  const termPayReasons = useMemo(
    () => buildTermPayReasons(profile, plan.items),
    [profile, plan.items]
  );

  const handleCopy = async () => {
    const text = buildSummaryText(profile, plan);
    try {
      await navigator.clipboard.writeText(text);
      showToast("推荐摘要已复制到剪贴板");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        showToast("推荐摘要已复制");
      } catch {
        showToast("复制失败，请手动选择文字");
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const handleBudgetChange = (next: BudgetBand) => {
    if (next === profile.budget) return;
    onProfileChange({ ...profile, budget: next });
  };

  const providerLabel =
    PROVIDER_TYPES.find((p) => p.value === profile.providerType)?.label ??
    "服务商";
  const budgetLabel =
    BUDGET_BANDS.find((b) => b.value === profile.budget)?.label ?? "";

  return (
    <div className="space-y-6">
      {/* HERO —— Recommendation Console */}
      <section className="dow-console-panel relative overflow-hidden p-6 sm:p-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full opacity-55 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,87,255,0.4), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(91,135,255,0.35), transparent)",
          }}
        />

        <div className="relative grid gap-8 lg:grid-cols-[1.45fr_1fr] lg:items-start lg:gap-10">
          {/* 左 */}
          <div className="space-y-5 animate-fade-up">
            <span className="dow-eyebrow dow-eyebrow-dot">
              AGENT RECOMMENDATION · TERMPAY BRIEFING
            </span>
            <h2 className="font-display text-balance text-[32px] font-black leading-[1.08] tracking-tight text-white sm:text-[40px] lg:text-[44px]">
              为「
              <span className="dow-gradient-text">
                {profile.companyName || "您的服务商"}
              </span>
              」生成的
              <br />
              <span className="dow-gradient-text">{plan.name}</span>
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-[rgba(226,219,255,0.78)] sm:text-lg">
              {plan.tagline}
            </p>

            {/* meta chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <MetaChip>{providerLabel}</MetaChip>
              <MetaChip>预算 · {budgetLabel}</MetaChip>
              <MetaChip tone="emerald">
                <Gift className="h-3 w-3" />
                含 {giftCount} 项赠送
              </MetaChip>
              {unlockCount > 0 ? (
                <MetaChip tone="gold">
                  <Unlock className="h-3 w-3" />
                  {unlockCount} 项满额解锁
                </MetaChip>
              ) : null}
            </div>

            {/* Agent narrative —— 暗色玻璃面板 */}
            <div
              className="rounded-2xl p-4 sm:p-5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(180,150,255,0.2)",
              }}
            >
              <span className="dow-eyebrow">AGENT NARRATIVE</span>
              <p className="mt-2 text-sm leading-relaxed text-[rgba(226,219,255,0.85)] sm:text-base">
                {plan.narrative}
              </p>
            </div>

            {/* 主操作 */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button variant="gradient" size="md" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                复制推荐摘要
              </Button>
              <Button
                variant="darkOutline"
                size="md"
                onClick={onEditQuestionnaire}
              >
                <RotateCcw className="h-4 w-4" />
                修改问卷
              </Button>
              <Button variant="darkGhost" size="md" onClick={onRestart}>
                重新开始
              </Button>
            </div>
          </div>

          {/* 右 —— 深色 KPI */}
          <div className="space-y-3 animate-fade-up">
            <DarkKpiCard
              icon={Wallet}
              label="推荐总价"
              value={formatCNYShort(plan.total)}
              detail={`完整报价 ${formatCNY(plan.total)}`}
              accent
            />
            <DarkKpiCard
              icon={Layers}
              label="付费权益项"
              value={String(paidCount)}
              unit="项"
              detail="含必选 / 强推荐 / 可选"
            />
            <DarkKpiCard
              icon={Gift}
              label="赠送 + 满额解锁"
              value={String(giftCount + unlockCount)}
              unit="项"
              detail={`赠送 ${giftCount} · 满额解锁 ${unlockCount}`}
            />
          </div>
        </div>
      </section>

      {/* TermPay 重点模块 */}
      <TermPayValueSection profile={profile} reasons={termPayReasons} />

      {/* TermPay 资金流 */}
      <TermPayFlowCard />

      {/* Quick Adjust —— 可折叠暗色卡 */}
      <section className="dow-glass-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowQuickAdjust((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.04] sm:px-6"
          aria-expanded={showQuickAdjust}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "rgba(34,211,238,0.12)",
                border: "1px solid rgba(34,211,238,0.32)",
                color: "#a7f3ff",
              }}
            >
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <span className="dow-eyebrow">QUICK ADJUST</span>
              <p className="mt-1 text-base font-semibold text-white">
                调整预算 / 目标，实时重算
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-[rgba(226,219,255,0.6)]">
            <span className="hidden sm:inline">
              当前命中{" "}
              <span className="font-semibold text-white">
                {plan.items.length}
              </span>{" "}
              项
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showQuickAdjust && "rotate-180"
              )}
            />
          </div>
        </button>

        {showQuickAdjust ? (
          <div className="dow-divider space-y-4 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-medium text-[rgba(226,219,255,0.85)]">
                年度预算
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BUDGET_BANDS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => handleBudgetChange(b.value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                      profile.budget === b.value
                        ? "text-white shadow-[0_10px_24px_-10px_rgba(167,87,255,0.6)] [background:linear-gradient(120deg,#ff5bb0,#a757ff_50%,#5b87ff)]"
                        : "border border-[rgba(180,150,255,0.2)] bg-white/[0.03] text-[rgba(226,219,255,0.75)] hover:border-[rgba(180,150,255,0.4)] hover:text-white"
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[rgba(226,219,255,0.85)]">
                你勾选的目标
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveGoal(null)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    activeGoal === null
                      ? "bg-white/15 text-white"
                      : "border border-[rgba(180,150,255,0.2)] bg-white/[0.03] text-[rgba(226,219,255,0.75)] hover:border-[rgba(180,150,255,0.4)]"
                  )}
                >
                  全部
                </button>
                {profile.goals.map((g) => {
                  const opt = GOALS.find((o) => o.value === g);
                  if (!opt) return null;
                  const active = activeGoal === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setActiveGoal(active ? null : g)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border border-[rgba(167,87,255,0.5)] bg-[rgba(167,87,255,0.18)] text-white"
                          : "border border-[rgba(180,150,255,0.2)] bg-white/[0.03] text-[rgba(226,219,255,0.75)] hover:border-[rgba(180,150,255,0.4)]"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                {profile.goals.length === 0 ? (
                  <span className="text-xs text-[rgba(226,219,255,0.5)]">
                    未勾选目标
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* 完整权益明细 —— 可折叠 */}
      <section className="dow-glass-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFullList((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.04] sm:px-6"
          aria-expanded={showFullList}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "rgba(167,87,255,0.14)",
                border: "1px solid rgba(167,87,255,0.35)",
                color: "#d6c2ff",
              }}
            >
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="dow-eyebrow">FULL BENEFITS</span>
              <p className="mt-1 text-base font-semibold text-white">
                查看完整权益明细
              </p>
              <p className="mt-0.5 text-xs text-[rgba(226,219,255,0.6)]">
                按类别分组 · 共 {plan.items.length} 项 · 含命中规则与可展开理由
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[rgba(226,219,255,0.6)] transition-transform",
              showFullList && "rotate-180"
            )}
          />
        </button>

        {showFullList ? (
          <div className="dow-divider space-y-6 px-5 py-6 sm:px-6">
            {CATEGORY_GROUP_ORDER.map((cat) => {
              const items = grouped.get(cat);
              if (!items || items.length === 0) return null;
              const filtered = activeGoal
                ? items.filter((it) =>
                    it.reasons.some((r) =>
                      r.includes(matchGoalKeyword(activeGoal))
                    )
                  )
                : items;
              if (filtered.length === 0) return null;
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              return (
                <section
                  key={cat}
                  className="animate-fade-up space-y-3"
                  id={`group-${cat}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-2xl text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,91,176,0.25), rgba(167,87,255,0.25), rgba(91,135,255,0.25))",
                        border: "1px solid rgba(180,150,255,0.3)",
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                        {meta.label}
                      </h3>
                      <p className="text-[11px] text-[rgba(226,219,255,0.6)]">
                        {filtered.length} 项命中 · {meta.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {filtered.map((item) => (
                      <BenefitCard key={item.benefit.id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* Next steps —— 暗色 */}
      <section className="dow-glass-card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="dow-eyebrow dow-eyebrow-dot">NEXT STEPS</span>
          <span className="text-base font-semibold text-white sm:text-lg">
            下一步建议
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plan.nextSteps.map((step) => {
            const Icon = NEXT_STEP_ICONS[step.icon] ?? CheckCircle2;
            return (
              <div
                key={step.id}
                className="flex items-start gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(180,150,255,0.18)",
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
                    boxShadow: "0 10px 26px -10px rgba(167,87,255,0.55)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[rgba(226,219,255,0.65)]">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 底部 CTA —— 暗色渐变 */}
      <section className="dow-console-panel relative overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-55 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,91,176,0.32), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full opacity-45 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(91,135,255,0.32), transparent)",
          }}
        />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="dow-eyebrow dow-eyebrow-dot">READY TO LAUNCH</span>
            <p className="mt-1.5 font-display text-lg font-bold text-white sm:text-xl">
              联系豆服云商务，锁定本期权益与{" "}
              <span className="dow-gradient-text">TermPay 接入节奏</span>
            </p>
            <p className="mt-1 text-xs text-[rgba(226,219,255,0.65)] sm:text-sm">
              方案命中规则可追溯 · 支持线下复盘 · 复制摘要即可发起对接
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="gradient" size="md" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              复制摘要给商务
            </Button>
            <Button
              variant="darkOutline"
              size="md"
              onClick={onEditQuestionnaire}
            >
              <RefreshCcw className="h-4 w-4" />
              重新调整问卷
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────── 暗色 KPI 小卡 ───────────────────────

interface DarkKpiCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit?: string;
  detail?: string;
  accent?: boolean;
}

function DarkKpiCard({
  icon: Icon,
  label,
  value,
  unit,
  detail,
  accent,
}: DarkKpiCardProps) {
  return (
    <div
      className={cn(
        "dow-glass-card flex items-center gap-4 p-4 sm:p-5",
        accent && "ring-1 ring-[rgba(167,87,255,0.4)]"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
        )}
        style={
          accent
            ? {
                background:
                  "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
                boxShadow: "0 14px 32px -10px rgba(167,87,255,0.55)",
              }
            : {
                background:
                  "linear-gradient(135deg, rgba(255,91,176,0.25), rgba(167,87,255,0.25), rgba(91,135,255,0.25))",
                border: "1px solid rgba(180,150,255,0.3)",
              }
        }
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="dow-eyebrow">{label}</p>
        <p className="mt-1 flex items-baseline gap-1 font-display text-[28px] font-black leading-none sm:text-[32px]">
          <span className="dow-gradient-text">{value}</span>
          {unit ? (
            <span className="text-sm font-medium text-[rgba(226,219,255,0.6)]">
              {unit}
            </span>
          ) : null}
        </p>
        {detail ? (
          <p className="mt-1.5 text-xs text-[rgba(226,219,255,0.6)]">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────── meta chip ───────────────────────

function MetaChip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "default" | "emerald" | "gold";
}) {
  const styles: React.CSSProperties =
    tone === "emerald"
      ? {
          background: "rgba(16,185,129,0.12)",
          borderColor: "rgba(16,185,129,0.4)",
          color: "#6ee7b7",
        }
      : tone === "gold"
        ? {
            background: "rgba(245,166,35,0.12)",
            borderColor: "rgba(245,166,35,0.4)",
            color: "#ffd187",
          }
        : {
            background: "rgba(255,255,255,0.05)",
            borderColor: "rgba(180,150,255,0.22)",
            color: "rgba(226,219,255,0.85)",
          };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
      style={styles}
    >
      {children}
    </span>
  );
}

// ─────────────────────── helpers ───────────────────────

function groupByCategory(
  items: RecommendedBenefit[]
): Map<BenefitCategory, RecommendedBenefit[]> {
  const m = new Map<BenefitCategory, RecommendedBenefit[]>();
  for (const it of items) {
    const arr = m.get(it.benefit.category) ?? [];
    arr.push(it);
    m.set(it.benefit.category, arr);
  }
  return m;
}

function buildTermPayReasons(
  profile: ProviderProfile,
  items: RecommendedBenefit[]
): string[] {
  const reasons: string[] = [];
  if (profile.wantsCustomerInstallment)
    reasons.push(
      "你的客户对延期 / 分期付款有明确需求，TermPay 直接覆盖这一场景"
    );
  if (profile.offersCreditToCustomers)
    reasons.push(
      "你目前已在给客户提供账期 / 月结，可以由 TermPay 替你结算到账"
    );
  if (profile.hasReceivablePressure)
    reasons.push(
      "你存在应收账款 / 回款慢的压力，TermPay 可让资金方直接打款到你账户"
    );
  if (profile.hasEmbeddableSystem)
    reasons.push(
      "你希望把 TermPay 嵌入自有官网 / ERP / 客户后台 / 公众号，命中嵌入式接入端口"
    );
  if (
    profile.goals.includes("offer-credit") ||
    profile.goals.includes("reduce-bad-debt")
  )
    reasons.push(
      "你勾选了账期 / 坏账相关目标，TermPay 账期风控模型可同步上线"
    );
  if (
    items.some(
      (i) =>
        i.benefit.id === "value-embed-finance" ||
        i.benefit.id === "value-risk-model"
    )
  ) {
    if (reasons.length === 0)
      reasons.push(
        "推荐方案中已包含 TermPay 接入端口或风控模型，可直接进入技术联调"
      );
  }
  return reasons.slice(0, 4);
}

function matchGoalKeyword(goal: string): string {
  const map: Record<string, string> = {
    "lead-gen": "线索",
    "reach-top-sellers": "大卖",
    "brand-exposure": "品牌曝光",
    "offer-credit": "账期",
    "reduce-bad-debt": "坏账",
    "platform-resource": "平台资源",
    "financing-tax": "融资",
    "hk-services": "香港",
  };
  return map[goal] ?? "";
}

function buildSummaryText(
  profile: ProviderProfile,
  plan: RecommendationPlan
): string {
  const goalNames = profile.goals
    .map((g) => GOALS.find((o) => o.value === g)?.label)
    .filter(Boolean)
    .join("、");
  const termPayFlags: string[] = [];
  if (profile.offersCreditToCustomers) termPayFlags.push("给客户提供账期");
  if (profile.hasReceivablePressure) termPayFlags.push("存在应收账款压力");
  if (profile.wantsCustomerInstallment)
    termPayFlags.push("希望客户分期 / 延期");
  if (profile.hasEmbeddableSystem) termPayFlags.push("希望嵌入自有系统");
  const lines = [
    "==== 豆服云 · TermPay 服务商增长引擎 推荐摘要 ====",
    `公司: ${profile.companyName}`,
    `类型: ${
      PROVIDER_TYPES.find((p) => p.value === profile.providerType)?.label
    }`,
    `目标: ${goalNames || "(未填写)"}`,
    `预算档位: ${BUDGET_BANDS.find((b) => b.value === profile.budget)?.label}`,
    `TermPay 适配: ${
      termPayFlags.length > 0 ? termPayFlags.join("、") : "(未触发)"
    }`,
    "",
    `方案: ${plan.name} —— ${plan.tagline}`,
    `总价: ${formatCNY(plan.total)}`,
    "",
    plan.narrative,
    "",
    "推荐权益:",
  ];
  for (const it of plan.items) {
    const priLabel =
      it.priority === "required"
        ? "[必选]"
        : it.priority === "strong"
          ? "[强推荐]"
          : it.priority === "optional"
            ? "[可选]"
            : it.priority === "unlock"
              ? "[满额解锁]"
              : "[赠送]";
    const isFree = it.priority === "gift" || it.priority === "unlock";
    const qty = it.quantity ?? 1;
    const price = isFree ? "—" : formatCNY(it.benefit.price * qty);
    lines.push(
      `${priLabel} ${it.benefit.name}  ${price}${qty > 1 ? `  × ${qty}` : ""}`
    );
    if (it.reasons.length) {
      lines.push(`    理由: ${it.reasons.join(";")}`);
    }
  }
  lines.push("");
  lines.push("下一步建议:");
  for (const ns of plan.nextSteps) {
    lines.push(`- ${ns.title}: ${ns.description}`);
  }
  lines.push("");
  lines.push(
    "(本方案由豆服云 · TermPay 服务商增长引擎自动生成 · demo 版)"
  );
  lines.push(
    "合规说明: Dowsure 提供技术、数据、风控与连接能力; TermPay 的资金与最终授信审批由合作银行 / 资金方承担。"
  );
  return lines.join("\n");
}
