import {
  ArrowRight,
  CheckCircle2,
  FileSignature,
  Landmark,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

interface FlowStep {
  icon: LucideIcon;
  title: string;
  detail: string;
}

const FLOW_STEPS: FlowStep[] = [
  {
    icon: ShieldCheck,
    title: "卖家获得额度",
    detail: "TermPay 完成卖家风控评估，由资金方授出可用额度",
  },
  {
    icon: Receipt,
    title: "选择服务商账单",
    detail: "卖家选择待支付的物流、海外仓、广告、采购账单",
  },
  {
    icon: Wallet,
    title: "选择延期 / 分期",
    detail: "卖家选择延后或分期方案，TermPay 展示还款计划",
  },
  {
    icon: FileSignature,
    title: "签署电子协议",
    detail: "卖家、服务商、资金方三方完成电子签约",
  },
  {
    icon: Landmark,
    title: "资金支付至服务商",
    detail: "资金方把账单金额直接打款到服务商账户",
  },
  {
    icon: PiggyBank,
    title: "卖家按约还款",
    detail: "卖家按约定节奏向资金方还款，状态同步给服务商",
  },
];

export function TermPayFlowCard() {
  return (
    <section className="dow-console-panel relative overflow-hidden p-5 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(34,211,238,0.28), transparent)",
        }}
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="dow-eyebrow dow-eyebrow-dot">
            TERMPAY FLOW · 资金路径
          </span>
          <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            卖家获得额度 →{" "}
            <span className="dow-gradient-text">服务商提前收款</span>
            {" "}→ 卖家按约还款
          </h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[rgba(226,219,255,0.7)] sm:text-base">
            TermPay（豆分期升级版）让大额账单进入「先用后付」模式，服务商现金流不再被账期拖住。
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
          style={{
            background: "rgba(34,211,238,0.08)",
            borderColor: "rgba(34,211,238,0.35)",
            color: "#a7f3ff",
          }}
        >
          <CheckCircle2 className="h-3 w-3" />
          Demo 演示，不涉及真实资金
        </span>
      </div>

      {/* 桌面：横向 flow */}
      <ol className="relative mt-5 hidden grid-cols-6 gap-3 md:grid">
        {FLOW_STEPS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <li
              key={s.title}
              className="dow-glass-card relative flex flex-col gap-2 p-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
                    boxShadow:
                      "0 10px 24px -10px rgba(167,87,255,0.55)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-mono text-[10px] tracking-[0.18em] text-[rgba(226,219,255,0.55)]">
                  STEP {String(idx + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">{s.title}</p>
              <p className="text-xs leading-relaxed text-[rgba(226,219,255,0.65)]">
                {s.detail}
              </p>
              {idx < FLOW_STEPS.length - 1 ? (
                <ArrowRight className="absolute -right-2.5 top-6 hidden h-4 w-4 text-[rgba(180,150,255,0.45)] lg:block" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* 移动：垂直 timeline */}
      <ol className="relative mt-5 space-y-3 md:hidden">
        {FLOW_STEPS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <li
              key={s.title}
              className="dow-glass-card flex items-start gap-3 p-4"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-[0.18em] text-[rgba(226,219,255,0.55)]">
                  STEP {String(idx + 1).padStart(2, "0")}
                </p>
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[rgba(226,219,255,0.65)]">
                  {s.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="relative mt-5 text-xs leading-relaxed text-[rgba(226,219,255,0.55)]">
        风控边界：Dowsure 提供技术、数据、风控与连接能力；TermPay 的资金与最终授信审批由合作银行 / 资金方承担。本流程为产品演示，不构成放款或授信承诺。
      </p>
    </section>
  );
}
