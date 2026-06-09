import type { ProviderFacts } from "@/core/providerEconomics";
import type {
  BudgetBand,
  GoalTag,
  ProviderProfile,
  ProviderType,
} from "@/types";

/**
 * 把对话 Agent（/provider-agent）收集的轻量 facts 桥接成购物车页
 * （RecommendationPage / recommend()）需要的 ProviderProfile。
 *
 * 背景：Agent 用 ProviderFacts（聊天模型，字段对齐问卷枚举），而购物车推荐引擎
 * 吃 ProviderProfile（完整问卷模型）。两套字段重叠有限，这里做「有损映射 + 安全默认」。
 *
 * ⚠️ Agent 不收集「预算 / 目标客户层级 / 报告档 / 线下活动」等字段，这里给默认值；
 *    primaryPain（单选主诉求）映射成 recommend() 的主驱动 goals。
 *    用户进购物车后若要精修预算等，可走页面里的「编辑问卷」回到完整问卷页。
 */

/** Agent 的中文服务商类别 → ProviderType 枚举（recommend R4 等规则用）。 */
const PROVIDER_TYPE_MAP: Record<string, ProviderType> = {
  海外仓储: "overseas-warehouse",
  物流服务: "logistics",
  供应链全托管: "logistics",
  跨境收款: "fintax",
  财税合规: "fintax",
  海外营销: "marketing",
  "选品 / 软件工具": "erp-tool",
  选品工具: "erp-tool",
  软件工具: "erp-tool",
  全球开店: "other",
  知识产权: "other",
  申诉服务: "other",
  其他: "other",
};

/** primaryPain（主诉求）→ recommend() 的 goals（推荐主驱动）。 */
const PAIN_TO_GOALS: Record<string, GoalTag[]> = {
  acquisition: ["lead-gen"],
  receivables: ["offer-credit", "reduce-bad-debt"],
  cashflow: ["financing-tax", "offer-credit"],
  margin: ["lead-gen", "brand-exposure"],
  brand: ["brand-exposure"],
  compliance: ["financing-tax", "platform-resource"],
};

/** Agent 未收集预算 → 默认中间档（展示较丰满，又不触发 20 万 / 80 万解锁）。 */
const DEFAULT_BUDGET: BudgetBand = "10w-20w";

/** 把 Agent 收集到的 facts 转成购物车页可用的 ProviderProfile。 */
export function providerFactsToProfile(facts: ProviderFacts): ProviderProfile {
  const providerType =
    (facts.providerType && PROVIDER_TYPE_MAP[facts.providerType.trim()]) || "other";
  const goals =
    (facts.primaryPain && PAIN_TO_GOALS[facts.primaryPain]) || ["lead-gen"];

  // 给卖家账期 / 月结 → 命中 R4 嵌入式金融 + 风控
  const offersCreditToCustomers =
    facts.settlementMode === "monthly" ||
    facts.settlementMode === "credit" ||
    facts.settlementMode === "prepay-part" ||
    (!!facts.creditTerm && facts.creditTerm !== "none");

  const hasReceivablePressure =
    facts.primaryPain === "receivables" ||
    facts.primaryPain === "cashflow" ||
    facts.cashTightness === "tight";

  const needsFinanceServices =
    facts.primaryPain === "cashflow" ||
    facts.primaryPain === "compliance" ||
    (!!facts.financingPlan && facts.financingPlan !== "none");

  return {
    companyName: "",
    providerType,
    goals,
    customerTier: "mid-sellers",
    budget: DEFAULT_BUDGET,
    hasEmbeddableSystem: false,
    reportTier: "20",
    wantsOfflineEvents: false,
    needsFinanceServices,
    offersCreditToCustomers,
    hasReceivablePressure,
    wantsCustomerInstallment: facts.primaryPain === "receivables",
    // 透传 Agent 已采集、与问卷同名的客观字段（诊断 / 展示可复用）
    companyScale: facts.companyScale,
    creditTerm: facts.creditTerm,
    badDebt: facts.badDebt,
    receivableCycle: facts.receivableCycle,
    cashTightness: facts.cashTightness,
    financingPlan: facts.financingPlan,
  };
}
