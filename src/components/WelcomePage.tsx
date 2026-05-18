import {
  ArrowRight,
  Check,
  Crown,
  FileBarChart,
  Landmark,
  Plane,
  ScanLine,
  Sparkles,
  Ticket,
  Timer,
} from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/Button";

interface WelcomePageProps {
  onStart: () => void;
}

/** 顶部 KPI 三卡 */
const KPI_CARDS = [
  {
    label: "推荐覆盖权益",
    value: "22",
    unit: "项",
    detail: "7 大类 · 覆盖获客、金融、生态",
    icon: Sparkles,
  },
  {
    label: "命中规则数",
    value: "13",
    unit: "条",
    detail: "Deterministic 推荐 · 可追溯 ruleId",
    icon: FileBarChart,
  },
  {
    label: "平均完成时长",
    value: "3",
    unit: "分钟",
    detail: "扫码即用 · 移动端友好",
    icon: Timer,
  },
] as const;

/** 本月热门资源 —— 横向无限循环 marquee */
interface HotItem {
  icon: ComponentType<{ className?: string }>;
  title: string;
  sub: string;
}

const HOT_RESOURCES: HotItem[] = [
  { icon: Landmark, title: "香港跨境电商加速器", sub: "银企对接会 · 限定会员" },
  { icon: Plane, title: "高才通 A 类申请绿色通道", sub: "限时 7 折" },
  { icon: Crown, title: "Amazon 平台私享会 · 6.27", sub: "T0/T1 专属" },
  { icon: Ticket, title: "大卖有约 · 深圳站", sub: "席位紧张 · 剩 3 席" },
  { icon: Sparkles, title: "AI 品牌营销共创工坊", sub: "6.30 · 杭州" },
  { icon: Landmark, title: "香港企业开户绿色通道", sub: "全年免预约" },
];

export function WelcomePage({ onStart }: WelcomePageProps) {
  return (
    <div className="space-y-8">
      {/* Hero — 浅粉 → 白渐变 + 网格 */}
      <section className="ds-card relative overflow-hidden border-white/60 bg-hero-grid">
        <div className="grid gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-12 lg:px-12 lg:py-14">
          <div className="space-y-5 animate-fade-up">
            <span className="ds-eyebrow ds-eyebrow-dot text-xs">
              ENTITLEMENT MATRIX · 权益矩阵
            </span>
            <h1 className="font-display text-balance text-[42px] font-black leading-[1.12] tracking-tight text-ink sm:text-[56px] lg:text-[68px] lg:leading-[1.08]">
              您的
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                豆服云
              </span>
              权益矩阵
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink-muted sm:text-xl">
              跨境服务商的一站式增长引擎。
              <span className="font-semibold text-brand-700">获客</span> ×{" "}
              <span className="font-semibold text-brand-700">资金</span> ×{" "}
              <span className="font-semibold text-brand-700">生态</span>
              ,助你拿下头部大卖。
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button size="lg" onClick={onStart} className="shadow-pop">
                开始 3 分钟评估
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-sm text-ink-soft">
              <li className="flex items-center gap-1.5">
                <Check
                  className="h-3.5 w-3.5 text-accent-emerald"
                  strokeWidth={3}
                />
                3 分钟完成
              </li>
              <li className="flex items-center gap-1.5">
                <Check
                  className="h-3.5 w-3.5 text-accent-emerald"
                  strokeWidth={3}
                />
                Demo 不上传服务端
              </li>
              <li className="flex items-center gap-1.5">
                <Check
                  className="h-3.5 w-3.5 text-accent-emerald"
                  strokeWidth={3}
                />
                3 项默认赠送权益
              </li>
            </ul>
          </div>

          {/* Hero 右侧 —— "扫码进入" 卡 */}
          <div className="relative mx-auto w-full max-w-sm animate-fade-up">
            <div className="ds-card-soft flex flex-col items-center gap-4 bg-white/90 p-6 backdrop-blur">
              <div className="ds-eyebrow ds-eyebrow-dot">服务商扫码入口</div>
              <div className="relative flex h-48 w-48 items-center justify-center rounded-3xl bg-brand-gradient p-1.5 shadow-pop">
                <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-white">
                  <ScanLine className="h-24 w-24 text-brand-600" />
                </div>
                <span className="absolute -right-2 -top-2 rounded-full border border-white bg-accent-emerald px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft">
                  公测中
                </span>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-ink">
                  豆服云 · 服务商增长引擎
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  扫码即可进入问卷,移动端友好
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-6 -top-6 hidden h-28 w-28 rounded-full bg-brand-200/60 blur-3xl sm:block" />
            <div className="pointer-events-none absolute -bottom-8 -left-6 hidden h-28 w-28 rounded-full bg-accent-emerald/15 blur-3xl sm:block" />
          </div>
        </div>

        {/* KPI 三卡 (位于 hero 底部) */}
        <div className="relative grid gap-3 border-t border-white/60 bg-white/40 px-6 py-5 backdrop-blur sm:grid-cols-3 sm:px-10">
          {KPI_CARDS.map((k) => (
            <div
              key={k.label}
              className="flex items-center gap-4 rounded-2xl bg-white/80 p-4 shadow-soft"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <k.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-ink-soft">
                  {k.label}
                </p>
                <p className="mt-0.5 flex items-baseline gap-1 font-display text-[32px] font-black leading-none text-brand-600">
                  {k.value}
                  <span className="text-sm font-medium text-ink-muted">
                    {k.unit}
                  </span>
                </p>
                <p className="mt-1 text-xs text-ink-soft">{k.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 本月热门资源 —— 无限循环 marquee */}
      <HotResourcesMarquee items={HOT_RESOURCES} />
    </div>
  );
}

// ─────────────────────── Marquee 子组件 ───────────────────────

function HotResourcesMarquee({ items }: { items: HotItem[] }) {
  // 把数据复制两份组成完整循环轨道; CSS 用 translateX(-50%) 形成无缝衔接
  const track = [...items, ...items];
  return (
    <section className="ds-card-soft bg-kpi-pink px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex shrink-0 items-center gap-2 text-base font-semibold text-ink">
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse-soft" />
          本月热门资源
        </div>
        <div className="ds-marquee min-w-0 flex-1">
          <div className="ds-marquee-track">
            {track.map((r, idx) => (
              <div
                key={`${r.title}-${idx}`}
                className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-soft"
                aria-hidden={idx >= items.length ? true : undefined}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <r.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="whitespace-nowrap text-sm font-semibold text-ink">
                    {r.title}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-xs text-ink-soft">
                    {r.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
