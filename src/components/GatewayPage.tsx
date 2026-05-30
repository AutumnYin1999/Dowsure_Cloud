import {
  ArrowRight,
  Check,
  type LucideIcon,
  Store,
  Users,
} from "lucide-react";

interface GatewayEntry {
  id: "seller" | "provider";
  role: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tasksLabel: string;
  tasks: string[];
  path: string[];
  cta: string;
  variant: "primary" | "ghost";
}

const GATEWAY_ENTRIES: GatewayEntry[] = [
  {
    id: "seller",
    role: "For Sellers · 跨境卖家",
    icon: Store,
    title: "我是卖家",
    description:
      "先回答几个问题，系统会初步判断适合的服务商方向；如涉及账期压力，再补充账单信息生成 TermPay / 豆分期建议。",
    tasksLabel: "核心任务",
    tasks: [
      "找服务商（物流 / 海外仓 / 财税 / 保险等）",
      "分析账期压力",
      "申请 TermPay / 豆分期",
    ],
    path: [
      "填写智能问卷",
      "服务商推荐 + 理由",
      "跳转 / 客服 / 下单",
      "账期压力则生成 TermPay 预申请",
    ],
    cta: "进入卖家智能服务台",
    variant: "primary",
  },
  {
    id: "provider",
    role: "For Providers · 跨境服务商",
    icon: Users,
    title: "我是服务商",
    description:
      "基于服务商类型、客户结构、增长目标和经营痛点，推荐合适的豆服云权益包，支持下单、资料提交、任务派发和履约追踪。",
    tasksLabel: "核心任务",
    tasks: [
      "获取精准卖家线索",
      "了解豆服云权益包",
      "接入嵌入式金融端口",
      "查看权益履约进度",
    ],
    path: [
      "填写经营信息",
      "识别增长痛点",
      "推荐权益包",
      "下单",
      "CRM 派发履约",
    ],
    cta: "进入服务商入口",
    variant: "primary",
  },
];

const TRUST_POINTS = [
  { value: "近 10 万", suffix: "跨境店铺", lead: "已触达" },
  { value: "超 1 万", suffix: "卖家", lead: "累计服务" },
  { value: "TermPay / 豆分期 / 豆服云", suffix: "权益履约", lead: "支持" },
];

interface GatewayPageProps {
  onSelectProvider: () => void;
  onSelectSeller: () => void;
}

export function GatewayPage({
  onSelectProvider,
  onSelectSeller,
}: GatewayPageProps) {
  function handleEntry(entry: GatewayEntry) {
    if (entry.id === "provider") onSelectProvider();
    if (entry.id === "seller") onSelectSeller();
  }

  return (
    <main className="relative overflow-hidden pb-24 pt-20 sm:pt-28">
      <HeroBackdrop />

      <div className="container relative max-w-6xl text-center">
        {/* pill */}
        <span className="dow-pill">
          <span className="dow-pulse" />
          豆沙包出品 · 跨境电商服务与金融决策入口
        </span>

        {/* 主标题 */}
        <h1 className="mx-auto mt-6 max-w-4xl font-display text-[40px] font-semibold leading-[1.16] tracking-tight text-balance sm:text-[52px]">
          帮跨境卖家找到
          <span className="dow-gradient-text">合适服务商</span>，
          <br className="hidden sm:block" />
          也帮服务商获得更
          <span className="dow-gradient-text">精准的卖家客户</span>。
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--fg-mute)] sm:text-lg">
          豆服 DF 通过智能问卷、经营分析和金融能力，为卖家匹配服务商、识别账期压力，也为服务商推荐豆服云权益包并追踪权益履约。
        </p>

        {/* 信任条 */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2.5 text-sm text-[color:var(--fg-mute)]">
          {TRUST_POINTS.map((point, index) => (
            <span key={point.value} className="inline-flex items-center gap-2">
              {index > 0 ? (
                <span className="text-[color:var(--border-2)]">·</span>
              ) : null}
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--indigo)]" />
                {point.lead} <b className="font-semibold text-white">{point.value}</b>{" "}
                {point.suffix}
              </span>
            </span>
          ))}
        </div>

        {/* 两个主入口 */}
        <section
          id="entries"
          className="relative mx-auto mt-14 grid max-w-5xl gap-5 text-left lg:grid-cols-2"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-8 -top-12 h-[70%] blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.16) 0%, rgba(99,102,241,0.08) 36%, transparent 64%)",
            }}
          />
          {GATEWAY_ENTRIES.map((entry) => (
            <GatewayCard
              key={entry.id}
              entry={entry}
              onClick={() => handleEntry(entry)}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

function GatewayCard({
  entry,
  onClick,
}: {
  entry: GatewayEntry;
  onClick: () => void;
}) {
  const Icon = entry.icon;
  const isPrimary = entry.variant === "primary";

  return (
    <article
      className="dow-entry-card group relative flex cursor-pointer flex-col overflow-hidden p-8"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={entry.cta}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="text-xs font-medium uppercase tracking-[0.06em] text-[color:var(--fg-faint)]">
          {entry.role}
        </span>
        <span className="grid h-[42px] w-[42px] place-items-center rounded-[11px] border border-[color:var(--border-2)] bg-[color:var(--bg-3)] text-[#C4B5FD]">
          <Icon className="h-[22px] w-[22px]" strokeWidth={1.5} />
        </span>
      </div>

      <h2 className="font-display text-[26px] font-semibold tracking-tight text-white">
        {entry.title}
      </h2>
      <p className="mt-2.5 min-h-[66px] text-[14.5px] leading-relaxed text-[color:var(--fg-mute)]">
        {entry.description}
      </p>

      <p className="mb-3 mt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--fg-faint)]">
        {entry.tasksLabel}
      </p>
      <ul className="mb-6 space-y-2.5">
        {entry.tasks.map((task) => (
          <li
            key={task}
            className="flex items-center gap-3 text-[14.5px] text-[color:var(--fg-dim)]"
          >
            <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md bg-[rgba(99,102,241,0.13)] text-[#A5B4FC]">
              <Check className="h-3 w-3" strokeWidth={2.4} />
            </span>
            {task}
          </li>
        ))}
      </ul>

      <p className="mb-5 border-t border-[color:var(--border)] pt-4 text-[12.5px] leading-relaxed text-[color:var(--fg-faint)]">
        {entry.path.map((step, index) => (
          <span key={`${entry.id}-${step}`}>
            <b className="font-medium text-[color:var(--fg-mute)]">{step}</b>
            {index < entry.path.length - 1 ? (
              <span className="mx-1.5 text-[color:var(--violet)]">→</span>
            ) : null}
          </span>
        ))}
      </p>

      <button
        type="button"
        className={
          isPrimary
            ? "dow-cta-primary mt-auto w-full"
            : "dow-cta-secondary mt-auto w-full"
        }
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
      >
        {entry.cta}
        <ArrowRight className="h-4 w-4" />
      </button>
    </article>
  );
}

function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-[-220px] h-[760px] w-[1000px] -translate-x-1/2 blur-[44px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.13) 32%, rgba(236,72,153,0.05) 56%, transparent 72%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 14% 22%, rgba(255,255,255,0.5), transparent 50%), radial-gradient(1px 1px at 28% 64%, rgba(255,255,255,0.32), transparent 50%), radial-gradient(1.1px 1.1px at 42% 30%, rgba(255,255,255,0.42), transparent 50%), radial-gradient(1px 1px at 60% 14%, rgba(255,255,255,0.38), transparent 50%), radial-gradient(0.8px 0.8px at 70% 46%, rgba(255,255,255,0.45), transparent 50%), radial-gradient(1.1px 1.1px at 82% 24%, rgba(255,255,255,0.34), transparent 50%), radial-gradient(1px 1px at 88% 60%, rgba(255,255,255,0.4), transparent 50%)",
        }}
      />
    </div>
  );
}
