import type {
  BadDebtLevel,
  CashTightness,
  CompanyScale,
  CreditTerm,
  FinancingPlan,
  ReceivableCycle,
} from "@/types";

/**
 * 服务商「算钱」唯一数据源 —— 仅处理 TermPay（豆分期）这条线。
 *
 * 红线（与 sellerEconomics.ts 一致）：金额只在这里算，AI 永远不碰数字 —— 防幻觉的根本。
 * 每个系数都可追溯到 documents/material/（带出处 + 信心等级）。
 *
 * 设计要点：
 *  - 输入字段直接复用问卷 schema 的枚举值（creditTerm / settlementMode / companyScale…），
 *    所以对话 Agent 和老问卷页喂的是同一套字段、同一个引擎（单一数据源）。
 *  - 核心金额 = 服务商「自己的数」(月营收 × 账期/30 × 给账期占比)，是应收账款定义，
 *    比借来的行业率可信。行业系数只用于坏账敞口与默认值兜底，且都标了信心。
 *
 * ⚠️ 待豆沙包内部数据校准的「承重系数」：defaultCreditDays、creditRatio 映射、badDebtRate。
 *    见 documents/material/海外仓服务商_经济系数表.md §四。
 */

export const COEF = {
  /** 行业坏账率：应收的 2–5% 取中。🟡 中（FreightAmigo 2025，见 material）。 */
  badDebtRate: 0.03,
  /** 默认账期天数（未问到真实账期时用）：区间 30–60 取中。🟡 中（跨境账期 15–45 + 海外仓月结 30–60）。 */
  defaultCreditDays: 45,
  /** 默认给账期占比（未问到结算方式时用）。🔴 假设，待内部校准。 */
  defaultCreditRatio: 0.5,
  /** TermPay 单卖家额度上限（官方）：$100 万美元。🟢 硬（豆分期产品介绍）。 */
  termpayCapUSD: 1_000_000,
  /** 估算用美元汇率（仅用于把 $100 万上限换算成人民币提示）。🟡 取近似 7.2。 */
  usdToCny: 7.2,
} as const;

/** TermPay 官方可延账期档位（天）。🟢 硬（豆分期产品介绍 60/90/120；内容细则 30/60/90，合并取常用档）。 */
export const TERMPAY_TERMS = [60, 90, 120] as const;

/** 账期枚举 → 天数。🟢 直接映射（问卷 CREDIT_TERM_OPTIONS）。 */
const CREDIT_TERM_DAYS: Record<CreditTerm, number> = {
  none: 0,
  "lte-15": 15,
  "30": 30,
  "60": 60,
  "gte-90": 90,
};

/**
 * 结算方式枚举 → 给账期占比。🔴 假设映射，待内部校准。
 * 一题两用：既算占比，又决定诊断分叉（占比 0 = 不给账期 → 走「不敢给账期丢单」叙事）。
 */
const SETTLEMENT_RATIO: Record<string, number> = {
  "prepay-full": 0, // 先款后服务 → 不给账期
  "prepay-part": 0.3, // 预付部分 → 部分账期
  monthly: 0.6, // 月结 → 多数有账期
  credit: 0.8, // 给账期 → 高占比
};

/**
 * 公司规模枚举 → 月营收估算（元）。🟡 中（COMPANY_SCALE_OPTIONS 的营收量级 hint 取代表值）。
 * 仅在服务商没给具体月营收时用作粗估；给了具体值就用真实值（更可信）。
 */
const SCALE_MONTHLY_REVENUE: Record<CompanyScale, number> = {
  micro: 400_000, // 营收千万内 → 取约 ¥500 万/年
  small: 2_500_000, // 千万级 → 约 ¥3000 万/年
  medium: 12_500_000, // 亿级 → 约 ¥1.5 亿/年
  large: 40_000_000, // 数亿+ → 约 ¥5 亿/年
};

/** 服务商诊断所需的事实（字段值对齐问卷 schema 枚举）。 */
export interface ProviderFacts {
  /** 服务商类型（PROVIDER_TYPE_OPTIONS 值，如 overseas-warehouse / head-logistics）。 */
  providerType?: string;
  /**
   * 主诉求 / 最想解决的痛点（acquisition 获客 / receivables 回款账期 / cashflow 资金融资 /
   * margin 利润内卷 / brand 品牌 / compliance 财税合规资源）。
   * 引擎不参与计算，仅透传给诊断，用于决定先讲哪块、推荐哪些豆服云权益。
   */
  primaryPain?: string;
  /** 公司规模（COMPANY_SCALE_OPTIONS）。月营收的粗估来源。 */
  companyScale?: CompanyScale;
  /** 具体月营收自由文本（如「月营收 500 万」「年营收 6000 万」）。给了就优先用它精算。 */
  monthlyRevenue?: string;
  /** 与卖家的结算方式（SETTLEMENT_MODE_OPTIONS）。决定给账期占比 + 诊断分叉。 */
  settlementMode?: string;
  /**
   * 用户在「精算环节」自报的真实「给账期客户占比」(0–1)。给了就覆盖按结算方式估的假设占比。
   * 这是治「80% 假设当事实讲」的关键：占比从 SETTLEMENT_RATIO 的拍脑袋值升级成用户确认的真实值。
   */
  creditRatioOverride?: number;
  /** 给卖家的账期（CREDIT_TERM_OPTIONS）。驱动账压天数。 */
  creditTerm?: CreditTerm;
  /** 账期天数自由文本（如「60天」「两个月」）。给了就覆盖 creditTerm 的枚举映射。 */
  termDays?: string;
  /** 去年坏账 / 逾期（BAD_DEBT_OPTIONS）。 */
  badDebt?: BadDebtLevel;
  /** 平均应收回款周期（RECEIVABLE_CYCLE_OPTIONS）。健康度对照，选填。 */
  receivableCycle?: ReceivableCycle;
  /** 资金周转紧张度（CASH_TIGHTNESS_OPTIONS）。紧迫度，选填。 */
  cashTightness?: CashTightness;
  /** 融资计划（FINANCING_PLAN_OPTIONS）。替代借贷钩子，选填。 */
  financingPlan?: FinancingPlan;
}

/** TermPay 诊断的场景分叉。 */
export type ProviderScenario =
  | "gives-credit" // 已给卖家账期 → 在垫资 + 担坏账 → TermPay 卸风险、提前回款
  | "no-credit" // 不敢给账期、坚持先款 → 在丢大卖单 → TermPay 让他敢给又零风险
  | "unknown";

export interface ProviderEconomics {
  /** 月营收（元）。 */
  rep: number;
  /** 是否用了服务商自报的具体月营收（true=精算，false=按规模粗估）。 */
  exactRevenue: boolean;
  /** 账期天数。 */
  days: number;
  /** 给账期客户占比 0–1。 */
  creditRatio: number;
  /** 诊断场景分叉。 */
  scenario: ProviderScenario;
  /** 是否有回款/账期信息（结算方式/账期/天数任一）。false 时账期金额全为 0，诊断不该讲账期。 */
  hasReceivablesData: boolean;
  /** 被账期占压的现金（应收占压）= 月营收 × 账期/30 × 占比。痛点金额。 */
  cashLocked: number;
  /** TermPay 可提前回收的现金 ≈ 被占压现金（解药金额）。 */
  termpayRelease: number;
  /** 年通过账期的金额 = 月营收 × 12 × 占比。 */
  annualCreditVolume: number;
  /** 年坏账敞口 = 年通过账期金额 × 行业坏账率。 */
  badDebtExposure: number;
  /** TermPay 单卖家额度上限（人民币近似，用于「最高可覆盖」提示）。 */
  termpayCapCny: number;
}

const roundTo = (n: number, unit: number) => Math.round(n / unit) * unit;

/**
 * 解析「月营收」自由文本为元（CNY）。支持「500万」「6000万」「年营收6000万」「1.2亿」「800000」。
 * 含「年」字时按年营收 ÷ 12 折算月营收。解析不出返回 0（调用方回退到规模粗估）。
 */
export function monthlyRevenueFromText(text?: string): number {
  if (!text) return 0;
  const m = text.match(/(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  let val = parseFloat(m[1]);
  if (/亿/.test(text)) val *= 100_000_000;
  else if (/千万/.test(text)) val *= 10_000_000;
  else if (/百万/.test(text)) val *= 1_000_000;
  else if (/万/.test(text)) val *= 10_000;
  else if (val < 10_000) val *= 10_000; // 不带单位的小数（如 500）按「万」更合理
  if (/年/.test(text)) val /= 12; // 给的是年营收 → 折月
  return Math.round(val);
}

/** 解析账期天数自由文本。支持「60天」「两个月」「90」。解析不出返回 0。 */
export function termDaysFromText(text?: string): number {
  if (!text) return 0;
  const m = text.match(/(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  const num = parseFloat(m[1]);
  if (/月/.test(text)) return Math.round(num * 30);
  if (/周/.test(text)) return Math.round(num * 7);
  return Math.round(num);
}

/**
 * 解析「给账期客户占比」自由文本 → 0–1。支持「70%」「七成」「一半」「八九成」「几乎都给」。
 * 解析不出返回 undefined（调用方保持原占比）。用于精算环节把假设占比换成用户真实占比。
 */
export function creditRatioFromText(text?: string): number | undefined {
  if (!text) return undefined;
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
  const pct = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) return clamp01(parseFloat(pct[1]) / 100);
  const CHENG: Record<string, number> = {
    一: 0.1, 二: 0.2, 两: 0.2, 三: 0.3, 四: 0.4, 五: 0.5,
    六: 0.6, 七: 0.7, 八: 0.8, 九: 0.9, 十: 1,
  };
  const m = text.match(/([一二两三四五六七八九十]|\d+(?:\.\d+)?)\s*成/);
  if (m) {
    const k = m[1];
    const v = /\d/.test(k) ? parseFloat(k) / 10 : CHENG[k];
    if (v) return clamp01(v);
  }
  if (/一半/.test(text)) return 0.5;
  if (/几乎都|基本都|全部都|都给|大部分|绝大多数/.test(text)) return 0.9;
  if (/很少|少部分|个别|偶尔/.test(text)) return 0.2;
  return undefined;
}

/** 月营收：优先用自报具体值（精算），否则按公司规模粗估（估算）。 */
function resolveRevenue(facts: ProviderFacts): { rep: number; exact: boolean } {
  const exact = monthlyRevenueFromText(facts.monthlyRevenue);
  if (exact > 0) return { rep: exact, exact: true };
  if (facts.companyScale && SCALE_MONTHLY_REVENUE[facts.companyScale]) {
    return { rep: SCALE_MONTHLY_REVENUE[facts.companyScale], exact: false };
  }
  return { rep: 0, exact: false };
}

/** 账期天数：优先自由文本，其次账期枚举，最后默认值。 */
function resolveDays(facts: ProviderFacts): number {
  const fromText = termDaysFromText(facts.termDays);
  if (fromText > 0) return fromText;
  if (facts.creditTerm && facts.creditTerm in CREDIT_TERM_DAYS) {
    const d = CREDIT_TERM_DAYS[facts.creditTerm];
    if (d > 0) return d;
    if (facts.creditTerm === "none") return 0; // 明确不给账期
  }
  return COEF.defaultCreditDays;
}

/** 给账期占比：用户自报的真实占比最优先，其次由结算方式推，最后默认占比。 */
function resolveCreditRatio(facts: ProviderFacts): number {
  // 用户在精算环节给的真实占比 → 最高优先，替换掉按结算方式估的假设值（更可信、治"假精确"）。
  const override = facts.creditRatioOverride;
  if (typeof override === "number" && override > 0 && override <= 1) {
    return override;
  }
  if (facts.settlementMode && facts.settlementMode in SETTLEMENT_RATIO) {
    return SETTLEMENT_RATIO[facts.settlementMode];
  }
  // 明确不给账期 → 占比 0
  if (facts.creditTerm === "none") return 0;
  return COEF.defaultCreditRatio;
}

function resolveScenario(creditRatio: number, days: number): ProviderScenario {
  if (creditRatio <= 0 || days <= 0) return "no-credit";
  return "gives-credit";
}

/**
 * 唯一算钱入口：把 Agent 收集到的事实换成 TermPay 各项金额（全部可追溯到 COEF / material）。
 */
export function diagnoseProviderEconomics(facts: ProviderFacts): ProviderEconomics {
  const { rep, exact } = resolveRevenue(facts);
  // 没有任何结算/账期信息时，不臆造账压（否则默认占比/天数会编出假数字）。
  const hasReceivablesData = !!(facts.settlementMode || facts.creditTerm || facts.termDays);
  const days = hasReceivablesData ? resolveDays(facts) : 0;
  const creditRatio = hasReceivablesData ? resolveCreditRatio(facts) : 0;
  const scenario = hasReceivablesData ? resolveScenario(creditRatio, days) : "unknown";

  const cashLocked = roundTo(rep * (days / 30) * creditRatio, 1_000);
  const annualCreditVolume = roundTo(rep * 12 * creditRatio, 10_000);
  const badDebtExposure = roundTo(annualCreditVolume * COEF.badDebtRate, 1_000);

  return {
    rep,
    exactRevenue: exact,
    days,
    creditRatio,
    scenario,
    hasReceivablesData,
    cashLocked,
    termpayRelease: cashLocked,
    annualCreditVolume,
    badDebtExposure,
    termpayCapCny: roundTo(COEF.termpayCapUSD * COEF.usdToCny, 10_000),
  };
}

export function fmtCNY(n: number): string {
  if (n >= 100_000_000) {
    const yi = n / 100_000_000;
    return `¥${Number.isInteger(yi) ? yi : yi.toFixed(2)} 亿`;
  }
  if (n >= 10_000) {
    const w = n / 10_000;
    return `¥${Number.isInteger(w) ? w : w.toFixed(1)} 万`;
  }
  return `¥${Math.round(n).toLocaleString("zh-CN")}`;
}
