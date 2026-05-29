import type {
  BadDebtLevel,
  BudgetBand,
  CashTightness,
  CompanyScale,
  CreditTerm,
  CustomerTier,
  FinancingPlan,
  FoundedYears,
  GoalTag,
  ProviderType,
  ReceivableCycle,
  ReportTier,
  SellerTier,
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
    id: "profile",
    title: "基础画像",
    description: "先认识你们的团队与服务",
  },
  {
    id: "acquisition",
    title: "获客现状",
    description: "你们现在怎么找客户、卡在哪里",
  },
  {
    id: "receivables",
    title: "回款与坏账",
    description: "结算方式与回款健康度",
  },
  {
    id: "pressure",
    title: "经营压力与期望",
    description: "当前压力、资金与融资计划",
  },
];

/* ============================================================
   A 计划：客观化问卷选项（不含产品名 / 价格 / 解锁逻辑）
   ============================================================ */

/** 细颗粒度服务商类型（展示用），finalize 时映射到领域 ProviderType。 */
export const PROVIDER_TYPE_OPTIONS: OptionDef<string>[] = [
  { value: "head-logistics", label: "头程物流", hint: "海运 / 空运 / 铁路头程" },
  { value: "last-mile", label: "尾程配送", hint: "海外本地派送" },
  { value: "overseas-warehouse", label: "海外仓", hint: "美 / 欧 / 东南亚仓" },
  { value: "transit-customs", label: "转运清关", hint: "中转、报关、清关" },
  { value: "payment", label: "支付收款", hint: "收款、结汇、跨境账户" },
  { value: "erp-tool", label: "ERP / 工具", hint: "SaaS、运营工具" },
  { value: "marketing", label: "广告 / 营销", hint: "投放、红人、内容" },
  { value: "fintax", label: "财税 / 合规", hint: "记账、税务、合规" },
  { value: "other", label: "其他", hint: "请填写" },
];

/** 细类型 → 领域 ProviderType 的映射（供 recommender 使用）。 */
export const PROVIDER_TYPE_TO_DOMAIN: Record<string, ProviderType> = {
  "head-logistics": "logistics",
  "last-mile": "logistics",
  "overseas-warehouse": "overseas-warehouse",
  "transit-customs": "logistics",
  payment: "fintax",
  "erp-tool": "erp-tool",
  marketing: "marketing",
  fintax: "fintax",
  other: "other",
};

export const SERVICE_SCOPE_OPTIONS: OptionDef<string>[] = [
  { value: "head-haul", label: "头程运输" },
  { value: "last-mile", label: "尾程派送" },
  { value: "warehousing", label: "仓储 / 海外仓" },
  { value: "customs", label: "清关 / 转运" },
  { value: "payment", label: "支付 / 收款" },
  { value: "saas", label: "ERP / SaaS 工具" },
  { value: "ads", label: "广告 / 营销" },
  { value: "fintax", label: "财税 / 合规" },
  { value: "insurance", label: "保险 / 风控" },
];

export const FOUNDED_YEARS_OPTIONS: OptionDef<FoundedYears>[] = [
  { value: "lt-1", label: "1 年以内" },
  { value: "1-3", label: "1 - 3 年" },
  { value: "3-5", label: "3 - 5 年" },
  { value: "5-10", label: "5 - 10 年" },
  { value: "gt-10", label: "10 年以上" },
];

export const COMPANY_SCALE_OPTIONS: OptionDef<CompanyScale>[] = [
  { value: "micro", label: "10 人以内 / 初创", hint: "营收千万内" },
  { value: "small", label: "10 - 50 人", hint: "营收千万级" },
  { value: "medium", label: "50 - 200 人", hint: "营收亿级" },
  { value: "large", label: "200 人以上", hint: "营收数亿+" },
];

export const PLATFORM_OPTIONS: OptionDef<string>[] = [
  { value: "amazon", label: "Amazon" },
  { value: "walmart", label: "Walmart" },
  { value: "temu", label: "Temu" },
  { value: "ebay", label: "eBay" },
  { value: "independent", label: "独立站" },
  { value: "tiktok", label: "TikTok Shop" },
];

export const REGION_OPTIONS: OptionDef<string>[] = [
  { value: "na", label: "北美" },
  { value: "eu", label: "欧洲" },
  { value: "sea", label: "东南亚" },
  { value: "jp-kr", label: "日韩" },
  { value: "latam", label: "拉美" },
  { value: "mena", label: "中东" },
];

/* ── 模块 2 · 获客现状 ── */
export const ACQUISITION_CHANNEL_OPTIONS: OptionDef<string>[] = [
  { value: "exhibition", label: "展会" },
  { value: "referral", label: "老客户转介绍" },
  { value: "ads", label: "投放广告" },
  { value: "field", label: "地推 / 陌拜" },
  { value: "platform-assign", label: "平台分配" },
  { value: "directory", label: "跨境黄页 / 名录" },
];

export const ACQUISITION_PAIN_OPTIONS: OptionDef<string>[] = [
  { value: "no-precise", label: "找不到精准客户" },
  { value: "low-quality", label: "线索质量差" },
  { value: "low-conversion", label: "转化率低" },
  { value: "high-cost", label: "获客成本高" },
  { value: "trust", label: "不知道客户靠不靠谱" },
];

export const TARGET_CATEGORY_OPTIONS: OptionDef<string>[] = [
  { value: "all", label: "全品类 / 不限" },
  { value: "3c", label: "3C 电子" },
  { value: "home", label: "家居园艺 / 户外" },
  { value: "apparel", label: "服饰鞋包" },
  { value: "beauty-health", label: "美妆个护 / 健康" },
  { value: "baby-toy", label: "母婴玩具" },
  { value: "pet", label: "宠物用品" },
  { value: "auto-tool", label: "汽配工具" },
  { value: "food", label: "食品 / 快消" },
  { value: "other", label: "其他" },
];

export const SELLER_TIER_OPTIONS: OptionDef<SellerTier>[] = [
  { value: "new", label: "新卖家" },
  { value: "mid", label: "腰部卖家" },
  { value: "billion", label: "亿级卖家" },
  { value: "t0-t1", label: "T0 / T1 大卖" },
];

/* ── 模块 3 · 回款与坏账 ── */
export const SETTLEMENT_MODE_OPTIONS: OptionDef<string>[] = [
  { value: "prepay-full", label: "先款后服务" },
  { value: "prepay-part", label: "预付部分" },
  { value: "monthly", label: "月结" },
  { value: "credit", label: "给账期" },
];

export const CREDIT_TERM_OPTIONS: OptionDef<CreditTerm>[] = [
  { value: "none", label: "不给账期" },
  { value: "lte-15", label: "15 天内" },
  { value: "30", label: "30 天" },
  { value: "60", label: "60 天" },
  { value: "gte-90", label: "90 天以上" },
];

export const BAD_DEBT_OPTIONS: OptionDef<BadDebtLevel>[] = [
  { value: "none", label: "没有" },
  { value: "few", label: "偶有少量" },
  { value: "many", label: "较多" },
  { value: "unknown", label: "不确定" },
];

export const RECEIVABLE_CYCLE_OPTIONS: OptionDef<ReceivableCycle>[] = [
  { value: "lte-15", label: "15 天内" },
  { value: "16-30", label: "16 - 30 天" },
  { value: "31-60", label: "31 - 60 天" },
  { value: "gt-60", label: "60 天以上" },
  { value: "unknown", label: "不确定" },
];

/* ── 模块 4 · 经营压力与期望 ── */
export const BUSINESS_PRESSURE_OPTIONS: OptionDef<string>[] = [
  { value: "price-war", label: "价格内卷" },
  { value: "thin-margin", label: "利润薄" },
  { value: "cash-flow", label: "资金周转紧" },
  { value: "compliance", label: "合规财税" },
  { value: "labor-cost", label: "人力成本" },
  { value: "acquisition", label: "获客难" },
];

export const CASH_TIGHTNESS_OPTIONS: OptionDef<CashTightness>[] = [
  { value: "easy", label: "轻松" },
  { value: "normal", label: "一般" },
  { value: "tight", label: "紧张" },
];

export const FINANCING_PLAN_OPTIONS: OptionDef<FinancingPlan>[] = [
  { value: "none", label: "暂不需要" },
  { value: "debt", label: "债权（贷款）" },
  { value: "equity", label: "股权" },
  { value: "exploring", label: "还在看" },
];

/** 年度服务投入预期（中性措辞，映射到现有 BudgetBand）。 */
export const ANNUAL_SPEND_OPTIONS: OptionDef<BudgetBand>[] = [
  { value: "lt-3w", label: "3 万以内" },
  { value: "3w-10w", label: "3 - 10 万" },
  { value: "10w-20w", label: "10 - 20 万" },
  { value: "20w-50w", label: "20 - 50 万" },
  { value: "50w-80w", label: "50 - 80 万" },
  { value: "gte-80w", label: "80 万以上" },
];
