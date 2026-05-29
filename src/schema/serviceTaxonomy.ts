import type { ProviderType } from "@/types";

/**
 * 跨境服务分类树（参考雨果网二级目录）。
 * 一级大类 → 细分领域。卖家端「找服务商」与服务商端「服务商类型」共用。
 */
export interface ServiceCategory {
  /** 稳定 key。 */
  key: string;
  /** 一级大类名称。 */
  label: string;
  /** 细分领域。 */
  subs: string[];
  /** 映射到领域 ProviderType（供推荐引擎使用）。 */
  domain: ProviderType;
}

export const SERVICE_TAXONOMY: ServiceCategory[] = [
  {
    key: "operation",
    label: "运营工具",
    subs: ["选爆款", "ERP 工具", "关键词挖掘", "测评"],
    domain: "erp-tool",
  },
  {
    key: "logistics",
    label: "找物流",
    subs: ["专线", "小包", "快递", "FBA 头程空派", "FBA 头程海派", "FBA 头程卡派", "FBA 头程快递", "COD"],
    domain: "logistics",
  },
  {
    key: "warehouse",
    label: "海外仓储",
    subs: ["仓储服务", "一件代发", "贴标换标", "中转服务", "退货售后"],
    domain: "overseas-warehouse",
  },
  {
    key: "tax",
    label: "税务 & 合规",
    subs: ["商标注册", "VAT 注册申报", "资质认证", "公司注册", "专利", "版权", "IOSS 注册申报", "EPR 注册", "财税申报"],
    domain: "fintax",
  },
  {
    key: "payment",
    label: "跨境收款",
    subs: ["平台收款", "独立站收款", "外贸收款", "海外银行开户", "财税审计", "融资贷款", "保险", "金融服务"],
    domain: "fintax",
  },
  {
    key: "marketing",
    label: "营销推广",
    subs: ["Facebook 推广", "TikTok 推广", "Google 推广", "社媒营销", "邮件营销", "品牌建设", "KOL / 网红营销", "本土化运营"],
    domain: "marketing",
  },
  {
    key: "appeal",
    label: "申诉服务",
    subs: ["店铺解封", "律师援助"],
    domain: "other",
  },
];

/** 按 label 查大类。 */
export function categoryByLabel(label: string): ServiceCategory | undefined {
  return SERVICE_TAXONOMY.find((c) => c.label === label);
}

/** 按 key 查大类。 */
export function categoryByKey(key: string): ServiceCategory | undefined {
  return SERVICE_TAXONOMY.find((c) => c.key === key);
}
