import { PROVIDER_TYPES, GOALS } from "@/schema/questionnaireSchema";
import type {
  ProviderProfile,
  RecommendationPlan,
} from "@/types";
import { formatCNYShort } from "@/lib/utils";

/**
 * Agent Narrator —— 把推荐结果翻译成自然语言。
 *
 * 当前实现: 基于模板拼接 (deterministic, 可单测)。
 * 未来替换为 LLM 时:
 *   - 函数签名保持不变: (profile, plan) => string
 *   - prompt 输入 = profile + plan.items (含 reasons)
 *   - 调用方 (recommender.ts) 不需要任何修改
 */

export function generateNarrative(
  profile: ProviderProfile,
  plan: RecommendationPlan
): string {
  const providerLabel =
    PROVIDER_TYPES.find((p) => p.value === profile.providerType)?.label ??
    "服务商";
  const goalLabels = profile.goals
    .map((g) => GOALS.find((opt) => opt.value === g)?.label)
    .filter(Boolean)
    .slice(0, 3);

  const paidItems = plan.items.filter(
    (i) => i.priority !== "gift" && i.priority !== "unlock"
  );
  const giftCount = plan.items.filter((i) => i.priority === "gift").length;
  const unlockCount = plan.items.filter((i) => i.priority === "unlock").length;

  const goalText =
    goalLabels.length > 0
      ? `当前最重要的目标包括「${goalLabels.join("、")}」`
      : "目标偏长期布局";

  const stageText = describeStage(plan, profile);

  const valueLine = `结合你的预算档位,我们为你匹配了 ${paidItems.length} 项付费权益、${unlockCount} 项满额解锁、${giftCount} 项默认赠送,合计报价约 ${formatCNYShort(
    plan.total
  )}。`;

  const closing = describeNextMove(plan);

  return [
    `${profile.companyName || "您"}作为${providerLabel},${goalText},${stageText}。`,
    valueLine,
    closing,
  ].join(" ");
}

function describeStage(
  plan: RecommendationPlan,
  profile: ProviderProfile
): string {
  const hasExclusive = plan.items.some((i) => i.benefit.category === "exclusive");
  const hasPremium = plan.items.some((i) => i.benefit.category === "premium");
  if (hasExclusive)
    return "整体方案已覆盖独家权益,定位为「平台头部生态共建合作伙伴」";
  if (hasPremium)
    return "整体方案进入「尊享层」,适合深度联合营销与大客户突破";
  if (profile.goals.includes("brand-exposure"))
    return "整体方案聚焦在品牌曝光与流量主线";
  if (
    profile.goals.includes("offer-credit") ||
    profile.offersCreditToCustomers ||
    profile.hasReceivablePressure ||
    profile.wantsCustomerInstallment
  )
    return "整体方案围绕 TermPay 账期金融能力做能力补齐";
  return "整体方案从基础获客与平台展示开始，稳步建立合作基线";
}

function describeNextMove(plan: RecommendationPlan): string {
  const items = plan.items
    .filter((i) => i.priority === "strong")
    .slice(0, 2)
    .map((i) => `「${i.benefit.name}」`)
    .join("、");
  if (items) {
    return `建议优先与商务确认 ${items},以便尽快进入执行节奏。`;
  }
  return "建议先与豆服云商务对齐开通节奏,再分阶段叠加可选增强项。";
}
