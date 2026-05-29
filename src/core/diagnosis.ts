import type { ProviderProfile } from "@/types";

/**
 * 经营现状诊断（A 计划 + 深化）。
 * 纯函数：把问卷客观答案翻译成可读判断 + 可落地建议。
 * 只做诊断，不出现产品名 / 价格 / 解锁逻辑。
 */

export type DiagnosisTone = "good" | "warn" | "risk";

export interface DiagnosisMetric {
  label: string;
  value: string;
}

export interface DiagnosisDimension {
  key: "acquisition" | "receivables" | "pressure" | "cashflow";
  title: string;
  tag: string;
  tone: DiagnosisTone;
  /** 现状：一句基于答案的可读判断（所有维度都有）。 */
  insight: string;
  /** 意味着什么：影响 / 风险解读（仅 warn / risk）。 */
  meaning?: string;
  /** 建议这么做：方法级行动（risk 2-3 条 / warn 1-2 条；good 无）。 */
  actions?: string[];
  /** 量化行：仅在能直接得出数字 / 对比时显示。 */
  metrics?: DiagnosisMetric[];
}

export interface CrossInsight {
  id: string;
  title: string;
  body: string;
  /** 落地出口：一句具体建议（方法级，不点产品名）。 */
  action: string;
  tone: DiagnosisTone;
}

export interface ActionPlanItem {
  /** 行动文案。 */
  text: string;
  /** 可执行时机标注，如「本周可做」「旺季前布局」。 */
  timing: string;
  /** 严重度，用于排序与配色。 */
  tone: DiagnosisTone;
}

const CHANNEL_LABELS: Record<string, string> = {
  exhibition: "展会",
  referral: "老客户转介绍",
  ads: "广告投放",
  field: "地推",
  "platform-assign": "平台分配",
  directory: "黄页 / 名录",
};

const PAIN_LABELS: Record<string, string> = {
  "no-precise": "找不到精准客户",
  "low-quality": "线索质量差",
  "low-conversion": "转化率低",
  "high-cost": "获客成本高",
  trust: "客户可信度难判断",
};

const PRESSURE_LABELS: Record<string, string> = {
  "price-war": "价格内卷",
  "thin-margin": "利润薄",
  "cash-flow": "资金周转紧",
  compliance: "合规财税",
  "labor-cost": "人力成本",
  acquisition: "获客难",
};

const CREDIT_TERM_LABEL: Record<string, string> = {
  none: "不给账期",
  "lte-15": "15 天内",
  "30": "30 天",
  "60": "60 天",
  "gte-90": "90 天以上",
};

const RECV_CYCLE_LABEL: Record<string, string> = {
  "lte-15": "15 天内",
  "16-30": "16-30 天",
  "31-60": "31-60 天",
  "gt-60": "60 天以上",
  unknown: "不确定",
};

function labelList(values: string[], map: Record<string, string>): string {
  return values.map((v) => map[v] ?? v).join("、");
}

/* ───────────────────────── 维度诊断 ───────────────────────── */

/** 获客现状 */
function diagnoseAcquisition(p: ProviderProfile): DiagnosisDimension {
  const channels = p.acquisitionChannels ?? [];
  const pains = p.acquisitionPains ?? [];
  const passive =
    channels.includes("referral") ||
    channels.includes("platform-assign") ||
    channels.includes("exhibition");
  const activeOutbound = channels.includes("ads") || channels.includes("field");
  const precisionGap = pains.includes("no-precise") || pains.includes("low-quality");

  let tag = "渠道均衡";
  let tone: DiagnosisTone = "good";
  if (precisionGap) {
    tag = "精准度不足";
    tone = "risk";
  } else if (passive && !activeOutbound) {
    tag = "偏被动";
    tone = "warn";
  }

  const channelText = channels.length ? labelList(channels, CHANNEL_LABELS) : "尚未明确";
  const painText = pains.length ? labelList(pains, PAIN_LABELS) : "暂无明显困难";

  const insight = `当前主要靠${channelText}获客；最大的困难集中在${painText}。`;
  const dim: DiagnosisDimension = { key: "acquisition", title: "获客现状", tag, tone, insight };

  if (tone === "risk") {
    dim.meaning =
      "线索精准度不足会拉低转化率、抬高单客成本，规模化获客时问题会进一步放大。";
    dim.actions = [
      "先按「目标品类 + 卖家规模」列出 20-30 家精准目标客户，本周开始定向触达，替代广撒网。",
      "给线索打分（匹配度 / 活跃度 / 体量），只把销售精力压在高分线索上，把转化率先拉起来。",
      "复盘最近成交的 3-5 个客户的共同画像，按这个画像反推获客渠道。",
    ];
  } else if (tone === "warn") {
    dim.meaning =
      "渠道偏被动意味着增长高度依赖存量关系与外部分配，主动获取新客户的能力有限。";
    dim.actions = [
      "在转介绍 / 平台分配之外，本月内补一条可量化的主动获客路径（如按品类定向触达目标卖家）。",
      "把老客户转介绍流程化：每完成一单主动请客户引荐 1-2 个同类卖家。",
    ];
  }

  const metrics: DiagnosisMetric[] = [];
  if (channels.length) metrics.push({ label: "在用获客渠道", value: `${channels.length} 个` });
  if (pains.length) metrics.push({ label: "获客痛点", value: `${pains.length} 项` });
  if (metrics.length) dim.metrics = metrics;

  return dim;
}

/** 回款健康度 */
function diagnoseReceivables(p: ProviderProfile): DiagnosisDimension {
  const modes = p.settlementModes ?? [];
  const givesCredit = modes.includes("credit") || (p.creditTerm != null && p.creditTerm !== "none");
  const longTerm = p.creditTerm === "60" || p.creditTerm === "gte-90";
  const slowRecv = p.receivableCycle === "gt-60";
  const hasBadDebt = p.badDebt === "few" || p.badDebt === "many";

  let tag = "回款健康";
  let tone: DiagnosisTone = "good";
  if ((longTerm && slowRecv) || p.badDebt === "many") {
    tag = "存在账期错配";
    tone = "risk";
  } else if (givesCredit || hasBadDebt) {
    tag = "需关注";
    tone = "warn";
  }

  let insight: string;
  if (!givesCredit) {
    insight = "你以先款 / 预付为主，回款节奏相对稳健。";
  } else {
    insight = "你给客户提供账期";
    if (longTerm) insight += "且账期较长";
    if (slowRecv) insight += "，应收回款周期偏慢，账单到期可能早于回款";
    insight += "。";
    if (hasBadDebt) insight += p.badDebt === "many" ? "去年坏账 / 逾期较多。" : "去年有少量坏账 / 逾期。";
  }

  const dim: DiagnosisDimension = { key: "receivables", title: "回款健康度", tag, tone, insight };

  if (tone === "risk") {
    dim.meaning =
      "账单到期早于回款到账，会形成账期错配，旺季备货或集中付款时容易出现现金缺口。";
    dim.actions = [
      "客户分层：优质客户保留长账期，新客户改 30 天或预付，先把坏账口子收住。",
      "缩短关键账期：把 60 天压到 30 天，现金流安全垫立刻拉开。",
      "旺季前对大额头程 / 仓储账单引入「提前收款」方式，补上回款空档。",
    ];
  } else if (tone === "warn") {
    dim.meaning = "给客户账期会占用自有资金，叠加坏账 / 逾期时会侵蚀利润与现金安全垫。";
    dim.actions = [
      "给账期客户设授信上限和逾期提醒，把单客户敞口控制在可承受范围内。",
      "对回款慢的客户，下一单起改预付部分 + 尾款月结，逐步压缩敞口。",
    ];
  }

  // 量化行
  const TERM_DAYS: Record<string, number> = { none: 0, "lte-15": 15, "30": 30, "60": 60, "gte-90": 90 };
  const RECV_DAYS: Record<string, number> = { "lte-15": 15, "16-30": 30, "31-60": 60, "gt-60": 90, unknown: NaN };
  const metrics: DiagnosisMetric[] = [];
  if (p.creditTerm && p.creditTerm !== "none") {
    metrics.push({ label: "给客户账期", value: CREDIT_TERM_LABEL[p.creditTerm] ?? p.creditTerm });
  }
  if (p.receivableCycle && p.receivableCycle !== "unknown") {
    metrics.push({ label: "应收回款周期", value: RECV_CYCLE_LABEL[p.receivableCycle] ?? p.receivableCycle });
  }
  if (p.creditTerm && p.receivableCycle && p.receivableCycle !== "unknown") {
    const t = TERM_DAYS[p.creditTerm] ?? 0;
    const r = RECV_DAYS[p.receivableCycle] ?? NaN;
    if (!Number.isNaN(r)) {
      const gap = r - t;
      metrics.push({
        label: "账期 / 回款错配",
        value: gap > 0 ? `回款约晚 ${gap} 天` : gap === 0 ? "基本持平" : `回款约早 ${-gap} 天`,
      });
    }
  }
  if (metrics.length) dim.metrics = metrics;

  return dim;
}

/** 经营压力 */
function diagnosePressure(p: ProviderProfile): DiagnosisDimension {
  const pressures = p.businessPressures ?? [];

  let tone: DiagnosisTone = "good";
  let tag = "压力可控";
  if (pressures.length >= 3) {
    tone = "risk";
    tag = "多重压力";
  } else if (pressures.length >= 1) {
    tone = "warn";
    tag = "局部承压";
  }

  const text = pressures.length ? labelList(pressures, PRESSURE_LABELS) : "暂无突出压力";
  const insight =
    pressures.length >= 1 ? `当前主要压力来自${text}。` : "当前没有特别突出的经营压力，整体较为平稳。";

  const dim: DiagnosisDimension = { key: "pressure", title: "经营压力", tag, tone, insight };

  if (tone === "risk") {
    dim.meaning =
      "多项压力同时存在时往往相互传导（如内卷压价 → 利润变薄 → 周转更紧），单点处理见效有限。";
    dim.actions = [
      "选最影响现金流的那一项（多数情况是周转 / 回款）作为本月唯一突破口，集中资源打透。",
      "对利润薄的业务做一次成本拆解，砍掉毛利为负的服务或客户。",
    ];
  } else if (tone === "warn") {
    dim.meaning = "局部压力若不及时疏解，可能逐步传导到现金流与利润。";
    dim.actions = ["针对当前压力点做一次专项复盘，定 1-2 个本月可见效的小目标。"];
  }

  if (pressures.length >= 1) {
    dim.metrics = [{ label: "并存压力项", value: `${pressures.length} 项` }];
  }

  return dim;
}

/** 资金周转 */
function diagnoseCashflow(p: ProviderProfile): DiagnosisDimension {
  let tone: DiagnosisTone = "good";
  let tag = "周转充裕";
  if (p.cashTightness === "tight") {
    tone = "risk";
    tag = "偏紧";
  } else if (p.cashTightness === "normal") {
    tone = "warn";
    tag = "一般";
  }

  const wantsFinancing = p.financingPlan != null && p.financingPlan !== "none";
  const FIN_LABEL: Record<string, string> = { debt: "债权融资", equity: "股权融资", exploring: "融资可能性" };

  let insight: string;
  if (p.cashTightness === "tight") {
    insight = "你的资金周转偏紧，叠加账期 / 备货压力时容易出现现金缺口。";
  } else if (p.cashTightness === "normal") {
    insight = "资金周转一般，遇到旺季备货或集中付款时仍需提前规划。";
  } else {
    insight = "资金周转较为充裕，现金流压力不大。";
  }
  if (wantsFinancing) insight += ` 你已在考虑${FIN_LABEL[p.financingPlan as string] ?? "融资"}。`;

  const dim: DiagnosisDimension = { key: "cashflow", title: "资金周转", tag, tone, insight };

  if (tone === "risk") {
    dim.meaning =
      "周转偏紧时，任何回款延迟或集中付款都可能放大成现金缺口，挤压备货与获客投入。";
    dim.actions = [
      "做一张未来 8 周的现金流周历，标出每笔大额收 / 付时点，提前 2 周预警缺口。",
      "先从「提前回款 / 加速应收」入手补周转，而不是第一时间加杠杆——根因常在回款节奏。",
    ];
    if (wantsFinancing) {
      dim.actions.push("谈融资时按真实周转缺口测算额度，避免为了安全感过度举债。");
    }
  } else if (tone === "warn") {
    dim.meaning = "周转处于「一般」区间，缺乏缓冲，遇到波动容易转紧。";
    dim.actions = ["旺季前预留一笔等于 1 个月固定支出的现金缓冲，平滑收支节奏。"];
  }

  if (p.cashTightness) {
    const TIGHT_LABEL: Record<string, string> = { easy: "轻松", normal: "一般", tight: "偏紧" };
    const metrics: DiagnosisMetric[] = [{ label: "周转状态", value: TIGHT_LABEL[p.cashTightness] }];
    if (wantsFinancing) metrics.push({ label: "融资计划", value: FIN_LABEL[p.financingPlan as string] ?? "在看" });
    dim.metrics = metrics;
  }

  return dim;
}

export function diagnose(profile: ProviderProfile): DiagnosisDimension[] {
  return [
    diagnoseAcquisition(profile),
    diagnoseReceivables(profile),
    diagnosePressure(profile),
    diagnoseCashflow(profile),
  ];
}

/* ───────────────────────── 整体结论 ───────────────────────── */

const DIM_TITLE: Record<DiagnosisDimension["key"], string> = {
  acquisition: "获客",
  receivables: "回款",
  pressure: "经营压力",
  cashflow: "资金周转",
};

// 优先级：越靠近现金流越优先处理
const DIM_ORDER: DiagnosisDimension["key"][] = ["cashflow", "receivables", "acquisition", "pressure"];

export function summarize(
  _profile: ProviderProfile,
  dimensions: DiagnosisDimension[]
): string {
  const risks = dimensions.filter((d) => d.tone === "risk");
  const warns = dimensions.filter((d) => d.tone === "warn");

  if (risks.length === 0 && warns.length === 0) {
    return "整体看，你的经营状况较为稳健，获客、回款、压力与资金周转都没有突出风险。可以在保持现有节奏的基础上，寻找进一步提效的机会。";
  }

  const sortedRisks = [...risks].sort((a, b) => DIM_ORDER.indexOf(a.key) - DIM_ORDER.indexOf(b.key));
  const parts: string[] = [];

  if (sortedRisks.length > 0) {
    const bottleneck = sortedRisks.map((d) => DIM_TITLE[d.key]).join("、");
    parts.push(`从你的回答看，核心瓶颈集中在「${bottleneck}」。`);

    const hasCash = sortedRisks.some((d) => d.key === "cashflow");
    const hasRecv = sortedRisks.some((d) => d.key === "receivables");
    const hasAcq = sortedRisks.some((d) => d.key === "acquisition");
    if (hasCash && hasRecv) {
      parts.push("账期回款偏慢与资金周转偏紧相互叠加，是目前最需要优先疏解的一环。");
    } else if (hasRecv) {
      parts.push("回款节奏是当前最值得先处理的环节，它会直接影响现金流安全。");
    } else if (hasCash) {
      parts.push("资金周转偏紧是当前最敏感的一环，任何收支波动都可能被放大。");
    } else if (hasAcq) {
      parts.push("获客的精准度 / 主动性是当前增长的主要制约。");
    }
  }

  const first = sortedRisks[0]
    ? DIM_TITLE[sortedRisks[0].key]
    : warns[0]
    ? DIM_TITLE[warns[0].key]
    : "";
  const second = sortedRisks[1]
    ? DIM_TITLE[sortedRisks[1].key]
    : warns[0] && first !== DIM_TITLE[warns[0].key]
    ? DIM_TITLE[warns[0].key]
    : "";
  if (first && second) {
    parts.push(`建议优先解决「${first}」，再带动改善「${second}」。`);
  } else if (first) {
    parts.push(`建议把「${first}」作为首要突破口，逐步带动整体改善。`);
  }

  return parts.join("");
}

/* ───────────────────────── 交叉洞察 ───────────────────────── */

export function crossInsights(p: ProviderProfile): CrossInsight[] {
  const out: CrossInsight[] = [];

  // 1. 现金流错配
  const longCredit =
    p.creditTerm === "60" ||
    p.creditTerm === "gte-90" ||
    (p.settlementModes ?? []).includes("credit");
  const tight = p.cashTightness === "tight";
  const seekingFinance =
    p.financingPlan === "debt" || p.financingPlan === "equity" || p.financingPlan === "exploring";
  if (longCredit && tight && seekingFinance) {
    out.push({
      id: "cash-mismatch",
      title: "现金流错配",
      tone: "risk",
      body: "长账期、资金周转紧、正在看融资——这三个信号叠加时会相互放大：账期拉长占用资金，周转更紧，于是转向融资。但根因往往在「回款节奏」而非融资额度。",
      action: "优先级：先上「提前回款」缓解周转，再谈融资额度，别本末倒置。",
    });
  }

  // 2. 获客错位
  const targets = p.targetSellerTiers ?? [];
  const wantsTop = targets.includes("billion") || targets.includes("t0-t1");
  const channels = p.acquisitionChannels ?? [];
  const pains = p.acquisitionPains ?? [];
  const onlyPassive =
    channels.length > 0 &&
    channels.every((c) => c === "referral" || c === "exhibition" || c === "platform-assign");
  const precisionGap = pains.includes("no-precise") || pains.includes("low-conversion");
  if (wantsTop && (onlyPassive || precisionGap)) {
    out.push({
      id: "acq-misalign",
      title: "获客错位",
      tone: "warn",
      body: "你想触达大卖 / T0·T1 客户，但当前获客渠道偏被动、精准度不足，目标与渠道之间存在错位。高价值客户很难靠转介绍或平台分配稳定触达。",
      action: "建议改用「按品类 + 规模层级精准筛选」的主动获客方式，替代守株待兔式转介绍。",
    });
  }

  return out;
}

/* ───────────────────────── 行动优先级清单 ───────────────────────── */

export function buildActionPlan(
  _profile: ProviderProfile,
  dimensions: DiagnosisDimension[],
  crosses: CrossInsight[]
): ActionPlanItem[] {
  const items: ActionPlanItem[] = [];
  const seen = new Set<string>();

  const push = (text: string, tone: DiagnosisTone, timing: string) => {
    const norm = text.trim();
    if (!norm || seen.has(norm)) return;
    seen.add(norm);
    items.push({ text: norm, tone, timing });
  };

  // 时机推断：含「本周/本月/下一单」→ 本周可做；含「旺季」→ 旺季前布局；含「融资」→ 中期推进
  const inferTiming = (text: string): string => {
    if (/本周|本月|下一单|立刻|马上/.test(text)) return "本周可做";
    if (/旺季/.test(text)) return "旺季前布局";
    if (/融资|额度|举债|杠杆/.test(text)) return "中期推进";
    return "近期推进";
  };

  // 1) 交叉洞察 action 最优先（信号叠加，最关键）
  for (const c of crosses) {
    push(c.action, c.tone, inferTiming(c.action));
  }

  // 2) risk 维度的 actions，按现金流优先级排序，各取前 1-2 条
  const risks = dimensions
    .filter((d) => d.tone === "risk")
    .sort((a, b) => DIM_ORDER.indexOf(a.key) - DIM_ORDER.indexOf(b.key));
  for (const d of risks) {
    (d.actions ?? []).slice(0, 2).forEach((a) => push(a, "risk", inferTiming(a)));
  }

  // 3) warn 维度补充（每维取 1 条）
  const warns = dimensions
    .filter((d) => d.tone === "warn")
    .sort((a, b) => DIM_ORDER.indexOf(a.key) - DIM_ORDER.indexOf(b.key));
  for (const d of warns) {
    (d.actions ?? []).slice(0, 1).forEach((a) => push(a, "warn", inferTiming(a)));
  }

  // 排序：本周可做 > 旺季前布局 > 近期推进 > 中期推进；同档 risk > warn
  const timingRank: Record<string, number> = {
    "本周可做": 0,
    "旺季前布局": 1,
    "近期推进": 2,
    "中期推进": 3,
  };
  const toneRank: Record<DiagnosisTone, number> = { risk: 0, warn: 1, good: 2 };
  items.sort((a, b) => {
    const t = (timingRank[a.timing] ?? 9) - (timingRank[b.timing] ?? 9);
    if (t !== 0) return t;
    return toneRank[a.tone] - toneRank[b.tone];
  });

  return items.slice(0, 5);
}

/* ───────────────────────── 痛点 → 方案方向映射（A/B/C 复用） ───────────────────────── */

/**
 * 一条「痛点 → 方向 → 关联权益」。
 * - problem：诊断结论（你的问题）
 * - direction：中性方向措辞（不点产品名 / 不报价）
 * - benefitIds：关联的 knowledgeBase 权益 id（与 recommender 命中口径一致）
 */
export interface PainSolution {
  key: string;
  problem: string;
  direction: string;
  benefitIds: string[];
}

/**
 * 基于诊断结果派生「痛点 → 方向」。
 * 仅在对应维度命中（warn/risk）或交叉洞察触发时输出该条。
 */
export function painSolutions(profile: ProviderProfile): PainSolution[] {
  const dims = diagnose(profile);
  const crosses = crossInsights(profile);
  const dimOf = (k: DiagnosisDimension["key"]) => dims.find((d) => d.key === k);
  const hitTone = (d?: DiagnosisDimension) => d?.tone === "warn" || d?.tone === "risk";
  const crossHit = (id: string) => crosses.some((c) => c.id === id);

  const out: PainSolution[] = [];

  // 回款错配 / 坏账 —— 提前回款 / 账期风控
  if (hitTone(dimOf("receivables")) || crossHit("cash-mismatch")) {
    out.push({
      key: "receivables",
      problem: "账期与回款错配、坏账压力",
      direction: "提前回款 / 账期风控",
      benefitIds: ["value-embed-finance", "value-risk-model"],
    });
  }

  // 获客错位 / 精准度不足 —— 精准卖家线索
  const wantsTop =
    (profile.targetSellerTiers ?? []).includes("billion") ||
    (profile.targetSellerTiers ?? []).includes("t0-t1");
  if (hitTone(dimOf("acquisition")) || crossHit("acq-misalign")) {
    out.push({
      key: "acquisition",
      problem: "获客偏被动、线索精准度不足",
      direction: "精准卖家线索 / 主动获客",
      benefitIds: wantsTop
        ? ["growth-leadgen-plus", "growth-bigseller-tour"]
        : ["growth-leadgen-plus"],
    });
  }

  // 资金周转偏紧 —— 嵌入式金融 / 资金周转
  if (hitTone(dimOf("cashflow"))) {
    out.push({
      key: "cashflow",
      problem: "资金周转偏紧",
      direction: "嵌入式金融 / 资金周转",
      benefitIds: ["value-embed-finance", "finance-debt-advisory"],
    });
  }

  // 经营压力 · 合规财税 —— 财税合规
  if ((profile.businessPressures ?? []).includes("compliance")) {
    out.push({
      key: "compliance",
      problem: "合规财税压力",
      direction: "财税合规支持",
      benefitIds: ["finance-fin-diagnosis", "finance-tax-guidance", "finance-debt-advisory"],
    });
  }

  return out;
}

/** 反查：某个 benefitId 主要针对哪个痛点（取第一个命中的方向，用于 C 标签）。 */
export function painLabelForBenefit(
  profile: ProviderProfile,
  benefitId: string
): string | null {
  const sols = painSolutions(profile);
  const hit = sols.find((s) => s.benefitIds.includes(benefitId));
  return hit ? hit.direction : null;
}

/** B · 推荐页开场承接语：基于诊断点出核心矛盾 + 优先解决方向（不报价、不堆产品）。 */
export function recommendationIntro(profile: ProviderProfile): string {
  const dims = diagnose(profile);
  const overall = summarize(profile, dims);
  const sols = painSolutions(profile);

  if (sols.length === 0) {
    return "你的经营整体较稳健。下面这套方案以「锦上添花」为主，帮你在现有节奏上进一步提效，不必一次全开，可按需取舍。";
  }

  const directions = sols.slice(0, 3).map((s) => s.direction).join("、");
  // 取诊断整体结论的第一句作为承接，避免重复整段
  const firstSentence = overall.split("。")[0];
  return `${firstSentence}。下面这套方案优先解决这几点：${directions}——按对症顺序排好，你可以在此基础上自由增减。`;
}
