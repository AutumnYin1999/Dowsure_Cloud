import { ArrowRight, Banknote, Bot, ChevronRight, Package, RotateCcw, Send, Wand2 } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import "./seller-desk.css";
import "./seller-chat.css";

/**
 * 豆服云统一对话式助手 —— /chat
 *
 * 入口先用「任务语言」做身份分流（Q0）：卖家线 / 服务商线，再用轻量问题（对话式收集）→ 出智能诊断。
 *   纯前端 mock，自包含示例数据；金额由透明 mock 系数估算（后续接后端/真实算法只需替换 diagnose）。
 *
 * ⚠️ 由原 /seller/chat 卖家对话版升级而来：①Q0 身份分流 ②卖家 / 服务商双线脚本。
 *    本步（Step 1）卖家线保持原有完整诊断；服务商线先跑通分流，诊断为占位（下一步完善）。
 *    CSS 仍沿用 .seller-chat 类。
 */

type Line = "seller" | "provider";

// ──────────────────────── 选项 ────────────────────────

// 卖家线：识别平台、月销、优先事项，再分流到服务商匹配或 TermPay 账期。
const PLATFORMS = ["Amazon + TikTok Shop", "Amazon", "TikTok Shop", "Temu", "SHEIN", "其他平台"];
const GMV_OPTIONS = ["月销 10 万以内", "月销 10-50 万", "月销 50-100 万", "月销 100-300 万", "月销 300 万以上"];
const SELLER_NEED_OPTIONS = ["找/换更靠谱的服务商", "服务商账单想晚点付", "两个都有，先帮我判断"];
const SERVICE_CATEGORY_OPTIONS = [
  "全球开店",
  "运营工具",
  "找物流",
  "海外仓储",
  "税务&合规",
  "跨境收款",
  "营销推广",
  "申诉服务",
];
const SERVICE_PAIN_OPTIONS = [
  "报价不透明，利润被附加费吃掉",
  "旺季时效不稳，怕断货/差评",
  "异常没人处理，退款和索赔没人扛",
  "不知道谁适合我的平台，怕换错服务商",
];
const TERMPAY_DAYS_OPTIONS = ["30 天以内", "30-60 天", "60-90 天", "90 天以上"];
const TERMPAY_USE_OPTIONS = ["付物流/海外仓账单", "付广告/营销账单", "补货备货", "几个账单都想缓一缓"];
const JUDGMENT_IMPACT_OPTIONS = [
  "服务商不稳定，导致成本/时效/售后问题",
  "服务商账单太早付，现金被压住",
  "两个都有，但不知道哪个更严重",
];
const JUDGMENT_NEXT_OPTIONS = [
  "先把服务商筛靠谱",
  "先把账期往后挪，缓一口现金流",
  "先帮我算哪个损失更大",
];

// 服务商线（七分类精简，见方案梳理结论四）
const PROVIDER_TYPES = ["物流 / 海外仓", "整合营销", "技术 / 工具（ERP·SaaS）", "其他"];
const PROVIDER_SCALE = ["年服务 <50 家卖家", "50 – 200 家", "200 – 500 家", "500 家以上"];
const PROVIDER_GOALS = [
  "多搞点客户（获客线索）",
  "给客户做账期但怕坏账",
  "想要品牌背书 / 曝光",
];

// ──────────────────────── 身份分流 Q0 ────────────────────────

interface IdentityOption {
  value: Line;
  label: string;
}

const IDENTITY = {
  prompt:
    "👋 我是豆服云助手。先帮你对上号——你现在最想先搞定哪件事？",
  placeholder: "点上面选一个，或直接说说你的情况",
  options: [
    { value: "seller", label: "我在平台卖货，钱卡在回款里 / 想找靠谱服务商" },
    { value: "provider", label: "我是服务商，想获客 / 给客户做账期" },
  ] as IdentityOption[],
  /** 自由打字时的身份兜底解析。 */
  parse: (text: string): Line | null => {
    const s = text.toLowerCase();
    if (/服务商|供应商|物流|海外仓|营销|获客|拓客|做账期|给客户/.test(s)) return "provider";
    if (/卖货|卖家|店铺|回款|账单|现金|备货|找服务商/.test(s)) return "seller";
    return null;
  },
};

// ──────────────────────── 问题脚本 ────────────────────────

interface QuestionDef {
  id: string;
  label: string; // 诊断回显用
  prompt: string;
  options: string[];
  placeholder: string;
  sample: string;
  parse: (text: string) => string | null;
}

const SELLER_BASE_QUESTIONS: QuestionDef[] = [
  {
    id: "platform",
    label: "主要平台",
    prompt: "第 1 / 5 题 — 你主要在哪个平台卖货？",
    options: PLATFORMS,
    placeholder: "点上面选一个，或直接打字，比如「Amazon + TikTok Shop」",
    sample: "Amazon + TikTok Shop",
    parse: (t) => {
      const s = t.toLowerCase();
      if (/amazon|亚马逊|亚马孙/.test(s) && /tiktok|tik tok|抖音|小店/.test(s)) return "Amazon + TikTok Shop";
      if (/amazon|亚马逊|亚马孙/.test(s)) return "Amazon";
      if (/tiktok|tik tok|抖音|小店/.test(s)) return "TikTok Shop";
      if (/temu|拼多多|多多/.test(s)) return "Temu";
      if (/shein/.test(s)) return "SHEIN";
      if (/其他|别的|ebay|易贝|独立站|shopify|自建站|官网/.test(s)) return "其他平台";
      return null;
    },
  },
  {
    id: "gmv",
    label: "月销售额",
    prompt: "第 2 / 5 题 — 你店铺每月的销售额大概是？",
    options: GMV_OPTIONS,
    placeholder: "选一个区间，或直接说「月销 10-50 万」",
    sample: "月销 10-50 万",
    parse: (t) => {
      const m = t.match(/(\d+(?:\.\d+)?)/);
      if (m) {
        let n = parseFloat(m[1]);
        if (/亿/.test(t)) n *= 10000;
        else if (/千万/.test(t)) n *= 1000;
        else if (/百万/.test(t)) n *= 100;
        if (n > 0) {
          if (n < 10) return "月销 10 万以内";
          if (n < 50) return "月销 10-50 万";
          if (n < 100) return "月销 50-100 万";
          if (n < 300) return "月销 100-300 万";
          return "月销 300 万以上";
        }
      }
      return null;
    },
  },
  {
    id: "sellerNeed",
    label: "优先事项",
    prompt: "第 3 / 5 题 — 现在最想先解决哪件事？",
    options: SELLER_NEED_OPTIONS,
    placeholder: "选一个方向，或直接说「想先找服务商」/「账单想晚点付」",
    sample: "两个都有，先帮我判断",
    parse: (t) => {
      const s = t.toLowerCase();
      if (/都有|两个|都要|判断|帮我看|先帮/.test(s)) return "两个都有，先帮我判断";
      if (/账单|账期|晚点|延期|延后|缓冲|分期|termpay|term pay|垫资/.test(s)) return "服务商账单想晚点付";
      if (/服务商|供应商|找|换|靠谱|物流|海外仓|广告|营销|运营|推荐/.test(s)) return "找/换更靠谱的服务商";
      return null;
    },
  },
];

const SELLER_SERVICE_QUESTIONS: QuestionDef[] = [
  {
    id: "serviceCategory",
    label: "服务商类型",
    prompt: "第 4 / 5 题 — 你现在想先看哪类服务商？",
    options: SERVICE_CATEGORY_OPTIONS,
    placeholder: "选一个服务商类型，比如「找物流」「海外仓储」「税务&合规」",
    sample: "找物流",
    parse: (t) => {
      const s = t.toLowerCase();
      if (/全球|开店|入驻|店铺注册|开户注册|账号/.test(s)) return "全球开店";
      if (/运营工具|工具|erp|saas|软件|系统|刊登|选品|数据/.test(s)) return "运营工具";
      if (/物流|货代|头程|尾程|专线|快递/.test(s)) return "找物流";
      if (/海外仓|仓储|仓库|仓配|一件代发/.test(s)) return "海外仓储";
      if (/税务|合规|vat|epr|认证|商标|法务/.test(s)) return "税务&合规";
      if (/收款|支付|回款|结汇|payoneer|pingpong|连连|空中云汇/.test(s)) return "跨境收款";
      if (/营销|推广|广告|投放|达人|红人|内容|kol/.test(s)) return "营销推广";
      if (/申诉|封号|冻结|绩效|侵权|解封|appeal/.test(s)) return "申诉服务";
      return null;
    },
  },
  {
    id: "servicePain",
    label: "最怕踩坑",
    prompt: "第 5 / 5 题 — 这一类服务商里，你最怕踩哪个坑？",
    options: SERVICE_PAIN_OPTIONS,
    placeholder: "选一个最担心的问题，比如「利润被附加费吃掉」「旺季怕断货」",
    sample: "报价不透明，利润被附加费吃掉",
    parse: (t) => {
      const s = t.toLowerCase();
      if (/报价|费用|隐藏|附加费|不透明|对账|贵|利润/.test(s)) return "报价不透明，利润被附加费吃掉";
      if (/旺季|时效|延误|不稳|慢|爆仓|断货|差评/.test(s)) return "旺季时效不稳，怕断货/差评";
      if (/异常|没人|响应|售后|赔付|丢件|破损|退款|索赔/.test(s)) return "异常没人处理，退款和索赔没人扛";
      if (/不知道|适合|匹配|靠谱|怎么选|平台|换错/.test(s)) return "不知道谁适合我的平台，怕换错服务商";
      return null;
    },
  },
];

const SELLER_TERMPAY_QUESTIONS: QuestionDef[] = [
  {
    id: "termDays",
    label: "账期目标",
    prompt: "第 4 / 5 题 — 服务商账单现在最想往后缓多久？",
    options: TERMPAY_DAYS_OPTIONS,
    placeholder: "选一个账期，比如「60-90 天」",
    sample: "60-90 天",
    parse: (t) => {
      if (/60\s*[-~到至]\s*90|60-90|60 到 90|两到三个月/.test(t)) return "60-90 天";
      if (/90|三个月|3个月|以上/.test(t)) return "90 天以上";
      if (/60|两个月|2个月/.test(t)) return "60-90 天";
      if (/30|一个月|1个月/.test(t)) return "30-60 天";
      if (/以内|十几|15|半个月/.test(t)) return "30 天以内";
      return null;
    },
  },
  {
    id: "termUse",
    label: "资金用途",
    prompt: "第 5 / 5 题 — 这笔账期空间，你最想先用来缓哪类账单？",
    options: TERMPAY_USE_OPTIONS,
    placeholder: "选一个，比如「付物流/海外仓账单」",
    sample: "付物流/海外仓账单",
    parse: (t) => {
      const s = t.toLowerCase();
      if (/物流|海外仓|仓储|货代|头程|尾程/.test(s)) return "付物流/海外仓账单";
      if (/广告|营销|投放|推广|达人|kol/.test(s)) return "付广告/营销账单";
      if (/补货|备货|库存|采购/.test(s)) return "补货备货";
      if (/都有|几个|全部|都想|账单/.test(s)) return "几个账单都想缓一缓";
      return null;
    },
  },
];

const SELLER_JUDGMENT_QUESTIONS: QuestionDef[] = [
  {
    id: "impactArea",
    label: "主要影响",
    prompt: "第 4 / 5 题 — 最近最影响你的，是哪一种？",
    options: JUDGMENT_IMPACT_OPTIONS,
    placeholder: "选一个，比如「服务商不稳定」或「现金被压住」",
    sample: "两个都有，但不知道哪个更严重",
    parse: (t) => {
      const s = t.toLowerCase();
      if (/服务商|不稳定|成本|时效|售后|履约|异常/.test(s)) return "服务商不稳定，导致成本/时效/售后问题";
      if (/账单|太早|现金|压住|账期|付款|回款/.test(s)) return "服务商账单太早付，现金被压住";
      if (/都有|两个|不知道|更严重|判断|都/.test(s)) return "两个都有，但不知道哪个更严重";
      return null;
    },
  },
  {
    id: "nextRelief",
    label: "先缓哪边",
    prompt: "第 5 / 5 题 — 如果只能先解决一个，哪个马上能让你轻松一点？",
    options: JUDGMENT_NEXT_OPTIONS,
    placeholder: "选一个，比如「先把服务商筛靠谱」",
    sample: "先帮我算哪个损失更大",
    parse: (t) => {
      const s = t.toLowerCase();
      if (/服务商|筛|靠谱|换|找|匹配/.test(s)) return "先把服务商筛靠谱";
      if (/账期|往后|现金|缓|账单|付款/.test(s)) return "先把账期往后挪，缓一口现金流";
      if (/算|损失|更大|判断|哪个|比较/.test(s)) return "先帮我算哪个损失更大";
      return null;
    },
  },
];

const PROVIDER_QUESTIONS: QuestionDef[] = [
  {
    id: "ptype",
    label: "服务类型",
    prompt: "好的～先认识下你的业务，你主要是做哪类服务的？",
    options: PROVIDER_TYPES,
    placeholder: "点上面选一个，或直接说「我做海外仓」",
    sample: "物流 / 海外仓",
    parse: (t) => {
      const s = t.toLowerCase();
      if (/物流|海外仓|仓储|货代|头程|尾程/.test(s)) return "物流 / 海外仓";
      if (/营销|投放|广告|红人|kol|内容|品牌推广/.test(s)) return "整合营销";
      if (/erp|saas|工具|软件|系统|建站|技术/.test(s)) return "技术 / 工具（ERP·SaaS）";
      if (/其他|别的|不是/.test(s)) return "其他";
      return null;
    },
  },
  {
    id: "scale",
    label: "业务体量",
    prompt: "了解～ 你现在的业务体量大概多大？（按一年服务的卖家数量大致估一下）",
    options: PROVIDER_SCALE,
    placeholder: "选一档，或直接说「一年大概服务一百多家」",
    sample: "200 – 500 家",
    parse: (t) => {
      const m = t.match(/(\d+(?:\.\d+)?)/);
      if (m) {
        let n = parseFloat(m[1]);
        if (/千/.test(t)) n *= 1000;
        else if (/百/.test(t)) n *= 100;
        if (n > 0) {
          if (n < 50) return "年服务 <50 家卖家";
          if (n < 200) return "50 – 200 家";
          if (n < 500) return "200 – 500 家";
          return "500 家以上";
        }
      }
      return null;
    },
  },
  {
    id: "pgoal",
    label: "最想先解决",
    prompt: "最后一个：眼下你最想先解决哪件事？",
    options: PROVIDER_GOALS,
    placeholder: "选一个，或跟我说说你的目标",
    sample: "给客户做账期但怕坏账",
    parse: (t) => {
      const s = t.toLowerCase();
      if (/客户|获客|线索|拓客|订单|生意/.test(s)) return "多搞点客户（获客线索）";
      if (/账期|坏账|垫资|回款|资金|分期/.test(s)) return "给客户做账期但怕坏账";
      if (/品牌|曝光|背书|展示|流量/.test(s)) return "想要品牌背书 / 曝光";
      return null;
    },
  },
];

function sellerQuestionsFor(answers: Record<string, string>): QuestionDef[] {
  const base = SELLER_BASE_QUESTIONS;
  if (answers.sellerNeed === "找/换更靠谱的服务商") return [...base, ...SELLER_SERVICE_QUESTIONS];
  if (answers.sellerNeed === "服务商账单想晚点付") return [...base, ...SELLER_TERMPAY_QUESTIONS];
  if (answers.sellerNeed === "两个都有，先帮我判断") return [...base, ...SELLER_JUDGMENT_QUESTIONS];
  return [...base, ...SELLER_JUDGMENT_QUESTIONS];
}

function questionsFor(line: Line, answers: Record<string, string> = {}): QuestionDef[] {
  return line === "seller" ? sellerQuestionsFor(answers) : PROVIDER_QUESTIONS;
}

function questionsOf(line: Line): QuestionDef[] {
  return questionsFor(line);
}

// ──────────────────────── 智能诊断（透明 mock，后续替换后端） ────────────────────────

/** GMV 档位 → 代表性月 GMV（元），用于金额估算。 */
const GMV_REP: Record<string, number> = {
  "月销 10 万以内": 60_000,
  "月销 10-50 万": 300_000,
  "月销 50-100 万": 750_000,
  "月销 100-300 万": 2_000_000,
  "月销 300 万以上": 5_000_000,
  "10 万以下": 60_000,
  "10 – 50 万": 300_000,
  "80 – 120 万": 1_000_000,
  "120 – 300 万": 2_000_000,
  "300 万以上": 5_000_000,
};

function fmtCNY(n: number): string {
  if (n >= 10_000) {
    const w = n / 10_000;
    return `¥${Number.isInteger(w) ? w : w.toFixed(1)} 万`;
  }
  return `¥${Math.round(n).toLocaleString("zh-CN")}`;
}

/**
 * 算钱系数总表（透明 mock，全部带来源背书，见 documents/方案梳理_2026-06-08.md §7）。
 * 红线：后续接后端/真实算法只换这一处，严禁把系数散落进 UI。
 */
const COEF = {
  /** 现金占压率：月 GMV × 11.85%（账压金额）。来源：JungleScout 痛点 + 卖家顾问实测 11.85%。 */
  cashLockRate: 0.1185,
  /** 缺货损失率：月 GMV × 10%（区间 7~14% 取中）。来源：亿邦 AWD 自动补货反推（缺货率↓15%、销售↑7-14%）。 */
  stockoutRate: 0.1,
  /** 机会成本粗算系数，保留给后续补货/周转测算使用。 */
  restockOpportunityRatio: 0.6,
  /** 物流仓储成本占营收比：17.5%（区间 15~20% 取中）。来源：亿邦商家财报抽样成本结构。 */
  logisticsCostRate: 0.175,
  /** 物流仓储中可压缩比例：15%（透明 mock 估算）。 */
  compressibleRatio: 0.15,
  /** TermPay/账期额度系数：月 GMV × 1.5（封顶 $100 万）。来源：豆分期产品介绍 PDF；对标 Payoneer×1.4 / Wayflyer×1.5-3，取区间下沿=安全牌。 */
  termpayMultiple: 1.5,

  // ── 服务商线 ──
  /** AI 拓客线索份数（按版本档）。来源：对服务商版 PDF（启航 20 / 跃升 80 / 领航 120）。 */
  leadTiers: { base: 20, growth: 80, premium: 120 },
  /** 每服务卖家年经手物流费/账单（元，mock 估算）。 */
  providerAnnualPerSeller: 300_000,
  /** 账期在途占年比例：90 天 ≈ 0.25（TermPay T+90 → 可提前回笼的在途资金）。 */
  termAdvanceShare: 0.25,
  /** 平台触达店铺数（话术用）。来源：对服务商版 PDF（豆沙包触达近 10 万店铺、服务超 1 万卖家）。 */
  platformReachShops: 100_000,
} as const;

/** 服务商「年服务卖家数」档位 → 代表值，用于账期/获客估算。 */
const SCALE_REP: Record<string, number> = {
  "年服务 <50 家卖家": 30,
  "50 – 200 家": 120,
  "200 – 500 家": 350,
  "500 家以上": 800,
};

function termDaysValue(answers: Record<string, string>): number {
  const label = answers.termDays ?? "";
  if (/90/.test(label)) return 90;
  if (/60/.test(label)) return 60;
  if (/30/.test(label)) return 30;
  return 90;
}

function sellerMonthlyServiceBill(answers: Record<string, string>): number | null {
  const label = answers.gmv;
  if (!label) return null;
  const rep = GMV_REP[label] ?? 300_000;
  return Math.round((rep * COEF.logisticsCostRate) / 1000) * 1000;
}

/** TermPay 账期缓冲空间（月服务商账单 × 期望账期 / 30；gmv 未答则为 null）。诊断与状态栏共用。 */
function sellerCredit(answers: Record<string, string>): number | null {
  const monthlyBill = sellerMonthlyServiceBill(answers);
  if (monthlyBill == null) return null;
  return Math.round(((monthlyBill * termDaysValue(answers)) / 30) / 1000) * 1000;
}

/** TermPay预估可用额度（月 GMV × termpayMultiple，四舍五入到万；gmv 未答则为 null）。 */
function termpayQuota(answers: Record<string, string>): number | null {
  const label = answers.gmv;
  if (!label) return null;
  const rep = GMV_REP[label] ?? 300_000;
  return Math.round((rep * COEF.termpayMultiple) / 10000) * 10000;
}

interface ServiceMatchSuggestion {
  category: string;
  reason: string;
  checks: string[];
  categories: {
    name: string;
    fit: string;
    note: string;
  }[];
  recommendations: {
    name: string;
    tag: string;
    note: string;
  }[];
}

interface PrioritySuggestion {
  first: "TermPay账期" | "服务商匹配";
  firstReason: string;
  second: "TermPay账期" | "服务商匹配";
  secondReason: string;
  signal: string;
}

interface ProviderCard {
  name: string;
  badge: "高级认证服务商" | "合作服务商";
  summary: string;
  fit: string;
  points: string[];
}

function logisticsProviderCards(answers: Record<string, string>): ProviderCard[] {
  const pain = answers.servicePain ?? "报价不透明，利润被附加费吃掉";
  const platform = answers.platform ?? "当前平台";
  const painCopy: Record<
    string,
    {
      xiyou: string;
      fanyuan: string;
      partner: string;
      xiyouPoints: string[];
      fanyuanPoints: string[];
      partnerPoints: string[];
    }
  > = {
    "报价不透明，利润被附加费吃掉": {
      xiyou:
        "西邮国际是豆沙包高级认证物流服务商，更偏成熟型的欧美链路和中大件履约服务。它的优势在头程、尾程、海外仓协同能力比较完整，正好对应你担心的“报价不透明”：豆沙包会优先帮你核对它能不能把头程、尾程、仓储和异常费拆清楚，避免后面被隐藏附加费吃掉利润。",
      fanyuan:
        "泛远物流也是高级认证服务商，更偏综合跨境物流和多平台履约服务。推荐它，是因为它可以和西邮形成报价口径对照：同一票货、同一线路下，豆沙包可以帮你比较燃油、偏远、仓内操作和异常处理费，判断哪家的费用结构更清楚。",
      partner:
        "这家是豆沙包合作物流服务商，更适合作为价格参照和补充候选。它的作用不是直接替代前两家，而是帮你看市场报价底线；如果它的附加费、对账周期和赔付口径不够清楚，就不建议优先放量。",
      xiyouPoints: ["先拆头程/尾程/仓储费", "适合欧美中大件链路", "用于锁定主履约方案"],
      fanyuanPoints: ["对比综合报价口径", "核对多平台订单费用", "适合做第二主候选"],
      partnerPoints: ["用于压实市场价", "验证隐藏费用", "不清楚则降级备选"],
    },
    "旺季时效不稳，怕断货/差评": {
      xiyou:
        "西邮国际是豆沙包高级认证物流服务商，更偏欧美链路、中大件履约和海外仓协同。这个能力和你担心的“旺季断货/差评”直接相关：如果它能提前锁定旺季入仓节奏、头程安排和尾程稳定性，就能降低旺季履约延误带来的断货风险。",
      fanyuan:
        "泛远物流是高级认证服务商，更偏综合跨境物流和多平台订单承接。推荐它作为第二主候选，是因为它可以补充备选线路和多平台履约能力，当主线路波动时，豆沙包可以帮你判断它是否能承担分流和应急履约。",
      partner:
        "这家合作物流服务商更适合作为备用线路测试对象。它的价值在于小单试跑和补充运力，不建议一开始承接全部订单；这样可以避免旺季只押一家服务商，降低断货和延误风险。",
      xiyouPoints: ["验证旺季履约稳定性", "海外仓/头程协同", "适合主线路候选"],
      fanyuanPoints: ["补充备选线路", "对比多平台履约", "看异常转运能力"],
      partnerPoints: ["小单测试备用线路", "看响应速度", "避免单一服务商风险"],
    },
    "异常没人处理，退款和索赔没人扛": {
      xiyou:
        "西邮国际是豆沙包高级认证物流服务商，更偏欧美链路、海外仓和尾程协同。这个能力适合处理你担心的“异常没人扛”：跨环节服务越多，越需要明确固定对接人、异常响应时限和赔付口径，豆沙包会优先帮你核对这些服务边界。",
      fanyuan:
        "泛远物流是高级认证服务商，更偏综合跨境物流和数字化履约。推荐它，是因为它可以作为服务流程对照：豆沙包会重点看它的异常工单流转、首次响应速度、赔付规则和售后跟进机制，判断它能不能减少退款和索赔成本。",
      partner:
        "这家合作物流服务商适合做服务边界测试。它可以参与报价和小单履约，但如果异常处理、赔付规则和售后响应不够清楚，就不适合承接高客单价或差评敏感的订单。",
      xiyouPoints: ["先看专属对接机制", "核对赔付口径", "适合异常敏感订单"],
      fanyuanPoints: ["对照工单响应", "核对服务 SLA", "看售后处理流程"],
      partnerPoints: ["测试服务边界", "不适合高风险订单", "赔付不清则降级"],
    },
    "不知道谁适合我的平台，怕换错服务商": {
      xiyou:
        `西邮国际是豆沙包高级认证物流服务商，更适合欧美链路、中大件履约和海外仓协同。你现在担心的是“换错服务商”，所以豆沙包会优先核对它有没有和 ${platform}、相近体量、相近品类相关的服务经验，再判断它是否适合作为主候选。`,
      fanyuan:
        `泛远物流是高级认证服务商，更偏综合跨境物流和多平台履约。推荐它，是因为它可以作为平台适配度对照：豆沙包会看它是否服务过 ${platform} 卖家、订单结构是否相似、系统对接和售后流程是否成熟，避免只看名气不看匹配度。`,
      partner:
        "这家合作物流服务商适合作为低风险试单对象。它不一定是第一选择，但可以用少量订单测试报价、时效、响应和对账稳定性，帮助你在正式切换前降低试错成本。",
      xiyouPoints: ["先要同平台案例", "验证相近体量经验", "适合主候选筛选"],
      fanyuanPoints: ["对照平台适配度", "看系统/售后成熟度", "避免只看品牌名气"],
      partnerPoints: ["适合小单试跑", "测试实际履约", "再决定是否放量"],
    },
  };
  const copy = painCopy[pain] ?? painCopy["报价不透明，利润被附加费吃掉"];

  return [
    {
      name: "西邮国际",
      badge: "高级认证服务商",
      summary: "更适合关注欧美链路、中大件履约、海外仓与头程协同的卖家。",
      fit: copy.xiyou,
      points: copy.xiyouPoints,
    },
    {
      name: "泛远物流",
      badge: "高级认证服务商",
      summary: "更适合希望用综合跨境物流和数字化履约能力承接多平台订单的卖家。",
      fit: copy.fanyuan,
      points: copy.fanyuanPoints,
    },
    {
      name: "合作物流商 A",
      badge: "合作服务商",
      summary: "作为补充候选，用来对比价格结构、响应速度和服务边界。",
      fit: copy.partner,
      points: copy.partnerPoints,
    },
  ];
}

function sellerServiceLeadParts(answers: Record<string, string>): string[] {
  const platform = answers.platform ?? "你的平台";
  const category = answers.serviceCategory ?? "物流服务商";
  const pain = answers.servicePain ?? "报价不透明，利润被附加费吃掉";
  const monthlyBill = sellerMonthlyServiceBill(answers) ?? 52_000;
  const gmv = GMV_REP[answers.gmv ?? ""] ?? 300_000;
  const hiddenCost = Math.round((monthlyBill * 0.08) / 1000) * 1000;
  const stockoutLoss = Math.round((gmv * 0.08) / 10000) * 10000;
  const exceptionCost = Math.round((monthlyBill * 0.06) / 1000) * 1000;
  const switchCost = Math.round((monthlyBill * 0.12) / 1000) * 1000;
  const painSummary: Record<string, { focus: string; money: string }> = {
    "报价不透明，利润被附加费吃掉": {
      focus: "不是先比最低价，而是先把报价拆分、隐藏费用和对账口径看清楚",
      money: `按你当前月销估算，物流/仓储类账单大概在 ${fmtCNY(monthlyBill)}/月；如果附加费多吃掉 8%，一个月就可能多花约 ${fmtCNY(hiddenCost)}。`,
    },
    "旺季时效不稳，怕断货/差评": {
      focus: "不是先找更多线路，而是先确认旺季时效、扩容能力和备选方案",
      money: `按你当前月销估算，旺季断货或履约延误带来的销售损失可能达到约 ${fmtCNY(stockoutLoss)}/月级别。`,
    },
    "异常没人处理，退款和索赔没人扛": {
      focus: "不是先看报价，而是先确认异常响应、赔付规则和专属对接机制",
      money: `按物流/仓储账单粗算，异常处理不清晰可能每月额外拖出约 ${fmtCNY(exceptionCost)} 的退款、赔付或人工对账成本。`,
    },
    "不知道谁适合我的平台，怕换错服务商": {
      focus: "不是先拉一堆名单，而是先找有同平台、同体量案例的服务商",
      money: `如果换错服务商，试错成本通常不只是一单运费，按你当前体量可能至少影响约 ${fmtCNY(switchCost)} 的履约和对接成本。`,
    },
  };
  const summary = painSummary[pain] ?? painSummary["报价不透明，利润被附加费吃掉"];

  return [
    `我先按你「${platform}」和「${category}」的情况看了一下：你现在遇到的难题，核心是「${pain}」。`,
    `${summary.focus}。${summary.money}`,
    "豆沙包这边有一批合作物流服务商，也会区分高级认证服务商和普通合作服务商，可以帮你先把不适合的候选筛掉。下面是豆沙包给你的专属推荐。",
  ];
}

function selectedServiceCategorySuggestion(category?: string): ServiceMatchSuggestion | null {
  switch (category) {
    case "全球开店":
      return {
        category: "全球开店 / 平台入驻服务商",
        reason: "你现在更像是在扩新平台或新站点，优先看能处理开户注册、资料准备、平台规则和开店节奏的服务商。",
        checks: ["熟悉目标平台入驻规则", "能说明开户注册所需材料和周期", "有同平台开店成功案例"],
        categories: [
          { name: "平台入驻", fit: "优先", note: "先把账号、店铺和基础资料跑通。" },
          { name: "合规资料", fit: "重点", note: "避免因为资料或主体问题卡审核。" },
          { name: "运营启动", fit: "后续", note: "开店后再接工具、物流和投放服务。" },
        ],
        recommendations: [
          { name: "平台入驻服务商", tag: "先看", note: "重点比较开店周期、资料清单和平台经验。" },
          { name: "合规资料服务商", tag: "备选", note: "适合主体、税号、认证资料还不完整的卖家。" },
        ],
      };
    case "运营工具":
      return {
        category: "运营工具 / ERP·SaaS 服务商",
        reason: "你现在更需要把订单、库存、刊登、数据复盘这些基础动作系统化，先减少人工操作和信息断点。",
        checks: ["能覆盖当前平台", "库存和订单同步稳定", "报价按模块拆清楚"],
        categories: [
          { name: "ERP / 订单", fit: "优先", note: "先管订单、库存和发货状态。" },
          { name: "数据分析", fit: "次优先", note: "适合想看利润、广告和 SKU 表现的店铺。" },
          { name: "自动化工具", fit: "后续", note: "基础流程稳定后再看效率提升。" },
        ],
        recommendations: [
          { name: "跨境 ERP 服务商", tag: "先看", note: "重点比较平台覆盖、库存同步和售后响应。" },
          { name: "经营数据工具", tag: "备选", note: "适合想先把利润、广告和动销看清楚的卖家。" },
        ],
      };
    case "找物流":
      return {
        category: "跨境物流服务商",
        reason: "你现在优先关心发货链路，先把头程、尾程、时效、异常和费用结构看明白。",
        checks: ["有同平台同体量案例", "旺季时效和价格稳定", "附加费、异常费、赔付规则清晰"],
        categories: [
          { name: "头程物流", fit: "优先", note: "先看价格、时效、清关和旺季稳定性。" },
          { name: "尾程配送", fit: "重点", note: "适合投诉、延误、签收异常较多的店铺。" },
          { name: "账期支持", fit: "补充", note: "物流账单变大后，再用 TermPay 后置付款。" },
        ],
        recommendations: [
          { name: "跨境物流服务商", tag: "先看", note: "重点比较同平台案例、报价透明度和异常响应。" },
          { name: "专线物流服务商", tag: "备选", note: "适合单一区域订单集中、追求时效稳定的卖家。" },
        ],
      };
    case "海外仓储":
      return {
        category: "海外仓储服务商",
        reason: "你现在更像是库存和履约节奏需要稳定，优先看仓储、库内操作、尾程和退换货处理能力。",
        checks: ["库内操作费拆分清晰", "尾程渠道稳定", "退换货和异常响应有 SLA"],
        categories: [
          { name: "海外仓", fit: "优先", note: "先看仓租、操作费、尾程和库龄管理。" },
          { name: "一件代发", fit: "重点", note: "适合订单分散、SKU 多的店铺。" },
          { name: "库存周转", fit: "补充", note: "结合销售节奏看补货和滞销风险。" },
        ],
        recommendations: [
          { name: "海外仓服务商", tag: "先看", note: "重点比较库内费用、尾程渠道和异常处理。" },
          { name: "仓配一体服务商", tag: "备选", note: "适合想把仓储和配送一起托管的卖家。" },
        ],
      };
    case "税务&合规":
      return {
        category: "税务&合规服务商",
        reason: "你现在优先要降低规则和资质风险，先看 VAT、EPR、认证、商标等合规服务是否覆盖目标市场。",
        checks: ["覆盖目标国家/地区", "能解释申报周期和材料要求", "有异常处理和续费提醒机制"],
        categories: [
          { name: "VAT / 税务", fit: "优先", note: "先处理申报、税号和周期提醒。" },
          { name: "EPR / 认证", fit: "重点", note: "适合欧洲、平台合规要求较多的卖家。" },
          { name: "商标 / 法务", fit: "后续", note: "适合品牌化和侵权风险较高的店铺。" },
        ],
        recommendations: [
          { name: "跨境税务服务商", tag: "先看", note: "重点比较国家覆盖、申报节奏和异常处理。" },
          { name: "合规认证服务商", tag: "备选", note: "适合 EPR、产品认证、平台资料补齐。" },
        ],
      };
    case "跨境收款":
      return {
        category: "跨境收款服务商",
        reason: "你现在优先关心回款、结汇和资金路径，先看收款覆盖、费率、到账速度和账户稳定性。",
        checks: ["支持当前平台和站点", "费率和结汇成本清晰", "账户风控和异常处理机制明确"],
        categories: [
          { name: "平台收款", fit: "优先", note: "先看平台覆盖、到账速度和稳定性。" },
          { name: "结汇 / 换汇", fit: "重点", note: "适合多币种、多市场经营的卖家。" },
          { name: "账期金融", fit: "补充", note: "收款之外，再看 TermPay 解决服务商账单付款。" },
        ],
        recommendations: [
          { name: "跨境收款服务商", tag: "先看", note: "重点比较平台支持、费率和到账周期。" },
          { name: "多币种资金账户", tag: "备选", note: "适合多平台、多国家同时经营的卖家。" },
        ],
      };
    case "营销推广":
      return {
        category: "营销推广服务商",
        reason: "你现在优先要把流量和转化跑起来，先看广告投放、内容、达人和复盘能力是否能闭环。",
        checks: ["有同平台同类目案例", "能拆内容、达人、投放和转化数据", "报价不只按打包项目粗略收费"],
        categories: [
          { name: "广告投放", fit: "优先", note: "先看预算、转化和复盘节奏。" },
          { name: "内容 / 达人", fit: "重点", note: "适合 TikTok Shop 或内容驱动型店铺。" },
          { name: "品牌推广", fit: "后续", note: "基础转化稳定后再做品牌放大。" },
        ],
        recommendations: [
          { name: "广告投放服务商", tag: "先看", note: "重点比较同类目案例、预算效率和复盘机制。" },
          { name: "内容达人服务商", tag: "备选", note: "适合 TikTok Shop、独立站和内容种草场景。" },
        ],
      };
    case "申诉服务":
      return {
        category: "申诉服务商",
        reason: "你现在优先要处理账号、绩效、侵权或资金冻结等风险，先找熟悉平台规则和申诉材料的服务商。",
        checks: ["熟悉对应平台申诉规则", "能说明材料清单和处理周期", "不承诺包过，过程透明"],
        categories: [
          { name: "账号申诉", fit: "优先", note: "先处理封号、绩效、资金冻结等紧急事项。" },
          { name: "侵权处理", fit: "重点", note: "适合商标、版权、专利相关投诉。" },
          { name: "合规复盘", fit: "后续", note: "申诉后再补规则和流程，避免复发。" },
        ],
        recommendations: [
          { name: "平台申诉服务商", tag: "先看", note: "重点比较平台经验、材料准备和过程透明度。" },
          { name: "合规风控服务商", tag: "备选", note: "适合申诉后想做长期风险预防的卖家。" },
        ],
      };
    default:
      return null;
  }
}

function serviceMatchSuggestion(answers: Record<string, string>): ServiceMatchSuggestion {
  const selected = selectedServiceCategorySuggestion(answers.serviceCategory);
  if (selected) return selected;

  const platform = answers.platform ?? "";
  if (/TikTok/.test(platform) && !/Amazon/.test(platform)) {
    return {
      category: "内容营销 / 广告投放服务商",
      reason: "TikTok Shop 更容易先卡在内容节奏、达人资源和投放效率上，先把成交链路跑顺，比盲目换履约商更有效。",
      checks: ["有 TikTok Shop 同类目案例", "能同时做内容、达人和投放复盘", "报价按项目拆清楚，不只给打包价"],
      categories: [
        { name: "内容营销", fit: "优先", note: "先解决达人、短视频素材和投放节奏。" },
        { name: "广告投放", fit: "次优先", note: "适合已经有素材，但转化不稳定的店铺。" },
        { name: "物流 / 海外仓", fit: "观察", note: "订单起来后再看履约稳定性和尾程成本。" },
      ],
      recommendations: [
        { name: "TikTok Shop 增长型服务商", tag: "先看", note: "能把内容、达人、投放放在同一个复盘节奏里。" },
        { name: "跨境广告投放服务商", tag: "备选", note: "适合已有内容团队，但投放效率需要优化。" },
      ],
    };
  }
  if (/Temu|SHEIN/.test(platform)) {
    return {
      category: "履约 / 合规 / 供应链服务商",
      reason: "这类平台对履约稳定、规则响应和供应链节奏要求更高，优先找能降低出错率的服务商。",
      checks: ["熟悉平台履约和处罚规则", "能处理旺季订单波动", "异常响应有明确 SLA"],
      categories: [
        { name: "履约 / 合规", fit: "优先", note: "减少规则误踩、履约异常和处罚风险。" },
        { name: "供应链协同", fit: "次优先", note: "适合订单波动大、备货节奏不稳的卖家。" },
        { name: "账期支持", fit: "补充", note: "账单压力上来后，再接 TermPay 延后付款。" },
      ],
      recommendations: [
        { name: "平台履约服务商", tag: "先看", note: "熟悉平台规则，能把异常率和响应时效说清楚。" },
        { name: "供应链协同服务商", tag: "备选", note: "适合多 SKU、旺季波动明显的店铺。" },
      ],
    };
  }
  if (/Amazon \+ TikTok Shop/.test(platform)) {
    return {
      category: "跨平台物流 / 海外仓服务商",
      reason: "你同时做 Amazon 和 TikTok Shop，最容易先卡在多平台库存、发货节奏和费用透明度上。",
      checks: ["有 Amazon / TikTok Shop 双平台经验", "旺季能扩容，不临时涨价", "仓储、尾程、附加费拆得明白"],
      categories: [
        { name: "跨平台物流", fit: "优先", note: "先把 Amazon 和 TikTok Shop 的发货节奏统一起来。" },
        { name: "海外仓", fit: "重点", note: "适合库存分散、尾程成本不透明的店铺。" },
        { name: "账期支持", fit: "补充", note: "服务商账单变大后，用 TermPay 把付款节奏后置。" },
      ],
      recommendations: [
        { name: "跨平台物流服务商", tag: "先看", note: "重点比较双平台经验、旺季 SLA 和费用拆分。" },
        { name: "海外仓服务商", tag: "备选", note: "重点比较库内操作费、尾程价格和异常响应。" },
      ],
    };
  }
  return {
    category: "跨境物流 / 海外仓服务商",
    reason: "按你当前平台和月销体量，先把履约稳定、时效和费用透明度理顺，通常比一次性换很多工具更稳。",
    checks: ["有同平台同体量卖家案例", "旺季可扩容，异常响应快", "报价结构清楚，可对账"],
    categories: [
      { name: "跨境物流", fit: "优先", note: "先看头程、尾程、异常处理和价格稳定性。" },
      { name: "海外仓", fit: "次优先", note: "适合库存周转慢、订单履约压力大的卖家。" },
      { name: "营销 / 运营", fit: "后续", note: "履约稳定后，再看流量和转化效率。" },
    ],
    recommendations: [
      { name: "跨境物流服务商", tag: "先看", note: "重点比较同平台案例、报价透明度和异常响应。" },
      { name: "海外仓服务商", tag: "备选", note: "适合想把库存和尾程稳定性先管起来的卖家。" },
    ],
  };
}

function sellerPrioritySuggestion(answers: Record<string, string>): PrioritySuggestion {
  const monthlyBill = sellerMonthlyServiceBill(answers) ?? 0;
  const gmv = GMV_REP[answers.gmv ?? ""] ?? 300_000;
  const serviceFirst =
    answers.impactArea === "服务商不稳定，导致成本/时效/售后问题" ||
    answers.nextRelief === "先把服务商筛靠谱";
  const termFirst =
    answers.impactArea === "服务商账单太早付，现金被压住" ||
    answers.nextRelief === "先把账期往后挪，缓一口现金流";

  if (serviceFirst && !termFirst) {
    return {
      first: "服务商匹配",
      firstReason:
        "你现在最直接的损失来自服务商不稳定：报价、时效、售后或异常处理一旦失控，利润和店铺评分都会被拖住。先把服务商筛靠谱，比马上上账期工具更能减少试错成本。",
      second: "TermPay账期",
      secondReason:
        "等服务商方向和账单口径确认后，再用 TermPay 把付款周期往后挪，账期工具的价值会更清楚。",
      signal: "服务商稳定性优先",
    };
  }

  if (termFirst && !serviceFirst) {
    return {
      first: "TermPay账期",
      firstReason: `你现在的痛点更像是账单付款早于平台回款。按当前体量，物流、仓储、广告等服务商账单约 ${fmtCNY(
        monthlyBill
      )}/月，先把付款周期往后挪，现金流压力会更快下降。`,
      second: "服务商匹配",
      secondReason:
        "账期缓下来后，再筛物流/海外仓或营销服务商，谈判空间更大，也更不容易因为现金紧而被动接受报价。",
      signal: "账期压力优先",
    };
  }

  if (monthlyBill >= 50_000 || gmv >= 300_000) {
    return {
      first: "TermPay账期",
      firstReason: `你现在月销体量已经会产生约 ${fmtCNY(
        monthlyBill
      )}/月 的物流、仓储、广告等服务商账单，先把 90 天账期缓下来，周转压力会更快下降。`,
      second: "服务商匹配",
      secondReason: "账期缓下来后，再筛物流/海外仓或营销服务商，谈判空间更大，也更不容易因为现金紧而被动接受报价。",
      signal: "账单压力优先",
    };
  }
  return {
    first: "服务商匹配",
    firstReason: "你当前体量还在打基础，先把履约、投放或运营服务商选稳，比立刻上账期工具更能减少试错成本。",
    second: "TermPay账期",
    secondReason: "当月服务商账单持续放大后，再用 TermPay 把账单延后到 60-90 天，会更容易看出价值。",
    signal: "能力补齐优先",
  };
}

/** TermPay 资金路径（竖向时间线，对话卡内展示；含义同原 TermPayFlowCard）。 */
const TERMPAY_FLOW: { t: string; d: string }[] = [
  { t: "卖家获得额度", d: "TermPay 完成卖家风控评估，由资金方授出可用额度" },
  { t: "选择服务商账单", d: "卖家选择待支付的物流、海外仓、广告、采购账单" },
  { t: "选择延期 / 分期", d: "卖家选择延后或分期方案，TermPay 展示还款计划" },
  { t: "签署电子协议", d: "卖家、服务商、资金方三方完成电子签约" },
  { t: "资金支付至服务商", d: "资金方把账单金额直接打款到服务商账户" },
  { t: "卖家按约还款", d: "卖家按约定节奏向资金方还款，状态同步给服务商" },
];

interface Kpi {
  k: string;
  v: number;
  /** 自定义显示文案；缺省则用 fmtCNY(v)。服务商线「线索份数」等非金额指标用它。 */
  display?: string;
  note: string;
  focus: boolean;
}
interface Dim {
  title: string;
  tone: "warn" | "risk" | "good";
  tag: string;
  insight: string;
  direction: string;
}
interface Diagnosis {
  headline: string;
  kpis: Kpi[];
  dims: Dim[];
}

function diagnoseSeller(answers: Record<string, string>): Diagnosis {
  const platform = answers.platform ?? "你的平台";
  const gmvLabel = answers.gmv ?? "当前体量";
  const concern = answers.concern ?? "经营效率";
  const rep = GMV_REP[gmvLabel] ?? 300_000;

  // 系数全部来自 COEF（有背书，见方案梳理 §7）
  const waste =
    Math.round((rep * COEF.logisticsCostRate * COEF.compressibleRatio) / 1000) * 1000; // 物流仓储 17.5% × 可压缩 15%
  const credit = sellerCredit(answers) ?? Math.round((rep * COEF.cashLockRate) / 1000) * 1000; // 现金占压 11.85%
  const stockout = Math.round((rep * COEF.stockoutRate) / 10000) * 10000; // 缺货损失 10%

  const focusCredit = concern === "账单压力大";
  const focusCost = concern === "成本太高";
  const focusStock = !focusCredit && !focusCost;

  const kpis: Kpi[] = [
    {
      k: "服务成本可优化 / 月",
      v: waste,
      note: "物流仓储约占营收 15–20%（亿邦财报抽样），其中约 15% 来自可压缩的低效环节",
      focus: focusCost,
    },
    {
      k: "账期占用资金",
      v: credit,
      note: "账单到期常早于平台回款，约 11.85% 销售额压在回款里（行业实测）",
      focus: focusCredit,
    },
    {
      k: "旺季缺货风险 / 季",
      v: stockout,
      note: "旺季断货潜在销售损失，约月 GMV 的 10%（亿邦 AWD 反推 7–14%）",
      focus: focusStock,
    },
  ];

  const dims: Dim[] = [
    {
      title: "成本结构",
      tone: focusCost ? "risk" : "warn",
      tag: focusCost ? "重点" : "可优化",
      insight: `月 GMV ${gmvLabel} 体量下，服务费里通常有可优化空间，按经验约 ${fmtCNY(
        waste
      )}/月 来自低效环节。`,
      direction: "用透明比价 + 服务商匹配，先把这部分浪费压下来。",
    },
    {
      title: "现金流 / 账期",
      tone: focusCredit ? "risk" : "warn",
      tag: focusCredit ? "重点" : "需关注",
      insight: `估算约有 ${fmtCNY(
        credit
      )} 资金被账期占用——约相当于 11.85% 的月销售额压在回款里，旺季尤其紧。`,
      direction: "用TermPay延期物流/仓储账单，理顺回款节奏、把这笔现金先释放出来。",
    },
    {
      title: "履约 / 服务稳定",
      tone: focusStock ? "risk" : "good",
      tag: focusStock ? "重点" : "尚可",
      insight: `旺季履约一旦掉链子，潜在销售损失估算约 ${fmtCNY(
        stockout
      )}/季，服务商稳定性是关键变量。`,
      direction: "优先选稳定性高、旺季能扩容、且有对应平台经验的服务商。",
    },
  ];

  const headline = `按你「${platform} · 月GMV ${gmvLabel}」来看，你点的最头疼是「${concern}」。我扫了一遍经营面，下面是诊断重点 👇`;

  return { headline, kpis, dims };
}

// ──────────────────────── 服务商线：推荐权益版本（透明 mock） ────────────────────────

interface BenefitLine {
  name: string;
  hot?: boolean; // TermPay组合高亮（与卖家线的咬合点）
}
interface ProviderRec {
  versionId: "base" | "growth" | "term" | "premium";
  versionName: string;
  versionShort: string; // 状态栏用
  price: number;
  leads: number; // AI 拓客线索份数
  benefits: BenefitLine[];
  highlight: boolean; // 是否高亮TermPay组合
  reason: string;
}

/** 服务商年经手物流费/账单（年服务卖家数 × 每卖家年经手；scale 未答则 null）。 */
function providerAnnualVolume(answers: Record<string, string>): number | null {
  const label = answers.scale;
  if (!label) return null;
  const sellers = SCALE_REP[label] ?? 120;
  return sellers * COEF.providerAnnualPerSeller;
}

/** TermPay可提前回笼资金（年经手 × 账期在途占比）。 */
function providerTermAdvance(answers: Record<string, string>): number | null {
  const vol = providerAnnualVolume(answers);
  if (vol == null) return null;
  return Math.round((vol * COEF.termAdvanceShare) / 10000) * 10000;
}

/**
 * 按「服务类型 + 体量 + 目标」推荐一个权益版本。
 * 版本与价格对齐 src/data/knowledgeBase.ts 的真实权益（基础包 28,888 起）。
 */
function recommendProvider(answers: Record<string, string>): ProviderRec {
  const scaleRep = SCALE_REP[answers.scale ?? ""] ?? 120;
  const goal = answers.pgoal ?? "";
  const isTerm = goal.includes("账期");
  const isBrand = goal.includes("品牌");
  const isBig = scaleRep >= 500;
  const isLogistics = (answers.ptype ?? "").startsWith("物流");

  // 账期目标 → 账期增值版（高亮TermPay组合，咬合卖家线）
  if (isTerm) {
    return {
      versionId: "term",
      versionName: "账期增值版（基础包 + TermPay组合）",
      versionShort: "账期增值版",
      price: 28_888 + 20_000 + 100_000, // 基础包 + 嵌入式端口 + 风控模型
      leads: COEF.leadTiers.base,
      benefits: [
        { name: "豆服云基础包（展示位 + AI 拓客启航 20 份 + 100 万提现券）" },
        { name: "嵌入式金融跳转端口（公众号 / 网页客户后台 / ERP / 独立站嵌入）", hot: true },
        { name: "账期优化风控模型（覆盖流水 / 履约 / 信用，输出评分报告）", hot: true },
        { name: "TermPay服务（放款直达你账户，T+30/60/90 受托支付）", hot: true },
      ],
      highlight: true,
      reason:
        "你最想给客户做账期又怕坏账——这正是TermPay的主场：嵌入式端口把账期入口接进你的系统，风控模型压坏账，放款由资金方直达你的账户，你提前收款、零坏账。",
    };
  }
  // 品牌目标 / 大体量 → 升级尊享版
  if (isBrand || isBig) {
    return {
      versionId: "premium",
      versionName: "升级尊享版（基础包 + 领航拓客 + 深度营销）",
      versionShort: "升级尊享版",
      price: 28_888 + 400_000,
      leads: COEF.leadTiers.premium,
      benefits: [
        { name: "豆服云基础包（展示位 + AI 拓客启航 20 份 + 100 万提现券）" },
        {
          name: isLogistics
            ? "AI 智能拓客领航版（120+ 份分析 + 资深销售 20 次线下指导，含≥5 个月均 200 万物流费的 T0/T1 大卖）"
            : "AI 智能拓客领航版（120+ 份深度分析报告 + 资深销售 20 次线下指导）",
        },
        { name: "AI 品牌营销赋能 + 大卖有约曝光" },
        { name: "TermPay服务（给客户做账期 / 大额应收提前回款）", hot: true },
      ],
      highlight: false,
      reason: isLogistics
        ? "你是物流服务商、体量也够：领航版 120 份线索 + 深度营销，还含至少 5 个「月均 200 万物流费」的亿级到十亿级（T0/T1）大卖线下营销指导，直接对接头部货量客户。"
        : "你的体量和品牌诉求够撑起全链路打法：领航版 120 份线索 + 深度营销，把平台流量扶持（服务商第一需求 69.1%）吃满。",
    };
  }
  // 获客目标 / 中体量 → 获客增长版
  if (goal.includes("客户") || scaleRep >= 200) {
    return {
      versionId: "growth",
      versionName: "获客增长版（基础包 + 跃升拓客 + Banner）",
      versionShort: "获客增长版",
      price: 28_888 + 50_000 + 20_000,
      leads: COEF.leadTiers.growth,
      benefits: [
        { name: "豆服云基础包（展示位 + AI 拓客启航 20 份 + 100 万提现券）" },
        { name: "AI 智能拓客跃升版（80 份深度分析报告，瞄准腰部以上卖家）" },
        { name: "平台首页 Banner 位（品牌曝光）" },
        { name: "TermPay服务（给客户做账期 / 大额应收提前回款）", hot: true },
      ],
      highlight: false,
      reason:
        "获客难是服务商第一痛点（内部问卷 43.48% 居首）。跃升版 80 份线索直接喂你的销售管道，Banner 补品牌曝光。",
    };
  }
  // 小体量 → 基础启航版
  return {
    versionId: "base",
    versionName: "基础启航版（必选基础包）",
    versionShort: "基础启航版",
    price: 28_888,
    leads: COEF.leadTiers.base,
    benefits: [
      { name: "豆服云平台固定展示位" },
      { name: "AI 智能拓客启航版（20 份数据分析报告）" },
      { name: "100 万美金提现优惠券（必选 28,888 以提现券形式全额返还）" },
      { name: "TermPay服务（给客户做账期 / 大额应收提前回款）", hot: true },
    ],
    highlight: false,
    reason:
      "先用必选基础包把展示位、20 份线索和账期金融能力跑起来，体量起来后再升获客增长 / 升级尊享版。",
  };
}

/**
 * 服务商线诊断 —— 获客 / 账期（TermPay）/ 品牌三类价值 + 推荐权益版本。
 * 系数集中在 COEF（见方案梳理结论三/四）；推荐版本见 recommendProvider。
 */
function diagnoseProvider(answers: Record<string, string>): Diagnosis {
  const ptype = answers.ptype ?? "服务商";
  const scale = answers.scale ?? "当前体量";
  const goal = answers.pgoal ?? "增长";
  const rec = recommendProvider(answers);
  const advance = providerTermAdvance(answers) ?? 0;
  const annual = providerAnnualVolume(answers) ?? 0;

  const focusLead = goal.includes("客户");
  const focusTerm = goal.includes("账期");
  const focusBrand = goal.includes("品牌");

  const kpis: Kpi[] = [
    {
      k: "可推高价值线索",
      v: rec.leads,
      display: `${rec.leads} 份`,
      note: "豆沙包已触达近 10 万店铺、服务超 1 万卖家，按你的画像匹配可推的卖家线索份数",
      focus: focusLead,
    },
    {
      k: "TermPay可提前回笼 / 年",
      v: advance,
      note: `按你年经手约 ${fmtCNY(
        annual
      )} 物流/账单估算，用TermPay给客户做账期可提前回笼的在途资金（T+90）`,
      focus: focusTerm,
    },
    {
      k: "品牌可触达店铺",
      v: COEF.platformReachShops,
      display: "~10 万店铺",
      note: "平台展示位 / 首页 Banner 覆盖访问平台的全量卖家，是品牌曝光最高效的位置",
      focus: focusBrand,
    },
  ];

  const dims: Dim[] = [
    {
      title: "获客 / 拓客",
      tone: focusLead ? "risk" : "warn",
      tag: focusLead ? "重点" : "可发力",
      insight: `获客难是服务商第一痛点（内部问卷 43.48% 居首）。按你「${ptype} · ${scale}」画像，AI 拓客可推约 ${rec.leads} 份高价值卖家线索。`,
      direction: "用 AI 拓客把平台流量扶持（服务商第一需求 69.1%）转成你的销售线索。",
    },
    {
      title: "账期 / TermPay（与卖家线咬合）",
      tone: focusTerm ? "risk" : "warn",
      tag: focusTerm ? "重点" : "需关注",
      insight: `用TermPay给客户做账期，可提前回笼约 ${fmtCNY(
        advance
      )}/年、并把坏账转移给资金方。卖家用TermPay付的物流/仓储账单，正是打到你账户上的钱。`,
      direction:
        "开通「嵌入式金融端口 + 账期风控模型 + TermPay服务」组合：你提前收款、零坏账，客户粘性↑。",
    },
    {
      title: "品牌 / 曝光",
      tone: focusBrand ? "risk" : "good",
      tag: focusBrand ? "重点" : "尚可",
      insight: `平台展示位 / 首页 Banner 可触达近 ${fmtCNY(
        COEF.platformReachShops
      ).replace("¥", "")}家访问店铺，配合大卖有约建立行业口碑（服务商选择第 2 因素 58%）。`,
      direction: "用展示位 + Banner + 大卖有约，把品牌口碑这一项补上。",
    },
  ];

  const headline = `按你「${ptype} · ${scale}」来看，目标是「${goal}」。结合豆服云生态，我给你算了三笔账，并配了一版权益 👇`;

  return { headline, kpis, dims };
}

function diagnose(line: Line, answers: Record<string, string>): Diagnosis {
  return line === "seller" ? diagnoseSeller(answers) : diagnoseProvider(answers);
}

// ──────────────── 报告后的自由对话（关键词意图 + 预设话术，纯前端 mock） ────────────────

type CardKind = "report" | "termpay" | "benefit";
type AgentMsg = { text?: string; card?: CardKind; providerIndex?: number };
type AgentCopyPayload = {
  purpose: "next_question" | "free_reply";
  line: Line;
  answers: Record<string, string>;
  userText?: string;
  parsedValue?: string;
  currentQuestion?: Pick<QuestionDef, "id" | "prompt" | "options">;
  nextQuestion?: Pick<QuestionDef, "id" | "prompt" | "options">;
  intent?: Intent;
  fallbackText: string;
};
type Intent =
  | "term"
  | "service"
  | "connect"
  | "leadgen"
  | "price"
  | "brand"
  | "stockout"
  | "cost"
  | "apply"
  | "restart"
  | "fallback";

async function requestAgentCopy(payload: AgentCopyPayload): Promise<string> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6500);
  try {
    const res = await fetch("/api/seller-agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return payload.fallbackText;
    const data = (await res.json()) as { text?: unknown };
    return typeof data.text === "string" && data.text.trim()
      ? data.text.trim()
      : payload.fallbackText;
  } catch {
    return payload.fallbackText;
  } finally {
    window.clearTimeout(timeout);
  }
}

/** 报告之后给用户的第一句引导语（开启自由对话）。 */
function followUpPrompt(line: Line, answers: Record<string, string> = {}): string {
  const credit = sellerCredit(answers) ?? 0;
  const days = termDaysValue(answers);
  if (line === "seller" && answers.sellerNeed === "找/换更靠谱的服务商") {
    return "下一步可以连接店铺做只读授权，我会按平台、月销和服务需求帮你筛一批更准的服务商。也可以先聊聊怎么判断服务商是否靠谱。";
  }
  if (line === "seller" && answers.sellerNeed === "两个都有，先帮我判断") {
    const priority = sellerPrioritySuggestion(answers);
    return `我建议你先看「${priority.first}」。如果你愿意，下一步我可以继续展开这一路；另一条也不会丢，适合放到第二步继续看。`;
  }
  return line === "seller"
    ? `好消息是 —— Dowsure 的 TermPay 可以把物流、仓储、广告等服务商账单做成最长约 ${days} 天账期，帮你把约 ${fmtCNY(
        credit
      )} 的短期付款压力往后放。\n\n想看看你能拿到多少 TermPay 额度吗？这一步需要连接店铺 / 账单数据（只读授权），我才能给你精确数字。`
    : "按你的画像我配了一版权益。想先看「TermPay账期组合」怎么帮你提前收款，还是先聊获客线索 / 权益价格？";
}

/** 自由对话阶段的快捷意图气泡。 */
function suggestionChips(line: Line, answers: Record<string, string> = {}): string[] {
  if (line === "seller" && answers.sellerNeed === "找/换更靠谱的服务商") {
    return ["看看推荐服务商", "怎么筛选服务商？", "重新开始"];
  }
  if (line === "seller" && answers.sellerNeed === "两个都有，先帮我判断") {
    return ["先看账期额度", "先看推荐服务商", "重新开始"];
  }
  return line === "seller"
    ? ["想看，怎么连店铺？", "TermPay怎么做到90天？", "重新开始"]
    : ["看TermPay账期组合", "获客线索怎么来", "权益价格", "重新开始"];
}

/** 把用户自由输入解析成意图（关键词兜底，纯 mock）。 */
function parseIntent(text: string, line: Line): Intent {
  const s = text.toLowerCase();
  if (/重来|重新|再来|从头|reset/.test(s)) return "restart";
  if (/申请|领取|开通|要了|来一份|生成预申请|就它|选这个|确认/.test(s)) return "apply";
  if (/价格|多少钱|费用|报价|多贵|预算|怎么收费|手续费/.test(s)) return "price";
  if (line === "provider" && /获客|线索|客户|拓客|订单|卖家/.test(s)) return "leadgen";
  if (line === "provider" && /品牌|曝光|背书|展示|banner/.test(s)) return "brand";
  if (line === "seller" && /推荐服务商|筛选服务商|服务商名单|匹配服务商|找服务商|换服务商/.test(s)) return "service";
  if (line === "seller" && /连店铺|连接店铺|授权|只读|怎么连|想看|安全吗|安全/.test(s)) return "connect";
  if (/termpay|term pay|豆分期|账期|账单|现金|回款|垫资|延期|额度|坏账|分期|90天|90 天/.test(s)) return "term";
  if (line === "seller" && /缺货|断货|备货|库存/.test(s)) return "stockout";
  if (line === "seller" && /成本|物流费|降本|压成本/.test(s)) return "cost";
  return "fallback";
}

/** 申请 / 领取成功话术。 */
function replyApply(line: Line): AgentMsg[] {
  return line === "seller"
    ? [
        {
          text: "✅ TermPay预申请已生成（demo）。顾问会与你联系确认店铺授权、服务商账单与额度；签约前你会看到全部费用，固定费率、无隐藏收费。",
        },
      ]
    : [
        {
          text: "✅ 权益已领取（demo）。商务会与你联系确认开通；TermPay / 嵌入式金融端口由资金方与平台协同落地。",
        },
      ];
}

/** 按意图生成 agent 回复（文字 + 可选产品卡）。卡片内容在渲染时按 answers 实时派生。 */
function replyFor(intent: Intent, line: Line, answers: Record<string, string>): AgentMsg[] {
  const rep = GMV_REP[answers.gmv ?? ""] ?? 300_000;
  if (line === "seller") {
    const credit = sellerCredit(answers) ?? 0;
    const quota = termpayQuota(answers) ?? 0;
    const days = termDaysValue(answers);
    const waste =
      Math.round((rep * COEF.logisticsCostRate * COEF.compressibleRatio) / 1000) * 1000;
    switch (intent) {
      case "service": {
        const match = serviceMatchSuggestion(answers);
        const baseReply: AgentMsg[] = [
          {
            text: `可以。按你现在的画像，优先看「${match.category}」。先筛三件事：${match.checks.join(
              "；"
            )}。连接店铺后，我可以把这个方向细化成服务商名单和对比项。`,
          },
        ];
        if (answers.sellerNeed === "两个都有，先帮我判断") {
          return [
            ...baseReply,
            { card: "report", providerIndex: 0 },
            { card: "report", providerIndex: 1 },
            { card: "report", providerIndex: 2 },
          ];
        }
        return baseReply;
      }
      case "connect":
        if (answers.sellerNeed === "找/换更靠谱的服务商") {
          return [
            {
              text: "可以。先用手机号创建 Dowsure 账号，再做店铺只读授权；我会根据平台、月销、履约/营销需求，帮你筛更匹配的服务商名单。",
            },
          ];
        }
        return [
          {
            text: "可以。先用手机号创建 Dowsure 账号，再做店铺 / 账单只读授权；我们只读取销售额、订单表现、服务商账单这类经营数据，用来计算 TermPay 额度，不会改动你的店铺设置或订单。",
          },
        ];
      case "term":
      case "price":
        return [
          {
            text: `TermPay 可以把物流 / 仓储 / 广告等服务商账单延后支付，最长约 ${days} 天。按你当前体量，粗估可缓冲约 ${fmtCNY(
              credit
            )} 的服务商账单，预估可用额度约 ${fmtCNY(quota)}；连接店铺和账单数据后能算精确额度。`,
          },
          { card: "termpay" },
        ];
      case "stockout":
        return [
          {
            text: `旺季断货通常不是单一库存问题，也和现金周转有关。TermPay 先把服务商账单后置，能让你把更多现金留给备货和投放。`,
          },
        ];
      case "cost":
        return [
          {
            text: `服务成本里约 ${fmtCNY(
              waste
            )}/月 来自可压缩环节（物流仓储约占营收 15–20%）。下一步可做服务商比价（demo 暂未开放）。`,
          },
        ];
      default:
        return [
          {
            text: "我可以帮你看：① 推荐服务商怎么筛 ② TermPay怎么缓解90天账期压力 ③ 怎么连店铺算精确结果。你想先聊哪个？",
          },
        ];
    }
  }
  // 服务商线
  const rec = recommendProvider(answers);
  const advance = providerTermAdvance(answers) ?? 0;
  switch (intent) {
    case "term":
      return [
        {
          text: `用TermPay给客户做账期，你能提前回笼约 ${fmtCNY(
            advance
          )}/年、把坏账转移给资金方。这版权益里就含TermPay组合 👇`,
        },
        { card: "benefit" },
      ];
    case "price":
      return [
        {
          text: `给你配的是「${rec.versionName}」，${fmtCNY(rec.price)} 起，含以下权益 👇`,
        },
        { card: "benefit" },
      ];
    case "leadgen":
      return [
        {
          text: `AI 拓客按你画像可推约 ${rec.leads} 份高价值卖家线索（豆沙包已触达近 10 万店铺）。这版权益含拓客版本 👇`,
        },
        { card: "benefit" },
      ];
    case "brand":
      return [
        {
          text: "品牌这块用平台展示位 + 首页 Banner + 大卖有约。这版权益里有对应位置 👇",
        },
        { card: "benefit" },
      ];
    default:
      return [
        {
          text: "我可以帮你看：① TermPay账期组合怎么帮你提前收款 ② 获客线索怎么来 ③ 权益价格。你想先聊哪个？",
        },
      ];
  }
}

// ──────────────────────── 价值感状态栏（随对话逐格点亮） ────────────────────────

interface ValueCell {
  label: string;
  value: string;
  lit: boolean; // 是否已点亮（对应字段已收集到）
}

/** 服务类型简称，用于状态栏「身份」格。 */
function providerTypeShort(ptype?: string): string {
  if (!ptype) return "";
  if (ptype.startsWith("物流")) return "物流";
  if (ptype.startsWith("整合营销")) return "营销";
  if (ptype.startsWith("技术")) return "技术";
  return "其他";
}

/**
 * 状态栏 4 格。lit 表示该格已点亮。
 * 卖家线后两格（账单缓冲 / 预申请）由 Step 6 TermPay 落点点亮；
 * 服务商线后三格（可拓客户 / 推荐版本 / 权益）由 Step 5/7 点亮。
 */
function valueCells(
  line: Line | null,
  answers: Record<string, string>,
  ctx: { done: boolean; termpaySubmitted: boolean; benefitClaimed: boolean }
): ValueCell[] {
  if (line === null) {
    return [
      { label: "身份", value: "待确认", lit: false },
      { label: "价值金额", value: "—", lit: false },
      { label: "方案", value: "—", lit: false },
      { label: "下一步", value: "—", lit: false },
    ];
  }
  if (line === "seller") {
    if (answers.sellerNeed === "找/换更靠谱的服务商") {
      const match = ctx.done ? serviceMatchSuggestion(answers) : null;
      return [
        { label: "身份", value: "卖家", lit: true },
        {
          label: "匹配方向",
          value: match ? match.category : "待判断",
          lit: !!match,
        },
        {
          label: "推荐服务商",
          value: ctx.done ? "待连接" : "待评估",
          lit: ctx.done,
        },
        {
          label: "下一步",
          value: "连接店铺",
          lit: ctx.done,
        },
      ];
    }
    if (answers.sellerNeed === "两个都有，先帮我判断") {
      const priority = ctx.done ? sellerPrioritySuggestion(answers) : null;
      return [
        { label: "身份", value: "卖家", lit: true },
        {
          label: "优先路径",
          value: priority ? priority.first : "待判断",
          lit: !!priority,
        },
        {
          label: "第二步",
          value: priority ? priority.second : "待判断",
          lit: !!priority,
        },
        {
          label: "下一步",
          value: priority ? "展开路径" : "待评估",
          lit: !!priority,
        },
      ];
    }
    const credit = sellerCredit(answers);
    const released = ctx.done && credit != null;
    return [
      { label: "身份", value: "卖家", lit: true },
      {
        label: "账期空间",
        value: credit != null ? fmtCNY(credit) : "—",
        lit: credit != null,
      },
      {
        label: "账单缓冲",
        value: released ? fmtCNY(credit) : "待评估",
        lit: released,
      },
      {
        label: "TermPay",
        value: ctx.termpaySubmitted ? "已发起" : "未发起",
        lit: ctx.termpaySubmitted,
      },
    ];
  }
  const short = providerTypeShort(answers.ptype);
  const rec = ctx.done ? recommendProvider(answers) : null;
  return [
    { label: "身份", value: short ? `服务商·${short}` : "服务商", lit: true },
    {
      label: "可拓客户",
      value: rec ? `${rec.leads} 份线索` : "待评估",
      lit: !!rec,
    },
    {
      label: "推荐版本",
      value: rec ? rec.versionShort : "待评估",
      lit: !!rec,
    },
    {
      label: "权益",
      value: ctx.benefitClaimed ? "已领取" : "未领取",
      lit: ctx.benefitClaimed,
    },
  ];
}

// ──────────────────────── 消息模型 ────────────────────────

interface Message {
  id: number;
  role: "agent" | "user";
  text?: string;
  card?: CardKind; // 富卡片（报告 / TermPay / 权益），内容在渲染时按 line+answers 派生
  providerIndex?: number; // 卖家线物流服务商推荐卡的序号
}

interface SellerChatPageProps {
  onHome?: () => void;
  /** 锁定身份线：设置后跳过 Q0 身份分流，进页面直接进入该线问答（如 /seller 锁定卖家）。 */
  lockedLine?: Line;
}

type SellerChatPanelProps = SellerChatPageProps;

/** 锁定身份线时的开场白（替代 Q0 身份分流提示）。 */
const LOCKED_GREETING: Record<Line, string> = {
  seller:
    "👋 我是豆服云卖家助手。几个问题，我先扫一遍你的经营情况，算出当前最该先动的地方。",
  provider:
    "👋 我是豆服云服务商助手。几个问题，我先了解下你的业务，再帮你算账、配一版权益。",
};

export function SellerChatPanel({ onHome, lockedLine }: SellerChatPanelProps) {
  const idRef = useRef(lockedLine ? 2 : 1);
  const nextId = () => idRef.current++;

  const initialMessages = (): Message[] =>
    lockedLine
      ? [
          { id: 0, role: "agent", text: LOCKED_GREETING[lockedLine] },
          { id: 1, role: "agent", text: questionsOf(lockedLine)[0].prompt },
        ]
      : [{ id: 0, role: "agent", text: IDENTITY.prompt }];

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [line, setLine] = useState<Line | null>(lockedLine ?? null); // null = 还在 Q0 身份分流
  const [stepIdx, setStepIdx] = useState(0); // 选定线后，线内问题进度
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState<string | null>(null);
  const [termpaySubmitted, setTermpaySubmitted] = useState(false); // 是否已生成TermPay预申请
  const [benefitClaimed, setBenefitClaimed] = useState(false); // 是否已领取权益

  const questions = line ? questionsFor(line, answers) : [];
  const collecting = line !== null && stepIdx < questions.length;
  const done = line !== null && stepIdx >= questions.length;
  const current = collecting ? questions[stepIdx] : null;

  // 整页流式滚动：新消息出现时把流末尾滚到视野内
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  /** Q0：选定身份线，接入对应顾问的第一题。 */
  function chooseLine(value: Line, displayText: string) {
    if (thinking || line !== null) return;
    setMessages((m) => [...m, { id: nextId(), role: "user", text: displayText }]);
    setAnswers((a) => ({ ...a, identity: value }));
    setThinking("正在为你接通对应顾问…");
    const qs = questionsOf(value);
    window.setTimeout(() => {
      setThinking(null);
      setLine(value);
      setStepIdx(0);
      setMessages((m) => [...m, { id: nextId(), role: "agent", text: qs[0].prompt }]);
    }, 700);
  }

  function answerCurrent(value: string, displayText: string) {
    if (thinking || done || !line) return;
    const step = stepIdx;
    const q = questions[step];
    const nextAnswers = { ...answers, [q.id]: value };
    const nextQuestions = questionsFor(line, nextAnswers);

    setMessages((m) => [...m, { id: nextId(), role: "user", text: displayText }]);
    setAnswers(nextAnswers);

    const isLast = step >= nextQuestions.length - 1;
    setThinking(isLast ? "正在分析你的情况…" : "正在记录…");
    window.setTimeout(
      async () => {
        if (!isLast) {
          const fallbackText = nextQuestions[step + 1].prompt;
          const text = await requestAgentCopy({
            purpose: "next_question",
            line,
            answers: nextAnswers,
            userText: displayText,
            parsedValue: value,
            currentQuestion: {
              id: q.id,
              prompt: q.prompt,
              options: q.options,
            },
            nextQuestion: {
              id: nextQuestions[step + 1].id,
              prompt: nextQuestions[step + 1].prompt,
              options: nextQuestions[step + 1].options,
            },
            fallbackText,
          });
          setThinking(null);
          setMessages((m) => [
            ...m,
            { id: nextId(), role: "agent", text },
          ]);
          setStepIdx(step + 1);
        } else {
          setThinking(null);
          setStepIdx(step + 1); // → done，进入「报告 + 自由对话」阶段
          const leadParts =
            line === "seller" && nextAnswers.sellerNeed === "找/换更靠谱的服务商"
              ? sellerServiceLeadParts(nextAnswers)
              : [];
          const appendReport = (providerIndex?: number) => {
            setMessages((m) => [
              ...m,
              { id: nextId(), role: "agent", card: "report", providerIndex },
            ]);
          };
          const appendFollowUp = () => {
            setMessages((m) => [
              ...m,
              { id: nextId(), role: "agent", text: followUpPrompt(line, nextAnswers) },
            ]);
          };

          if (leadParts.length > 0) {
            const leadGap = 1350;
            const cardGap = 1600;
            leadParts.forEach((text, i) => {
              window.setTimeout(() => {
                setMessages((m) => [...m, { id: nextId(), role: "agent", text }]);
              }, i * leadGap);
            });

            const cardStartDelay = leadParts.length * leadGap + 900;
            [0, 1, 2].forEach((providerIndex, i) => {
              window.setTimeout(() => appendReport(providerIndex), cardStartDelay + i * cardGap);
            });
            window.setTimeout(appendFollowUp, cardStartDelay + 3 * cardGap + 1500);
          } else {
            appendReport();
            window.setTimeout(appendFollowUp, 900);
          }
        }
      },
      isLast ? 1400 : 600
    );
  }

  /** 自由对话阶段：推送一组 agent 回复（带打字态）。 */
  function pushAgent(items: AgentMsg[], delay = 650, thinkMsg = "正在帮你分析…") {
    if (items.length === 0) return;
    setThinking(thinkMsg);
    window.setTimeout(() => {
      setThinking(null);
      setMessages((m) => [
        ...m,
        ...items.map((it) => ({ id: nextId(), role: "agent" as const, ...it })),
      ]);
    }, delay);
  }

  function pushAgentNatural(
    items: AgentMsg[],
    payload: Omit<AgentCopyPayload, "fallbackText">,
    delay = 650,
    thinkMsg = "正在组织更自然的回答…"
  ) {
    if (items.length === 0) return;
    const firstTextIndex = items.findIndex((it) => typeof it.text === "string" && it.text.trim());
    if (firstTextIndex < 0) {
      pushAgent(items, delay, thinkMsg);
      return;
    }
    const fallbackText = items[firstTextIndex].text ?? "";
    setThinking(thinkMsg);
    window.setTimeout(async () => {
      const text = await requestAgentCopy({ ...payload, fallbackText });
      const nextItems = items.map((it, idx) =>
        idx === firstTextIndex ? { ...it, text } : it
      );
      setThinking(null);
      setMessages((m) => [
        ...m,
        ...nextItems.map((it) => ({ id: nextId(), role: "agent" as const, ...it })),
      ]);
    }, delay);
  }

  /** 自由对话阶段：解析用户输入意图并回复（含申请 / 领取 / 重来）。 */
  function handleIntent(text: string) {
    if (!line || thinking) return;
    setMessages((m) => [...m, { id: nextId(), role: "user", text }]);
    const intent = parseIntent(text, line);
    if (intent === "restart") {
      window.setTimeout(handleRestart, 350);
      return;
    }
    if (intent === "apply") {
      if (line === "seller") setTermpaySubmitted(true);
      else setBenefitClaimed(true);
      pushAgent(replyApply(line));
      return;
    }
    const items = replyFor(intent, line, answers);
    pushAgentNatural(items, {
      purpose: "free_reply",
      line,
      answers,
      userText: text,
      intent,
    });
  }

  function handleSend() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    if (line === null) {
      const v = IDENTITY.parse(text);
      chooseLine(v ?? "seller", text); // 兜底进卖家线
      return;
    }
    if (done) {
      handleIntent(text); // 报告后自由对话
      return;
    }
    if (!current) return;
    const parsed = current.parse(text);
    answerCurrent(parsed ?? text, text);
  }

  function handleFillSample() {
    if (thinking) return;
    if (line === null) {
      chooseLine("seller", IDENTITY.options[0].label);
      return;
    }
    if (!current) return;
    answerCurrent(current.sample, current.sample);
  }

  function handleRestart() {
    idRef.current = lockedLine ? 2 : 1;
    setMessages(initialMessages());
    setLine(lockedLine ?? null);
    setStepIdx(0);
    setAnswers({});
    setInput("");
    setThinking(null);
    setTermpaySubmitted(false);
    setBenefitClaimed(false);
  }

  // ── 对话流里的富卡片（内容按 line+answers 实时派生） ──

  function renderReportCard(providerIndex?: number) {
    if (!line) return null;
    if (line === "seller") {
      if (answers.sellerNeed === "两个都有，先帮我判断" && providerIndex == null) {
        const priority = sellerPrioritySuggestion(answers);
        return (
          <div className="diag in-stream priority-report">
            <div className="priority-report-head">
              <div className="priority-report-icon">
                <Bot size={21} />
              </div>
              <div>
                <div className="priority-report-title">我建议你先走这一路</div>
                <div className="priority-report-sub">SERVICE OR TERMPAY · 轻量判断</div>
              </div>
            </div>
            <div className="priority-report-body">
              <div className="priority-report-main">
                <div className="priority-report-label">优先路径</div>
                <div className="priority-report-decision">{priority.first}</div>
                <div className="priority-report-signal">{priority.signal}</div>
              </div>
              <div className="priority-steps">
                <div className="priority-step focus">
                  <div className="priority-step-k">第一步</div>
                  <div className="priority-step-v">{priority.first}</div>
                  <p>{priority.firstReason}</p>
                </div>
                <div className="priority-step">
                  <div className="priority-step-k">第二步</div>
                  <div className="priority-step-v">{priority.second}</div>
                  <p>{priority.secondReason}</p>
                </div>
              </div>
              <div className="priority-report-callout">
                我不会把另一条路丢掉。先解决最痛的一边，再把另一边作为第二步接上，整体推进会更稳。
              </div>
            </div>
          </div>
        );
      }
      if (answers.sellerNeed !== "服务商账单想晚点付") {
        const allProviderCards = logisticsProviderCards(answers);
        const providerCards =
          providerIndex == null
            ? allProviderCards
            : allProviderCards[providerIndex]
            ? [allProviderCards[providerIndex]]
            : [];
        return (
          <div className="diag in-stream match-report provider-recommend-report">
            <div className="match-report-body">
              <div className="provider-card-list">
                {providerCards.map((item) => (
                  <div key={item.name} className="provider-card">
                    <div className="provider-card-head">
                      <div className="provider-card-name">{item.name}</div>
                      <span className={item.badge === "高级认证服务商" ? "premium" : undefined}>
                        {item.badge}
                      </span>
                    </div>
                    <div className="provider-reason">
                      <span>推荐理由</span>
                      <p>{item.fit}</p>
                    </div>
                    <ul>
                      {item.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      const credit = sellerCredit(answers) ?? 0;
      const monthlyBill = sellerMonthlyServiceBill(answers) ?? 0;
      const days = termDaysValue(answers);
      return (
        <div className="diag in-stream cash-report">
          <div className="cash-report-head">
            <div className="cash-report-icon">¥</div>
            <div>
              <div className="cash-report-title">你的 TermPay 账期测算</div>
              <div className="cash-report-sub">TERM PAY · 估算结果</div>
            </div>
          </div>

          <div className="cash-report-body">
            <div className="cash-report-main">
              <div className="cash-report-amount">{fmtCNY(credit)}</div>
              <div className="cash-report-label">{days} 天内可后置支付的服务商账单</div>
            </div>

            <div className="cash-report-row">
              <div>
                <div className="cash-report-row-title">目标账期</div>
                <div className="cash-report-row-sub">服务商账单延后支付</div>
              </div>
              <strong>{days} 天</strong>
            </div>
            <div className="cash-report-row positive">
              <div>
                <div className="cash-report-row-title">估算月服务商账单</div>
                <div className="cash-report-row-sub">按物流/仓储等成本占比粗算</div>
              </div>
              <strong>≈ {fmtCNY(monthlyBill)}</strong>
            </div>
            <div className="cash-report-row risk">
              <div>
                <div className="cash-report-row-title">用 TermPay 后</div>
                <div className="cash-report-row-sub">资金方先付服务商，你按期还款</div>
              </div>
              <strong>→ T+{days}</strong>
            </div>

            <div className="cash-report-callout">
              这意味着：TermPay 不是把十几天回款提前到账，而是把原本今天要付给物流、仓储、广告等服务商的钱，延后到最长约 {days} 天后再还，让平台回款和账单付款节奏更匹配。
            </div>
          </div>
        </div>
      );
    }
    const d = diagnose(line, answers);
    return (
      <div className="diag in-stream">
        <div className="diag-head">
          <div className="cap">
            <span className="sparkle" />
            智能诊断
          </div>
          <p>{d.headline}</p>
        </div>
        {d.kpis.length > 0 ? (
          <div className="kpis">
            {d.kpis.map((kp) => (
              <div key={kp.k} className={"kpi" + (kp.focus ? " focus" : "")}>
                {kp.focus ? <span className="badge-focus">最痛点</span> : null}
                <div className="kpi-k">{kp.k}</div>
                <div className="kpi-v">{kp.display ?? fmtCNY(kp.v)}</div>
                <div className="kpi-note">{kp.note}</div>
              </div>
            ))}
          </div>
        ) : null}
        {d.dims.map((dim) => (
          <div key={dim.title} className={"dim tone-" + dim.tone}>
            <div className="dim-h">
              <span className="dim-t">{dim.title}</span>
              <span className="dim-tag">{dim.tag}</span>
            </div>
            <p className="dim-insight">{dim.insight}</p>
            <div className="dim-dir">
              <ArrowRight className="arr" size={16} />
              <span>{dim.direction}</span>
            </div>
          </div>
        ))}
        <div className="diag-foot">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            disabled={!!thinking}
            onClick={() => pushAgent(replyFor("price", line, answers))}
          >
            查看推荐权益
            <ArrowRight size={16} />
          </button>
        </div>
        <p className="diag-note">
          以上为 demo 示例诊断，金额由透明 mock 系数估算，接入真实数据后替换。可以继续问我。
        </p>
      </div>
    );
  }

  function renderTermpayCard() {
    return (
      <div className="termpay-panel">
        <div className="tp-head">
          <div className="cap">
            <Banknote size={15} />
            TermPay · 账期金融
          </div>
          <p>
            被账期占住的这笔现金，可以用TermPay延期支付物流 / 仓储账单先释放出来——放款直接打给服务商账户，你延期付款、现金不断流。
          </p>
        </div>
        <div className="tp-nums">
          <div className="tp-num focus">
            <div className="tp-k">预计释放现金</div>
            <div className="tp-v">{fmtCNY(sellerCredit(answers) ?? 0)}</div>
            <div className="tp-note">延期这笔账单 → 这笔被占用的现金立即回到你手上</div>
          </div>
          <div className="tp-num">
            <div className="tp-k">预估可用额度</div>
            <div className="tp-v">{fmtCNY(termpayQuota(answers) ?? 0)}</div>
            <div className="tp-note">
              按月 GMV ×1.5 预估，对标 Payoneer 1.4 / Wayflyer 1.5–3，封顶约 $100 万
            </div>
          </div>
        </div>
        <div className="tp-flow">
          <div className="tp-flow-cap">资金路径 · Demo 演示，不涉及真实资金</div>
          {TERMPAY_FLOW.map((s, i) => (
            <div key={s.t} className="tp-flow-step">
              <div className="tp-flow-num">{i + 1}</div>
              <div className="tp-flow-body">
                <div className="tp-flow-t">{s.t}</div>
                <div className="tp-flow-d">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
        {!termpaySubmitted ? (
          <button
            type="button"
            className="btn btn-primary btn-lg tp-cta"
            disabled={!!thinking}
            onClick={() => {
              setTermpaySubmitted(true);
              pushAgent(replyApply("seller"));
            }}
          >
            生成TermPay预申请
            <ArrowRight size={16} />
          </button>
        ) : (
          <div className="tp-success">
            ✅ 预申请已生成（demo）。顾问会与你联系确认账单与额度；签约前你会看到全部费用，固定费率、无隐藏收费。
          </div>
        )}
        <p className="tp-fine">
          合规说明：Dowsure 提供技术、数据、风控与连接能力；资金与最终授信审批由合作银行 / 资金方承担。本流程为产品演示，不构成放款或授信承诺。
        </p>
      </div>
    );
  }

  function renderBenefitCard() {
    const rec = recommendProvider(answers);
    return (
      <div className="termpay-panel">
        <div className="tp-head">
          <div className="cap">
            <Package size={15} />
            豆服云 · 推荐权益版本
          </div>
          <p>
            按你的体量和目标，给你配了这一版权益。其中
            {rec.highlight ? "高亮的" : ""}
            TermPay组合，正好接你「给客户做账期」的场景——和卖家线在TermPay处闭环。
          </p>
        </div>
        <div className="bp-version">
          <div className="bp-name">{rec.versionName}</div>
          <div className="bp-price">{fmtCNY(rec.price)} 起</div>
        </div>
        <ul className="bp-list">
          {rec.benefits.map((b) => (
            <li key={b.name} className={b.hot ? "hot" : undefined}>
              <span className="bp-tick">{b.hot ? "⭐" : "✓"}</span>
              {b.name}
            </li>
          ))}
        </ul>
        <p className="bp-reason">{rec.reason}</p>
        {!benefitClaimed ? (
          <button
            type="button"
            className="btn btn-primary btn-lg tp-cta"
            disabled={!!thinking}
            onClick={() => {
              setBenefitClaimed(true);
              pushAgent(replyApply("provider"));
            }}
          >
            领取这版权益
            <ArrowRight size={16} />
          </button>
        ) : (
          <div className="tp-success">
            ✅ 权益已领取（demo）。商务会与你联系确认开通；TermPay / 嵌入式金融端口由资金方与平台协同落地。
          </div>
        )}
        <p className="tp-fine">
          合规说明：以上权益与价格为产品演示口径，最终以正式合同为准；TermPay相关资金与授信由合作银行 / 资金方承担。
        </p>
      </div>
    );
  }

  function renderCard(kind: CardKind, providerIndex?: number) {
    if (kind === "report") return renderReportCard(providerIndex);
    if (kind === "termpay") return renderTermpayCard();
    return renderBenefitCard();
  }

  return (
      <section className="seller-chat">
        {/* 头部 */}
        <div className="desk-head" style={{ paddingBottom: 18 }}>
          <span className="pill">
            <span className="pulse" />
            豆服云智能助手 · 对话版
          </span>
          <h1>几个问题，给你一份智能诊断</h1>
          <p>
            {lockedLine === "seller"
              ? "像聊天一样回答几个问题，我先扫一遍你的经营情况，算出当前最该先动的地方。"
              : "像聊天一样回答几个问题，我先帮你对上号，再扫一遍你的情况，算出当前最该先动的地方。"}
          </p>
        </div>

        {/* 价值感状态栏（随对话逐格点亮） */}
        <div className="value-bar">
          {valueCells(line, answers, { done, termpaySubmitted, benefitClaimed }).map((c, i) => (
            <Fragment key={c.label}>
              {i > 0 ? (
                <div className="vb-arrow" aria-hidden>
                  <ChevronRight size={15} />
                </div>
              ) : null}
              <div className={"vb-cell" + (c.lit ? " lit" : "")}>
                <div className="vb-k">
                  <span className="vb-dot" />
                  {c.label}
                </div>
                <div className="vb-v">{c.value}</div>
              </div>
            </Fragment>
          ))}
        </div>

        {/* 进度点（Q0 身份 + 线内问题） */}
        <div className="chat-progress" style={{ marginBottom: 12 }}>
          {!lockedLine ? (
            <span className={"dot " + (line ? "done" : "cur")} />
          ) : null}
          {questions.map((q, i) => (
            <span
              key={q.id}
              className={
                "dot " +
                (i < stepIdx ? "done" : i === stepIdx && !done ? "cur" : "todo")
              }
            />
          ))}
        </div>

        {/* 对话卡片（整页流式：消息 + 富卡片同流） */}
        <div className="chat-card">
          <div className="chat-scroll">
            {messages.map((m) =>
              m.card ? (
                <div key={m.id} className="stream-card">
                  {renderCard(m.card, m.providerIndex)}
                </div>
              ) : (
                <div key={m.id} className={"msg " + m.role}>
                  <div className="avatar">
                    {m.role === "agent" ? <Bot size={17} /> : "你"}
                  </div>
                  <div className="bubble">{m.text}</div>
                </div>
              )
            )}
            {thinking ? (
              <div className="msg agent">
                <div className="avatar">
                  <Bot size={17} />
                </div>
                <div className="thinking">
                  <span className="tdot" style={{ animationDelay: "0s" }} />
                  <span className="tdot" style={{ animationDelay: "0.18s" }} />
                  <span className="tdot" style={{ animationDelay: "0.36s" }} />
                  <span className="label">{thinking}</span>
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          {/* 输入区：Q0 身份分流 / 线内问题选项 / 报告后自由对话气泡 */}
          <div className="composer">
            {line === null ? (
              <div className="opt-list">
                {IDENTITY.options.map((opt, i) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="opt-row"
                    disabled={!!thinking}
                    onClick={() => chooseLine(opt.value, opt.label)}
                  >
                    <span className="opt-key">{String.fromCharCode(65 + i)}</span>
                    <span className="opt-text">{opt.label}</span>
                    <ArrowRight className="opt-arrow" size={16} />
                  </button>
                ))}
              </div>
            ) : collecting ? (
              <div
                className={
                  "opt-list" +
                  (current?.id === "serviceCategory" ? " service-category-options" : "")
                }
              >
                {current!.options.map((opt, i) => (
                  <button
                    key={opt}
                    type="button"
                    className="opt-row"
                    disabled={!!thinking}
                    onClick={() => answerCurrent(opt, opt)}
                  >
                    <span className="opt-key">{String.fromCharCode(65 + i)}</span>
                    <span className="opt-text">{opt}</span>
                    <ArrowRight className="opt-arrow" size={16} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="chip-row">
                {suggestionChips(line, answers).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="chip"
                    disabled={!!thinking}
                    onClick={() => handleIntent(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <div className="input-row">
              {!done ? (
                <button
                  type="button"
                  className="btn btn-soft"
                  disabled={!!thinking}
                  onClick={handleFillSample}
                  title="填入当前问题的示例答案"
                >
                  <Wand2 size={15} />
                  填入示例
                </button>
              ) : null}
              <input
                className="input"
                value={input}
                disabled={!!thinking}
                placeholder={
                  line === null
                    ? IDENTITY.placeholder
                    : collecting
                    ? current!.placeholder
                    : "继续问我，比如「账期怎么解决」「权益多少钱」"
                }
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={!!thinking || !input.trim()}
                onClick={handleSend}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* 报告后操作（重来 / 返回首页） */}
        {done ? (
          <div className="chat-actions">
            <button type="button" className="btn btn-ghost" onClick={handleRestart}>
              <RotateCcw size={15} />
              重新开始
            </button>
            {onHome ? (
              <button type="button" className="btn btn-soft" onClick={onHome}>
                返回首页
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
  );
}

export function SellerChatPage({ onHome, lockedLine }: SellerChatPageProps) {
  return (
    <div className="seller-desk">
      <div className="desk-bg" aria-hidden />
      <SellerChatPanel onHome={onHome} lockedLine={lockedLine} />
    </div>
  );
}
