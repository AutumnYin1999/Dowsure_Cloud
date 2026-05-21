import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CircleDot,
  Clock4,
  Lock,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";

interface WelcomePageProps {
  onStart: () => void;
}

interface PillarCard {
  index: string;
  eyebrow: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}

const PILLARS: PillarCard[] = [
  {
    index: "01",
    eyebrow: "LEAD GEN",
    icon: Sparkles,
    title: "精准识别高价值卖家",
    detail:
      "AI 卖家画像 × 平台流量曝光 × T0/T1 大卖资源对接，把流量真正变成订单。",
  },
  {
    index: "02",
    eyebrow: "TERMPAY",
    icon: Wallet,
    title: "TermPay 账期金融 · 服务商提前收款",
    detail:
      "卖家「先用后付」支付物流、海外仓、广告、采购等大额账单，资金方直接打款到你账户。",
  },
  {
    index: "03",
    eyebrow: "RISK ROUTING",
    icon: ShieldCheck,
    title: "账期风控 · 降低坏账与补件成本",
    detail:
      "TermPay 账期风控模型做卖家信用、额度建议与坏账预警，账期业务的风险显著下降。",
  },
];

type ConsoleStatus = "READY" | "PENDING" | "REVIEW" | "LOCKED";

interface ConsoleRow {
  label: string;
  status: ConsoleStatus;
  note: string;
}

const CONSOLE_ROWS: ConsoleRow[] = [
  { label: "Provider profile", status: "READY", note: "服务商基础画像就绪" },
  { label: "TermPay fit scan", status: "READY", note: "账期适配扫描已加载" },
  { label: "Seller bill scenario", status: "PENDING", note: "等待问卷输入" },
  { label: "Risk & payment route", status: "REVIEW", note: "等待风控规则匹配" },
  { label: "Recommendation plan", status: "LOCKED", note: "完成问卷后解锁" },
];

const STATUS_META: Record<
  ConsoleStatus,
  { label: string; chip: string; dot: string; icon: ComponentType<{ className?: string }> }
> = {
  READY: {
    label: "READY",
    chip:
      "bg-[rgba(34,211,238,0.12)] border-[rgba(34,211,238,0.4)] text-[#a7f3ff]",
    dot: "bg-[#22d3ee] shadow-[0_0_10px_rgba(34,211,238,0.7)]",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "PENDING",
    chip:
      "bg-[rgba(245,166,35,0.12)] border-[rgba(245,166,35,0.4)] text-[#ffd187]",
    dot: "bg-[#f5a623] shadow-[0_0_10px_rgba(245,166,35,0.7)]",
    icon: Clock4,
  },
  REVIEW: {
    label: "REVIEW",
    chip:
      "bg-[rgba(167,87,255,0.14)] border-[rgba(167,87,255,0.45)] text-[#d6c2ff]",
    dot: "bg-[#a757ff] shadow-[0_0_10px_rgba(167,87,255,0.7)]",
    icon: CircleDot,
  },
  LOCKED: {
    label: "LOCKED",
    chip:
      "bg-white/[0.04] border-white/[0.12] text-[rgba(226,219,255,0.5)]",
    dot: "bg-white/30",
    icon: Lock,
  },
};

interface KpiCard {
  label: string;
  value: string;
  unit?: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
}

const KPIS: KpiCard[] = [
  { label: "3 min evaluation", value: "3", unit: "min", detail: "扫码即用 · 移动端友好", icon: Zap },
  { label: "TermPay fit scan", value: "4", unit: "signals", detail: "账期 / 应收 / 分期 / 嵌入", icon: ScanSearch },
  { label: "Provider cash-in", value: "T+1", unit: "结算", detail: "资金方直接打款到服务商账户", icon: Banknote },
  { label: "Risk route visible", value: "13", unit: "rules", detail: "规则引擎可追溯", icon: ShieldCheck },
];

export function WelcomePage({ onStart }: WelcomePageProps) {
  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="dow-glass-card relative overflow-hidden px-6 py-9 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
        {/* 背景光斑 */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(167,87,255,0.45), transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(91,135,255,0.4), transparent)" }}
        />

        <div className="relative grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-14">
          {/* 左侧 */}
          <div className="space-y-6 animate-fade-up">
            <span className="dow-eyebrow dow-eyebrow-dot">
              DOWSURE CLOUD · TERMPAY ACTIVATION
            </span>
            <h1 className="font-display text-balance text-[44px] font-black leading-[1.05] tracking-tight text-white sm:text-[60px] lg:text-[68px]">
              豆服云 ×{" "}
              <span className="dow-gradient-text">TermPay</span>
              <br />
              服务商
              <span className="dow-gradient-text">增长引擎</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[rgba(226,219,255,0.78)] sm:text-lg">
              AI 拓客、账期金融、服务商权益矩阵合在一起，帮助跨境服务商
              <span className="text-white"> 获客 </span>、
              <span className="text-white"> 提前收款 </span>、
              <span className="text-white"> 降低账期风险</span>。
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-[rgba(226,219,255,0.6)] sm:text-base">
              TermPay 是豆分期的升级版，作为豆服云的嵌入式账期金融能力：服务商提前收款，卖家用「先用后付」支付物流、海外仓、广告、采购等大额账单。
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onStart}
                className="dow-cta-primary"
              >
                开始 3 分钟评估
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#termpay-flow"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("termpay-flow")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="dow-cta-secondary"
              >
                查看 TermPay 流程
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-[rgba(226,219,255,0.65)]">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee]" />
                3 分钟完成评估
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#a757ff]" />
                Demo 演示 · 不上传服务端
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff5bb0]" />
                推荐含 TermPay 适配建议
              </li>
            </ul>
          </div>

          {/* 右侧：Activation Console */}
          <div className="relative animate-fade-up">
            <div className="dow-console-panel relative p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 pb-4">
                <div>
                  <p className="dow-eyebrow dow-eyebrow-dot">ACTIVATION CONSOLE</p>
                  <p className="mt-1.5 text-base font-semibold text-white sm:text-lg">
                    Dowsure Cloud · Provider OS
                  </p>
                </div>
                <span
                  className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{
                    background: "rgba(34,211,238,0.1)",
                    borderColor: "rgba(34,211,238,0.45)",
                    color: "#a7f3ff",
                  }}
                >
                  Live · 公测中
                </span>
              </div>

              {/* mock terminal header */}
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/70" />
                <span
                  className="ml-3 font-mono text-[11px]"
                  style={{ color: "rgba(226,219,255,0.45)" }}
                >
                  provider.activate
                </span>
              </div>

              <ul className="space-y-2">
                {CONSOLE_ROWS.map((row) => {
                  const meta = STATUS_META[row.status];
                  return (
                    <li key={row.label} className="dow-console-row">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                        <div className="min-w-0">
                          <p
                            className="truncate font-mono text-[12px] tracking-tight"
                            style={{ color: "rgba(255,255,255,0.92)" }}
                          >
                            {row.label}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-[rgba(226,219,255,0.55)]">
                            {row.note}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.18em] ${meta.chip}`}
                      >
                        <meta.icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="dow-divider mt-4 pt-3">
                <p
                  className="font-mono text-[10px] tracking-[0.18em]"
                  style={{ color: "rgba(226,219,255,0.45)" }}
                >
                  &gt; awaiting questionnaire · estimated 03:00
                </p>
              </div>
            </div>
            {/* 装饰光晕 */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl opacity-60 blur-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,91,176,0.2), rgba(167,87,255,0.25), rgba(91,135,255,0.2))",
              }}
            />
          </div>
        </div>

        {/* KPI 小卡 */}
        <div className="relative mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="dow-kpi-card">
              <div className="flex items-center justify-between">
                <span className="dow-eyebrow">{kpi.label}</span>
                <kpi.icon className="h-4 w-4 text-[rgba(226,219,255,0.6)]" />
              </div>
              <p className="mt-1 flex items-baseline gap-1 font-display text-[28px] font-black leading-none text-white">
                {kpi.value}
                {kpi.unit ? (
                  <span className="text-sm font-medium text-[rgba(226,219,255,0.6)]">
                    {kpi.unit}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-[11px] text-[rgba(226,219,255,0.55)]">
                {kpi.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section id="termpay-flow" className="space-y-4">
        <div className="flex flex-col gap-1 px-1">
          <span className="dow-eyebrow dow-eyebrow-dot">
            3 PILLARS · 服务商增长引擎主线
          </span>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            一套引擎，把
            <span className="dow-gradient-text">获客、回款、风控</span>
            打通
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <article
              key={p.index}
              className="dow-glass-card relative flex flex-col gap-3 p-5 transition-transform hover:-translate-y-0.5 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="dow-eyebrow">
                  {p.index} · {p.eyebrow}
                </span>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,91,176,0.25), rgba(167,87,255,0.25), rgba(91,135,255,0.25))",
                    border: "1px solid rgba(180,150,255,0.3)",
                  }}
                >
                  <p.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-base font-semibold leading-snug text-white">
                {p.title}
              </p>
              <p className="text-sm leading-relaxed text-[rgba(226,219,255,0.7)]">
                {p.detail}
              </p>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(180,150,255,0.55), transparent)",
                }}
              />
            </article>
          ))}
        </div>
        <p className="px-1 text-xs leading-relaxed text-[rgba(226,219,255,0.55)]">
          合规说明：Dowsure 提供技术、数据、风控与连接能力；TermPay 的资金与最终授信审批由合作银行 / 资金方承担。本页面为产品演示，不构成授信或放款承诺。
        </p>
      </section>

      {/* 服务商画像 / 适用行业 */}
      <section className="dow-glass-card flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-base font-semibold text-white">
          <TrendingUp className="h-4 w-4 text-[#ff5bb0]" />
          适用服务商
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "物流 / 跨境头程",
            "海外仓",
            "ERP / 工具",
            "广告 / 营销",
            "财税 / 合规",
            "其他跨境服务",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(180,150,255,0.22)",
                color: "rgba(226,219,255,0.85)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
