import type {
  BudgetBand,
  CustomerTier,
  GoalTag,
  ProviderType,
  ReportTier,
} from "@/types";

/**
 * 问卷字段 schema —— 以「字段 + 选项 + 文案」为单位描述，
 * 让组件层只负责渲染，不掌握业务知识。
 */

export interface OptionDef<V extends string> {
  value: V;
  label: string;
  hint?: string;
}

export const PROVIDER_TYPES: OptionDef<ProviderType>[] = [
  { value: "logistics", label: "物流服务商", hint: "跨境头程 / 尾程 / 转运" },
  { value: "overseas-warehouse", label: "海外仓", hint: "美 / 欧 / 东南亚仓" },
  { value: "erp-tool", label: "ERP / 工具服务商", hint: "SaaS、运营工具" },
  { value: "marketing", label: "广告 / 营销服务商", hint: "广告投放、红人内容" },
  { value: "fintax", label: "财税 / 合规服务商", hint: "记账、税务、合规" },
  { value: "other", label: "其他服务商", hint: "请在备注中说明" },
];

export const GOALS: OptionDef<GoalTag>[] = [
  { value: "lead-gen", label: "获取更多卖家线索" },
  { value: "reach-top-sellers", label: "触达大卖 / T0 / T1 客户" },
  { value: "brand-exposure", label: "提升品牌曝光" },
  { value: "offer-credit", label: "给客户提供账期 / 金融能力" },
  { value: "reduce-bad-debt", label: "降低坏账风险" },
  { value: "platform-resource", label: "获取平台资源对接" },
  { value: "financing-tax", label: "融资 / 财税优化" },
  { value: "hk-services", label: "香港资源 / 开户 / 跨境服务" },
];

export const CUSTOMER_TIERS: OptionDef<CustomerTier>[] = [
  { value: "new-sellers", label: "新卖家为主" },
  { value: "mid-sellers", label: "腰部卖家为主" },
  { value: "billion-sellers", label: "亿级卖家为主" },
  { value: "t0-t1", label: "T0 / T1 大卖为主" },
];

export const BUDGET_BANDS: OptionDef<BudgetBand>[] = [
  { value: "lt-3w", label: "3 万以内" },
  { value: "3w-10w", label: "3 - 10 万" },
  { value: "10w-20w", label: "10 - 20 万" },
  { value: "20w-50w", label: "20 - 50 万" },
  { value: "50w-80w", label: "50 - 80 万" },
  { value: "gte-80w", label: "80 万以上" },
];

export const REPORT_TIERS: OptionDef<ReportTier>[] = [
  { value: "20", label: "20 份 (启航版)", hint: "基础包内含" },
  { value: "80", label: "80 份 (跃升版)" },
  {
    value: "120-plus",
    label: "120 份及线下深度营销 (领航版)",
    hint: "需选购满 20 万解锁",
  },
];

/** 预算上限映射 (元)。用于推荐时硬约束。 */
export const BUDGET_CAP: Record<BudgetBand, number> = {
  "lt-3w": 30_000,
  "3w-10w": 100_000,
  "10w-20w": 200_000,
  "20w-50w": 500_000,
  "50w-80w": 800_000,
  "gte-80w": 5_000_000,
};

/** 预算下限,用于「升级尊享」「独家权益」是否解锁的判断。 */
export const BUDGET_FLOOR: Record<BudgetBand, number> = {
  "lt-3w": 0,
  "3w-10w": 30_000,
  "10w-20w": 100_000,
  "20w-50w": 200_000,
  "50w-80w": 500_000,
  "gte-80w": 800_000,
};

/** 问卷分步。 */
export interface QuestionnaireStep {
  id: string;
  title: string;
  description: string;
}

export const QUESTIONNAIRE_STEPS: QuestionnaireStep[] = [
  {
    id: "company",
    title: "公司与服务类型",
    description: "让我们先认识你们的团队",
  },
  {
    id: "goals",
    title: "增长目标与客户结构",
    description: "确定你们当前最想做的事情",
  },
  {
    id: "termpay",
    title: "账期与 TermPay 适配",
    description: "判断你是否适合接入 TermPay 账期金融能力",
  },
  {
    id: "budget",
    title: "预算与能力需求",
    description: "用于匹配合适的权益组合",
  },
];
