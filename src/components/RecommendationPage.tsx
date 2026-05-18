import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Copy,
  Gift,
  ImagePlus,
  Layers,
  PhoneCall,
  Plug,
  RefreshCcw,
  RotateCcw,
  Unlock,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
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

  const grouped = useMemo(() => groupByCategory(plan.items), [plan.items]);
  const paidCount = plan.items.filter(
    (i) => i.priority !== "gift" && i.priority !== "unlock"
  ).length;
  const giftCount = plan.items.filter((i) => i.priority === "gift").length;
  const unlockCount = plan.items.filter((i) => i.priority === "unlock").length;

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
        showToast("复制失败,请手动选择文字");
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const handleBudgetChange = (next: BudgetBand) => {
    if (next === profile.budget) return;
    onProfileChange({ ...profile, budget: next });
  };

  return (
    <div className="space-y-6">
      {/* Hero — 仿设计稿:粉色渐变 + 网格 + 大标题高亮 */}
      <section className="ds-card relative overflow-hidden border-white/60 bg-hero-grid">
        <div className="grid gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:gap-10 lg:px-12 lg:py-12">
          <div className="space-y-4 animate-fade-up">
            <span className="ds-eyebrow ds-eyebrow-dot">
              AGENT RECOMMENDATION · AI 推荐方案
            </span>
            <h2 className="font-display text-balance text-[34px] font-black leading-[1.12] tracking-tight text-ink sm:text-[44px] sm:leading-[1.1]">
              为「
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                {profile.companyName || "您的服务商"}
              </span>
              」生成的{" "}
              <span className="text-brand-600">{plan.name}</span>
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
              {plan.tagline}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge tone="brand">
                {PROVIDER_TYPES.find((p) => p.value === profile.providerType)
                  ?.label ?? "服务商"}
              </Badge>
              <Badge tone="neutral">
                预算 ·{" "}
                {BUDGET_BANDS.find((b) => b.value === profile.budget)?.label}
              </Badge>
              <Badge tone="emerald">
                <Gift className="h-3 w-3" />
                含 {giftCount} 项赠送
              </Badge>
              {unlockCount > 0 ? (
                <Badge tone="gold">
                  <Unlock className="h-3 w-3" />
                  {unlockCount} 项满额解锁
                </Badge>
              ) : null}
            </div>

            <p className="rounded-2xl border border-white/70 bg-white/70 p-4 text-base leading-relaxed text-ink/80 shadow-soft backdrop-blur sm:p-5">
              <span className="ds-eyebrow">AGENT NARRATIVE</span>
              <span className="mt-2 block">{plan.narrative}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button onClick={handleCopy} className="shadow-pop">
                <Copy className="h-4 w-4" />
                复制推荐摘要
              </Button>
              <Button variant="outline" onClick={onEditQuestionnaire}>
                <RotateCcw className="h-4 w-4" />
                修改问卷
              </Button>
              <Button variant="ghost" onClick={onRestart}>
                重新开始
              </Button>
            </div>
          </div>

          {/* 右侧 KPI 三卡 (堆叠) */}
          <div className="space-y-3 animate-fade-up">
            <KpiCard
              icon={Wallet}
              label="推荐总价"
              value={formatCNYShort(plan.total)}
              detail={`完整报价 ${formatCNY(plan.total)}`}
              accent
            />
            <KpiCard
              icon={Layers}
              label="付费权益项"
              value={String(paidCount)}
              unit="项"
              detail={`含必选 / 强推荐 / 可选`}
            />
            <KpiCard
              icon={Gift}
              label="赠送 + 满额解锁"
              value={String(giftCount + unlockCount)}
              unit="项"
              detail={`赠送 ${giftCount} · 满额解锁 ${unlockCount}`}
            />
          </div>
        </div>
      </section>

      {/* 预算切换 + 目标过滤 (合并到一张卡) */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="ds-eyebrow ds-eyebrow-dot">QUICK ADJUST · 调整重算</p>
              <p className="mt-1.5 text-sm text-ink-muted">
                切换预算或目标 chip,系统会实时重新计算推荐组合
              </p>
            </div>
            <span className="text-xs text-ink-soft">
              当前命中{" "}
              <span className="font-semibold text-brand-700">
                {plan.items.length}
              </span>{" "}
              项权益
            </span>
          </div>

          <div>
            <p className="text-xs font-medium text-ink">年度预算</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {BUDGET_BANDS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => handleBudgetChange(b.value)}
                  className={cn(
                    "ds-focus rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    profile.budget === b.value
                      ? "border-transparent bg-brand-gradient text-white shadow-pop"
                      : "border-surface-line bg-white text-ink-muted hover:border-brand-200 hover:text-ink"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-ink">你勾选的目标</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveGoal(null)}
                className={cn(
                  "ds-focus rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  activeGoal === null
                    ? "border-transparent bg-brand-600 text-white"
                    : "border-surface-line bg-white text-ink-muted hover:border-brand-200"
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
                      "ds-focus rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-surface-line bg-white text-ink-muted hover:border-brand-200"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
              {profile.goals.length === 0 ? (
                <span className="text-xs text-ink-soft">未勾选目标</span>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 分组权益清单 */}
      <div className="space-y-6">
        {CATEGORY_GROUP_ORDER.map((cat) => {
          const items = grouped.get(cat);
          if (!items || items.length === 0) return null;
          const filtered = activeGoal
            ? items.filter((it) =>
                it.reasons.some((r) => r.includes(matchGoalKeyword(activeGoal)))
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-2xl border",
                      meta.chipClass
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-brand-600 sm:text-lg">
                      {meta.label}
                    </h3>
                    <p className="text-[11px] text-ink-soft">
                      {filtered.length} 项命中 · {meta.subtitle}
                    </p>
                  </div>
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

      {/* Next steps */}
      <Card className="ds-card-soft bg-white">
        <CardHeader className="border-0 pb-0">
          <CardTitle className="flex items-center gap-2">
            <span className="ds-eyebrow ds-eyebrow-dot">NEXT STEPS</span>
            <span className="ml-1 text-base font-semibold text-ink sm:text-lg">
              下一步建议
            </span>
          </CardTitle>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plan.nextSteps.map((step) => {
            const Icon = NEXT_STEP_ICONS[step.icon] ?? CheckCircle2;
            return (
              <div
                key={step.id}
                className="flex items-start gap-3 rounded-2xl border border-surface-line p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-pop">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>

      {/* 底部 CTA */}
      <Card className="relative overflow-hidden border-0 bg-brand-gradient text-white shadow-pop">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 0%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 20% 100%, rgba(255,255,255,0.25), transparent 35%)",
          }}
        />
        <CardBody className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/85">
              READY TO LAUNCH
            </p>
            <p className="mt-1 text-lg font-semibold sm:text-xl">
              联系豆服云商务,锁定本期权益与执行节奏
            </p>
            <p className="mt-1 text-xs text-white/80">
              方案命中规则可追溯 · 支持线下复盘 · 复制摘要即可发起对接
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-white text-brand-700 shadow-soft hover:bg-brand-50"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" />
              复制摘要给商务
            </Button>
            <Button
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              onClick={onEditQuestionnaire}
            >
              <RefreshCcw className="h-4 w-4" />
              重新调整问卷
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ─────────────────────── KPI 小卡 ───────────────────────

interface KpiCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit?: string;
  detail?: string;
  accent?: boolean;
}

function KpiCard({ icon: Icon, label, value, unit, detail, accent }: KpiCardProps) {
  return (
    <div
      className={cn(
        "ds-card-soft flex items-center gap-4 p-4 backdrop-blur",
        accent ? "bg-kpi-pink" : "bg-white/90"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
          accent
            ? "bg-brand-gradient text-white shadow-pop"
            : "bg-brand-50 text-brand-600"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-ink-soft">
          {label}
        </p>
        <p className="mt-0.5 flex items-baseline gap-1 font-display text-[30px] font-black leading-none text-brand-600 sm:text-[34px]">
          {value}
          {unit ? (
            <span className="text-sm font-medium text-ink-muted">{unit}</span>
          ) : null}
        </p>
        {detail ? (
          <p className="mt-1.5 text-xs text-ink-soft">{detail}</p>
        ) : null}
      </div>
    </div>
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
  const lines = [
    "==== 豆服云 · 服务商增长引擎 推荐摘要 ====",
    `公司: ${profile.companyName}`,
    `类型: ${
      PROVIDER_TYPES.find((p) => p.value === profile.providerType)?.label
    }`,
    `目标: ${goalNames || "(未填写)"}`,
    `预算档位: ${BUDGET_BANDS.find((b) => b.value === profile.budget)?.label}`,
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
  lines.push("(本方案由豆服云 · 服务商增长引擎自动生成 · demo 版)");
  return lines.join("\n");
}
