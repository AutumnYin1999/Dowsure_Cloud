import { getBenefit, KNOWLEDGE_BASE } from "@/data/knowledgeBase";
import { BUDGET_CAP, BUDGET_FLOOR } from "@/schema/questionnaireSchema";
import type {
  BenefitItem,
  BenefitPriority,
  NextStep,
  ProviderProfile,
  RecommendationPlan,
  RecommendedBenefit,
} from "@/types";
import { generateNarrative } from "./agentNarrator";

/**
 * Deterministic 规则推荐引擎。
 *
 * 设计原则:
 *  - 规则与权益解耦: 这里只决定「为什么推荐 + 优先级」,
 *    具体权益信息从 knowledgeBase 拿。
 *  - 规则可追溯: 每条 RecommendedBenefit 都带 matchedRules,方便 debug。
 *  - 易扩展: 加新规则 -> push 到 RULES 即可。
 *  - 易替换为 Agent: recommend(profile) 是单一入口,
 *    未来可替换为 LLM-based planner,接口不变。
 */

interface RuleHit {
  benefitId: string;
  priority: BenefitPriority;
  reason: string;
  ruleId: string;
  quantity?: number;
}

type Rule = (profile: ProviderProfile) => RuleHit[];

// ───────────────────────────── 规则定义 ─────────────────────────────

const RULES: Rule[] = [
  // R1 所有人含基础包
  () => [
    {
      ruleId: "R1-base",
      benefitId: "base-package",
      priority: "required",
      reason: "所有服务商默认包含的基础包,含展示位、AI 拓客启航版与豆分期",
    },
  ],

  // R2 获取更多卖家线索 -> 跃升版
  (p) =>
    p.goals.includes("lead-gen")
      ? [
          {
            ruleId: "R2-leadgen",
            benefitId: "growth-leadgen-plus",
            priority: "strong",
            reason: "你勾选了「获取更多卖家线索」,跃升版提供 80 份深度卖家画像",
          },
        ]
      : [],

  // R3 品牌曝光 -> Banner + 品牌营销
  (p) =>
    p.goals.includes("brand-exposure")
      ? [
          {
            ruleId: "R3a-banner",
            benefitId: "growth-banner",
            priority: "strong",
            reason: "你希望提升品牌曝光,首页 Banner 是最高效的固定展示位",
          },
          {
            ruleId: "R3b-brand",
            benefitId: "growth-brand-marketing",
            priority: "optional",
            reason: "AI 品牌营销赋能可作为全年的品牌建设主线",
          },
        ]
      : [],

  // R4 物流 / 海外仓 + 账期金融能力 -> 嵌入式金融 + 风控
  (p) => {
    const isInfra =
      p.providerType === "logistics" ||
      p.providerType === "overseas-warehouse" ||
      p.providerType === "erp-tool";
    if (!isInfra || !p.goals.includes("offer-credit")) return [];
    const hits: RuleHit[] = [
      {
        ruleId: "R4a-embed",
        benefitId: "value-embed-finance",
        priority: p.hasEmbeddableSystem ? "strong" : "optional",
        reason: p.hasEmbeddableSystem
          ? "你已有可嵌入的系统/官网,可以快速接入豆分期金融入口"
          : "你希望为客户提供账期能力,后续上线自有系统时可嵌入金融入口",
      },
    ];
    hits.push({
      ruleId: "R4b-risk",
      benefitId: "value-risk-model",
      priority: "optional",
      reason: "账期 / 坏账风控模型可有效降低你给客户提供账期带来的资金风险",
    });
    return hits;
  },

  // R5 服务大卖 / T0 T1 -> 大卖有约 + 私享会 + 联合营销
  (p) => {
    const wantsTop = p.goals.includes("reach-top-sellers");
    const tierTop =
      p.customerTier === "billion-sellers" || p.customerTier === "t0-t1";
    if (!wantsTop && !tierTop) return [];
    return [
      {
        ruleId: "R5a-bigseller",
        benefitId: "growth-bigseller-tour",
        priority: "strong",
        reason: "你的目标 / 客户结构指向大卖,大卖有约游学是最直接的转化抓手",
        quantity: 1,
      },
    ];
  },

  // R6 财税融资需求
  (p) => {
    if (!p.needsFinanceServices && !p.goals.includes("financing-tax")) return [];
    return [
      {
        ruleId: "R6a-debt",
        benefitId: "finance-debt-advisory",
        priority: "optional",
        reason: "你勾选了融资 / 财税相关需求,可叠加债权融资咨询",
      },
      {
        ruleId: "R6b-equity",
        benefitId: "finance-equity-advisory",
        priority: "optional",
        reason: "如有股权融资计划,可由豆服云团队做轻咨询",
      },
      {
        ruleId: "R6c-diagnosis",
        benefitId: "finance-fin-diagnosis",
        priority: "optional",
        reason: "一份财务诊断报告可作为后续融资 / 优化的基线",
      },
      {
        ruleId: "R6d-tax",
        benefitId: "finance-tax-guidance",
        priority: "optional",
        reason: "针对跨境财税合规给出专业建议",
      },
    ];
  },

  // R7 香港 / 跨境服务需求
  (p) =>
    p.goals.includes("hk-services")
      ? [
          {
            ruleId: "R7-hk",
            benefitId: "value-hk-accelerator",
            priority: "optional",
            reason: "你希望使用香港资源,可加入跨境电商加速器获得长期对接窗口",
          },
        ]
      : [],

  // R8 平台资源对接 -> 政策同步 + 1v1 商务
  (p) =>
    p.goals.includes("platform-resource")
      ? [
          {
            ruleId: "R8-platform",
            benefitId: "value-platform-sync",
            priority: "strong",
            reason: "你希望对接平台资源,全年政策同步 + 专属商务可保证信息差最小",
          },
        ]
      : [],

  // R9 报告分档
  (p) => {
    if (p.reportTier === "80") {
      return [
        {
          ruleId: "R9-report-80",
          benefitId: "growth-leadgen-plus",
          priority: "strong",
          reason: "你选择了 80 份报告档位,直接对应拓客跃升版",
        },
      ];
    }
    if (p.reportTier === "120-plus") {
      return [
        {
          ruleId: "R9-report-120",
          benefitId: "premium-leadgen-pro",
          priority: "strong",
          reason: "你选择了 120 份及深度营销,直接对应拓客领航版 (升级尊享)",
        },
      ];
    }
    return [];
  },

  // R10 线下活动
  (p) =>
    p.wantsOfflineEvents
      ? [
          {
            ruleId: "R10-offline",
            benefitId: "premium-offline-comarketing",
            priority: "optional",
            reason: "你希望参与线下活动,线下联合营销可与豆服云共同落地",
          },
        ]
      : [],

  // R11 ≥20 万解锁尊享
  (p) =>
    BUDGET_FLOOR[p.budget] >= 200_000
      ? [
          {
            ruleId: "R11a-unlock-salon",
            benefitId: "premium-resource-salon",
            priority: "unlock",
            reason: "你的预算达到 20 万档,平台资源对接私享会自动解锁",
          },
        ]
      : [],

  // R12 ≥80 万解锁亚马逊大会
  (p) =>
    BUDGET_FLOOR[p.budget] >= 800_000
      ? [
          {
            ruleId: "R12-exclusive-amazon",
            benefitId: "exclusive-amazon-summit",
            priority: "gift",
            reason: "你的预算达到 80 万档,亚马逊年度大会联合参展露出作为独家赠送",
          },
        ]
      : [],

  // R13 默认赠送项 (所有方案)
  () => [
    {
      ruleId: "R13a-gift-channel",
      benefitId: "gift-channel",
      priority: "gift",
      reason: "所有方案默认赠送渠道合作机会",
    },
    {
      ruleId: "R13b-gift-insurance",
      benefitId: "gift-logistics-insurance",
      priority: "gift",
      reason: "所有方案默认赠送物流险咨询",
    },
    {
      ruleId: "R13c-gift-hk",
      benefitId: "gift-hk-account",
      priority: "gift",
      reason: "所有方案默认赠送香港企业开户服务",
    },
  ],
];

// ───────────────────────────── 主入口 ─────────────────────────────

export function recommend(profile: ProviderProfile): RecommendationPlan {
  const hits = RULES.flatMap((rule) => rule(profile));
  const merged = mergeHits(hits);

  // 按预算硬约束: 过滤可选项 (基础 / 必选 / 满额项不裁剪)
  const trimmed = enforceBudget(merged, profile);

  // 计费 (赠送 / 解锁 / 大卖有约的 quantity 都考虑)
  const subtotal = trimmed.reduce((sum, item) => {
    if (item.priority === "gift" || item.priority === "unlock") return sum;
    const qty = item.quantity ?? 1;
    return sum + item.benefit.price * qty;
  }, 0);

  const plan: RecommendationPlan = {
    name: deriveName(profile, trimmed),
    tagline: deriveTagline(profile),
    narrative: "", // 下面再填
    items: trimmed,
    subtotal,
    total: subtotal,
    nextSteps: deriveNextSteps(profile, trimmed),
    budget: profile.budget,
  };

  plan.narrative = generateNarrative(profile, plan);
  return plan;
}

// ───────────────────────────── 工具函数 ─────────────────────────────

/** 同 benefit 多次命中时,取最高优先级 + 合并原因。 */
function mergeHits(hits: RuleHit[]): RecommendedBenefit[] {
  const priorityRank: Record<BenefitPriority, number> = {
    required: 4,
    strong: 3,
    optional: 2,
    unlock: 1,
    gift: 0,
  };

  const map = new Map<string, RecommendedBenefit>();
  for (const hit of hits) {
    const benefit = getBenefit(hit.benefitId);
    const existing = map.get(hit.benefitId);
    if (!existing) {
      map.set(hit.benefitId, {
        benefit,
        priority: hit.priority,
        reasons: [hit.reason],
        matchedRules: [hit.ruleId],
        quantity: hit.quantity,
      });
    } else {
      existing.reasons.push(hit.reason);
      existing.matchedRules.push(hit.ruleId);
      if (priorityRank[hit.priority] > priorityRank[existing.priority]) {
        existing.priority = hit.priority;
      }
      if (hit.quantity) {
        existing.quantity = Math.max(existing.quantity ?? 1, hit.quantity);
      }
    }
  }

  // 排序: required > strong > optional > unlock > gift, 同级按 category
  const categoryRank: Record<BenefitItem["category"], number> = {
    base: 0,
    growth: 1,
    "value-added": 2,
    finance: 3,
    premium: 4,
    exclusive: 5,
    gift: 6,
  };
  return Array.from(map.values()).sort((a, b) => {
    const r = priorityRank[b.priority] - priorityRank[a.priority];
    if (r !== 0) return r;
    return categoryRank[a.benefit.category] - categoryRank[b.benefit.category];
  });
}

/**
 * 用预算上限裁剪: 当前所有付费项总价超出 cap 时,
 * 自下而上裁掉 priority = optional 的项,直到符合预算。
 * required / strong / unlock / gift 保留 (服务商可后续手动加项)。
 */
function enforceBudget(
  items: RecommendedBenefit[],
  profile: ProviderProfile
): RecommendedBenefit[] {
  const cap = BUDGET_CAP[profile.budget];
  const paidPrice = (it: RecommendedBenefit) =>
    it.priority === "gift" || it.priority === "unlock"
      ? 0
      : it.benefit.price * (it.quantity ?? 1);

  let total = items.reduce((s, it) => s + paidPrice(it), 0);
  if (total <= cap) return items;

  // 按 optional 从贵到便宜逐个剔除
  const result = [...items];
  const optionalSorted = result
    .map((it, idx) => ({ it, idx }))
    .filter(({ it }) => it.priority === "optional")
    .sort((a, b) => paidPrice(b.it) - paidPrice(a.it));

  for (const { idx } of optionalSorted) {
    if (total <= cap) break;
    total -= paidPrice(result[idx]);
    result[idx] = { ...result[idx], _trimmed: true } as never;
  }

  // 过滤掉被标记的项
  return result.filter((it) => !(it as never as { _trimmed?: boolean })._trimmed);
}

/** 方案名称 —— 根据画像挑一个语义化标题。 */
function deriveName(
  profile: ProviderProfile,
  items: RecommendedBenefit[]
): string {
  const hasBanner = items.some((i) => i.benefit.id === "growth-banner");
  const hasBrand = items.some((i) => i.benefit.id === "growth-brand-marketing");
  const hasBigseller = items.some((i) =>
    i.benefit.id.startsWith("growth-bigseller")
  );
  const hasFinance =
    items.some((i) => i.benefit.id === "value-embed-finance") ||
    items.some((i) => i.benefit.id === "value-risk-model");
  const hasPremium = items.some((i) => i.benefit.category === "premium");
  const hasExclusive = items.some((i) => i.benefit.category === "exclusive");

  if (hasExclusive) return "平台资源与资本加速组合";
  if (hasPremium && hasBigseller) return "大卖深度转化组合";
  if (hasFinance) return "账期金融赋能组合";
  if (hasBanner || hasBrand) return "品牌曝光跃升组合";
  if (profile.goals.includes("lead-gen")) return "基础获客启动组合";
  return "服务商成长起步组合";
}

function deriveTagline(profile: ProviderProfile): string {
  if (profile.goals.length === 0)
    return "基于豆服云权益体系,为你定制的起步组合";
  const first = profile.goals[0];
  const taglineMap: Record<typeof first, string> = {
    "lead-gen": "把豆服云的卖家流量与 AI 拓客打包给你",
    "reach-top-sellers": "锁定 T0/T1 大卖,打开高价值转化窗口",
    "brand-exposure": "用平台核心展示位 + AI 品牌内容做长期曝光",
    "offer-credit": "把账期 / 金融能力嵌进你的客户服务里",
    "reduce-bad-debt": "用风控模型把账期业务的风险压下来",
    "platform-resource": "把平台政策 + 一对一商务对接接到你的团队",
    "financing-tax": "把融资、财税、合规打包成一份诊断 + 行动方案",
    "hk-services": "用香港加速器 + 跨境云资源完成出海落地",
  };
  return taglineMap[first];
}

function deriveNextSteps(
  profile: ProviderProfile,
  items: RecommendedBenefit[]
): NextStep[] {
  const steps: NextStep[] = [
    {
      id: "contact-bd",
      title: "联系豆服云商务",
      description: "由商务对接经理跟你确认权益开通与回款节奏",
      icon: "phone-call",
    },
    {
      id: "assets",
      title: "补充 Logo / 案例 / 服务介绍",
      description: "用于落地展示位、品牌合作与对外露出",
      icon: "image-plus",
    },
  ];
  if (items.some((i) => i.benefit.id === "value-platform-sync")) {
    steps.push({
      id: "platform-sync",
      title: "预约平台对接会",
      description: "由平台商务一对一同步亚马逊等平台最新政策",
      icon: "calendar-clock",
    });
  }
  if (items.some((i) => i.benefit.id === "value-embed-finance")) {
    steps.push({
      id: "fintech-integration",
      title: "申请豆分期技术联调",
      description: "对接你的 ERP / 客户后台,完成金融入口嵌入",
      icon: "plug",
    });
  }
  if (
    profile.wantsOfflineEvents ||
    items.some(
      (i) =>
        i.benefit.id.startsWith("growth-bigseller") ||
        i.benefit.id === "premium-offline-comarketing"
    )
  ) {
    steps.push({
      id: "offline-event",
      title: "预约线下活动 / 游学",
      description: "选定承办时间、行业与目标卖家画像",
      icon: "users",
    });
  }
  return steps;
}

/** 把 RAG 检索接口暴露给外部 (debug / 未来插入 LLM 时使用)。 */
export function listAllBenefits(): BenefitItem[] {
  return KNOWLEDGE_BASE;
}
