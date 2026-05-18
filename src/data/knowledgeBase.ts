import type { BenefitItem } from "@/types";

/**
 * 豆服云权益知识库 —— 当前为本地 mock。
 * 未来替换为真实 RAG 时:
 *   1. 这里的 BenefitItem 列表 -> 向量化进入 vector store
 *   2. 推荐引擎通过 retrieve(query, profile) 拉相关 chunk
 *   3. 结构（id / category / keywords / fit*）保持稳定，可作为 metadata filter
 */
export const KNOWLEDGE_BASE: BenefitItem[] = [
  // ────────────────────── 1. 必选基础包 ──────────────────────
  {
    id: "base-package",
    name: "豆服云基础包",
    category: "base",
    price: 28_888,
    summary: "服务商入驻必选,含展示位、AI 拓客启航版、提现券、豆分期",
    description:
      "一次开通即获得豆服云平台基础固定展示位、AI 智能拓客启航版 (20 份数据分析报告)、100 万美金提现优惠券、以及面向终端卖家的豆分期账期服务能力。所有服务商均需开通此基础包。",
    keywords: [
      "基础包",
      "展示位",
      "AI 拓客",
      "拓客启航版",
      "100万美金提现",
      "豆分期",
      "必选",
    ],
    alwaysIncluded: true,
  },

  // ────────────────────── 2. 获客增长 ──────────────────────
  {
    id: "growth-banner",
    name: "平台首页 Banner 位",
    category: "growth",
    price: 20_000,
    summary: "首页核心流量位,适合品牌曝光与新品发布",
    description:
      "在豆服云平台首页 Banner 位置获得固定曝光，覆盖访问平台的全量卖家，是品牌曝光与活动节点最高效的展示位。",
    keywords: ["首页", "banner", "曝光", "品牌", "广告位"],
  },
  {
    id: "growth-leadgen-plus",
    name: "AI 智能拓客跃升版",
    category: "growth",
    price: 50_000,
    summary: "80 份深度分析报告,瞄准腰部及以上卖家",
    description:
      "在启航版基础上升级到跃升版：包含 80 份卖家深度分析报告，覆盖更多腰部 / 头部卖家画像，配套销售工单与跟进建议。",
    keywords: ["拓客", "线索", "卖家", "分析报告", "跃升版", "lead"],
  },
  {
    id: "growth-brand-marketing",
    name: "AI 品牌营销赋能",
    category: "growth",
    price: 158_000,
    summary: "全年 AI 内容 + 案例 + 多渠道分发的品牌建设套件",
    description:
      "由豆服云品牌团队提供全年 AI 内容生成、案例包装、多渠道分发；服务商可作为品牌升级的核心抓手。",
    keywords: ["品牌", "营销", "AI", "内容", "传播", "案例"],
  },
  {
    id: "growth-bigseller-tour",
    name: "大卖有约 & 游学考察",
    category: "growth",
    price: 100_000,
    unit: "/ 次",
    summary: "组织大卖游学,获得深度信任与转化窗口",
    description:
      "由豆服云组织的 T0/T1 大卖游学考察与闭门交流活动，服务商作为承办方深度植入，每次活动可触达数十位决策人。",
    keywords: ["大卖", "游学", "T0", "T1", "闭门会", "高净值"],
  },
  {
    id: "growth-bigseller-title",
    name: "大卖有约 · 冠名权益",
    category: "growth",
    price: 200_000,
    unit: "/ 次",
    summary: "全程冠名大卖闭门会,品牌等同于平台合作伙伴",
    description:
      "服务商以冠名身份参与大卖有约活动，享受全程露出 + 主题演讲席位 + 一对一专访，建立行业头部认知。",
    keywords: ["冠名", "大卖", "闭门会", "T0", "T1", "高端品牌"],
  },

  // ────────────────────── 3. 增值服务 ──────────────────────
  {
    id: "value-embed-finance",
    name: "嵌入式金融跳转端口",
    category: "value-added",
    price: 20_000,
    summary: "在自有系统中嵌入豆分期入口,转化卖家融资需求",
    description:
      "服务商可在自有 ERP / 客户后台 / 官网中嵌入豆分期金融入口，把客户的提现 / 账期需求一键导流到豆服云，按转化分润。",
    keywords: ["嵌入", "金融", "入口", "ERP", "豆分期", "API"],
    fitProviderTypes: ["logistics", "overseas-warehouse", "erp-tool"],
  },
  {
    id: "value-risk-model",
    name: "账期优化风控模型",
    category: "value-added",
    price: 100_000,
    summary: "基于平台数据的账期 / 坏账风控模型,降低坏账率",
    description:
      "接入豆服云风控引擎，为服务商客户提供账期评估、坏账预警与额度建议；常用于物流、海外仓、ERP 类服务商优化其垫资 / 账期业务。",
    keywords: ["风控", "账期", "坏账", "信用", "评估"],
    fitProviderTypes: ["logistics", "overseas-warehouse", "erp-tool"],
  },
  {
    id: "value-platform-sync",
    name: "平台最新政策同步 + 1v1 商务对接",
    category: "value-added",
    price: 50_000,
    unit: "/ 年",
    summary: "亚马逊等平台政策第一手同步 + 专属商务对接人",
    description:
      "全年享受亚马逊等主流平台政策第一手同步与解读；并配有专属 1v1 商务对接人，处理资源、活动、合规等需求。",
    keywords: ["政策", "平台", "亚马逊", "商务对接", "1v1"],
  },
  {
    id: "value-hk-accelerator",
    name: "香港跨境电商加速器计划",
    category: "value-added",
    price: 100_000,
    summary: "加入香港跨境电商加速器,获取资源 / 资本 / 政策对接",
    description:
      "加入由豆服云联合发起的香港跨境电商加速器计划，获得香港落地、资本对接、政策资源等长期服务窗口。",
    keywords: ["香港", "加速器", "出海", "资本", "落地"],
  },
  {
    id: "value-cross-cloud",
    name: "跨境云个人服务",
    category: "value-added",
    price: 30_000,
    summary: "一对一跨境云顾问,适合需要个性化方案的服务商",
    description:
      "配置专属跨境云顾问，帮助服务商团队完成方案落地、客户对接、合规协同等长尾事项。",
    keywords: ["跨境云", "顾问", "1v1", "落地"],
  },

  // ────────────────────── 4. 金融赋能 ──────────────────────
  {
    id: "finance-debt-advisory",
    name: "债权融资咨询",
    category: "finance",
    price: 2_000,
    summary: "债权融资场景下的专业咨询服务",
    description:
      "针对服务商及其上下游客户的债权融资需求，提供方案匹配、机构对接与材料准备指导。",
    keywords: ["债权", "融资", "贷款", "咨询"],
  },
  {
    id: "finance-equity-advisory",
    name: "股权融资咨询",
    category: "finance",
    price: 2_000,
    summary: "股权融资 / FA 场景下的轻咨询",
    description:
      "提供股权融资场景下的策略咨询、估值参考、投资人对接思路。",
    keywords: ["股权", "融资", "FA", "投资人"],
  },
  {
    id: "finance-fin-diagnosis",
    name: "公司财务诊断报告",
    category: "finance",
    price: 2_000,
    summary: "出具一份针对服务商自身的财务诊断报告",
    description:
      "由豆服云财税团队出具一份针对服务商当前财务结构、现金流、税务风险的诊断报告。",
    keywords: ["财务", "诊断", "报告", "现金流"],
  },
  {
    id: "finance-tax-guidance",
    name: "财税指导",
    category: "finance",
    price: 2_000,
    summary: "跨境财税合规指导,适合需要海外结构的服务商",
    description:
      "围绕跨境财税合规、香港 / 海外架构、票据等场景，提供针对性的指导建议。",
    keywords: ["财税", "合规", "跨境", "税务"],
  },

  // ────────────────────── 5. 升级尊享 (≥20 万解锁) ──────────────────────
  {
    id: "premium-leadgen-pro",
    name: "AI 智能拓客领航版 + 深度营销赋能",
    category: "premium",
    price: 400_000,
    summary: "120+ 份分析报告 + 全链路深度营销,适合冲击大客户",
    description:
      "领航版包含 120+ 份卖家深度分析报告，并联动品牌、内容、线下活动做全链路深度营销赋能。仅在前述权益选购满 20 万后开放购买。",
    keywords: ["领航版", "拓客", "深度营销", "120 份", "全链路"],
    unlockThreshold: 200_000,
  },
  {
    id: "premium-resource-salon",
    name: "平台资源对接私享会",
    category: "premium",
    price: 0,
    unit: "全年 2 场",
    summary: "全年 2 场闭门私享会,直连平台资源方",
    description:
      "全年 2 场闭门私享会，邀请平台核心资源方 / 头部卖家进行深度交流。前述权益选购满 20 万后赠送参与资格。",
    keywords: ["私享会", "资源", "闭门", "对接"],
    unlockThreshold: 200_000,
  },
  {
    id: "premium-offline-comarketing",
    name: "线下联合营销",
    category: "premium",
    price: 0,
    summary: "豆服云联合服务商共同举办线下营销活动",
    description:
      "豆服云市场团队与服务商共同策划并落地线下联合营销活动，包括场地、招商、内容、传播。前述权益选购满 20 万后解锁。",
    keywords: ["线下", "联合营销", "活动"],
    unlockThreshold: 200_000,
  },

  // ────────────────────── 6. 独家权益 (≥80 万送) ──────────────────────
  {
    id: "exclusive-amazon-summit",
    name: "亚马逊美国 / 中国年度大会联合参展",
    category: "exclusive",
    price: 0,
    summary: "选购满 80 万,获得年度大会联合参展露出",
    description:
      "前述权益选购满 80 万后,豆服云将携手服务商在亚马逊美国 / 中国年度大会上获得联合参展露出位，是面向全球生态的最高级别曝光。",
    keywords: ["亚马逊", "年度大会", "参展", "露出", "独家"],
    unlockThreshold: 800_000,
  },

  // ────────────────────── 7. 赠送项 (所有方案默认含) ──────────────────────
  {
    id: "gift-channel",
    name: "渠道合作机会",
    category: "gift",
    price: 0,
    summary: "默认赠送:接入豆服云渠道生态",
    description: "默认赠送,所有方案附带。可对接豆服云渠道生态的联合 GTM 机会。",
    keywords: ["渠道", "合作", "赠送"],
  },
  {
    id: "gift-logistics-insurance",
    name: "物流险咨询",
    category: "gift",
    price: 0,
    summary: "默认赠送:物流保险方案咨询",
    description: "默认赠送,所有方案附带。覆盖跨境物流保险方案咨询。",
    keywords: ["物流", "保险", "咨询", "赠送"],
  },
  {
    id: "gift-hk-account",
    name: "香港企业开户服务",
    category: "gift",
    price: 0,
    summary: "默认赠送:香港企业开户绿色通道",
    description: "默认赠送,所有方案附带。提供香港企业开户绿色通道与材料协助。",
    keywords: ["香港", "开户", "企业", "赠送"],
  },
];

/** 通过 id 取权益。 */
export function getBenefit(id: string): BenefitItem {
  const item = KNOWLEDGE_BASE.find((b) => b.id === id);
  if (!item) {
    throw new Error(`[knowledgeBase] benefit not found: ${id}`);
  }
  return item;
}

/**
 * Mock 的 RAG 检索接口。
 * 这里用关键词 / category 做朴素打分,
 * 未来可以替换为向量检索 + metadata filter,
 * 而推荐引擎调用方完全无需改动。
 */
export function retrieveBenefits(query: {
  keywords?: string[];
  categories?: BenefitItem["category"][];
}): BenefitItem[] {
  const { keywords = [], categories } = query;
  return KNOWLEDGE_BASE.filter((b) => {
    if (categories && categories.length && !categories.includes(b.category)) {
      return false;
    }
    if (keywords.length === 0) return true;
    return keywords.some((kw) =>
      b.keywords.some((bkw) => bkw.toLowerCase().includes(kw.toLowerCase()))
    );
  });
}
