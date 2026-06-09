/**
 * 卖家诊断「算钱」唯一数据源（暂定值，待 LD 2026-06-10 确认）。
 *
 * 红线：金额只能在这里算，AI 永远不碰数字 —— 这是防幻觉的根本办法。
 * 明天 LD 确认后，只改本文件的 COEF / 取值，不动其它逻辑。
 * 依据见 documents/卖家痛点清单_2026-06-09.md §六 / §七，与 方案梳理 / Roadmap 的系数表。
 *
 * ⚠️ 暂定的 SellerChatPage.tsx 里也有一份 COEF（现有 /seller 流程用）；
 *    确认后两处统一到本文件，避免 §6.3 那种「两套算法」问题。
 */

export const COEF = {
  /** 现金占压率：月GMV × 11.85%。🟢 较硬（截图实测，见方案§1.4）。 */
  cashLockRate: 0.1185,
  /** 缺货损失率：月GMV × 10%（区间 7~14% 取中）。🟡 中（亿邦 AWD 反推）。 */
  stockoutRate: 0.1,
  /** 物流仓储成本占营收比：17.5%（区间 15~20% 取中）。🟢 硬（亿邦财报抽样）。 */
  logisticsCostRate: 0.175,
  /** 物流仓储中可压缩比例：15%。🔴 暂定值，无背书 —— 明天重点和 LD 确认。 */
  compressibleRatio: 0.15,
  /**
   * TermPay 额度粗估系数（月GMV × 1.5）—— ⚠️ 仅内部占位，Agent 话术已不再对外报这个数。
   * 真实官方模型：授权后接入亚马逊店铺近半年真实经营数据评估、上限约 60%、封顶 100 万元
   *   （内部口径，绝不要写进任何用户可见文案或 AI 话术；对外只说"看店铺近半年数据、最高 100 万、以审核为准"）。
   * 这里保留一个倍数只为内部估个量级，不应再当成"官方额度公式"展示。
   */
  termpayMultiple: 1.5,
} as const;

/** 默认目标账期（天）。卖家未指定时暂用 90 天，待确认。 */
export const DEFAULT_TERM_DAYS = 90;

/** 月销区间档位 → 代表 GMV（CNY）。取区间中点，待 LD 确认（见 §6.4）。 */
function repFromWan(wan: number): number {
  if (wan < 10) return 60_000;
  if (wan < 50) return 300_000;
  if (wan < 100) return 750_000;
  if (wan < 300) return 2_000_000;
  return 5_000_000;
}

/**
 * 从 AI 抽取的自由文本（如「月销80万」「80-100万」「2百万」）解析出代表月 GMV。
 * 解析不出时回退到 30 万（与现有 GMV_REP 默认一致）。
 * 注意：本函数会把数值「归档到区间中点」（repFromWan），适合卖家只给了区间时用。
 * 若卖家给了具体月销，请改用 gmvExactFromText —— 直接用真实值算，不再取中点。
 */
export function gmvRepFromText(text?: string): number {
  if (!text) return 300_000;
  const m = text.match(/(\d+(?:\.\d+)?)/);
  if (!m) return 300_000;
  let wan = parseFloat(m[1]);
  if (/亿/.test(text)) wan *= 10_000;
  else if (/千万/.test(text)) wan *= 1_000;
  else if (/百万/.test(text)) wan *= 100;
  // 不带「万/亿」且数值很大时，按「元」处理（如直接写 800000）。
  if (!/[万亿]/.test(text) && wan >= 10_000) return repFromWan(wan / 10_000);
  return repFromWan(wan);
}

/**
 * 解析卖家给出的「具体月销额」为元（CNY），不归档到区间中点 —— 算得更贴近真实。
 * 支持「35万」「2百万」「1.2千万」「3亿」「800000」等写法。解析不出时回退到区间逻辑。
 */
export function gmvExactFromText(text?: string): number {
  if (!text) return 300_000;
  const m = text.match(/(\d+(?:\.\d+)?)/);
  if (!m) return gmvRepFromText(text);
  let val = parseFloat(m[1]);
  if (/亿/.test(text)) val *= 100_000_000;
  else if (/千万/.test(text)) val *= 10_000_000;
  else if (/百万/.test(text)) val *= 1_000_000;
  else if (/万/.test(text)) val *= 10_000;
  // 不带单位的大数按「元」原样处理（如 800000）；小数（如 35）当作「万」更合理。
  else if (val < 10_000) val *= 10_000;
  return Math.round(val);
}

/**
 * 解析卖家给出的「回款/账期天数」。支持「90天」「3个月」「两个半月」≈数字+单位。
 * 解析不出时回退到默认账期。
 */
export function termDaysFromText(text?: string): number {
  if (!text) return DEFAULT_TERM_DAYS;
  const m = text.match(/(\d+(?:\.\d+)?)/);
  if (!m) return DEFAULT_TERM_DAYS;
  const num = parseFloat(m[1]);
  // 「月」优先于「天」：先判月，避免「3个月」里没有数字单位混淆。
  if (/月/.test(text)) return Math.round(num * 30);
  if (/周/.test(text)) return Math.round(num * 7);
  return Math.round(num);
}

export interface SellerFacts {
  painPrimary?: string;
  painDetail?: string;
  platform?: string;
  /** 月销区间（粗），如「20-50万」。卖家只给区间时用。 */
  gmvBand?: string;
  /** 具体月销额（细），如「35万」。给了就优先用它算 rep，不取区间中点。 */
  gmvExact?: string;
  /** 回款/账期天数，如「90天」「3个月」。驱动账压与可释放现金。 */
  termDays?: string;
  /** 想找的服务商大类（七大类 label，如「找物流」）。provider 线必填。 */
  serviceCategory?: string;
  /** 最怕踩的坑（自然语言，如「报价不透明」）。provider 线用于匹配。 */
  servicePain?: string;
}

export interface SellerEconomics {
  rep: number;
  /** 账压金额：被账期占用的现金（痛点金额）。 */
  cashLock: number;
  /** 服务成本可优化 / 月。 */
  costOptim: number;
  /** 旺季缺货风险 / 季。 */
  stockout: number;
  /** 月服务商账单（物流/仓储估算）。 */
  monthlyBill: number;
  /** 可释放现金：用 TermPay 延期这笔账单能放出来的现金（解药金额）。 */
  termpayRelease: number;
  /** TermPay 预估可用额度。 */
  termpayQuota: number;
  days: number;
}

const roundTo = (n: number, unit: number) => Math.round(n / unit) * unit;

/** 唯一算钱入口：把 AI 收集到的事实换成各项金额（全部可追溯到 COEF）。 */
export function diagnoseEconomics(
  facts: SellerFacts,
  // 账期天数：优先用卖家给的真实账期（facts.termDays），没有才回退默认 90 天。
  days: number = termDaysFromText(facts.termDays)
): SellerEconomics {
  // 给了具体月销就用真实值算（不取区间中点），算得更贴近卖家实际。
  const rep = facts.gmvExact ? gmvExactFromText(facts.gmvExact) : gmvRepFromText(facts.gmvBand);
  const monthlyBill = roundTo(rep * COEF.logisticsCostRate, 1_000);
  // 账压随真实账期缩放：11.85% 是 @90天基准的占压率，账期越长压得越多。
  // 🔴 暂定：线性缩放、基准 90 天，待 LD（06-10）确认占压率与账期的真实关系。
  const cashLockRaw = rep * COEF.cashLockRate * (days / DEFAULT_TERM_DAYS);
  return {
    rep,
    cashLock: roundTo(cashLockRaw, 1_000),
    costOptim: roundTo(rep * COEF.logisticsCostRate * COEF.compressibleRatio, 1_000),
    stockout: roundTo(rep * COEF.stockoutRate, 10_000),
    monthlyBill,
    termpayRelease: roundTo((monthlyBill * days) / 30, 1_000),
    termpayQuota: roundTo(rep * COEF.termpayMultiple, 10_000),
    days,
  };
}

export function fmtCNY(n: number): string {
  if (n >= 10_000) {
    const w = n / 10_000;
    return `¥${Number.isInteger(w) ? w : w.toFixed(1)} 万`;
  }
  return `¥${Math.round(n).toLocaleString("zh-CN")}`;
}
