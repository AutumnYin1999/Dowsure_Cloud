import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Gift,
  Layers,
  Lock,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  Unlock,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { KNOWLEDGE_BASE } from "@/data/knowledgeBase";
import { recommend } from "@/core/recommender";
import { painLabelForBenefit, recommendationIntro } from "@/core/diagnosis";
import { cn, formatCNY, formatCNYShort } from "@/lib/utils";
import { BUDGET_BANDS, PROVIDER_TYPES } from "@/schema/questionnaireSchema";
import type {
  BenefitCategory,
  BenefitItem,
  ProviderProfile,
  RecommendedBenefit,
} from "@/types";
import { CATEGORY_META } from "./categoryMeta";
import { TermPayFlowCard } from "./TermPayFlowCard";
import { TermPayValueSection } from "./TermPayValueSection";

interface RecommendationPageProps {
  profile: ProviderProfile;
  onRestart: () => void;
  onEditQuestionnaire: () => void;
  onProfileChange: (next: ProviderProfile) => void;
  /** 确认方案并下单：把当前生效的权益 id 集合传出，跳转 checkout。 */
  onConfirmOrder: (activeBenefitIds: string[]) => void;
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

/** 解锁阈值（与 recommender / BUDGET_FLOOR 口径一致）。 */
const TIER_PREMIUM = 200_000; // ≥20 万解锁尊享
const TIER_EXCLUSIVE = 800_000; // ≥80 万赠送独家

/** 一项权益是否「随单赠送」（默认 gift 类，免费且无解锁阈值）。 */
function isGiftBenefit(b: BenefitItem): boolean {
  return b.category === "gift";
}
/** 一项权益是否「满额解锁 / 满额赠送」（价格 0 且带 unlockThreshold）。 */
function isUnlockBenefit(b: BenefitItem): boolean {
  return b.unlockThreshold != null && b.price === 0;
}
/** 是否可被用户手动勾选（付费项 + base 之外的）。base 必选、gift/unlock 自动。 */
function isManualSelectable(b: BenefitItem): boolean {
  return !b.alwaysIncluded && !isGiftBenefit(b) && !isUnlockBenefit(b);
}

export function RecommendationPage({
  profile,
  onRestart,
  onEditQuestionnaire,
  onConfirmOrder,
}: RecommendationPageProps) {
  const plan = useMemo(() => recommend(profile), [profile]);
  const intro = useMemo(() => recommendationIntro(profile), [profile]);

  /** 推荐项的元信息（理由 / 命中规则 / 优先级），按 benefitId 索引。 */
  const recMap = useMemo(() => {
    const m = new Map<string, RecommendedBenefit>();
    for (const it of plan.items) m.set(it.benefit.id, it);
    return m;
  }, [plan.items]);

  /** Agent 默认选中集 = 推荐里的付费项（required/strong/optional） + base。 */
  const defaultSelected = useMemo(() => {
    const ids = new Set<string>();
    for (const b of KNOWLEDGE_BASE) {
      if (b.alwaysIncluded) ids.add(b.id); // base 必选
    }
    for (const it of plan.items) {
      if (it.priority === "required" || it.priority === "strong" || it.priority === "optional") {
        if (isManualSelectable(it.benefit) || it.benefit.alwaysIncluded) {
          ids.add(it.benefit.id);
        }
      }
    }
    return ids;
  }, [plan.items]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(defaultSelected));
  const [showFullList, setShowFullList] = useState(true);

  /** 付费项小计（排除 gift / unlock / 0 价）。 */
  const paidSubtotal = useMemo(() => {
    let sum = 0;
    for (const b of KNOWLEDGE_BASE) {
      if (!selectedIds.has(b.id)) continue;
      if (isGiftBenefit(b) || isUnlockBenefit(b)) continue;
      sum += b.price; // 工作台按单数量计价
    }
    return sum;
  }, [selectedIds]);

  const premiumUnlocked = paidSubtotal >= TIER_PREMIUM;
  const exclusiveUnlocked = paidSubtotal >= TIER_EXCLUSIVE;

  /** 当前生效的赠送 / 解锁项（用于展示「已解锁/已赠送」）。 */
  function isBenefitActive(b: BenefitItem): boolean {
    if (b.alwaysIncluded) return true;
    if (isGiftBenefit(b)) return true; // 随单赠送
    if (isUnlockBenefit(b)) {
      return paidSubtotal >= (b.unlockThreshold ?? Infinity);
    }
    return selectedIds.has(b.id);
  }

  const toggle = (b: BenefitItem) => {
    if (!isManualSelectable(b)) return; // base/gift/unlock 不可手动
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(b.id)) next.delete(b.id);
      else next.add(b.id);
      return next;
    });
  };

  const restoreRecommended = () => {
    setSelectedIds(new Set(defaultSelected));
    showToast("已恢复 Agent 推荐方案");
  };

  /** 收集当前「生效」的权益 id（选中付费项 + 必选 + 随单赠送 + 已解锁），交给 checkout。 */
  const confirmOrder = () => {
    const ids = KNOWLEDGE_BASE.filter((b) => isBenefitActive(b)).map((b) => b.id);
    onConfirmOrder(ids);
  };

  // 计数
  const paidSelectedCount = KNOWLEDGE_BASE.filter(
    (b) => selectedIds.has(b.id) && !isGiftBenefit(b) && !isUnlockBenefit(b)
  ).length;
  const giftActiveCount = KNOWLEDGE_BASE.filter((b) => isGiftBenefit(b)).length;
  const unlockActiveCount = KNOWLEDGE_BASE.filter(
    (b) => isUnlockBenefit(b) && isBenefitActive(b)
  ).length;

  const termPayReasons = useMemo(
    () => buildTermPayReasons(profile, plan.items),
    [profile, plan.items]
  );

  // TermPay 两张解释卡片暂隐藏，让权益工作台直接顶上来；改 true 可恢复。
  const SHOW_TERMPAY_CARDS = false;

  const handleCopy = async () => {
    const text = buildSummaryText(profile, paidSubtotal, KNOWLEDGE_BASE.filter((b) => isBenefitActive(b)), recMap);
    try {
      await navigator.clipboard.writeText(text);
      showToast("方案摘要已复制到剪贴板");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        showToast("方案摘要已复制");
      } catch {
        showToast("复制失败，请手动选择文字");
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const providerLabel =
    PROVIDER_TYPES.find((p) => p.value === profile.providerType)?.label ?? "服务商";
  const budgetLabel = BUDGET_BANDS.find((b) => b.value === profile.budget)?.label ?? "";

  // 进度条：到下一档
  const nextTier = !premiumUnlocked
    ? { name: "尊享权益", target: TIER_PREMIUM }
    : !exclusiveUnlocked
    ? { name: "独家赠送", target: TIER_EXCLUSIVE }
    : null;
  const gapToNext = nextTier ? Math.max(0, nextTier.target - paidSubtotal) : 0;
  const progressPct = nextTier
    ? Math.min(100, (paidSubtotal / nextTier.target) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="dow-console-panel relative overflow-hidden p-6 sm:p-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full opacity-55 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.35), transparent)" }}
        />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-10">
          <div className="space-y-5 animate-fade-up">
            <span className="dow-eyebrow dow-eyebrow-dot">AGENT RECOMMENDATION · 方案工作台</span>
            <h2 className="font-display text-balance text-[32px] font-black leading-[1.08] tracking-tight text-white sm:text-[40px] lg:text-[44px]">
              为「
              <span className="dow-gradient-text">{profile.companyName || "您的服务商"}</span>
              」定制的
              <br />
              <span className="dow-gradient-text">{plan.name}</span>
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-[color:var(--fg-dim)] sm:text-lg">
              {plan.tagline}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <MetaChip>{providerLabel}</MetaChip>
              <MetaChip>预算 · {budgetLabel}</MetaChip>
              <MetaChip tone="emerald">
                <Gift className="h-3 w-3" />含 {giftActiveCount} 项赠送
              </MetaChip>
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-2)" }}
            >
              <span className="text-sm font-semibold text-white">回应你的诊断</span>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--fg-dim)] sm:text-base">
                {intro}
              </p>
              <p className="mt-2.5 border-t border-[color:var(--border)] pt-2.5 text-sm leading-relaxed text-[color:var(--fg-mute)]">
                {plan.narrative}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button variant="darkOutline" size="md" onClick={restoreRecommended}>
                <RotateCcw className="h-4 w-4" />
                恢复 Agent 推荐
              </Button>
              <Button variant="darkOutline" size="md" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                复制方案摘要
              </Button>
              <Button variant="darkGhost" size="md" onClick={onEditQuestionnaire}>
                修改问卷
              </Button>
              <Button variant="darkGhost" size="md" onClick={onRestart}>
                重新开始
              </Button>
            </div>
          </div>

          {/* 右：方案小计 + 解锁进度（sticky） */}
          <div className="lg:sticky lg:top-20">
            <CartSummary
              paidSubtotal={paidSubtotal}
              paidSelectedCount={paidSelectedCount}
              giftCount={giftActiveCount}
              unlockCount={unlockActiveCount}
              premiumUnlocked={premiumUnlocked}
              exclusiveUnlocked={exclusiveUnlocked}
              nextTier={nextTier}
              gapToNext={gapToNext}
              progressPct={progressPct}
              onConfirmOrder={confirmOrder}
            />
          </div>
        </div>
      </section>

      {/* TermPay 解释卡片：暂隐藏，让权益工作台直接顶上来（SHOW_TERMPAY_CARDS=true 可恢复） */}
      {SHOW_TERMPAY_CARDS ? (
        <>
          <TermPayValueSection profile={profile} reasons={termPayReasons} />
          <TermPayFlowCard />
        </>
      ) : null}

      {/* 权益工作台 */}
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
              style={{ background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "#C4B5FD" }}
            >
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-semibold text-white">权益工作台 · 自由增减</span>
              <p className="mt-0.5 text-xs text-[color:var(--fg-mute)]">
                共 {KNOWLEDGE_BASE.length} 项权益 · 勾选即加入方案，实时计价
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[color:var(--fg-mute)] transition-transform",
              showFullList && "rotate-180"
            )}
          />
        </button>

        {showFullList ? (
          <div className="dow-divider space-y-6 px-5 py-6 sm:px-6">
            {CATEGORY_GROUP_ORDER.map((cat) => {
              const items = KNOWLEDGE_BASE.filter((b) => b.category === cat);
              if (items.length === 0) return null;
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              return (
                <section key={cat} className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(99,102,241,0.28), rgba(139,92,246,0.28), rgba(236,72,153,0.24))",
                        border: "1px solid rgba(139,92,246,0.28)",
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                        {meta.label}
                      </h3>
                      <p className="text-[11px] text-[color:var(--fg-faint)]">{meta.subtitle}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
                    {items.map((b) => (
                      <WorktableCard
                        key={b.id}
                        benefit={b}
                        rec={recMap.get(b.id)}
                        painLabel={recMap.has(b.id) ? painLabelForBenefit(profile, b.id) : null}
                        selected={selectedIds.has(b.id)}
                        active={isBenefitActive(b)}
                        onToggle={() => toggle(b)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* 底部下单 CTA */}
      <section className="dow-console-panel relative overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-45 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.3), transparent)" }}
        />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-base font-semibold text-white sm:text-lg">
              已选 {paidSelectedCount} 项付费权益 · 小计 {formatCNY(paidSubtotal)}
            </span>
            <p className="mt-1 text-xs text-[color:var(--fg-mute)] sm:text-sm">
              Dowsure 提供技术、数据、风控与连接能力；TermPay 的资金与最终授信审批由合作银行 / 资金方承担。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="darkOutline" size="md" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              复制摘要
            </Button>
            <Button variant="gradient" size="md" onClick={confirmOrder}>
              <ShoppingCart className="h-4 w-4" />
              确认方案并下单
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────── 方案小计 + 解锁进度 ───────────────────────

function CartSummary({
  paidSubtotal,
  paidSelectedCount,
  giftCount,
  unlockCount,
  premiumUnlocked,
  exclusiveUnlocked,
  nextTier,
  gapToNext,
  progressPct,
  onConfirmOrder,
}: {
  paidSubtotal: number;
  paidSelectedCount: number;
  giftCount: number;
  unlockCount: number;
  premiumUnlocked: boolean;
  exclusiveUnlocked: boolean;
  nextTier: { name: string; target: number } | null;
  gapToNext: number;
  progressPct: number;
  onConfirmOrder: () => void;
}) {
  return (
    <div className="dow-glass-card space-y-4 p-5">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ background: "var(--grad)", boxShadow: "0 10px 26px -10px rgba(139,92,246,0.6)" }}
        >
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-[color:var(--fg-mute)]">方案小计（付费项）</p>
          <p className="font-display text-[30px] font-black leading-none">
            <span className="dow-gradient-text">{formatCNYShort(paidSubtotal)}</span>
          </p>
        </div>
      </div>
      <p className="text-xs text-[color:var(--fg-faint)]">完整报价 {formatCNY(paidSubtotal)}</p>

      <div className="grid grid-cols-3 gap-2 border-t border-[color:var(--border)] pt-3 text-center">
        <SummaryStat value={paidSelectedCount} label="付费项" />
        <SummaryStat value={giftCount} label="随单赠送" />
        <SummaryStat value={unlockCount} label="已解锁" />
      </div>

      {/* 解锁进度 */}
      <div className="border-t border-[color:var(--border)] pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-white">解锁进度</span>
          {nextTier ? (
            <span className="text-[color:var(--fg-mute)]">
              距{nextTier.name}还差 <b className="text-[#F5A623]">{formatCNYShort(gapToNext)}</b>
            </span>
          ) : (
            <span className="text-[#34D399]">全部档位已解锁</span>
          )}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--bg-3)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: "var(--grad)" }}
          />
        </div>
        <div className="mt-2.5 space-y-1.5">
          <TierRow label="满 20 万 · 解锁尊享权益" unlocked={premiumUnlocked} />
          <TierRow label="满 80 万 · 赠送独家权益" unlocked={exclusiveUnlocked} />
        </div>
      </div>

      <Button variant="gradient" size="md" onClick={onConfirmOrder} className="!w-full">
        <ShoppingCart className="h-4 w-4" />
        确认方案并下单
      </Button>
    </div>
  );
}

function SummaryStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[11px] text-[color:var(--fg-faint)]">{label}</p>
    </div>
  );
}

function TierRow({ label, unlocked }: { label: string; unlocked: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full",
          unlocked ? "bg-[#34D399]/20 text-[#34D399]" : "bg-white/5 text-[color:var(--fg-faint)]"
        )}
      >
        {unlocked ? <Check className="h-3 w-3" strokeWidth={3} /> : <Lock className="h-2.5 w-2.5" />}
      </span>
      <span className={unlocked ? "text-white" : "text-[color:var(--fg-mute)]"}>{label}</span>
    </div>
  );
}

// ─────────────────────── 工作台权益卡 ───────────────────────

function WorktableCard({
  benefit,
  rec,
  painLabel,
  selected,
  active,
  onToggle,
}: {
  benefit: BenefitItem;
  rec?: RecommendedBenefit;
  painLabel?: string | null;
  selected: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isBase = !!benefit.alwaysIncluded;
  const isGift = benefit.category === "gift";
  const isUnlock = benefit.unlockThreshold != null && benefit.price === 0;
  const manual = !isBase && !isGift && !isUnlock;
  const recommended = !!rec;

  // 卡片高亮：手动选中 或 自动生效
  const highlighted = manual ? selected : active;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all sm:p-5",
        highlighted
          ? "border-[color:var(--violet)] bg-[var(--grad-soft)] shadow-[0_0_0_1px_rgba(139,92,246,0.25)]"
          : "border-[color:var(--border)] bg-[color:var(--bg-2)]"
      )}
    >
      <div className="flex items-start gap-3">
        {/* 勾选控件 */}
        <button
          type="button"
          onClick={onToggle}
          disabled={!manual}
          aria-pressed={highlighted}
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all",
            highlighted
              ? "border-transparent bg-[var(--grad)] text-white"
              : "border-[color:var(--border-2)] bg-[color:var(--bg-3)] text-transparent",
            manual ? "cursor-pointer" : "cursor-default"
          )}
          title={
            isBase ? "基础包必选" : isGift ? "随单赠送" : isUnlock ? "满额自动解锁" : "点击加入 / 移除"
          }
        >
          {isBase || isGift ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : isUnlock ? (
            active ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />
          ) : highlighted ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-[15px] font-semibold tracking-tight text-white sm:text-base">
              {benefit.name}
            </h4>
            {recommended ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: "rgba(139,92,246,0.18)",
                  border: "1px solid rgba(139,92,246,0.45)",
                  color: "#d6c2ff",
                }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                Agent 推荐
              </span>
            ) : null}
            {recommended && painLabel ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.32)",
                  color: "#6ee7b7",
                }}
              >
                ↳ 针对：{painLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--fg-mute)] sm:text-sm">
            {benefit.summary}
          </p>
          {/* 状态 / 价格 */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {isBase ? (
              <StatusChip tone="violet" label="基础包 · 必选" />
            ) : isGift ? (
              <StatusChip tone="emerald" label="随单赠送" icon={Gift} />
            ) : isUnlock ? (
              <StatusChip
                tone={active ? "emerald" : "gold"}
                label={active ? "已解锁 / 已赠送" : `满 ${formatCNYShort(benefit.unlockThreshold ?? 0)}解锁`}
                icon={active ? Unlock : Lock}
              />
            ) : (
              <span className="font-display text-base font-bold">
                <span className="dow-gradient-text">{formatCNY(benefit.price)}</span>
                {benefit.unit ? (
                  <span className="ml-1 text-[11px] font-normal text-[color:var(--fg-faint)]">
                    {benefit.unit}
                  </span>
                ) : null}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 推荐理由 / 详情，可展开 */}
      <div className="mt-3 border-t border-[color:var(--border)] pt-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2 text-xs font-medium text-[#C4B5FD]">
            <Sparkles className="h-3.5 w-3.5" />
            {recommended ? "为什么推荐？" : "权益详情"}
            {recommended ? (
              <span className="ml-1 text-[color:var(--fg-faint)]">
                · 命中 {rec!.matchedRules.length} 条规则
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[color:var(--fg-faint)] transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
        {open ? (
          <div className="mt-3 animate-fade-in space-y-3">
            {recommended && rec!.reasons.length ? (
              <ul className="space-y-1.5">
                {rec!.reasons.map((reason, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs leading-relaxed text-[color:var(--fg-dim)]"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#34D399]" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p
              className="rounded-xl px-3 py-2.5 text-xs leading-relaxed text-[color:var(--fg-mute)]"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
            >
              {benefit.description}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusChip({
  tone,
  label,
  icon: Icon,
}: {
  tone: "violet" | "emerald" | "gold";
  label: string;
  icon?: LucideIcon;
}) {
  const styles: React.CSSProperties =
    tone === "emerald"
      ? { background: "rgba(52,211,153,0.12)", borderColor: "rgba(52,211,153,0.4)", color: "#6ee7b7" }
      : tone === "gold"
      ? { background: "rgba(245,166,35,0.12)", borderColor: "rgba(245,166,35,0.4)", color: "#ffd187" }
      : { background: "rgba(139,92,246,0.16)", borderColor: "rgba(139,92,246,0.45)", color: "#d6c2ff" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
      style={styles}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {label}
    </span>
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
      ? { background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.4)", color: "#6ee7b7" }
      : tone === "gold"
      ? { background: "rgba(245,166,35,0.12)", borderColor: "rgba(245,166,35,0.4)", color: "#ffd187" }
      : { background: "rgba(255,255,255,0.05)", borderColor: "var(--border-2)", color: "var(--fg-dim)" };
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

function buildTermPayReasons(
  profile: ProviderProfile,
  items: RecommendedBenefit[]
): string[] {
  const reasons: string[] = [];
  if (profile.wantsCustomerInstallment)
    reasons.push("你的客户对延期 / 分期付款有明确需求，TermPay 直接覆盖这一场景");
  if (profile.offersCreditToCustomers)
    reasons.push("你目前已在给客户提供账期 / 月结，可以由 TermPay 替你结算到账");
  if (profile.hasReceivablePressure)
    reasons.push("你存在应收账款 / 回款慢的压力，TermPay 可让资金方直接打款到你账户");
  if (profile.hasEmbeddableSystem)
    reasons.push("你希望把 TermPay 嵌入自有官网 / ERP / 客户后台 / 公众号，命中嵌入式接入端口");
  if (profile.goals.includes("offer-credit") || profile.goals.includes("reduce-bad-debt"))
    reasons.push("你勾选了账期 / 坏账相关目标，TermPay 账期风控模型可同步上线");
  if (
    items.some((i) => i.benefit.id === "value-embed-finance" || i.benefit.id === "value-risk-model")
  ) {
    if (reasons.length === 0)
      reasons.push("推荐方案中已包含 TermPay 接入端口或风控模型，可直接进入技术联调");
  }
  return reasons.slice(0, 4);
}

function buildSummaryText(
  profile: ProviderProfile,
  paidSubtotal: number,
  activeBenefits: BenefitItem[],
  recMap: Map<string, RecommendedBenefit>
): string {
  const lines = [
    "==== 豆服云 · TermPay 服务商增长引擎 方案摘要 ====",
    `类型: ${PROVIDER_TYPES.find((p) => p.value === profile.providerType)?.label ?? "服务商"}`,
    `预算档位: ${BUDGET_BANDS.find((b) => b.value === profile.budget)?.label ?? "—"}`,
    `付费小计: ${formatCNY(paidSubtotal)}`,
    "",
    "当前选中权益:",
  ];
  for (const b of activeBenefits) {
    const isFree = b.category === "gift" || (b.unlockThreshold != null && b.price === 0);
    const tag = b.alwaysIncluded
      ? "[必选]"
      : b.category === "gift"
      ? "[赠送]"
      : isFree
      ? "[满额解锁]"
      : recMap.has(b.id)
      ? "[Agent 推荐]"
      : "[自选]";
    const price = isFree ? "—" : formatCNY(b.price);
    lines.push(`${tag} ${b.name}  ${price}`);
  }
  lines.push("");
  lines.push("(本方案由服务商在工作台自选生成 · demo 版)");
  lines.push(
    "合规说明: Dowsure 提供技术、数据、风控与连接能力; TermPay 的资金与最终授信审批由合作银行 / 资金方承担。"
  );
  return lines.join("\n");
}
