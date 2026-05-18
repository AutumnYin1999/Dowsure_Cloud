/**
 * 登录后「核心权益矩阵」工作台 (DRAFT)
 *
 * ─────────────────────────────────────────────
 * 状态: 暂未挂载到任何路由 / 页面。
 * 用途: 服务商登录后查看「已开通的权益」+「可加购的权益体系」
 *       的工作台。
 *
 * 后续接入计划:
 *   1. 新增 /workbench 或登录后入口
 *   2. 用户登录态读到 ProviderProfile + 已购清单
 *   3. 把这两个 section 移过去,绑定真实数据
 *
 * Welcome 页 (访客 / 未登录扫码) 不再展示这部分,
 * 以免与"未购买 → 推荐"的引流主路径冲突。
 * ─────────────────────────────────────────────
 */
import {
  Award,
  Banknote,
  Building2,
  Check,
  Crown,
  Gift,
  GraduationCap,
  Megaphone,
  Ship,
  Sparkles,
  Wallet,
} from "lucide-react";

/** 必选 · 基础底座 —— 登录后默认全部"已开启" */
const BASE_CARDS = [
  {
    icon: Building2,
    title: "平台基础固定展示位",
    detail: "豆服平台服务商分类页全年固定展示位,提升品牌曝光与信任背书",
  },
  {
    icon: GraduationCap,
    title: "AI 智能拓客 · 启航版",
    detail: "AI 输出 20 份高价值卖家分析报告,精准识别潜在客户",
    highlight: "20 份",
  },
  {
    icon: Wallet,
    title: "100 万美金提现优惠券",
    detail: "注册豆沙钱包即送,单笔手续费抵扣 50%,降低提现成本",
    highlight: "50%",
  },
  {
    icon: Ship,
    title: "豆分期服务",
    detail: "卖家「先用后付」,服务商提前回款、零坏账风险,增强客户粘性",
  },
];

/** 权益体系一览 —— 6 大分类 */
const OVERVIEW = [
  {
    icon: Building2,
    title: "必选基础包",
    detail: "展示位 + AI 拓客启航 + 提现券 + 豆分期",
    price: "￥28,888",
    tag: "起步",
  },
  {
    icon: Megaphone,
    title: "获客增长",
    detail: "首页 Banner / AI 拓客跃升 / 大卖有约",
    price: "￥2 万起",
    tag: "增长",
  },
  {
    icon: Sparkles,
    title: "增值服务",
    detail: "嵌入式金融 / 风控模型 / 政策同步",
    price: "￥2 万起",
    tag: "能力",
  },
  {
    icon: Banknote,
    title: "金融赋能",
    detail: "债权 / 股权 / 财务诊断 / 财税",
    price: "￥2,000 起",
    tag: "金融",
  },
  {
    icon: Crown,
    title: "升级尊享",
    detail: "选购满 20 万解锁,深度营销 + 私享会",
    price: "≥20 万",
    tag: "尊享",
  },
  {
    icon: Award,
    title: "独家权益",
    detail: "选购满 80 万,亚马逊年度大会联合参展",
    price: "≥80 万",
    tag: "独家",
  },
];

const GIFT_TAGS = ["渠道合作机会", "物流险咨询", "香港企业开户服务"];

export function EntitlementsMatrix() {
  return (
    <div className="space-y-8">
      {/* 必选项 · 基础底座 */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            核心权益矩阵
          </h2>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-semibold text-brand-600">
              必选项
            </span>
            <span className="text-base font-semibold text-brand-600">·</span>
            <span className="text-base font-semibold text-brand-600">
              基础底座
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            每位服务商即刻开通,构成日常运营的最低保障
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BASE_CARDS.map((c) => (
            <div
              key={c.title}
              className="ds-card-soft group flex flex-col gap-3 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-pop"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <c.icon className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-2 py-0.5 text-[11px] font-semibold text-accent-emerald">
                  <Check className="h-3 w-3" strokeWidth={3} />
                  已开启
                </span>
              </div>
              <div>
                <p className="text-[15px] font-semibold tracking-tight text-ink">
                  {c.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                  {c.highlight ? (
                    <>
                      {c.detail.split(c.highlight)[0]}
                      <span className="font-semibold text-brand-600">
                        {c.highlight}
                      </span>
                      {c.detail.split(c.highlight)[1]}
                    </>
                  ) : (
                    c.detail
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6 大权益分类 */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-brand-600">
                获客 · 增值 · 金融 · 尊享
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              问卷会根据你的回答,从下列权益池中组合方案
            </p>
          </div>
          <span className="hidden text-xs text-ink-soft sm:inline">
            共 7 大类 · 22 项权益
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OVERVIEW.map((item) => (
            <div
              key={item.title}
              className="ds-card-soft flex items-start gap-3 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-pop"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-pop">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <span className="text-xs font-semibold text-brand-700">
                    {item.price}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {item.detail}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-brand-100 bg-brand-50/70 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                  {item.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 默认赠送项 */}
        <div className="ds-card-soft flex flex-col items-start gap-3 bg-white/70 p-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent-emerald/15 text-accent-emerald">
              <Gift className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">所有方案默认赠送</p>
              <p className="text-[11px] text-ink-soft">无需额外购买</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GIFT_TAGS.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-2.5 py-1 text-[11px] font-medium text-accent-emerald"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
