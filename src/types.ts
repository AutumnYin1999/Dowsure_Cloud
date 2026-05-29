/**
 * 全局领域类型。所有页面 / 推荐逻辑共享。
 * 未来接 RAG / Agent 时，这里就是 contract。
 */

export type BenefitCategory =
  | "base" //  基础包
  | "growth" // 获客增长
  | "value-added" // 增值服务
  | "finance" // 金融赋能
  | "premium" // 升级尊享
  | "exclusive" // 独家权益
  | "gift"; // 赠送项

export type BenefitPriority =
  | "required" // 必选
  | "strong" // 强推荐
  | "optional" // 可选增强
  | "unlock" // 满额解锁
  | "gift"; // 满额赠送 / 默认赠送

export type ProviderType =
  | "logistics"
  | "overseas-warehouse"
  | "erp-tool"
  | "marketing"
  | "fintax"
  | "other";

export type CustomerTier =
  | "new-sellers"
  | "mid-sellers"
  | "billion-sellers"
  | "t0-t1";

export type BudgetBand =
  | "lt-3w"
  | "3w-10w"
  | "10w-20w"
  | "20w-50w"
  | "50w-80w"
  | "gte-80w";

export type GoalTag =
  | "lead-gen"
  | "reach-top-sellers"
  | "brand-exposure"
  | "offer-credit"
  | "reduce-bad-debt"
  | "platform-resource"
  | "financing-tax"
  | "hk-services";

export type ReportTier = "20" | "80" | "120-plus";

/* ===== A 计划：服务商客观经营现状（问卷采集，用于诊断与多维评分） ===== */

/** 成立年限 */
export type FoundedYears = "lt-1" | "1-3" | "3-5" | "5-10" | "gt-10";
/** 团队 / 营收规模区间 */
export type CompanyScale = "micro" | "small" | "medium" | "large";
/** 平均账期 */
export type CreditTerm = "none" | "lte-15" | "30" | "60" | "gte-90";
/** 去年坏账 / 逾期情况 */
export type BadDebtLevel = "none" | "few" | "many" | "unknown";
/** 平均应收回款周期 */
export type ReceivableCycle = "lte-15" | "16-30" | "31-60" | "gt-60" | "unknown";
/** 资金周转紧张度 */
export type CashTightness = "easy" | "normal" | "tight";
/** 融资计划 */
export type FinancingPlan = "none" | "debt" | "equity" | "exploring";
/** 目标卖家规模层级 */
export type SellerTier = "new" | "mid" | "billion" | "t0-t1";

/** 一项独立权益的元数据。 */
export interface BenefitItem {
  /** 稳定的业务 id, 推荐引擎和 RAG 都会引用。 */
  id: string;
  name: string;
  category: BenefitCategory;
  /** 单价；若为 0 表示「满额赠送」或「按需」。 */
  price: number;
  /** 单位文案: 例如 "/ 年"、"/ 次"，可空。 */
  unit?: string;
  /** 一句话定位。 */
  summary: string;
  /** 详细描述，可在卡片展开时展示。 */
  description: string;
  /** 用于知识库检索的关键词；未来 RAG 会用 embedding 替换。 */
  keywords: string[];
  /** 适合的服务商类型；空数组表示通用。 */
  fitProviderTypes?: ProviderType[];
  /** 适合的客户层级。 */
  fitCustomerTiers?: CustomerTier[];
  /** 满额解锁阈值（人民币元），当推荐总价达到时变成赠送/解锁。 */
  unlockThreshold?: number;
  /** 默认是否必选（基础包）。 */
  alwaysIncluded?: boolean;
}

/** 服务商画像 —— 问卷归一化后的结果。 */
export interface ProviderProfile {
  companyName: string;
  providerType: ProviderType;
  goals: GoalTag[];
  customerTier: CustomerTier;
  budget: BudgetBand;
  hasEmbeddableSystem: boolean;
  reportTier: ReportTier;
  wantsOfflineEvents: boolean;
  needsFinanceServices: boolean;
  /** 是否给客户提供账期 / 月结。 */
  offersCreditToCustomers?: boolean;
  /** 是否存在应收账款压力 / 回款慢。 */
  hasReceivablePressure?: boolean;
  /** 是否希望支持客户延期 / 分期付款。 */
  wantsCustomerInstallment?: boolean;

  /* ===== A 计划新增：客观经营现状（问卷采集，供诊断 + 多维评分；
     上面的旧字段由这些在 finalize() 中派生，recommender 无需改写） ===== */
  /** 主营服务环节（自由标签，多选 + 其他） */
  serviceScopes?: string[];
  /** 成立年限 */
  foundedYears?: FoundedYears;
  /** 团队 / 营收规模 */
  companyScale?: CompanyScale;
  /** 主营平台 */
  platforms?: string[];
  /** 主要客户区域 */
  customerRegions?: string[];

  /* 模块 2 · 获客现状 */
  /** 目前主要获客方式 */
  acquisitionChannels?: string[];
  /** 获客最大的困难 */
  acquisitionPains?: string[];
  /** 最想触达的目标品类 */
  targetCategories?: string[];
  /** 目标卖家规模层级 */
  targetSellerTiers?: SellerTier[];
  /** 目标地区 */
  targetRegions?: string[];
  /** 当前客户数（选填，自由文本） */
  currentCustomers?: string;
  /** 月新增客户数（选填，自由文本） */
  monthlyNewCustomers?: string;

  /* 模块 3 · 回款与坏账 */
  /** 与客户的结算方式（可多选） */
  settlementModes?: string[];
  /** 平均账期 */
  creditTerm?: CreditTerm;
  /** 去年坏账 / 逾期 */
  badDebt?: BadDebtLevel;
  /** 平均应收回款周期 */
  receivableCycle?: ReceivableCycle;

  /* 模块 4 · 经营压力与期望 */
  /** 当前最大的经营压力（多选） */
  businessPressures?: string[];
  /** 资金周转紧张度 */
  cashTightness?: CashTightness;
  /** 融资计划 */
  financingPlan?: FinancingPlan;
  /** ⭐ 开放题：最头疼的经营问题 */
  openConcern?: string;

  /** 各单选 / 多选题的「其他」自由输入。key 为字段名。 */
  otherText?: Record<string, string>;
}

/** 单条推荐项 —— 一个权益 + 推荐理由 + 优先级。 */
export interface RecommendedBenefit {
  benefit: BenefitItem;
  priority: BenefitPriority;
  /** 触发该推荐的画像证据（可读、可调试）。 */
  reasons: string[];
  /** 命中规则 id，用于 debug。 */
  matchedRules: string[];
  /** 在该方案中的展示数量（默认 1，例如「大卖有约」可能 1 次）。 */
  quantity?: number;
}

/** 推荐方案 —— Plan ≈ 套餐组合。 */
export interface RecommendationPlan {
  /** 方案名称，例如「品牌曝光跃升组合」。 */
  name: string;
  /** 一句话定位。 */
  tagline: string;
  /** Agent 生成的自然语言总结。 */
  narrative: string;
  items: RecommendedBenefit[];
  /** 含税前的小计（不含赠送 / 满额解锁项）。 */
  subtotal: number;
  /** 实际报价（demo 中等于 subtotal）。 */
  total: number;
  /** 下一步建议。 */
  nextSteps: NextStep[];
  /** 命中的预算档位，用于在 UI 上展示。 */
  budget: BudgetBand;
}

export interface NextStep {
  id: string;
  title: string;
  description: string;
  /** lucide-react 图标名。 */
  icon: string;
}
