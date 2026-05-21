import {
  Banknote,
  HandCoins,
  ShieldCheck,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ProviderProfile } from "@/types";

interface TermPayValueSectionProps {
  /** 服务商画像，用于决定推荐理由文案。 */
  profile: ProviderProfile;
  /** 该服务商命中 TermPay 的 1-3 条原因。 */
  reasons: string[];
}

interface ValueCard {
  index: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  detail: string;
}

const VALUE_CARDS: ValueCard[] = [
  {
    index: "01",
    eyebrow: "CASH-IN",
    icon: HandCoins,
    title: "服务商提前收款",
    detail:
      "资金方直接把账单金额支付到服务商账户，无需等待卖家回款，账期 / 应收压力转移给资金方。",
  },
  {
    index: "02",
    eyebrow: "BUY-NOW-PAY-LATER",
    icon: Wallet,
    title: "卖家先用后付",
    detail:
      "卖家用 TermPay 额度支付物流、海外仓、广告、采购等大额账单，按约定节奏分期或延期还款。",
  },
  {
    index: "03",
    eyebrow: "RISK ROUTING",
    icon: ShieldCheck,
    title: "风控与资金方边界",
    detail:
      "Dowsure 提供技术、数据、风控与连接能力；资金方依据自身策略做最终授信与放款决定。",
  },
];

export function TermPayValueSection({
  profile,
  reasons,
}: TermPayValueSectionProps) {
  const headline = buildHeadline(profile);
  return (
    <section className="dow-console-panel relative overflow-hidden p-5 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,91,176,0.32), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(91,135,255,0.3), transparent)",
        }}
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{
              background:
                "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
              boxShadow: "0 14px 36px -10px rgba(167,87,255,0.6)",
            }}
          >
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <span className="dow-eyebrow dow-eyebrow-dot">
              TERMPAY · 账期金融方案
            </span>
            <h3 className="mt-1.5 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
              TermPay <span className="dow-gradient-text">账期金融方案</span>
            </h3>
          </div>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium"
          style={{
            background: "rgba(167,87,255,0.12)",
            borderColor: "rgba(167,87,255,0.4)",
            color: "#d6c2ff",
          }}
        >
          <Sparkles className="h-3 w-3" />
          推荐结果重点模块
        </span>
      </div>

      <p className="relative mt-5 text-base leading-relaxed text-[rgba(226,219,255,0.85)] sm:text-lg">
        {headline}
      </p>

      {reasons.length > 0 ? (
        <ul className="relative mt-4 grid gap-2 sm:grid-cols-2">
          {reasons.map((r) => (
            <li
              key={r}
              className="flex items-start gap-2 rounded-xl border p-3 text-sm leading-relaxed text-[rgba(226,219,255,0.78)]"
              style={{
                background: "rgba(255,255,255,0.035)",
                borderColor: "rgba(180,150,255,0.18)",
              }}
            >
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff5bb0]" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative mt-6 grid gap-3 lg:grid-cols-3">
        {VALUE_CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <article
              key={c.index}
              className="dow-glass-card flex flex-col gap-3 p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="dow-eyebrow">
                  {c.index} · {c.eyebrow}
                </span>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,91,176,0.3), rgba(167,87,255,0.3), rgba(91,135,255,0.3))",
                    border: "1px solid rgba(180,150,255,0.3)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-base font-semibold text-white">{c.title}</p>
              <p className="text-sm leading-relaxed text-[rgba(226,219,255,0.72)]">
                {c.detail}
              </p>
            </article>
          );
        })}
      </div>

      <p className="relative mt-5 text-xs leading-relaxed text-[rgba(226,219,255,0.55)]">
        合规说明：Dowsure 提供技术、数据、风控与连接能力；资金和最终审批由合作银行 / 资金方承担。本模块为产品演示，不构成授信或放款承诺。
      </p>
    </section>
  );
}

function buildHeadline(profile: ProviderProfile): string {
  const hasSignal =
    profile.wantsCustomerInstallment ||
    profile.offersCreditToCustomers ||
    profile.hasReceivablePressure ||
    profile.hasEmbeddableSystem ||
    profile.goals.includes("offer-credit") ||
    profile.goals.includes("reduce-bad-debt");

  if (!hasSignal) {
    return "适合你接入 TermPay：把跨境运营中的大额账单切到「先用后付」，服务商提前收款，卖家延期或分期支付。";
  }
  return "适合你接入 TermPay，因为你的客户存在大额账单、账期需求或复购提升空间。TermPay（豆分期升级版）让卖家用「先用后付」方式支付物流、海外仓、广告、采购等大额账单，服务商提前收款、降低账期风险。";
}
