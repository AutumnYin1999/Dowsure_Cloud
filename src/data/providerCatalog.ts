/**
 * 卖家侧「服务商推荐」资料库 —— AI 的唯一服务商数据源。
 *
 * 红线（与 sellerEconomics 同一纪律）：AI 永远不许自己编造服务商名称、能力或区域。
 * 推荐只能从本表里的 PROVIDERS 里选，由 matchProviders() 确定性筛出候选，AI 只负责把
 * 「为什么推荐它、它擅长什么、怎么避坑」讲成自然语言。
 *
 * 数据来源：公开资料整理（雨果网 cifnews.com、AMZ123、各服务商官网及第三方测评），
 *   采集于 2026-06。每条只列代表性服务商，非穷尽、非排名；platforms/strengths/regions 为
 *   公开信息归纳，接入真实商务前请二次核对。费率/时效等随时间变化，话术里按「公开资料」口径表述。
 *
 * categoryKey 对齐 src/schema/serviceTaxonomy.ts 的七大类 key：
 *   operation / logistics / warehouse / tax / payment / marketing / appeal
 */

/** 卖家最怕踩的坑（与卖家线 servicePain 选项一一对应）。 */
export type ProviderPain =
  | "transparency" // 报价不透明、利润被附加费吃掉
  | "stability" // 旺季时效不稳、怕断货/差评
  | "aftersale" // 异常没人处理、退款/索赔没人扛
  | "fit"; // 不知道谁适合我的平台、怕换错

/**
 * 服务商等级（3 档）：
 * - certified：豆沙包高级认证服务商（深度合作、重点推荐，排序优先 + 高亮打标）。
 * - partner：豆沙包合作服务商（签约合作名单，普通合作打标）。
 * - recommend：智能推荐（默认）。非签约、由豆服云资料库智能匹配出来的服务商，灰色打标。
 */
export type ProviderTier = "certified" | "partner" | "recommend";

/** 等级 → 展示标签文案（资料卡徽章用）。 */
export const PROVIDER_TIER_LABEL: Record<ProviderTier, string> = {
  certified: "豆沙包高级认证服务商",
  partner: "豆沙包合作服务商",
  recommend: "智能推荐",
};

/** 缺省档：未显式打标的服务商一律按「智能推荐」处理。 */
export const DEFAULT_TIER: ProviderTier = "recommend";

/** 取服务商展示标签（带缺省）。 */
export function tierLabelOf(tier?: ProviderTier): string {
  return PROVIDER_TIER_LABEL[tier ?? DEFAULT_TIER];
}

export interface SellerProvider {
  id: string;
  name: string;
  /** 等级；缺省按 recommend（智能推荐）处理。 */
  tier?: ProviderTier;
  /** 对齐 serviceTaxonomy 的大类 key。 */
  categoryKey: string;
  /** 细分能力（对照 serviceTaxonomy.subs，便于话术具体）。 */
  subs: string[];
  /** 擅长平台。含「多平台」表示通吃。 */
  platforms: string[];
  /** 覆盖区域 / 国家（如适用）。 */
  regions?: string[];
  /** 一句话核心优势 / 解决什么坑。 */
  strengths: string;
  /** 能缓解的「坑」标签，驱动匹配打分。 */
  solves: ProviderPain[];
  /** 给 AI 当背景的简介（公开资料归纳）。 */
  blurb: string;
  /** 参考来源 URL（debug / 溯源用）。 */
  source?: string;
}

export const PROVIDERS: SellerProvider[] = [
  // ───────────────────────── 运营工具（operation） ─────────────────────────
  {
    id: "op-eccang",
    name: "易仓 ERP",
    categoryKey: "operation",
    subs: ["ERP 工具", "利润精算", "广告智能投放", "Listing 诊断", "数据报表"],
    platforms: ["Amazon", "TikTok Shop", "Temu", "多平台"],
    strengths: "老牌 ERP，财务/数据报表强、亚马逊对接深，适合精细化运营",
    solves: ["fit"],
    blurb:
      "深圳易仓集团旗下老牌跨境 ERP，亚马逊对接突出（利润精算、广告投放、Listing 诊断、AMC 分析、AWD 卫星仓），并覆盖 TikTok、Temu 等新兴平台，开发团队与客服规模较大。",
    source: "https://www.eccang.com/news/4513",
  },
  {
    id: "op-mabang",
    name: "马帮 ERP",
    categoryKey: "operation",
    subs: ["ERP 工具", "多平台多仓管理", "供应链全链路"],
    platforms: ["Amazon", "eBay", "速卖通", "多平台"],
    strengths: "按单量计费、性价比高，全链路供应链稳，适合中小卖家",
    solves: ["transparency", "fit"],
    blurb:
      "老牌跨境 ERP，支持多平台多仓库，覆盖产品/采购/订单/仓储/物流/客服全环节；按单量收费、性价比高，适合中小型卖家。",
    source: "https://www.bnocode.com/article/mabang-erp-system.html",
  },
  {
    id: "op-lingxing",
    name: "领星 ERP",
    categoryKey: "operation",
    subs: ["ERP 工具", "多店铺统一管理", "利润核算", "广告优化"],
    platforms: ["Amazon"],
    strengths: "专注亚马逊，多店铺统一管理、利润与广告做得细",
    solves: ["fit"],
    blurb:
      "专注亚马逊平台卖家，提供从刊登、订单、仓储、物流到财务的一站式管理，支持多店铺统一管理、利润核算与广告优化。",
    source: "https://docs.pingcode.com/ask/ask-ask/248087.html",
  },
  {
    id: "op-jijia",
    name: "积加 ERP",
    tier: "partner",
    categoryKey: "operation",
    subs: ["ERP 工具", "精细化运营", "供应链协同", "财务核算"],
    platforms: ["Amazon"],
    strengths: "聚焦亚马逊精品卖家、数据化运营，提升单店产出",
    solves: ["fit"],
    blurb:
      "聚焦亚马逊精品卖家，提供产品开发、广告管理、供应链协同、财务核算等模块，注重数据化运营。",
    source: "https://www.eccang.com/news/2526",
  },
  {
    id: "op-dianxiaomi",
    name: "店小秘",
    categoryKey: "operation",
    subs: ["ERP 工具", "订单处理", "刊登", "进销存"],
    platforms: ["Amazon", "eBay", "Shopee", "多平台"],
    strengths: "上手快、性价比高，适合多平台铺货的中小卖家",
    solves: ["transparency", "fit"],
    blurb:
      "覆盖亚马逊、eBay、Shopee 等多平台，主打性价比、上手快；财务核算、广告管理、进销存与数据可视化较完善。",
    source: "https://www.2i1i.com/24242.html",
  },

  // ───────────────────────── 找物流（logistics） ─────────────────────────
  {
    id: "log-xiyou",
    name: "西邮物流",
    tier: "certified",
    categoryKey: "logistics",
    subs: ["海运头程", "FBA 头程", "海外仓储", "一件代发", "贴标换标", "尾程卡派"],
    platforms: ["Amazon", "多平台"],
    regions: ["美国", "欧洲"],
    strengths: "中大件出海强，欧美 27 个自营海外仓、海运头程到尾程派送全链路",
    solves: ["stability", "aftersale"],
    blurb:
      "成立于 2015 年，专注中大件跨境出口；欧美已有 27 个全自营海外仓、总面积超 500 万平方英尺，提供海运头程、海外仓储、FBA 送仓、一件代发、贴标换标、尾程卡派全链路，自研 10+ 智能业务系统。",
    source: "https://www.wpglb.com/",
  },
  {
    id: "log-far800",
    name: "泛远国际（Far International）",
    tier: "certified",
    categoryKey: "logistics",
    subs: ["端到端跨境配送", "FBA 头程", "海外仓储", "出口清关", "尾程派送", "供应链方案"],
    platforms: ["Amazon", "多平台"],
    regions: ["美洲", "欧洲", "全球 200+ 国家"],
    strengths: "港股上市（2516.HK）、阿里持股，端到端跨境物流、欧美专线成熟",
    solves: ["stability", "fit"],
    blurb:
      "成立于 2004 年的国内知名跨境电商物流服务商，按 2021 年收益在中国跨境物流市场排名第 8；2023 年 12 月在港交所上市（2516.HK），阿里巴巴上市前持股超 10%。提供端到端跨境配送（收货/仓储/安检/打包/贴标/分拣/出口报关/国际干线/清关/尾程派送）与供应链方案，覆盖 200+ 国家。",
    source: "https://www.far800.com/",
  },
  {
    id: "log-4px",
    name: "递四方（4PX）",
    categoryKey: "logistics",
    subs: ["FBA 头程", "专线", "小包", "贴标分箱", "退件处理"],
    platforms: ["Amazon", "多平台"],
    regions: ["美国", "英国", "日本", "全球"],
    strengths: "网络广、FBA 增值服务全，能代贴标/分箱、协助处理退件",
    solves: ["stability", "fit"],
    blurb:
      "依托自有网络帮亚马逊全球开店卖家把货从中国转运到美/英/日各 FBA 仓，提供打标、代贴标、分箱等增值服务及退件处理。",
    source: "http://express.4px.com/article/detail/id/500007",
  },
  {
    id: "log-yunexpress",
    name: "云途物流（YunExpress）",
    categoryKey: "logistics",
    subs: ["跨境专线", "FBA 头程", "邮政小包"],
    platforms: ["Amazon", "多平台"],
    regions: ["中欧", "美国", "全球"],
    strengths: "纵腾旗下，专线网络成熟、时效稳定",
    solves: ["stability"],
    blurb:
      "主营跨境专线、FBA 头程（中欧/美国）、邮政代理与国际商业快递；2018 年并入纵腾集团，成为其子公司。",
    source: "https://www.amz123.com/t/CXfh6kPo",
  },
  {
    id: "log-yanwen",
    name: "燕文物流（Yanwen）",
    categoryKey: "logistics",
    subs: ["小包", "FBA 头程", "自发货挂号", "海外仓一件代发"],
    platforms: ["Amazon", "多平台"],
    regions: ["全球"],
    strengths: "6 大分拨中心 + 37 个集货转运中心，小包能力强",
    solves: ["stability"],
    blurb:
      "跨境出口电商综合物流服务商，主营小包、FBA 与亚马逊自发货挂号，覆盖海运、空运、经济小包、海外仓一件代发、FBA 头程。",
    source: "https://letschuhai.com/pandianshichanglisanjutouqueweiyiwenkandongkuajingdianshangchukouwuliu",
  },
  {
    id: "log-zongteng",
    name: "纵腾集团（ZongTeng）",
    categoryKey: "logistics",
    subs: ["FBA 头程", "海外清关", "卡车转运", "航空运输"],
    platforms: ["Amazon", "多平台"],
    regions: ["全球"],
    strengths: "基础设施级玩家，旗下含谷仓海外仓、云途物流，链路完整",
    solves: ["stability", "fit"],
    blurb:
      "以「全球跨境电商基础设施服务商」自我定位，提供航空运输、FBA 头程、海外清关、卡车转运等；旗下含谷仓海外仓、云途物流、纵腾冠通、沃德太客等品牌。",
    source: "https://www.ztn.com/",
  },
  {
    id: "log-chukou1",
    name: "出口易（Chukou1）",
    categoryKey: "logistics",
    subs: ["FBA 头程", "海外仓调拨中转", "快递", "海运"],
    platforms: ["Amazon"],
    regions: ["全球 FBA 仓"],
    strengths: "亚马逊官方认可 SPN 服务商，固定船期、覆盖所有 FBA 仓",
    solves: ["stability", "fit"],
    blurb:
      "联合海空运、快递为 FBA 提供头程服务，覆盖所有 FBA 仓；亚马逊官方认可的 SPN 服务商，固定船期每周两班。",
    source: "https://www.chukou1.com/Services/FBAFirst.aspx",
  },

  // ───────────────────────── 海外仓储（warehouse） ─────────────────────────
  {
    id: "wh-goodcang",
    name: "谷仓海外仓（Goodcang）",
    categoryKey: "warehouse",
    subs: ["仓储服务", "一件代发", "FBA 中转", "退货售后"],
    platforms: ["多平台"],
    regions: ["美国", "欧洲", "全球"],
    strengths: "纵腾旗下、规模大、自动化程度高，旺季可扩容",
    solves: ["stability", "aftersale"],
    blurb:
      "纵腾集团旗下知名海外仓品牌，提供仓储、一件代发、FBA 中转与退货售后，仓网规模大、自动化能力强。",
    source: "https://www.ztn.com/",
  },
  {
    id: "wh-winit",
    name: "万邑通 / 沃德太客（WinIt）",
    categoryKey: "warehouse",
    subs: ["仓储服务", "一件代发", "退货换标", "中转服务"],
    platforms: ["多平台"],
    regions: ["美国", "欧洲"],
    strengths: "老牌海外仓、系统化运营，退货换标与中转成熟",
    solves: ["aftersale", "stability"],
    blurb:
      "老牌海外仓服务商（纵腾系沃德太客品牌），提供仓储、一件代发、退货换标与中转，系统化程度较高。",
    source: "https://www.ztn.com/",
  },
  {
    id: "wh-shipsage",
    name: "仓盛海外仓（ShipSage）",
    categoryKey: "warehouse",
    subs: ["一件代发", "FBA 中转", "退货换标"],
    platforms: ["多平台"],
    regions: ["美国（六大区自营）"],
    strengths: "12 年自营美仓经验，专注美国本土履约",
    solves: ["stability", "aftersale"],
    blurb:
      "专注美国自营海外仓，12 年运营经验，提供一件代发、亚马逊 FBA 中转、退货换标，美国六大区自营仓。",
    source: "https://www.shipsage.cn/",
  },
  {
    id: "wh-ytdhwc",
    name: "邑通达海外仓",
    categoryKey: "warehouse",
    subs: ["一件代发", "FBA 退货", "中转服务"],
    platforms: ["TEMU", "TikTok", "多平台"],
    regions: ["欧洲", "美洲"],
    strengths: "本土化运营，TEMU / TikTok 代发与 FBA 退货擅长",
    solves: ["fit", "aftersale"],
    blurb:
      "为跨境卖家提供全球仓储供应链一体化服务，欧洲与美洲布局，擅长 TEMU/TikTok 一件代发、FBA 退货与仓库合并。",
    source: "https://www.ytdhwc.com/",
  },
  {
    id: "wh-chukou1",
    name: "出口易海外仓",
    categoryKey: "warehouse",
    subs: ["仓储服务", "一件代发", "FBA 调拨", "退货售后"],
    platforms: ["多平台"],
    regions: ["英国", "美国", "全球"],
    strengths: "老牌海外仓，清关/质检/拣货/配送一体化",
    solves: ["stability"],
    blurb:
      "出口易海外仓，提供清关、质检、订单处理、分拣、配送一体化服务，英美等多地布局。",
    source: "https://www.chukou1.com/Logistics.aspx?Id=127",
  },

  // ───────────────────────── 税务 & 合规（tax） ─────────────────────────
  {
    id: "tax-jp",
    name: "J&P 会计师事务所",
    categoryKey: "tax",
    subs: ["VAT 注册申报", "EPR 注册", "欧代 / 英代", "资质认证"],
    platforms: ["多平台"],
    regions: ["英国", "德国", "法国", "意大利", "西班牙"],
    strengths: "2007 年成立、20 年税务团队，欧洲本地分部多",
    solves: ["fit", "aftersale"],
    blurb:
      "创立于 2007 年，总部英国曼彻斯特，中/德/法/意/西均有分部，主营欧洲 VAT 注册申报、EPR 注册、欧代英代等，税务专家团队经验深。",
    source: "https://jpvat.cn/",
  },
  {
    id: "tax-evat",
    name: "欧税通（eVat Master）",
    tier: "partner",
    categoryKey: "tax",
    subs: ["VAT 注册申报", "商标注册", "IOSS / EORI / EPR"],
    platforms: ["多平台"],
    regions: ["欧洲"],
    strengths: "合规 SaaS、自动化申报，报价与流程透明",
    solves: ["transparency", "fit"],
    blurb:
      "由税务团队与 IT 团队融合，定位中国首家跨境电商合规产品 SaaS，提供 VAT 注册申报、商标注册、IOSS/EORI/EPR 等。",
    source: "https://www.idcspy.net/evatmaster",
  },
  {
    id: "tax-kuaxintong",
    name: "跨信通（KuaXinTong）",
    categoryKey: "tax",
    subs: ["VAT 注册申报", "EPR 合规", "商标专利", "公司注册", "产品检测认证"],
    platforms: ["Amazon", "速卖通", "TEMU", "SHEIN", "美客多", "多平台"],
    strengths: "一站式出海合规，获多家平台生态认证",
    solves: ["fit"],
    blurb:
      "2017 年成立、总部深圳的全球一站式出海合规平台，获亚马逊、速卖通、TEMU、SHEIN、美客多等生态认证，覆盖全球 VAT、欧洲 EPR、商标专利、检测认证与海外工商注册。",
    source: "https://www.kuaxintong.com/",
  },

  // ───────────────────────── 跨境收款（payment） ─────────────────────────
  {
    id: "pay-payoneer",
    name: "Payoneer（派安盈）",
    categoryKey: "payment",
    subs: ["平台收款", "多平台结算", "VAT 缴税"],
    platforms: ["Amazon", "Shopee", "Wish", "eBay", "多平台"],
    regions: ["全球"],
    strengths: "2005 年成立、万事达发卡资质，平台覆盖广、老牌稳",
    solves: ["fit"],
    blurb:
      "2005 年成立、总部纽约，万事达卡授权发卡机构，适用亚马逊、Shopee、Wish、eBay 等平台；提现手续费封顶 1.2%，大客户可协商更低。",
    source: "https://www.cifnews.com/article/139307",
  },
  {
    id: "pay-pingpong",
    name: "PingPong",
    categoryKey: "payment",
    subs: ["平台收款", "结汇", "VAT 缴税"],
    platforms: ["Amazon", "多平台"],
    regions: ["200+ 国家和地区"],
    strengths: "费率较低、全球 30+ 分支，结汇灵活",
    solves: ["transparency", "fit"],
    blurb:
      "2015 年成立的杭州乒乓智能，全球 30+ 分支机构，业务覆盖 200+ 国家和地区，费率有竞争力。",
    source: "https://www.cifnews.com/article/139307",
  },
  {
    id: "pay-lianlian",
    name: "连连国际（LianLian）",
    categoryKey: "payment",
    subs: ["平台收款", "多币种结算", "全球支付网络"],
    platforms: ["近 70 家跨境平台", "多平台"],
    regions: ["100+ 国家和地区"],
    strengths: "合规实力强、平台覆盖广（约 150 个站点）",
    solves: ["fit"],
    blurb:
      "合规与安全实力强，支持全球近 70 家跨境平台、约 150 个站点、11 种货币自由结算，覆盖 100+ 国家和地区；标准提现费率 0.7%。",
    source: "https://www.cifnews.com/article/139307",
  },
  {
    id: "pay-worldfirst",
    name: "万里汇（WorldFirst）",
    categoryKey: "payment",
    subs: ["平台收款", "结汇"],
    platforms: ["Amazon", "PayPal", "多平台"],
    regions: ["全球"],
    strengths: "蚂蚁集团旗下，提现费率封顶 0.3%、大额可免费",
    solves: ["transparency"],
    blurb:
      "蚂蚁集团旗下专业服务全球电商卖家的支付平台，15 年跨境支付经验；提现手续费封顶 0.3%，大额收款甚至免费。",
    source: "https://www.cifnews.com/article/139307",
  },
  {
    id: "pay-airwallex",
    name: "空中云汇（Airwallex）",
    categoryKey: "payment",
    subs: ["收款", "结汇", "独立站收款"],
    platforms: ["独立站", "外贸", "多平台"],
    regions: ["全球"],
    strengths: "费率超低（约 0.3%），适合独立站 / 外贸收款",
    solves: ["transparency", "fit"],
    blurb:
      "获腾讯、红杉中国、DST、高瓴创投等超 4 亿美元融资，手续费低至约 0.3%、结汇卡可达 0.05%，独立站/外贸场景强。",
    source: "https://www.cifnews.com/article/139307",
  },

  // ───────────────────────── 营销推广（marketing） ─────────────────────────
  {
    id: "mkt-meetsocial",
    name: "飞书深诺（Meetsocial）",
    categoryKey: "marketing",
    subs: ["Facebook 推广", "TikTok 推广", "Google 推广", "达人服务", "品牌建设"],
    platforms: ["独立站", "TikTok Shop", "Amazon", "多平台"],
    regions: ["全球"],
    strengths: "服务超 10 万企业、年管理营销额 60 亿美元，资源全",
    solves: ["fit", "stability"],
    blurb:
      "覆盖独立站、TikTok Shop、亚马逊等多平台，依托全球优质媒体，提供策略/投放/创意/达人一站式；累计服务超 10 万家中国企业出海，年管理营销金额超 60 亿美元。",
    source: "https://www.meetsocial.com/",
  },
  {
    id: "mkt-sinoclick",
    name: "飞书逸途（SinoClick）",
    tier: "partner",
    categoryKey: "marketing",
    subs: ["Facebook/TikTok/Google 官方开户", "广告投放", "达人合作"],
    platforms: ["独立站", "TikTok Shop", "多平台"],
    regions: ["全球"],
    strengths: "飞书深诺旗下、官方一级代理，适合成长型卖家",
    solves: ["transparency", "fit"],
    blurb:
      "飞书深诺旗下成长型跨境电商全渠道营销服务商，Facebook/TikTok/Google 官方开户一级代理，覆盖广告投放与达人合作。",
    source: "https://www.sinoclick.com/",
  },
  {
    id: "mkt-insmark",
    name: "映马传媒（InsMark MCN）",
    categoryKey: "marketing",
    subs: ["海外红人营销", "TikTok 达人", "MCN 内容孵化"],
    platforms: ["TikTok", "YouTube", "Instagram"],
    regions: ["全球"],
    strengths: "TikTok 官方 MCN，海外红人资源丰富",
    solves: ["fit"],
    blurb:
      "海外红人营销机构、TikTok 官方 MCN，提供达人撮合、内容孵化与红人营销服务。",
    source: "https://www.insmarkmcn.com/",
  },
  {
    id: "mkt-hushi",
    name: "虎视传媒",
    categoryKey: "marketing",
    subs: ["海外网红营销", "达人撮合", "直播运营"],
    platforms: ["TikTok"],
    regions: ["全球"],
    strengths: "TikTok 官方认证达人代理，达人撮合 + 直播",
    solves: ["fit"],
    blurb:
      "TikTok 官方认证的头部达人代理商之一，覆盖达人撮合、内容孵化、直播运营与广告投放。",
    source: "https://www.sohu.com/a/1022632301_121674588",
  },

  // ───────────────────────── 申诉服务（appeal） ─────────────────────────
  // 注：申诉服务多为专项工作室/律所，公开「品牌化」服务商较少，以下为代表性入口，接真实商务前需重点核实。
  {
    id: "appeal-amz123",
    name: "AMZ123 申诉服务",
    categoryKey: "appeal",
    subs: ["店铺解封", "账号申诉", "冻结 / 侵权处理"],
    platforms: ["Amazon"],
    regions: ["全球"],
    strengths: "专项申诉服务、案例库较多，覆盖封号/冻结/侵权",
    solves: ["aftersale"],
    blurb:
      "提供亚马逊账号申诉解封服务，覆盖封号、资金冻结、侵权等场景，案例积累较多。",
    source: "https://www.amz123.com/shensu",
  },
  {
    id: "appeal-jp-legal",
    name: "J&P 律师 / 法务援助",
    categoryKey: "appeal",
    subs: ["律师援助", "二审 / KYC", "复杂申诉法务"],
    platforms: ["Amazon", "多平台"],
    regions: ["欧美"],
    strengths: "法务团队，适合资金冻结、二审 KYC 等复杂申诉",
    solves: ["aftersale"],
    blurb:
      "依托欧洲本地会计师/法务团队，处理较复杂的账号二审、KYC 与资金冻结类申诉。",
    source: "https://jpvat.cn/",
  },

  // ═════════════════════ 豆沙包合作服务商（签约名单 · partner） ═════════════════════
  // 来源：豆服云合作服务商资料（物流 / 广告 / 财税 / 运营）。logo 后续接入，blurb 为公开信息归纳，
  // 接入真实商务前请二次核对。

  // ── 合作物流服务商 ──
  {
    id: "log-lianyu",
    name: "联宇物流",
    tier: "partner",
    categoryKey: "logistics",
    subs: ["FBA 头程", "海运 / 空运", "海外仓中转", "尾程派送"],
    platforms: ["Amazon", "多平台"],
    regions: ["美国", "欧洲"],
    strengths: "豆沙包合作头程物流，海空运 + 海外仓中转链路完整",
    solves: ["stability", "fit"],
    blurb: "豆沙包合作物流服务商，提供 FBA 头程、海运空运与海外仓中转、尾程派送。（公开信息归纳，接入前请核对。）",
  },
  {
    id: "log-kaicangle",
    name: "开仓了",
    tier: "partner",
    categoryKey: "logistics",
    subs: ["海外仓一件代发", "FBA 中转", "仓配一体"],
    platforms: ["多平台"],
    regions: ["美国", "欧洲"],
    strengths: "豆沙包合作，海外仓 + 一件代发，仓配一体",
    solves: ["stability", "aftersale"],
    blurb: "豆沙包合作物流 / 海外仓服务商，提供海外仓一件代发、FBA 中转与仓配一体服务。（公开信息归纳，接入前请核对。）",
  },
  {
    id: "log-tuopuda",
    name: "拓普达",
    tier: "partner",
    categoryKey: "logistics",
    subs: ["FBA 头程", "跨境专线", "海外仓"],
    platforms: ["Amazon", "多平台"],
    regions: ["美国", "欧洲"],
    strengths: "豆沙包合作头程物流，专线时效稳定",
    solves: ["stability"],
    blurb: "豆沙包合作物流服务商，主营 FBA 头程与跨境专线、海外仓配送。（公开信息归纳，接入前请核对。）",
  },
  {
    id: "log-zhunshida",
    name: "准时达",
    tier: "partner",
    categoryKey: "logistics",
    subs: ["供应链物流", "FBA 头程", "海外仓", "端到端供应链"],
    platforms: ["Amazon", "多平台"],
    regions: ["全球"],
    strengths: "豆沙包合作，供应链物流能力强、端到端覆盖",
    solves: ["stability", "fit"],
    blurb: "豆沙包合作物流服务商（准时达国际供应链），提供端到端供应链物流、FBA 头程与海外仓。（公开信息归纳，接入前请核对。）",
  },
  {
    id: "log-kaiqi",
    name: "凯琦",
    tier: "partner",
    categoryKey: "logistics",
    subs: ["FBA 头程", "跨境专线", "尾程派送"],
    platforms: ["Amazon", "多平台"],
    regions: ["美国", "欧洲"],
    strengths: "豆沙包合作头程物流",
    solves: ["stability"],
    blurb: "豆沙包合作物流服务商，主营 FBA 头程与跨境专线、尾程派送。（公开信息归纳，接入前请核对。）",
  },
  {
    id: "log-chidao",
    name: "赤道",
    tier: "partner",
    categoryKey: "logistics",
    subs: ["FBA 头程", "海运 / 空运", "尾程派送"],
    platforms: ["Amazon", "多平台"],
    regions: ["美国", "欧洲"],
    strengths: "豆沙包合作头程物流",
    solves: ["stability"],
    blurb: "豆沙包合作物流服务商，提供 FBA 头程、海空运与尾程派送。（公开信息归纳，接入前请核对。）",
  },
  {
    id: "log-niuku",
    name: "纽酷",
    tier: "partner",
    categoryKey: "logistics",
    subs: ["海外仓一件代发", "FBA 头程", "尾程派送"],
    platforms: ["多平台"],
    regions: ["美国", "欧洲"],
    strengths: "豆沙包合作，海外仓 + 头程一体",
    solves: ["stability", "aftersale"],
    blurb: "豆沙包合作物流 / 海外仓服务商，提供海外仓一件代发、FBA 头程与尾程派送。（公开信息归纳，接入前请核对。）",
  },

  // ── 合作广告服务商（官方广告投放渠道） ──
  {
    id: "mkt-meta",
    name: "Meta",
    tier: "partner",
    categoryKey: "marketing",
    subs: ["Facebook 广告", "Instagram 广告", "官方广告投放"],
    platforms: ["独立站", "多平台"],
    regions: ["全球"],
    strengths: "豆沙包合作官方广告渠道，覆盖 Facebook / Instagram",
    solves: ["fit"],
    blurb: "豆沙包合作的官方广告投放渠道，覆盖 Facebook、Instagram 等 Meta 系流量，适合品牌与独立站获客。",
  },
  {
    id: "mkt-google",
    name: "Google",
    tier: "partner",
    categoryKey: "marketing",
    subs: ["Google Ads", "搜索 / 购物广告", "官方广告投放"],
    platforms: ["独立站", "多平台"],
    regions: ["全球"],
    strengths: "豆沙包合作官方广告渠道，搜索 / 购物 / 展示全覆盖",
    solves: ["fit"],
    blurb: "豆沙包合作的官方广告投放渠道（Google Ads），覆盖搜索、购物、展示广告，适合精准获量。",
  },
  {
    id: "mkt-amazonads",
    name: "Amazon Ads",
    tier: "partner",
    categoryKey: "marketing",
    subs: ["站内广告", "SP / SB / SD", "品牌推广"],
    platforms: ["Amazon"],
    regions: ["全球"],
    strengths: "豆沙包合作官方渠道，亚马逊站内广告全类型",
    solves: ["fit"],
    blurb: "豆沙包合作的亚马逊官方广告渠道，覆盖商品推广（SP）、品牌推广（SB）、展示型推广（SD）等站内广告。",
  },

  // ── 合作财税服务商 ──
  {
    id: "tax-jiaderunfeng",
    name: "嘉德润沣",
    tier: "partner",
    categoryKey: "tax",
    subs: ["跨境财税", "VAT 注册申报", "税务筹划"],
    platforms: ["多平台"],
    regions: ["欧洲", "全球"],
    strengths: "豆沙包合作财税，VAT 合规与税务筹划",
    solves: ["fit", "transparency"],
    blurb: "豆沙包合作财税服务商，提供跨境财税、VAT 注册申报与税务筹划。（公开信息归纳，接入前请核对。）",
  },
  {
    id: "tax-xiangmai",
    name: "响迈财税",
    tier: "partner",
    categoryKey: "tax",
    subs: ["跨境财税", "VAT / 合规", "账务处理"],
    platforms: ["多平台"],
    regions: ["欧洲", "全球"],
    strengths: "豆沙包合作财税，VAT 合规与账务处理",
    solves: ["fit", "transparency"],
    blurb: "豆沙包合作财税服务商，提供跨境财税、VAT 合规与账务处理服务。（公开信息归纳，接入前请核对。）",
  },

  // ── 合作运营服务商 ──
  {
    id: "op-shazhixing",
    name: "沙之星",
    tier: "partner",
    categoryKey: "operation",
    subs: ["亚马逊代运营", "店铺托管", "运营陪跑"],
    platforms: ["Amazon"],
    regions: ["全球"],
    strengths: "豆沙包合作，亚马逊代运营 / 店铺托管",
    solves: ["fit"],
    blurb: "豆沙包合作运营服务商，提供亚马逊代运营、店铺托管与运营陪跑。（公开信息归纳，接入前请核对。）",
  },
  {
    id: "op-sellersprite",
    name: "卖家精灵",
    tier: "partner",
    categoryKey: "operation",
    subs: ["选品分析", "关键词工具", "竞品监控", "数据分析"],
    platforms: ["Amazon"],
    regions: ["全球"],
    strengths: "豆沙包合作，亚马逊选品 / 关键词 / 数据分析工具",
    solves: ["fit"],
    blurb: "豆沙包合作运营工具，亚马逊选品、关键词反查、竞品监控与数据分析。（公开信息归纳，接入前请核对。）",
  },
  {
    id: "op-ziniao",
    name: "紫鸟",
    tier: "partner",
    categoryKey: "operation",
    subs: ["多账号防关联", "超级浏览器", "团队权限管理"],
    platforms: ["多平台"],
    regions: ["全球"],
    strengths: "豆沙包合作，多账号防关联运营（紫鸟浏览器）",
    solves: ["fit"],
    blurb: "豆沙包合作运营工具，紫鸟超级浏览器，主打多店铺多账号防关联与团队权限管理。（公开信息归纳，接入前请核对。）",
  },
  {
    id: "op-huiyou",
    name: "洄游",
    tier: "partner",
    categoryKey: "operation",
    subs: ["亚马逊运营", "运营培训", "代运营陪跑"],
    platforms: ["Amazon"],
    regions: ["全球"],
    strengths: "豆沙包合作，亚马逊运营 / 培训陪跑",
    solves: ["fit"],
    blurb: "豆沙包合作运营服务商，提供亚马逊运营、运营培训与代运营陪跑。（公开信息归纳，接入前请核对。）",
  },
  {
    id: "op-mailzone",
    name: "Mailzone",
    tier: "partner",
    categoryKey: "operation",
    subs: ["邮件营销", "EDM", "客户召回"],
    platforms: ["独立站", "多平台"],
    regions: ["全球"],
    strengths: "豆沙包合作，邮件营销 / EDM 客户召回",
    solves: ["fit"],
    blurb: "豆沙包合作运营工具，提供邮件营销（EDM）、客户召回与自动化触达。（公开信息归纳，接入前请核对。）",
  },
];

// ───────────────────────────── 匹配引擎 ─────────────────────────────

/** 卖家线 servicePain 文案 → ProviderPain 标签。 */
export function painFromLabel(label?: string): ProviderPain | null {
  if (!label) return null;
  const s = label.toLowerCase();
  if (/报价|附加费|不透明|对账|隐藏|利润|费用|贵/.test(s)) return "transparency";
  if (/旺季|时效|不稳|断货|差评|延误|爆仓|慢/.test(s)) return "stability";
  if (/异常|售后|退款|索赔|赔付|丢件|破损|没人/.test(s)) return "aftersale";
  if (/适合|匹配|靠谱|怎么选|换错|平台|不知道/.test(s)) return "fit";
  return null;
}

export interface ScoredProvider {
  provider: SellerProvider;
  score: number;
  /** 命中原因（debug / 话术提示）。 */
  hits: string[];
}

/**
 * 确定性匹配：先按品类硬过滤，再按「怕踩的坑 + 平台」打分排序。
 * AI 只能从返回的候选里讲，不许另选或编造。
 */
export function matchProviders(input: {
  categoryKey?: string;
  pains?: ProviderPain[];
  platform?: string;
  limit?: number;
}): ScoredProvider[] {
  const { categoryKey, pains = [], platform, limit = 3 } = input;
  const pool = categoryKey
    ? PROVIDERS.filter((p) => p.categoryKey === categoryKey)
    : PROVIDERS;

  const platformLc = platform?.toLowerCase().trim();
  const scored = pool.map((provider): ScoredProvider => {
    const hits: string[] = [];
    let score = 0;
    // 等级加权：高级认证最优先，其次签约合作，智能推荐不加权 —— 让合作/认证在同类里冒头。
    if (provider.tier === "certified") {
      score += 3;
      hits.push("certified");
    } else if (provider.tier === "partner") {
      score += 1.5;
      hits.push("partner");
    }
    for (const pain of pains) {
      if (provider.solves.includes(pain)) {
        score += 2;
        hits.push(pain);
      }
    }
    if (platformLc) {
      const matchPlatform = provider.platforms.some(
        (pf) => pf.toLowerCase().includes(platformLc) || platformLc.includes(pf.toLowerCase())
      );
      const universal = provider.platforms.some((pf) => /多平台|全球/.test(pf));
      if (matchPlatform) {
        score += 1.5;
        hits.push(`platform:${platform}`);
      } else if (universal) {
        score += 0.5;
        hits.push("platform:多平台");
      }
    }
    return { provider, score, hits };
  });

  // 分数相同保持原表顺序（PROVIDERS 内已按代表性/规模大致排列）。
  return scored
    .map((s, idx) => ({ s, idx }))
    .sort((a, b) => b.s.score - a.s.score || a.idx - b.idx)
    .slice(0, limit)
    .map(({ s }) => s);
}
