import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  BarChart3,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Clock4,
  Compass,
  Database,
  FileCheck2,
  FileText,
  Gauge,
  GitBranch,
  Landmark,
  Layers,
  Megaphone,
  Receipt,
  Rocket,
  Scale,
  ShieldCheck,
  Siren,
  Sparkles,
  Target,
  TrendingUp,
  UserCog,
  Users,
  Wrench,
  XOctagon,
  type LucideIcon,
} from "lucide-react";

interface TermPayDashboardPreviewProps {
  path?: string;
}

const DASHBOARD_BASE = "/termpay-dashboard";

interface DashboardModule {
  id: string;
  path: string;
  label: string;
  eyebrow: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: "overview",
    path: `${DASHBOARD_BASE}/overview`,
    label: "CEO Dashboard",
    eyebrow: "01 · STATUS",
    title: "CEO Dashboard",
    desc: "老板 3 分钟内判断项目状态、红黄绿风险和拍板事项。",
    icon: Gauge,
  },
  {
    id: "w6-w12",
    path: `${DASHBOARD_BASE}/w6-w12`,
    label: "W6 / W12",
    eyebrow: "02 · EVIDENCE GATES",
    title: "W6 / W12",
    desc: "W6 看能不能 pilot，W12 看能不能进入融资 evidence pack。",
    icon: Target,
  },
  {
    id: "kpi",
    path: `${DASHBOARD_BASE}/kpi`,
    label: "KPI",
    eyebrow: "03 · METRICS",
    title: "核心 KPI",
    desc: "解释 pilot case、facilitated volume、SLA、CM、facility 等指标口径。",
    icon: BarChart3,
  },
  {
    id: "milestones",
    path: `${DASHBOARD_BASE}/milestones`,
    label: "Milestones",
    eyebrow: "04 · SECOND CLOSE",
    title: "Milestone 映射",
    desc: "把 TermPay 翻译成 M1 / M2 / M5 / M8 / M9 能看懂的融资证据。",
    icon: GitBranch,
  },
  {
    id: "risks",
    path: `${DASHBOARD_BASE}/risks`,
    label: "Risks & Decisions",
    eyebrow: "05 · BLOCKERS",
    title: "Risks & Decisions",
    desc: "暴露会卡死项目的风险，以及需要 CEO 拍板的事项。",
    icon: AlertTriangle,
  },
  {
    id: "appendix",
    path: `${DASHBOARD_BASE}/appendix`,
    label: "Appendix",
    eyebrow: "06 · SUPPORTING DETAIL",
    title: "Appendix",
    desc: "收纳压缩版 12 周计划、跨团队依赖、AI prompt 和证据 backlog。",
    icon: ClipboardList,
  },
];

function normalizePath(p: string): string {
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

export function TermPayDashboardPreview({
  path = DASHBOARD_BASE,
}: TermPayDashboardPreviewProps) {
  const normalized = normalizePath(path);
  const currentModule =
    DASHBOARD_MODULES.find((m) => normalized === m.path) ?? null;

  return (
    <main className="container max-w-6xl pb-24 pt-8 sm:pt-10">
      <DashboardNav currentPath={normalized} />

      {currentModule?.id === "overview" ? (
        <OverviewPage />
      ) : currentModule?.id === "w6-w12" ? (
        <W6W12Page />
      ) : currentModule?.id === "kpi" ? (
        <KPIPage />
      ) : currentModule?.id === "milestones" ? (
        <MilestonesPage />
      ) : currentModule?.id === "risks" ? (
        <RisksDecisionsPage />
      ) : currentModule?.id === "appendix" ? (
        <AppendixPage />
      ) : currentModule ? (
        <ModulePlaceholder module={currentModule} />
      ) : (
        <DashboardHome />
      )}
    </main>
  );
}

// ────────────────── 顶部子路由 ──────────────────

function DashboardNav({ currentPath }: { currentPath: string }) {
  const homeActive = currentPath === DASHBOARD_BASE;
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs">
      <a
        href={DASHBOARD_BASE}
        className={
          "rounded-full px-3 py-1.5 font-mono uppercase tracking-[0.16em] transition " +
          (homeActive
            ? "border border-[rgba(167,87,255,0.55)] bg-[rgba(167,87,255,0.18)] text-white"
            : "border border-white/15 bg-white/[0.04] text-[rgba(226,219,255,0.72)] hover:border-white/30 hover:text-white")
        }
      >
        Dashboard Home
      </a>
      {DASHBOARD_MODULES.map((m) => {
        const active = currentPath === m.path;
        return (
          <a
            key={m.id}
            href={m.path}
            className={
              "rounded-full px-3 py-1.5 font-mono uppercase tracking-[0.14em] transition " +
              (active
                ? "border border-[rgba(167,87,255,0.55)] bg-[rgba(167,87,255,0.18)] text-white"
                : "border border-white/10 bg-white/[0.025] text-[rgba(226,219,255,0.48)] hover:border-white/25 hover:text-white")
            }
          >
            {m.label}
          </a>
        );
      })}
    </nav>
  );
}

// ────────────────── 目录页 ──────────────────

function DashboardHome() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="dow-console-panel relative overflow-hidden p-8 sm:p-10 lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-55 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,87,255,0.42), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full opacity-45 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(34,211,238,0.3), transparent)",
          }}
        />

        <div className="relative">
          <p className="dow-eyebrow dow-eyebrow-dot">TERMPAY CEO DASHBOARD</p>
          <h1 className="mt-3 max-w-4xl font-display text-[40px] font-black leading-[1.06] tracking-tight text-white sm:text-[54px] lg:text-[64px]">
            TermPay
            <span className="dow-gradient-text"> 融资证据作战图</span>
          </h1>
          <p className="mt-4 max-w-2xl font-mono text-sm tracking-[0.08em] text-[rgba(226,219,255,0.62)] sm:text-base">
            W6 Pilot Readiness × W12 Financing Evidence
          </p>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[rgba(226,219,255,0.72)] sm:text-base">
            TermPay 不是孤立的分期产品，而是 Dowsure L2 嵌入式金融执行层中的 AP 账单金融模块，用于验证服务商账单、卖家授权、银行资金、Sentinel 风控、Finance 对账和审计轨迹能否跑通。
          </p>
        </div>
      </section>

      {/* 6 个模块入口 */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <a
              key={m.id}
              href={m.path}
              className="dow-glass-card group block p-5 transition hover:-translate-y-0.5 hover:border-white/25 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="dow-eyebrow">{m.eyebrow}</p>
                  <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
                    {m.title}
                  </h2>
                </div>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,91,176,0.28), rgba(167,87,255,0.28), rgba(91,135,255,0.28))",
                    border: "1px solid rgba(180,150,255,0.3)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[rgba(226,219,255,0.7)]">
                {m.desc}
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#a7f3ff]">
                打开模块
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </div>
            </a>
          );
        })}
      </section>

      {/* 底部提示 */}
      <section className="dow-glass-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] text-[#ff5bb0]">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="dow-eyebrow">PREVIEW NOTE · v0</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[rgba(226,219,255,0.72)]">
              当前页面是 v0 preview，后续会补 target / owner / evidence / status。内容来源 <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-[#d6c2ff]">documents/TermPay_工作连续性记录_v0.md</code>。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ────────────────── Overview 页 ──────────────────

type GateStatus = "pending" | "review" | "ready" | "locked";

const GATE_META: Record<
  GateStatus,
  { label: string; icon: LucideIcon; chip: string; dot: string }
> = {
  ready: {
    label: "READY",
    icon: CheckCircle2,
    chip:
      "bg-[rgba(34,211,238,0.12)] border-[rgba(34,211,238,0.4)] text-[#a7f3ff]",
    dot: "bg-[#22d3ee] shadow-[0_0_10px_rgba(34,211,238,0.7)]",
  },
  pending: {
    label: "PENDING",
    icon: Clock4,
    chip:
      "bg-[rgba(245,166,35,0.12)] border-[rgba(245,166,35,0.4)] text-[#ffd187]",
    dot: "bg-[#f5a623] shadow-[0_0_10px_rgba(245,166,35,0.7)]",
  },
  review: {
    label: "REVIEW",
    icon: CircleDot,
    chip:
      "bg-[rgba(167,87,255,0.14)] border-[rgba(167,87,255,0.45)] text-[#d6c2ff]",
    dot: "bg-[#a757ff] shadow-[0_0_10px_rgba(167,87,255,0.7)]",
  },
  locked: {
    label: "LOCKED",
    icon: AlertTriangle,
    chip:
      "bg-white/[0.04] border-white/[0.12] text-[rgba(226,219,255,0.5)]",
    dot: "bg-white/30",
  },
};

interface StatusCard {
  eyebrow: string;
  title: string;
  value: string;
  hint: string;
  status: GateStatus;
  icon: LucideIcon;
}

const STATUS_CARDS: StatusCard[] = [
  {
    eyebrow: "01 · W6",
    title: "W6 Pilot Readiness",
    value: "待确认",
    hint: "能否进入受控 pilot",
    status: "pending",
    icon: Target,
  },
  {
    eyebrow: "02 · W12",
    title: "W12 Financing Evidence",
    value: "待确认",
    hint: "能否进入融资 evidence pack",
    status: "pending",
    icon: Compass,
  },
  {
    eyebrow: "03 · BLOCKERS",
    title: "Blocking Risks",
    value: "6 项",
    hint: "首批待识别风险口径",
    status: "review",
    icon: AlertTriangle,
  },
  {
    eyebrow: "04 · DECISIONS",
    title: "CEO Decisions",
    value: "8 项",
    hint: "需 leadership 拍板事项",
    status: "review",
    icon: Gauge,
  },
];

interface DashboardRow {
  dimension: string;
  w6: string;
  w12: string;
  status: GateStatus;
  ask: string;
}

const DASHBOARD_ROWS: DashboardRow[] = [
  {
    dimension: "Pilot case",
    w6: "待填 target",
    w12: "待填 target",
    status: "pending",
    ask: "待 leadership 拍板",
  },
  {
    dimension: "Facilitated volume",
    w6: "待填 target",
    w12: "待填 target",
    status: "pending",
    ask: "待 leadership 拍板",
  },
  {
    dimension: "服务商数",
    w6: "待填 target",
    w12: "待填 target",
    status: "pending",
    ask: "待 leadership 拍板",
  },
  {
    dimension: "资金方审批 SLA",
    w6: "待填 target",
    w12: "待填 target",
    status: "pending",
    ask: "待 leadership 拍板",
  },
  {
    dimension: "First-loss 边界",
    w6: "待填 target",
    w12: "待填 target",
    status: "pending",
    ask: "待 leadership 拍板",
  },
  {
    dimension: "Revenue recognition",
    w6: "待填 target",
    w12: "待填 target",
    status: "pending",
    ask: "待 leadership 拍板",
  },
];

function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* Hero / Executive Summary */}
      <section className="dow-console-panel relative overflow-hidden p-7 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-55 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,87,255,0.42), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full opacity-45 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(91,135,255,0.32), transparent)",
          }}
        />
        <div className="relative">
          <p className="dow-eyebrow dow-eyebrow-dot">CEO DASHBOARD · OVERVIEW</p>
          <h1 className="mt-3 max-w-4xl font-display text-[32px] font-black leading-[1.08] tracking-tight text-white sm:text-[44px] lg:text-[52px]">
            W6 能不能 <span className="dow-gradient-text">pilot</span>？
            <br />
            W12 能不能形成<span className="dow-gradient-text">融资证据</span>？
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[rgba(226,219,255,0.78)] sm:text-base">
            TermPay v1 的重点不是证明「流程跑通」，而是证明 Dowsure 在不自营放贷、不承担隐藏 first-loss 的前提下，可以通过服务商账单、卖家授权、银行资金、Sentinel 风控和 Finance 对账，跑通 AP+AR 闭环，并形成支持 Second Close 的证据。
          </p>
        </div>
      </section>

      {/* 4 个状态卡 */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STATUS_CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="dow-glass-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="dow-eyebrow">{c.eyebrow}</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {c.title}
                  </p>
                </div>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,91,176,0.25), rgba(167,87,255,0.25), rgba(91,135,255,0.25))",
                    border: "1px solid rgba(180,150,255,0.3)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 font-display text-[28px] font-black leading-none">
                <span className="dow-gradient-text">{c.value}</span>
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-[rgba(226,219,255,0.6)]">
                  {c.hint}
                </span>
                <StatusChip status={c.status} />
              </div>
            </div>
          );
        })}
      </section>

      {/* CEO Dashboard 主表预览 */}
      <section className="dow-console-panel overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dow-eyebrow dow-eyebrow-dot">
              MAIN DASHBOARD · 6 ROWS PREVIEW
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
              CEO Dashboard 主表
            </h2>
            <p className="mt-1 text-xs text-[rgba(226,219,255,0.6)] sm:text-sm">
              先放 6 行 · target / actual / owner 等字段后续补齐
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.6)] sm:self-auto">
            v0 preview
          </span>
        </div>

        {/* 桌面：表格 */}
        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-white/10 lg:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-white/[0.04] text-left">
                <Th>维度</Th>
                <Th>W6 Pilot Readiness</Th>
                <Th>W12 Financing Evidence</Th>
                <Th>Status</Th>
                <Th>CEO Ask</Th>
              </tr>
            </thead>
            <tbody>
              {DASHBOARD_ROWS.map((r, idx) => (
                <tr
                  key={r.dimension}
                  className={
                    idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                  }
                >
                  <Td>
                    <span className="font-semibold text-white">
                      {r.dimension}
                    </span>
                  </Td>
                  <Td className="text-[rgba(226,219,255,0.78)]">{r.w6}</Td>
                  <Td className="text-[rgba(226,219,255,0.78)]">{r.w12}</Td>
                  <Td>
                    <StatusChip status={r.status} />
                  </Td>
                  <Td className="text-[rgba(226,219,255,0.78)]">{r.ask}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 移动：卡片矩阵 */}
        <ul className="mt-5 space-y-3 lg:hidden">
          {DASHBOARD_ROWS.map((r) => (
            <li
              key={r.dimension}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-white">
                  {r.dimension}
                </p>
                <StatusChip status={r.status} />
              </div>
              <dl className="mt-3 space-y-2 text-xs text-[rgba(226,219,255,0.75)]">
                <KV label="W6">{r.w6}</KV>
                <KV label="W12">{r.w12}</KV>
                <KV label="CEO Ask">{r.ask}</KV>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      {/* 一句话结论卡 */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,91,176,0.16) 0%, rgba(167,87,255,0.16) 50%, rgba(91,135,255,0.16) 100%)",
          border: "1px solid rgba(167,87,255,0.45)",
          boxShadow: "0 0 0 1px rgba(167,87,255,0.2) inset",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{
              background:
                "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
              boxShadow: "0 12px 30px -10px rgba(167,87,255,0.6)",
            }}
          >
            <Compass className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="dow-eyebrow">EXECUTIVE TAKEAWAY</p>
            <p className="mt-2 text-sm leading-relaxed text-white sm:text-base">
              W6 判断能不能受控试点；W12 判断能不能进入融资 evidence pack。后续所有交付物都必须服务于这两个判断，而不是单纯证明页面做完或流程跑通。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ────────────────── W6 / W12 页 ──────────────────

const W6_CHECKLIST: string[] = [
  "真实服务商账单场景",
  "卖家授权和账单材料",
  "资金方审批路径",
  "Sentinel / 风控审核与人工兜底",
  "付款、还款计划、对账和审计记录路径",
  "无隐藏 first-loss、回购、担保或误导性营销口径",
];

const W12_CHECKLIST: string[] = [
  "一批 pilot case 数据",
  "facilitated volume",
  "服务商复用意向",
  "资金方审批表现",
  "风控漏斗数据",
  "单 case CM",
  "first-loss / revenue recognition 口径",
  "能映射到 Second Close hard milestones",
];

interface CompareRow {
  axis: string;
  w6: string;
  w12: string;
}

const COMPARE_ROWS: CompareRow[] = [
  {
    axis: "本质",
    w6: "Readiness · 有没有资格开始",
    w12: "Evidence · 有没有证据放大",
  },
  {
    axis: "判断问题",
    w6: "能不能进入受控 pilot",
    w12: "能不能进入融资 evidence pack",
  },
  {
    axis: "输出物",
    w6: "Go / No-Go checklist",
    w12: "Financing evidence pack",
  },
  {
    axis: "不达标后果",
    w6: "继续沙盒 / replay，不进入真实 pilot",
    w12: "不能作为 Second Close 支撑，只能作产品学习",
  },
];

function W6W12Page() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="dow-console-panel relative overflow-hidden p-7 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-55 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(34,211,238,0.32), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,87,255,0.4), transparent)",
          }}
        />
        <div className="relative">
          <p className="dow-eyebrow dow-eyebrow-dot">
            EVIDENCE GATES · W6 / W12
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[32px] font-black leading-[1.08] tracking-tight text-white sm:text-[44px] lg:text-[52px]">
            两个硬节点：
            <br />
            <span className="dow-gradient-text">W6</span> 看能不能试跑，
            <br />
            <span className="dow-gradient-text">W12</span> 看能不能证明价值。
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[rgba(226,219,255,0.78)] sm:text-base">
            TermPay v1 不再按 W1-W12 展开流水账，而是压缩成两个 CEO 判断点：第 6 周是否具备受控 pilot 条件，第 12 周是否具备进入融资 evidence pack 的证据。
          </p>
        </div>
      </section>

      {/* 双栏主卡 */}
      <section className="grid gap-4 lg:grid-cols-2">
        <GateCard
          eyebrow="GATE 01 · W6"
          icon={Rocket}
          accent="cyan"
          chipLabel="READINESS"
          title={
            <>
              W6 · <span className="dow-gradient-text">能不能 pilot</span>
            </>
          }
          tagline="W6 不要求证明规模化，只判断 TermPay 是否具备受控试点条件。"
          checklist={W6_CHECKLIST}
          conclusion="不满足则继续沙盒 / replay，不进入真实 pilot。"
        />
        <GateCard
          eyebrow="GATE 02 · W12"
          icon={FileCheck2}
          accent="violet"
          chipLabel="EVIDENCE"
          title={
            <>
              W12 ·{" "}
              <span className="dow-gradient-text">能不能进融资证据包</span>
            </>
          }
          tagline="W12 不只是证明流程跑通，而是判断 TermPay 是否能作为 Second Close 支撑材料。"
          checklist={W12_CHECKLIST}
          conclusion="不满足则不能作为 Second Close evidence，只能作为产品学习材料。"
        />
      </section>

      {/* 对比条 */}
      <section className="dow-glass-card p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <span className="dow-eyebrow dow-eyebrow-dot">
            W6 vs W12 · COMPARE
          </span>
        </div>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
          <span className="dow-gradient-text">W6 = Readiness</span> ·{" "}
          <span className="dow-gradient-text">W12 = Evidence</span>
        </h2>
        <p className="mt-1 text-xs text-[rgba(226,219,255,0.6)] sm:text-sm">
          一句话：W6 关注「有没有资格开始」，W12 关注「有没有证据放大」。
        </p>

        {/* 桌面：表格 */}
        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-white/10 md:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-white/[0.04] text-left">
                <Th>维度</Th>
                <Th>W6 · Pilot Readiness</Th>
                <Th>W12 · Financing Evidence</Th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, idx) => (
                <tr
                  key={row.axis}
                  className={
                    idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                  }
                >
                  <Td>
                    <span className="font-semibold text-white">{row.axis}</span>
                  </Td>
                  <Td className="text-[#a7f3ff]">{row.w6}</Td>
                  <Td className="text-[#d6c2ff]">{row.w12}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 移动：卡片 */}
        <ul className="mt-5 space-y-3 md:hidden">
          {COMPARE_ROWS.map((row) => (
            <li
              key={row.axis}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="text-sm font-semibold text-white">{row.axis}</p>
              <div className="mt-3 grid gap-2 text-xs">
                <div className="rounded-xl border border-[rgba(34,211,238,0.32)] bg-[rgba(34,211,238,0.08)] px-3 py-2 text-[#a7f3ff]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">
                    W6
                  </span>
                  <p className="mt-1">{row.w6}</p>
                </div>
                <div className="rounded-xl border border-[rgba(167,87,255,0.45)] bg-[rgba(167,87,255,0.12)] px-3 py-2 text-[#d6c2ff]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">
                    W12
                  </span>
                  <p className="mt-1">{row.w12}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 小结卡 */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,91,176,0.16) 0%, rgba(167,87,255,0.16) 50%, rgba(91,135,255,0.16) 100%)",
          border: "1px solid rgba(167,87,255,0.45)",
          boxShadow: "0 0 0 1px rgba(167,87,255,0.2) inset",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{
              background:
                "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
              boxShadow: "0 12px 30px -10px rgba(167,87,255,0.6)",
            }}
          >
            <Compass className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="dow-eyebrow">EXECUTIVE TAKEAWAY</p>
            <p className="mt-2 text-sm leading-relaxed text-white sm:text-base">
              W6 判断能不能受控试点；W12 判断试点结果能不能拿给 CEO、银行和投资人看。后续 KPI、milestone、risks 三个模块都围绕这两个判断展开。
            </p>
          </div>
        </div>
      </section>

      {/* 导航 CTA */}
      <section className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={DASHBOARD_BASE}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-[rgba(226,219,255,0.85)] transition hover:border-white/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          返回 Dashboard
        </a>
        <a
          href={`${DASHBOARD_BASE}/kpi`}
          className="dow-cta-primary"
        >
          下一模块：核心 KPI
          <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </div>
  );
}

interface GateCardProps {
  eyebrow: string;
  icon: LucideIcon;
  accent: "cyan" | "violet";
  chipLabel: string;
  title: React.ReactNode;
  tagline: string;
  checklist: string[];
  conclusion: string;
}

function GateCard({
  eyebrow,
  icon: Icon,
  accent,
  chipLabel,
  title,
  tagline,
  checklist,
  conclusion,
}: GateCardProps) {
  const isCyan = accent === "cyan";
  return (
    <article className="dow-console-panel relative flex h-full flex-col overflow-hidden p-5 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
        style={{
          background: isCyan
            ? "radial-gradient(closest-side, rgba(34,211,238,0.42), transparent)"
            : "radial-gradient(closest-side, rgba(167,87,255,0.42), transparent)",
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="dow-eyebrow">{eyebrow}</p>
          <h2 className="mt-2 font-display text-[22px] font-bold tracking-tight text-white sm:text-[26px]">
            {title}
          </h2>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
          style={
            isCyan
              ? {
                  background:
                    "linear-gradient(135deg, rgba(34,211,238,0.4) 0%, rgba(91,135,255,0.35) 100%)",
                  border: "1px solid rgba(34,211,238,0.5)",
                }
              : {
                  background:
                    "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
                  boxShadow: "0 12px 28px -10px rgba(167,87,255,0.6)",
                }
          }
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="relative mt-3">
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={
            isCyan
              ? {
                  background: "rgba(34,211,238,0.12)",
                  borderColor: "rgba(34,211,238,0.4)",
                  color: "#a7f3ff",
                }
              : {
                  background: "rgba(167,87,255,0.14)",
                  borderColor: "rgba(167,87,255,0.45)",
                  color: "#d6c2ff",
                }
          }
        >
          {isCyan ? (
            <ShieldCheck className="h-3 w-3" />
          ) : (
            <CheckCircle2 className="h-3 w-3" />
          )}
          {chipLabel}
        </span>
      </div>

      <p className="relative mt-4 text-sm leading-relaxed text-[rgba(226,219,255,0.85)] sm:text-base">
        {tagline}
      </p>

      <ul className="relative mt-5 space-y-2">
        {checklist.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 rounded-xl border px-3 py-2 text-sm text-[rgba(226,219,255,0.85)]"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(180,150,255,0.15)",
            }}
          >
            <CheckCircle2
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{ color: isCyan ? "#22d3ee" : "#a757ff" }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-auto">
        <div
          className="mt-5 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-relaxed sm:text-sm"
          style={
            isCyan
              ? {
                  background: "rgba(34,211,238,0.06)",
                  borderColor: "rgba(34,211,238,0.3)",
                  color: "#bdf0fa",
                }
              : {
                  background: "rgba(167,87,255,0.08)",
                  borderColor: "rgba(167,87,255,0.32)",
                  color: "#e5d5ff",
                }
          }
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{conclusion}</span>
        </div>
      </div>
    </article>
  );
}

// ────────────────── KPI 页 ──────────────────

type KpiAccent = "cyan" | "violet" | "pink";

interface KpiItem {
  name: string;
  explain: string;
  why: string;
  source: string;
}

interface KpiGroup {
  groupEyebrow: string;
  groupTitle: string;
  groupEn: string;
  groupTagline: string;
  icon: LucideIcon;
  accent: KpiAccent;
  items: KpiItem[];
}

const KPI_GROUPS: KpiGroup[] = [
  {
    groupEyebrow: "A · PILOT TRACTION",
    groupTitle: "试点牵引力",
    groupEn: "Pilot Traction",
    groupTagline: "证明 TermPay 已进入真实账单场景且服务商侧可复制。",
    icon: TrendingUp,
    accent: "cyan",
    items: [
      {
        name: "Pilot case 数",
        explain: "有多少个真实试点案例，不是页面 demo 或模拟数据。",
        why: "证明 TermPay 进入真实卖家和服务商账单场景。",
        source: "CRM / pilot tracker / ops case list",
      },
      {
        name: "Facilitated volume",
        explain: "通过 TermPay 流程被资金方审批、支付或处理的账单规模。",
        why: "证明不是 Dowsure 放款，而是 Dowsure 促成资金执行。",
        source: "Bank Ops / Finance / case ledger",
      },
      {
        name: "服务商数",
        explain: "有多少服务商接入或愿意试点 TermPay。",
        why: "证明 TermPay 不止服务单一客户，服务商侧可复制。",
        source: "Sales pipeline / pilot tracker",
      },
      {
        name: "复用意向",
        explain: "服务商或卖家是否愿意下一次继续使用 TermPay。",
        why: "证明 TermPay 有复购价值，不是一次性试验。",
        source: "Sales follow-up / NPS / ops 反馈",
      },
    ],
  },
  {
    groupEyebrow: "B · RISK & FUNDING",
    groupTitle: "风控与资金方表现",
    groupEn: "Risk & Funding",
    groupTagline:
      "证明 Dowsure 在筛选质量，资金方愿意基于 Dowsure 风控放大额度。",
    icon: ShieldCheck,
    accent: "violet",
    items: [
      {
        name: "资金方审批 SLA",
        explain: "资金方初审、补件、复审需要多久。",
        why: "决定产品体验和销售承诺能否成立。",
        source: "Bank portal / manual bridge / ops timestamp",
      },
      {
        name: "通过率 / 补件率 / 拒绝率",
        explain: "所有申请里，多少通过、多少需要补料、多少被拒。",
        why: "风控漏斗 — 证明 Dowsure 在筛选质量，而不是盲目推单。",
        source: "Sentinel 风控 / 人工审核记录",
      },
      {
        name: "Facility progress",
        explain: "资金方愿意给 Dowsure 的可提款额度或合作 facility 规模。",
        why: "融资叙事核心 — 银行是否愿意基于 Dowsure 风控放大额度。",
        source: "Bank BD / Treasury / facility memo",
      },
    ],
  },
  {
    groupEyebrow: "C · UNIT ECONOMICS",
    groupTitle: "单 case 经济性与干净口径",
    groupEn: "Unit Economics & Clean Accounting",
    groupTagline:
      "证明 TermPay 有单位经济学，且收入 / 风险口径经得起审计与 DD。",
    icon: Banknote,
    accent: "pink",
    items: [
      {
        name: "单 case CM",
        explain:
          "单个 case 扣除银行分成、服务成本、风控 / 运营成本后，Dowsure 是否赚钱。",
        why: "证明 TermPay 不是只跑流程，而是有单位经济学。",
        source: "Finance UE model",
      },
      {
        name: "Bank revenue share",
        explain: "银行 / 资金方和 Dowsure 怎么分收入。",
        why: "决定 Dowsure 能确认多少 net revenue。",
        source: "Bank contract / Finance memo",
      },
      {
        name: "First-loss clean",
        explain: "确认 Dowsure 不承担第一损失、回购、兜底或隐性担保。",
        why: "影响融资 DD、ASC 606 和监管风险。",
        source: "Legal / Finance responsibility matrix",
      },
      {
        name: "Revenue recognition clean",
        explain:
          "确认如何确认 net revenue，不把 GMV、facilitated volume、银行资金混成收入。",
        why: "影响审计、估值和投资人 DD。",
        source: "Finance memo / auditor pre-review",
      },
    ],
  },
];

const ACCENT_STYLE: Record<
  KpiAccent,
  {
    iconStyle: React.CSSProperties;
    chipStyle: React.CSSProperties;
    glowColor: string;
    bulletColor: string;
  }
> = {
  cyan: {
    iconStyle: {
      background:
        "linear-gradient(135deg, rgba(34,211,238,0.45) 0%, rgba(91,135,255,0.35) 100%)",
      border: "1px solid rgba(34,211,238,0.5)",
    },
    chipStyle: {
      background: "rgba(34,211,238,0.12)",
      borderColor: "rgba(34,211,238,0.4)",
      color: "#a7f3ff",
    },
    glowColor: "rgba(34,211,238,0.32)",
    bulletColor: "#22d3ee",
  },
  violet: {
    iconStyle: {
      background:
        "linear-gradient(135deg, rgba(167,87,255,0.4) 0%, rgba(91,135,255,0.35) 100%)",
      border: "1px solid rgba(167,87,255,0.5)",
    },
    chipStyle: {
      background: "rgba(167,87,255,0.14)",
      borderColor: "rgba(167,87,255,0.45)",
      color: "#d6c2ff",
    },
    glowColor: "rgba(167,87,255,0.32)",
    bulletColor: "#a757ff",
  },
  pink: {
    iconStyle: {
      background:
        "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
      boxShadow: "0 12px 28px -10px rgba(255,91,176,0.55)",
    },
    chipStyle: {
      background: "rgba(255,91,176,0.14)",
      borderColor: "rgba(255,91,176,0.45)",
      color: "#ffc2e2",
    },
    glowColor: "rgba(255,91,176,0.32)",
    bulletColor: "#ff5bb0",
  },
};

interface ReadinessStrip {
  label: string;
  status: string;
  icon: LucideIcon;
}

const READINESS_STRIP: ReadinessStrip[] = [
  { label: "Data source", status: "待接入", icon: Database },
  { label: "Owner", status: "待指定", icon: UserCog },
  { label: "Target", status: "待 CEO 拍板", icon: Target },
  { label: "Actual", status: "pilot 后填入", icon: BarChart3 },
];

function KPIPage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="dow-console-panel relative overflow-hidden p-7 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-55 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,87,255,0.4), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full opacity-45 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(34,211,238,0.32), transparent)",
          }}
        />
        <div className="relative">
          <p className="dow-eyebrow dow-eyebrow-dot">
            METRICS · EVIDENCE LANGUAGE
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[32px] font-black leading-[1.08] tracking-tight text-white sm:text-[44px] lg:text-[52px]">
            用哪些数字证明{" "}
            <span className="dow-gradient-text">TermPay 有价值</span>？
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[rgba(226,219,255,0.78)] sm:text-base">
            模块 3 不是为了堆指标，而是定义 TermPay pilot 结果如何被量化，哪些数字能进入融资材料，哪些口径必须由 Finance / Legal 确认。
          </p>
        </div>
      </section>

      {/* 3 组 KPI */}
      <section className="space-y-5">
        {KPI_GROUPS.map((g) => (
          <KpiGroupCard key={g.groupEyebrow} group={g} />
        ))}
      </section>

      {/* Evidence Readiness Strip */}
      <section className="dow-glass-card p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dow-eyebrow dow-eyebrow-dot">
              EVIDENCE READINESS · STATUS
            </p>
            <h2 className="mt-2 text-base font-semibold tracking-tight text-white sm:text-lg">
              当前阶段：先定义口径，不编造真实数据
            </h2>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.6)] sm:self-auto">
            v0 preview
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {READINESS_STRIP.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex items-start gap-3 rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(180,150,255,0.18)",
                }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] text-[rgba(226,219,255,0.85)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.55)]">
                    {s.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {s.status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 小结卡 */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,91,176,0.16) 0%, rgba(167,87,255,0.16) 50%, rgba(91,135,255,0.16) 100%)",
          border: "1px solid rgba(167,87,255,0.45)",
          boxShadow: "0 0 0 1px rgba(167,87,255,0.2) inset",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{
              background:
                "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
              boxShadow: "0 12px 30px -10px rgba(167,87,255,0.6)",
            }}
          >
            <Compass className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="dow-eyebrow">EXECUTIVE TAKEAWAY</p>
            <p className="mt-2 text-sm leading-relaxed text-white sm:text-base">
              模块 2 定义 W6 / W12 要证明什么；模块 3 定义用哪些 KPI 来证明。后续 dashboard 只展示结果，本页负责解释指标口径。
            </p>
          </div>
        </div>
      </section>

      {/* 底部导航 */}
      <section className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={`${DASHBOARD_BASE}/w6-w12`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-[rgba(226,219,255,0.85)] transition hover:border-white/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          上一模块：W6 / W12
        </a>
        <a
          href={`${DASHBOARD_BASE}/milestones`}
          className="dow-cta-primary"
        >
          下一模块：Milestone 映射
          <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </div>
  );
}

function KpiGroupCard({ group }: { group: KpiGroup }) {
  const Icon = group.icon;
  const style = ACCENT_STYLE[group.accent];
  return (
    <section className="dow-console-panel relative overflow-hidden p-5 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-55 blur-3xl"
        style={{
          background: `radial-gradient(closest-side, ${style.glowColor}, transparent)`,
        }}
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={style.iconStyle}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="dow-eyebrow">{group.groupEyebrow}</p>
            <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
              {group.groupTitle}{" "}
              <span className="text-[rgba(226,219,255,0.55)] font-medium">
                · {group.groupEn}
              </span>
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[rgba(226,219,255,0.65)] sm:text-sm">
              {group.groupTagline}
            </p>
          </div>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={style.chipStyle}
        >
          {group.items.length} KPIs
        </span>
      </div>

      <div className="relative mt-5 grid gap-3 md:grid-cols-2">
        {group.items.map((item) => (
          <KpiItemCard
            key={item.name}
            item={item}
            bulletColor={style.bulletColor}
          />
        ))}
      </div>
    </section>
  );
}

function KpiItemCard({
  item,
  bulletColor,
}: {
  item: KpiItem;
  bulletColor: string;
}) {
  return (
    <article className="dow-glass-card flex h-full flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-semibold tracking-tight text-white sm:text-lg">
          <span className="dow-gradient-text">{item.name}</span>
        </h3>
        <span
          aria-hidden
          className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{
            background: bulletColor,
            boxShadow: `0 0 10px ${bulletColor}`,
          }}
        />
      </div>

      <KvRow label="解释">
        <span className="text-[rgba(226,219,255,0.85)]">{item.explain}</span>
      </KvRow>
      <KvRow label="为什么重要">
        <span className="text-[rgba(226,219,255,0.78)]">{item.why}</span>
      </KvRow>
      <KvRow label="数据来源">
        <code
          className="rounded-md px-1.5 py-0.5 font-mono text-[11px] text-[#d6c2ff]"
          style={{
            background: "rgba(167,87,255,0.1)",
            border: "1px solid rgba(167,87,255,0.25)",
          }}
        >
          {item.source}
        </code>
      </KvRow>
    </article>
  );
}

function KvRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2 text-xs leading-relaxed sm:text-sm">
      <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(226,219,255,0.5)]">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// ────────────────── Milestones 页 ──────────────────

type MsAccent = "cyan" | "violet" | "pink" | "amber" | "emerald";

interface MilestoneEvidence {
  id: "M1" | "M2" | "M5" | "M8" | "M9";
  label: string;
  title: string;
  icon: LucideIcon;
  accent: MsAccent;
  howSupport: string;
  evidence: string[];
  risk: string;
}

const MILESTONES: MilestoneEvidence[] = [
  {
    id: "M1",
    label: "Risk Monitoring",
    title: "风控和异常监控",
    icon: ShieldCheck,
    accent: "cyan",
    howSupport:
      "Dowsure 可以基于卖家授权数据、服务商账单、回款监控和 Sentinel 风控，持续追踪还款与异常。",
    evidence: [
      "每个 case 的还款计划",
      "异常事件记录",
      "通过 / 补件 / 拒绝原因",
      "Sentinel 审核记录",
      "人工 override 记录",
    ],
    risk: "样本不足，pilot case 还未形成 cohort 数据。",
  },
  {
    id: "M2",
    label: "Facility",
    title: "银行 / 资金方 facility",
    icon: Landmark,
    accent: "violet",
    howSupport:
      "银行或资金方愿意基于 Dowsure 的风控、账单验证和贷后监控推进审批，甚至扩大额度。",
    evidence: [
      "资金方审批 SLA",
      "银行 / 资金方 feedback",
      "credit appetite 记录",
      "facility / LOI / term sheet 进展",
      "每周 funding pipeline",
    ],
    risk: "资金方审批边界和 SLA 尚未锁定。",
  },
  {
    id: "M5",
    label: "Contribution Margin",
    title: "Contribution margin",
    icon: TrendingUp,
    accent: "emerald",
    howSupport:
      "证明 TermPay 不是免费跑流程，而是每个 case 有收入、有成本、有毛利测算。",
    evidence: [
      "单 case gross fee",
      "bank revenue share",
      "servicing cost",
      "fraud / exception cost",
      "net contribution margin",
    ],
    risk: "bank share、servicing cost、exception cost 口径待 Finance 确认。",
  },
  {
    id: "M8",
    label: "Revenue Recognition",
    title: "Revenue recognition",
    icon: Receipt,
    accent: "amber",
    howSupport:
      "Dowsure 的收入确认口径清楚，不把银行资金、GMV、facilitated volume 混成收入。",
    evidence: [
      "net revenue 口径",
      "bank share 口径",
      "服务费确认方式",
      "Finance memo v0",
      "Big-4 / audit pre-review input",
    ],
    risk: "Finance / Legal 尚未形成 memo 口径。",
  },
  {
    id: "M9",
    label: "First-loss Clean",
    title: "First-loss / guarantee clean",
    icon: Scale,
    accent: "pink",
    howSupport:
      "Dowsure 不承担隐藏 first-loss、不回购、不兜底、不对外担保。",
    evidence: [
      "风险责任矩阵",
      "合同条款 review",
      "资金方最终审批权说明",
      "对外话术禁用词",
      "Legal / Finance sign-off matrix",
    ],
    risk: "所有风险责任边界需要 CEO / Legal / Finance 拍板。",
  },
];

const MS_ACCENT: Record<
  MsAccent,
  {
    icon: React.CSSProperties;
    chip: React.CSSProperties;
    glow: string;
    bullet: string;
    code: string;
  }
> = {
  cyan: {
    icon: {
      background:
        "linear-gradient(135deg, rgba(34,211,238,0.45) 0%, rgba(91,135,255,0.35) 100%)",
      border: "1px solid rgba(34,211,238,0.5)",
    },
    chip: {
      background: "rgba(34,211,238,0.12)",
      borderColor: "rgba(34,211,238,0.4)",
      color: "#a7f3ff",
    },
    glow: "rgba(34,211,238,0.32)",
    bullet: "#22d3ee",
    code: "#a7f3ff",
  },
  violet: {
    icon: {
      background:
        "linear-gradient(135deg, rgba(167,87,255,0.4) 0%, rgba(91,135,255,0.35) 100%)",
      border: "1px solid rgba(167,87,255,0.5)",
    },
    chip: {
      background: "rgba(167,87,255,0.14)",
      borderColor: "rgba(167,87,255,0.45)",
      color: "#d6c2ff",
    },
    glow: "rgba(167,87,255,0.32)",
    bullet: "#a757ff",
    code: "#d6c2ff",
  },
  emerald: {
    icon: {
      background:
        "linear-gradient(135deg, rgba(16,185,129,0.4) 0%, rgba(34,211,238,0.3) 100%)",
      border: "1px solid rgba(16,185,129,0.5)",
    },
    chip: {
      background: "rgba(16,185,129,0.12)",
      borderColor: "rgba(16,185,129,0.4)",
      color: "#6ee7b7",
    },
    glow: "rgba(16,185,129,0.3)",
    bullet: "#10b981",
    code: "#6ee7b7",
  },
  amber: {
    icon: {
      background:
        "linear-gradient(135deg, rgba(245,166,35,0.4) 0%, rgba(255,91,176,0.32) 100%)",
      border: "1px solid rgba(245,166,35,0.5)",
    },
    chip: {
      background: "rgba(245,166,35,0.12)",
      borderColor: "rgba(245,166,35,0.4)",
      color: "#ffd187",
    },
    glow: "rgba(245,166,35,0.3)",
    bullet: "#f5a623",
    code: "#ffd187",
  },
  pink: {
    icon: {
      background:
        "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
      boxShadow: "0 12px 28px -10px rgba(255,91,176,0.55)",
    },
    chip: {
      background: "rgba(255,91,176,0.14)",
      borderColor: "rgba(255,91,176,0.45)",
      color: "#ffc2e2",
    },
    glow: "rgba(255,91,176,0.32)",
    bullet: "#ff5bb0",
    code: "#ffc2e2",
  },
};

function MilestonesPage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="dow-console-panel relative overflow-hidden p-7 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-55 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,87,255,0.4), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full opacity-45 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(91,135,255,0.32), transparent)",
          }}
        />
        <div className="relative">
          <p className="dow-eyebrow dow-eyebrow-dot">
            SECOND CLOSE · MILESTONE MAP
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[32px] font-black leading-[1.08] tracking-tight text-white sm:text-[44px] lg:text-[52px]">
            把 TermPay 翻译成{" "}
            <span className="dow-gradient-text">融资 milestone</span>{" "}
            能看懂的证据。
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[rgba(226,219,255,0.78)] sm:text-base">
            TermPay 不需要硬凑全部 9 个 milestones。它优先支撑 M1 / M2 / M5 / M8 / M9，其它 milestone 只作为间接 cross-sell 或 usage evidence。
          </p>
        </div>
      </section>

      {/* Milestone Focus Strip */}
      <section className="dow-glass-card p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dow-eyebrow dow-eyebrow-dot">FOCUS · 5 MILESTONES</p>
            <h2 className="mt-2 text-base font-semibold tracking-tight text-white sm:text-lg">
              TermPay 优先支撑的融资证据点
            </h2>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.6)] sm:self-auto">
            evidence pending
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {MILESTONES.map((m) => {
            const Icon = m.icon;
            const a = MS_ACCENT[m.accent];
            return (
              <a
                key={m.id}
                href={`#milestone-${m.id}`}
                className="dow-glass-card group flex flex-col gap-2 p-4 transition hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={a.chip}
                  >
                    {m.id}
                  </span>
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                    style={a.icon}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-white">
                  {m.id} ·{" "}
                  <span className="font-medium text-[rgba(226,219,255,0.85)]">
                    {m.label}
                  </span>
                </p>
                <span
                  className="mt-1 inline-flex items-center gap-1 self-start rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{
                    background: "rgba(245,166,35,0.12)",
                    borderColor: "rgba(245,166,35,0.4)",
                    color: "#ffd187",
                  }}
                >
                  <Clock4 className="h-3 w-3" />
                  Evidence Pending
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* 5 张 Milestone Evidence 大卡 */}
      <section className="space-y-4">
        {MILESTONES.map((m) => (
          <MilestoneCard key={m.id} milestone={m} />
        ))}
      </section>

      {/* 不直接负责的 milestone 边界说明 */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background: "rgba(255,255,255,0.035)",
          border: "1px dashed rgba(180,150,255,0.3)",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] text-[rgba(226,219,255,0.7)]">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="dow-eyebrow">BOUNDARY · NOT DIRECT OWNER</p>
              <p className="mt-1.5 text-base font-semibold text-white">
                TermPay 不直接负责
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:min-w-[480px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="dow-eyebrow">NOT DIRECT</p>
              <ul className="mt-2 space-y-1.5 text-sm text-[rgba(226,219,255,0.8)]">
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgba(226,219,255,0.45)]"
                  />
                  M3 / M4：FastPay volume 与 paying customers
                </li>
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgba(226,219,255,0.45)]"
                  />
                  M6 / M7：Pure Agent OS ARR / GRR / NRR
                </li>
              </ul>
            </div>
            <div
              className="rounded-2xl border p-4"
              style={{
                background: "rgba(34,211,238,0.06)",
                borderColor: "rgba(34,211,238,0.3)",
              }}
            >
              <p className="dow-eyebrow">INDIRECT CONTRIBUTION</p>
              <ul className="mt-2 space-y-1.5 text-sm text-[#bdf0fa]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22d3ee]" />
                  提供 cross-sell evidence
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22d3ee]" />
                  证明嵌入式金融与 Agent OS 协同
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22d3ee]" />
                  不把 TermPay 硬写成所有 milestone 的 owner
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 小结卡 */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,91,176,0.16) 0%, rgba(167,87,255,0.16) 50%, rgba(91,135,255,0.16) 100%)",
          border: "1px solid rgba(167,87,255,0.45)",
          boxShadow: "0 0 0 1px rgba(167,87,255,0.2) inset",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{
              background:
                "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
              boxShadow: "0 12px 30px -10px rgba(167,87,255,0.6)",
            }}
          >
            <Compass className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="dow-eyebrow">EXECUTIVE TAKEAWAY</p>
            <p className="mt-2 text-sm leading-relaxed text-white sm:text-base">
              模块 4 不是讲 TermPay 多厉害，而是把 TermPay 试点结果翻译成 Second Close 能识别的证据语言。
            </p>
          </div>
        </div>
      </section>

      {/* 底部导航 */}
      <section className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={`${DASHBOARD_BASE}/kpi`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-[rgba(226,219,255,0.85)] transition hover:border-white/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          上一模块：核心 KPI
        </a>
        <a href={`${DASHBOARD_BASE}/risks`} className="dow-cta-primary">
          下一模块：Risks &amp; Decisions
          <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: MilestoneEvidence }) {
  const Icon = milestone.icon;
  const a = MS_ACCENT[milestone.accent];
  return (
    <article
      id={`milestone-${milestone.id}`}
      className="dow-console-panel relative overflow-hidden p-5 sm:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-55 blur-3xl"
        style={{
          background: `radial-gradient(closest-side, ${a.glow}, transparent)`,
        }}
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={a.icon}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="dow-eyebrow">
              <span style={{ color: a.code }}>{milestone.id}</span> ·{" "}
              {milestone.label}
            </p>
            <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
              <span style={{ color: a.code }}>{milestone.id}</span> ·{" "}
              <span className="dow-gradient-text">{milestone.title}</span>
            </h2>
          </div>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{
            background: "rgba(245,166,35,0.12)",
            borderColor: "rgba(245,166,35,0.4)",
            color: "#ffd187",
          }}
        >
          <Clock4 className="h-3 w-3" />
          Evidence Pending
        </span>
      </div>

      <div className="relative mt-5 grid gap-4 lg:grid-cols-[1.2fr_1.5fr_1fr]">
        {/* TermPay 如何支撑 */}
        <div>
          <p className="dow-eyebrow">TERMPAY 如何支撑</p>
          <p className="mt-2 text-sm leading-relaxed text-[rgba(226,219,255,0.85)]">
            {milestone.howSupport}
          </p>
        </div>

        {/* 需要形成的证据 */}
        <div>
          <p className="dow-eyebrow">需要形成的证据</p>
          <ul className="mt-2 space-y-1.5">
            {milestone.evidence.map((e) => (
              <li
                key={e}
                className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-[rgba(226,219,255,0.85)]"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(180,150,255,0.12)",
                }}
              >
                <CheckCircle2
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: a.bullet }}
                />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 当前风险 */}
        <div>
          <p className="dow-eyebrow">当前风险</p>
          <div
            className="mt-2 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm leading-relaxed"
            style={{
              background: "rgba(255,87,130,0.06)",
              border: "1px solid rgba(255,87,130,0.28)",
              color: "#ffbcd2",
            }}
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{milestone.risk}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ────────────────── Risks & Decisions 页 ──────────────────

type RiskSeverity = "blocker" | "critical" | "watch";

interface RiskCard {
  id: "R1" | "R2" | "R3" | "R4" | "R5" | "R6";
  title: string;
  icon: LucideIcon;
  severity: RiskSeverity;
  impact: string;
  mitigations: string[];
  /** 仅 R5 有禁用词 */
  forbiddenTerms?: string[];
  decisionAsk: string;
  /** 若不解决，会卡住哪个 gate */
  blocks: ("W6 Pilot" | "W12 Evidence")[];
  status: string;
}

const RISK_CARDS: RiskCard[] = [
  {
    id: "R1",
    title: "First-loss / 回购 / 担保边界不清",
    icon: Scale,
    severity: "blocker",
    impact:
      "如果 Dowsure 被理解成兜底方，TermPay 会变成类放贷或隐性担保，影响融资 DD、收入确认和监管风险。",
    mitigations: [
      "风险责任矩阵 v0",
      "合同条款 review",
      "对外禁用话术清单",
      "Legal / Finance sign-off",
    ],
    decisionAsk:
      "确认 Dowsure 不兜底、不回购、不承担隐性担保（Dowsure does not lend; Dowsure makes lending possible）。",
    blocks: ["W6 Pilot", "W12 Evidence"],
    status: "待 Legal / Finance / CEO 拍板",
  },
  {
    id: "R2",
    title: "资金方审批 SLA 不确定",
    icon: Landmark,
    severity: "blocker",
    impact:
      "银行 / 资金方审批太慢会拖垮卖家体验和服务商销售承诺；若 SLA 不锁定，pilot 无法对外承诺。",
    mitigations: [
      "初审 SLA 锁定",
      "补件 SLA 锁定",
      "通过 / 拒绝口径表",
      "fallback funding path",
    ],
    decisionAsk: "确认初审 48h、补件后 72h 内复审，作为对外承诺基线。",
    blocks: ["W6 Pilot"],
    status: "待 Bank BD / Treasury 确认",
  },
  {
    id: "R3",
    title: "服务商账单真实性不足",
    icon: FileText,
    severity: "critical",
    impact:
      "账单造假、关联交易、服务未交付会让风控基础失真，pilot case 不能作为 Second Close evidence。",
    mitigations: [
      "服务商白名单",
      "账单模板",
      "交付证明",
      "异常账单人工审核",
    ],
    decisionAsk: "确认首批服务商名单和账单验真标准。",
    blocks: ["W6 Pilot", "W12 Evidence"],
    status: "待 Ops / Sales 提名 + Sentinel 校验",
  },
  {
    id: "R4",
    title: "Revenue recognition 口径不清",
    icon: Receipt,
    severity: "blocker",
    impact:
      "GMV、facilitated volume、银行资金、Dowsure net revenue 混在一起，会被 Finance / auditor 挑战。",
    mitigations: [
      "Finance memo v0",
      "bank share 口径",
      "net revenue 口径",
      "单 case UE 模板",
    ],
    decisionAsk: "确认收入确认口径 owner 和 memo 时间。",
    blocks: ["W12 Evidence"],
    status: "待 Finance memo + Big-4 pre-review",
  },
  {
    id: "R5",
    title: "对外口径越界",
    icon: Megaphone,
    severity: "critical",
    impact:
      "Amazon / 银行股东相关表达若越界，会触发品牌、合规、合作风险，并危及融资叙事。",
    mitigations: [
      "禁用词清单",
      "对外材料 review",
      "8 月官宣前统一口径",
    ],
    forbiddenTerms: [
      "独家",
      "保证",
      "银行级",
      "最低费率",
      "秒批秒放",
      "零坏账",
      "Dowsure 放款",
    ],
    decisionAsk:
      "确认官宣前仅使用 pilot / controlled validation 口径，且所有外部材料必须 Legal review。",
    blocks: ["W6 Pilot"],
    status: "待 Legal / Comms 拍板",
  },
  {
    id: "R6",
    title: "Pilot 样本太小",
    icon: Users,
    severity: "critical",
    impact:
      "如果 W12 只有 1-2 个 case，不能形成 cohort 数据，融资材料缺少规模感。",
    mitigations: [
      "W6 / W12 case target",
      "服务商名单",
      "销售 pipeline",
      "每周进度看板",
    ],
    decisionAsk: "确认 W6 / W12 case 数与 facilitated volume target。",
    blocks: ["W12 Evidence"],
    status: "待 Sales + Ops 联动",
  },
];

const SEVERITY_META: Record<
  RiskSeverity,
  {
    label: string;
    icon: LucideIcon;
    chip: React.CSSProperties;
    glow: string;
    bullet: string;
  }
> = {
  blocker: {
    label: "BLOCKER",
    icon: XOctagon,
    chip: {
      background: "rgba(255,87,130,0.12)",
      borderColor: "rgba(255,87,130,0.45)",
      color: "#ffbcd2",
    },
    glow: "rgba(255,87,130,0.3)",
    bullet: "#ff5782",
  },
  critical: {
    label: "CRITICAL",
    icon: Siren,
    chip: {
      background: "rgba(245,166,35,0.12)",
      borderColor: "rgba(245,166,35,0.45)",
      color: "#ffd187",
    },
    glow: "rgba(245,166,35,0.3)",
    bullet: "#f5a623",
  },
  watch: {
    label: "WATCH",
    icon: AlertTriangle,
    chip: {
      background: "rgba(167,87,255,0.14)",
      borderColor: "rgba(167,87,255,0.45)",
      color: "#d6c2ff",
    },
    glow: "rgba(167,87,255,0.32)",
    bullet: "#a757ff",
  },
};

interface DecisionRow {
  topic: string;
  recommended: string;
  impactIfStalled: string;
  owner: string;
}

const DECISION_ROWS: DecisionRow[] = [
  {
    topic: "W6 pilot case 数",
    recommended: "5-8 个候选 case",
    impactIfStalled: "无法判断 W6 是否达标",
    owner: "Sales + Ops",
  },
  {
    topic: "W12 pilot case 数",
    recommended: "10-20 个受控 case",
    impactIfStalled: "无法形成 cohort evidence",
    owner: "Sales + Ops",
  },
  {
    topic: "W12 facilitated volume",
    recommended: "USD 500K-1M target range",
    impactIfStalled: "融资材料缺少规模感",
    owner: "CEO + Finance",
  },
  {
    topic: "首批服务商类型",
    recommended: "物流 / 海外仓优先",
    impactIfStalled: "场景过散，账单验证难度升高",
    owner: "Sales + Product",
  },
  {
    topic: "首批服务商数",
    recommended: "W6 3 家 · W12 5 家",
    impactIfStalled: "无法证明服务商侧可复制",
    owner: "Sales",
  },
  {
    topic: "资金方 SLA",
    recommended: "初审 48h · 补件后 72h 内复审",
    impactIfStalled: "卖家体验和销售承诺不可控",
    owner: "Bank BD + Treasury",
  },
  {
    topic: "First-loss 边界",
    recommended: "Dowsure 不兜底、不回购、不隐性担保",
    impactIfStalled: "影响融资 DD / ASC 606 / 合规",
    owner: "CEO + Legal + Finance",
  },
  {
    topic: "对外口径",
    recommended: "8 月官宣前仅使用 pilot / controlled validation 表达",
    impactIfStalled: "可能触发 Amazon / 银行股东口径风险",
    owner: "CEO + Comms + Legal",
  },
];

function RisksDecisionsPage() {
  const blockers = RISK_CARDS.filter((r) => r.severity === "blocker").length;
  const criticals = RISK_CARDS.filter((r) => r.severity === "critical").length;
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="dow-console-panel relative overflow-hidden p-7 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-55 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,87,130,0.32), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full opacity-45 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,87,255,0.3), transparent)",
          }}
        />
        <div className="relative">
          <p className="dow-eyebrow dow-eyebrow-dot">
            BLOCKERS · CEO DECISIONS REQUIRED
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[32px] font-black leading-[1.08] tracking-tight text-white sm:text-[44px] lg:text-[52px]">
            哪些风险会卡死{" "}
            <span className="dow-gradient-text">pilot / financing evidence</span>
            ？
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[rgba(226,219,255,0.78)] sm:text-base">
            Blocking risk = 如果不解决，项目不能进入 pilot，或不能作为融资证据。本页把会卡死项目的风险与必须 CEO 拍板的事项收敛成清单。
          </p>
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-[rgba(226,219,255,0.55)] sm:text-sm">
            Anchor 原则：Dowsure does not lend; Dowsure makes lending possible.
          </p>

          {/* 顶部状态条 */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SummaryStat
              icon={XOctagon}
              tone="rose"
              label="Blocker"
              value={`${blockers} 项`}
              hint="未拍板 → 不能 pilot / 不能进 evidence"
            />
            <SummaryStat
              icon={Siren}
              tone="amber"
              label="Critical"
              value={`${criticals} 项`}
              hint="不解决会拖慢 pilot 节奏与样本质量"
            />
            <SummaryStat
              icon={Gauge}
              tone="violet"
              label="CEO Decisions"
              value={`${DECISION_ROWS.length} 项`}
              hint="必须 leadership 拍板的清单"
            />
          </div>
        </div>
      </section>

      {/* Blocking Risks 区 */}
      <section className="space-y-4">
        <div className="flex items-end justify-between px-1">
          <div>
            <p className="dow-eyebrow dow-eyebrow-dot">BLOCKING RISKS · R1-R6</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
              如果不解决，会卡住哪个 gate？
            </h2>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.55)] sm:inline">
            6 risks · evidence pending
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {RISK_CARDS.map((r) => (
            <RiskCardView key={r.id} risk={r} />
          ))}
        </div>
      </section>

      {/* CEO Decision Required 区 */}
      <section className="dow-console-panel overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dow-eyebrow dow-eyebrow-dot">
              CEO DECISION REQUIRED · 8 ITEMS
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
              <span className="dow-gradient-text">不拍板</span>，团队没法继续推进
            </h2>
            <p className="mt-1 text-xs text-[rgba(226,219,255,0.6)] sm:text-sm">
              语气直接：每行都给推荐默认值与不拍板的影响。
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.6)] sm:self-auto">
            v0 preview
          </span>
        </div>

        {/* 桌面表格 */}
        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-white/10 lg:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-white/[0.04] text-left">
                <Th>决策事项</Th>
                <Th>推荐默认值</Th>
                <Th>不拍板的影响</Th>
                <Th>Owner / Decision</Th>
              </tr>
            </thead>
            <tbody>
              {DECISION_ROWS.map((row, idx) => (
                <tr
                  key={row.topic}
                  className={
                    idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                  }
                >
                  <Td>
                    <span className="font-semibold text-white">{row.topic}</span>
                  </Td>
                  <Td>
                    <span className="dow-gradient-text font-medium">
                      {row.recommended}
                    </span>
                  </Td>
                  <Td className="text-[rgba(226,219,255,0.78)]">
                    {row.impactIfStalled}
                  </Td>
                  <Td>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
                      style={{
                        background: "rgba(167,87,255,0.12)",
                        borderColor: "rgba(167,87,255,0.4)",
                        color: "#d6c2ff",
                      }}
                    >
                      {row.owner}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 移动卡片 */}
        <ul className="mt-5 space-y-3 lg:hidden">
          {DECISION_ROWS.map((row) => (
            <li
              key={row.topic}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="text-sm font-semibold text-white">{row.topic}</p>
              <dl className="mt-3 space-y-2 text-xs text-[rgba(226,219,255,0.85)]">
                <KV label="推荐">
                  <span className="dow-gradient-text font-medium">
                    {row.recommended}
                  </span>
                </KV>
                <KV label="不拍板">{row.impactIfStalled}</KV>
                <KV label="Owner">
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{
                      background: "rgba(167,87,255,0.12)",
                      borderColor: "rgba(167,87,255,0.4)",
                      color: "#d6c2ff",
                    }}
                  >
                    {row.owner}
                  </span>
                </KV>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      {/* 小结卡 */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,91,176,0.16) 0%, rgba(167,87,255,0.16) 50%, rgba(91,135,255,0.16) 100%)",
          border: "1px solid rgba(167,87,255,0.45)",
          boxShadow: "0 0 0 1px rgba(167,87,255,0.2) inset",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{
              background:
                "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
              boxShadow: "0 12px 30px -10px rgba(167,87,255,0.6)",
            }}
          >
            <Compass className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="dow-eyebrow">EXECUTIVE TAKEAWAY</p>
            <p className="mt-2 text-sm leading-relaxed text-white sm:text-base">
              模块 5 不是为了显得想得周全，而是提前暴露会卡住 pilot / financing evidence 的问题，并把必须 CEO 拍板的事项收敛成清单。
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[rgba(226,219,255,0.7)] sm:text-sm">
              一句锚点：Dowsure does not lend; Dowsure makes lending possible.
            </p>
          </div>
        </div>
      </section>

      {/* 底部导航 */}
      <section className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={`${DASHBOARD_BASE}/milestones`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-[rgba(226,219,255,0.85)] transition hover:border-white/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          上一模块：Milestone 映射
        </a>
        <a href={`${DASHBOARD_BASE}/appendix`} className="dow-cta-primary">
          下一模块：Appendix
          <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </div>
  );
}

function RiskCardView({ risk }: { risk: RiskCard }) {
  const Icon = risk.icon;
  const sev = SEVERITY_META[risk.severity];
  const SevIcon = sev.icon;
  return (
    <article className="dow-console-panel relative flex h-full flex-col overflow-hidden p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
        style={{
          background: `radial-gradient(closest-side, ${sev.glow}, transparent)`,
        }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] text-[rgba(226,219,255,0.9)]"
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="dow-eyebrow">
              <span className="font-bold" style={{ color: sev.bullet }}>
                {risk.id}
              </span>{" "}
              · RISK
            </p>
            <h3 className="mt-1.5 font-display text-base font-bold tracking-tight text-white sm:text-lg">
              {risk.title}
            </h3>
          </div>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={sev.chip}
        >
          <SevIcon className="h-3 w-3" />
          {sev.label}
        </span>
      </div>

      {/* Blocks chips */}
      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {risk.blocks.map((b) => (
          <span
            key={b}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{
              background:
                b === "W6 Pilot"
                  ? "rgba(34,211,238,0.1)"
                  : "rgba(167,87,255,0.12)",
              borderColor:
                b === "W6 Pilot"
                  ? "rgba(34,211,238,0.35)"
                  : "rgba(167,87,255,0.4)",
              color: b === "W6 Pilot" ? "#a7f3ff" : "#d6c2ff",
            }}
          >
            blocks · {b}
          </span>
        ))}
      </div>

      {/* 影响 */}
      <div className="relative mt-4">
        <p className="dow-eyebrow">影响</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[rgba(226,219,255,0.85)]">
          {risk.impact}
        </p>
      </div>

      {/* 缓释动作 */}
      <div className="relative mt-4">
        <p className="dow-eyebrow flex items-center gap-1.5">
          <Wrench className="h-3 w-3" />
          缓释动作
        </p>
        <ul className="mt-2 space-y-1.5">
          {risk.mitigations.map((m) => (
            <li
              key={m}
              className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-[rgba(226,219,255,0.85)]"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(180,150,255,0.14)",
              }}
            >
              <CheckCircle2
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                style={{ color: sev.bullet }}
              />
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 禁用词（R5 专属） */}
      {risk.forbiddenTerms && risk.forbiddenTerms.length > 0 ? (
        <div className="relative mt-4">
          <p className="dow-eyebrow flex items-center gap-1.5">
            <XOctagon className="h-3 w-3" />
            禁用词清单
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {risk.forbiddenTerms.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                style={{
                  background: "rgba(255,87,130,0.08)",
                  borderColor: "rgba(255,87,130,0.35)",
                  color: "#ffbcd2",
                  textDecoration: "line-through",
                  textDecorationColor: "rgba(255,87,130,0.6)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[rgba(226,219,255,0.5)]">
            * 仅作为禁用清单展示，不构成对外口径。
          </p>
        </div>
      ) : null}

      {/* 决策 ask */}
      <div className="relative mt-auto">
        <div
          className="mt-5 rounded-xl border p-3"
          style={{
            background: "rgba(167,87,255,0.1)",
            borderColor: "rgba(167,87,255,0.4)",
          }}
        >
          <p className="dow-eyebrow text-[#d6c2ff]">CEO ASK</p>
          <p className="mt-1.5 text-sm leading-relaxed text-white">
            {risk.decisionAsk}
          </p>
          <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[rgba(226,219,255,0.55)]">
            status · {risk.status}
          </p>
        </div>
      </div>
    </article>
  );
}

function SummaryStat({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  tone: "rose" | "amber" | "violet";
  label: string;
  value: string;
  hint: string;
}) {
  const styleMap: Record<
    typeof tone,
    {
      icon: React.CSSProperties;
      chip: React.CSSProperties;
      gradientText: string;
    }
  > = {
    rose: {
      icon: {
        background:
          "linear-gradient(135deg, rgba(255,87,130,0.4) 0%, rgba(167,87,255,0.32) 100%)",
        border: "1px solid rgba(255,87,130,0.5)",
      },
      chip: {
        background: "rgba(255,87,130,0.12)",
        borderColor: "rgba(255,87,130,0.45)",
        color: "#ffbcd2",
      },
      gradientText: "#ffbcd2",
    },
    amber: {
      icon: {
        background:
          "linear-gradient(135deg, rgba(245,166,35,0.4) 0%, rgba(255,91,176,0.32) 100%)",
        border: "1px solid rgba(245,166,35,0.5)",
      },
      chip: {
        background: "rgba(245,166,35,0.12)",
        borderColor: "rgba(245,166,35,0.45)",
        color: "#ffd187",
      },
      gradientText: "#ffd187",
    },
    violet: {
      icon: {
        background:
          "linear-gradient(135deg, rgba(167,87,255,0.4) 0%, rgba(91,135,255,0.35) 100%)",
        border: "1px solid rgba(167,87,255,0.5)",
      },
      chip: {
        background: "rgba(167,87,255,0.14)",
        borderColor: "rgba(167,87,255,0.45)",
        color: "#d6c2ff",
      },
      gradientText: "#d6c2ff",
    },
  };
  const s = styleMap[tone];
  return (
    <div className="dow-glass-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="dow-eyebrow">{label}</p>
          <p
            className="mt-1.5 font-display text-[28px] font-black leading-none"
            style={{ color: s.gradientText }}
          >
            {value}
          </p>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={s.icon}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-xs text-[rgba(226,219,255,0.65)]">{hint}</p>
    </div>
  );
}

// ────────────────── Appendix 页 ──────────────────

type AppendixAccent = "cyan" | "violet" | "emerald" | "amber";

interface PhaseCard {
  id: "P1" | "P2" | "P3" | "P4";
  label: string;
  range: string;
  title: string;
  goal: string;
  outputs: string[];
  icon: LucideIcon;
  accent: AppendixAccent;
}

const PHASES: PhaseCard[] = [
  {
    id: "P1",
    label: "Phase 1",
    range: "W1-W2",
    title: "Scope freeze & pilot 准备",
    goal: "锁定场景、服务商、资金方、合规边界。",
    outputs: [
      "scenario scope",
      "首批服务商名单",
      "funding path",
      "first-loss boundary draft",
    ],
    icon: Compass,
    accent: "cyan",
  },
  {
    id: "P2",
    label: "Phase 2",
    range: "W3-W6",
    title: "Pilot readiness",
    goal: "完成产品流程、风控、授权、对账，并完成 Go / No-Go 决策。",
    outputs: [
      "申请流程",
      "Sentinel review",
      "seller authorization",
      "payment / reconciliation path",
      "W6 decision pack",
    ],
    icon: Rocket,
    accent: "violet",
  },
  {
    id: "P3",
    label: "Phase 3",
    range: "W7-W10",
    title: "Controlled pilot",
    goal: "运行受控 case，收集审批、服务商反馈与风控漏斗。",
    outputs: [
      "case cohort",
      "approval SLA",
      "pass / supplement / reject funnel",
      "exception log",
      "repayment tracking",
    ],
    icon: ShieldCheck,
    accent: "emerald",
  },
  {
    id: "P4",
    label: "Phase 4",
    range: "W11-W12",
    title: "Evidence pack",
    goal: "形成 CEO dashboard 与 Second Close 融资材料。",
    outputs: [
      "cohort report",
      "single-case CM",
      "facility progress",
      "rev rec memo",
      "milestone mapping",
    ],
    icon: FileCheck2,
    accent: "amber",
  },
];

const APPENDIX_ACCENT: Record<
  AppendixAccent,
  {
    icon: React.CSSProperties;
    chip: React.CSSProperties;
    glow: string;
    bullet: string;
    code: string;
  }
> = {
  cyan: {
    icon: {
      background:
        "linear-gradient(135deg, rgba(34,211,238,0.45) 0%, rgba(91,135,255,0.35) 100%)",
      border: "1px solid rgba(34,211,238,0.5)",
    },
    chip: {
      background: "rgba(34,211,238,0.12)",
      borderColor: "rgba(34,211,238,0.4)",
      color: "#a7f3ff",
    },
    glow: "rgba(34,211,238,0.32)",
    bullet: "#22d3ee",
    code: "#a7f3ff",
  },
  violet: {
    icon: {
      background:
        "linear-gradient(135deg, rgba(167,87,255,0.4) 0%, rgba(91,135,255,0.35) 100%)",
      border: "1px solid rgba(167,87,255,0.5)",
    },
    chip: {
      background: "rgba(167,87,255,0.14)",
      borderColor: "rgba(167,87,255,0.45)",
      color: "#d6c2ff",
    },
    glow: "rgba(167,87,255,0.32)",
    bullet: "#a757ff",
    code: "#d6c2ff",
  },
  emerald: {
    icon: {
      background:
        "linear-gradient(135deg, rgba(16,185,129,0.4) 0%, rgba(34,211,238,0.3) 100%)",
      border: "1px solid rgba(16,185,129,0.5)",
    },
    chip: {
      background: "rgba(16,185,129,0.12)",
      borderColor: "rgba(16,185,129,0.4)",
      color: "#6ee7b7",
    },
    glow: "rgba(16,185,129,0.3)",
    bullet: "#10b981",
    code: "#6ee7b7",
  },
  amber: {
    icon: {
      background:
        "linear-gradient(135deg, rgba(245,166,35,0.4) 0%, rgba(255,91,176,0.32) 100%)",
      border: "1px solid rgba(245,166,35,0.5)",
    },
    chip: {
      background: "rgba(245,166,35,0.12)",
      borderColor: "rgba(245,166,35,0.4)",
      color: "#ffd187",
    },
    glow: "rgba(245,166,35,0.3)",
    bullet: "#f5a623",
    code: "#ffd187",
  },
};

interface DependencyRow {
  team: string;
  support: string;
  range: string;
  icon: LucideIcon;
}

const DEPENDENCY_ROWS: DependencyRow[] = [
  {
    team: "Product",
    support: "申请流程、状态机、dashboard",
    range: "W3-W6",
    icon: Layers,
  },
  {
    team: "RD",
    support: "账单、审计、对账、数据接口",
    range: "W4-W10",
    icon: Database,
  },
  {
    team: "Risk / Sentinel",
    support: "风控政策、审核规则、异常监控",
    range: "W2-W11",
    icon: ShieldCheck,
  },
  {
    team: "Finance",
    support: "CM、revenue recognition、bank share",
    range: "W3-W11",
    icon: Receipt,
  },
  {
    team: "Bank BD",
    support: "资金方 SLA、facility、审批反馈",
    range: "W2-W12",
    icon: Landmark,
  },
  {
    team: "Sales",
    support: "pilot case、服务商名单、复用反馈",
    range: "W1-W12",
    icon: Users,
  },
  {
    team: "Legal / Compliance",
    support: "first-loss、授权、对外口径",
    range: "W1-W12",
    icon: Scale,
  },
];

interface PromptCard {
  name: string;
  usage: string;
  input: string;
  output: string;
}

const PROMPT_CARDS: PromptCard[] = [
  {
    name: "12 周计划生成 prompt",
    usage: "把目标 / 约束 / 风险压缩成压缩版 4-phase 计划草稿。",
    input: "目标、约束、已知风险",
    output: "Phase 1-4 草稿 + 关键产出清单",
  },
  {
    name: "Product SPEC prompt",
    usage: "把功能描述翻译成产品 SPEC，便于 RD / Sentinel 评估。",
    input: "feature 描述、Constraints",
    output: "状态机、字段、风险点、Open Questions",
  },
  {
    name: "周报 prompt",
    usage: "把团队周更整理成 CEO 周报格式（成果 / 风险 / 决策）。",
    input: "团队周更原文",
    output: "本周成果、风险、需要拍板事项",
  },
  {
    name: "Claude / Codex handoff prompt",
    usage: "把上下文与代码改动一次性交接给 Claude / Codex，避免重复解释。",
    input: "目标、上次进度、已读文件",
    output: "可执行的开发 prompt + 文件清单",
  },
];

type EvidenceStatus = "pending" | "draft" | "review";

interface EvidenceItem {
  item: string;
  supports: string;
  owner: string;
  status: EvidenceStatus;
}

const EVIDENCE_BACKLOG: EvidenceItem[] = [
  {
    item: "case-level audit trail",
    supports: "M1 · Risk Monitoring",
    owner: "Product + RD",
    status: "pending",
  },
  {
    item: "seller authorization records",
    supports: "M1 · M9",
    owner: "Product + Legal",
    status: "pending",
  },
  {
    item: "service provider invoice template",
    supports: "M1 · pilot data",
    owner: "Product + Sales",
    status: "draft",
  },
  {
    item: "funding approval log",
    supports: "M2 · Facility",
    owner: "Bank BD + Ops",
    status: "pending",
  },
  {
    item: "repayment schedule",
    supports: "M1 · M5",
    owner: "Product + Finance",
    status: "draft",
  },
  {
    item: "exception / override log",
    supports: "M1 · Risk Monitoring",
    owner: "Sentinel + Ops",
    status: "pending",
  },
  {
    item: "Finance CM template",
    supports: "M5 · Contribution Margin",
    owner: "Finance",
    status: "draft",
  },
  {
    item: "revenue recognition memo",
    supports: "M8 · Revenue Recognition",
    owner: "Finance + Legal",
    status: "review",
  },
  {
    item: "first-loss responsibility matrix",
    supports: "M9 · First-loss Clean",
    owner: "CEO + Legal + Finance",
    status: "review",
  },
  {
    item: "external wording review checklist",
    supports: "Risk R5 · 对外口径",
    owner: "Legal + Comms",
    status: "pending",
  },
];

const EVIDENCE_STATUS_META: Record<
  EvidenceStatus,
  { label: string; chip: React.CSSProperties; icon: LucideIcon }
> = {
  pending: {
    label: "Pending",
    chip: {
      background: "rgba(245,166,35,0.12)",
      borderColor: "rgba(245,166,35,0.4)",
      color: "#ffd187",
    },
    icon: Clock4,
  },
  draft: {
    label: "Draft",
    chip: {
      background: "rgba(167,87,255,0.14)",
      borderColor: "rgba(167,87,255,0.45)",
      color: "#d6c2ff",
    },
    icon: FileText,
  },
  review: {
    label: "Required Review",
    chip: {
      background: "rgba(34,211,238,0.12)",
      borderColor: "rgba(34,211,238,0.4)",
      color: "#a7f3ff",
    },
    icon: CircleDot,
  },
};

function AppendixPage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="dow-console-panel relative overflow-hidden p-7 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-55 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(167,87,255,0.4), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full opacity-45 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(34,211,238,0.3), transparent)",
          }}
        />
        <div className="relative">
          <p className="dow-eyebrow dow-eyebrow-dot">
            APPENDIX · SUPPORTING DETAIL
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[32px] font-black leading-[1.08] tracking-tight text-white sm:text-[44px] lg:text-[52px]">
            执行细节收进{" "}
            <span className="dow-gradient-text">Appendix</span>，
            不抢 CEO 视角。
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[rgba(226,219,255,0.78)] sm:text-base">
            正文只保留 CEO 决策、融资证据、blocking risks；附录负责收纳 12 周计划、跨团队依赖、AI prompt、evidence backlog。
          </p>
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-[rgba(226,219,255,0.55)] sm:text-sm">
            Anchor 原则：Dowsure does not lend; Dowsure makes lending possible.
          </p>
        </div>
      </section>

      {/* Appendix A · 压缩版 12 周计划 */}
      <section className="space-y-4">
        <div className="flex items-end justify-between px-1">
          <div>
            <p className="dow-eyebrow dow-eyebrow-dot">
              APPENDIX A · 12-WEEK COMPRESSED PLAN
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
              压缩版 12 周计划 ·{" "}
              <span className="dow-gradient-text">4 个 Phase</span>
            </h2>
            <p className="mt-1 text-xs text-[rgba(226,219,255,0.6)] sm:text-sm">
              老板能看到节奏，不被每周任务淹没。
            </p>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.55)] sm:inline">
            4 phases · w1 → w12
          </span>
        </div>

        <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((p, idx) => {
            const Icon = p.icon;
            const a = APPENDIX_ACCENT[p.accent];
            return (
              <li
                key={p.id}
                className="dow-console-panel relative flex h-full flex-col overflow-hidden p-5"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-50 blur-3xl"
                  style={{
                    background: `radial-gradient(closest-side, ${a.glow}, transparent)`,
                  }}
                />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="dow-eyebrow">
                      <span style={{ color: a.code }}>{p.label}</span> ·{" "}
                      {p.range}
                    </p>
                    <h3 className="mt-1.5 font-display text-base font-bold tracking-tight text-white sm:text-lg">
                      {p.title}
                    </h3>
                  </div>
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                    style={a.icon}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <p className="relative mt-3 text-sm leading-relaxed text-[rgba(226,219,255,0.85)]">
                  <span className="dow-eyebrow text-[10px]">目标</span>
                  <br />
                  {p.goal}
                </p>

                <div className="relative mt-3">
                  <p className="dow-eyebrow text-[10px]">关键产出</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {p.outputs.map((o) => (
                      <li
                        key={o}
                        className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs text-[rgba(226,219,255,0.82)]"
                        style={{
                          background: "rgba(255,255,255,0.025)",
                          border: "1px solid rgba(180,150,255,0.12)",
                        }}
                      >
                        <CheckCircle2
                          className="mt-0.5 h-3 w-3 shrink-0"
                          style={{ color: a.bullet }}
                        />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <span className="relative mt-auto pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.45)]">
                  {String(idx + 1).padStart(2, "0")} / 04
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Appendix B · 跨团队依赖 */}
      <section className="dow-console-panel overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dow-eyebrow dow-eyebrow-dot">
              APPENDIX B · CROSS-TEAM DEPENDENCIES
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
              跨团队依赖
            </h2>
            <p className="mt-1 text-xs text-[rgba(226,219,255,0.6)] sm:text-sm">
              每个团队只一两行；不展开成大段。
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.6)] sm:self-auto">
            7 teams
          </span>
        </div>

        {/* 桌面表格 */}
        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-white/10 lg:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-white/[0.04] text-left">
                <Th>团队</Th>
                <Th>需要支持什么</Th>
                <Th>截止节点</Th>
              </tr>
            </thead>
            <tbody>
              {DEPENDENCY_ROWS.map((row, idx) => {
                const Icon = row.icon;
                return (
                  <tr
                    key={row.team}
                    className={
                      idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                    }
                  >
                    <Td>
                      <span className="inline-flex items-center gap-2 font-semibold text-white">
                        <Icon className="h-3.5 w-3.5 text-[rgba(226,219,255,0.7)]" />
                        {row.team}
                      </span>
                    </Td>
                    <Td className="text-[rgba(226,219,255,0.82)]">
                      {row.support}
                    </Td>
                    <Td>
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
                        style={{
                          background: "rgba(167,87,255,0.12)",
                          borderColor: "rgba(167,87,255,0.4)",
                          color: "#d6c2ff",
                        }}
                      >
                        {row.range}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 移动卡片 */}
        <ul className="mt-5 space-y-3 lg:hidden">
          {DEPENDENCY_ROWS.map((row) => {
            const Icon = row.icon;
            return (
              <li
                key={row.team}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-2 font-semibold text-white">
                    <Icon className="h-3.5 w-3.5 text-[rgba(226,219,255,0.7)]" />
                    {row.team}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{
                      background: "rgba(167,87,255,0.12)",
                      borderColor: "rgba(167,87,255,0.4)",
                      color: "#d6c2ff",
                    }}
                  >
                    {row.range}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[rgba(226,219,255,0.82)]">
                  {row.support}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Appendix C · AI Prompt Pack */}
      <section className="dow-console-panel overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{
                background:
                  "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
                boxShadow: "0 12px 28px -10px rgba(167,87,255,0.55)",
              }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="dow-eyebrow dow-eyebrow-dot">
                APPENDIX C · AI PROMPT PACK
              </p>
              <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-white sm:text-xl">
                AI Prompt Pack
              </h2>
              <p className="mt-1 text-xs text-[rgba(226,219,255,0.6)] sm:text-sm">
                AI prompt 是工具，不是 CEO 正文关注点。
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.6)] sm:self-auto">
            tools · not narrative
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {PROMPT_CARDS.map((p) => (
            <article key={p.name} className="dow-glass-card p-4 sm:p-5">
              <p className="dow-eyebrow">PROMPT</p>
              <h3 className="mt-1.5 font-display text-base font-semibold tracking-tight">
                <span className="dow-gradient-text">{p.name}</span>
              </h3>
              <KvRow label="用途">
                <span className="text-[rgba(226,219,255,0.85)]">{p.usage}</span>
              </KvRow>
              <KvRow label="输入">
                <code
                  className="rounded-md px-1.5 py-0.5 font-mono text-[11px] text-[#d6c2ff]"
                  style={{
                    background: "rgba(167,87,255,0.1)",
                    border: "1px solid rgba(167,87,255,0.25)",
                  }}
                >
                  {p.input}
                </code>
              </KvRow>
              <KvRow label="输出">
                <code
                  className="rounded-md px-1.5 py-0.5 font-mono text-[11px] text-[#a7f3ff]"
                  style={{
                    background: "rgba(34,211,238,0.08)",
                    border: "1px solid rgba(34,211,238,0.28)",
                  }}
                >
                  {p.output}
                </code>
              </KvRow>
            </article>
          ))}
        </div>
      </section>

      {/* Appendix D · Evidence Detail Backlog */}
      <section className="dow-console-panel overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dow-eyebrow dow-eyebrow-dot">
              APPENDIX D · EVIDENCE DETAIL BACKLOG
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Evidence Detail Backlog
            </h2>
            <p className="mt-1 text-xs text-[rgba(226,219,255,0.6)] sm:text-sm">
              不是正文重点，但后续可以作为证据细项展开。
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.6)] sm:self-auto">
            {EVIDENCE_BACKLOG.length} items
          </span>
        </div>

        {/* 桌面表格 */}
        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-white/10 lg:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-white/[0.04] text-left">
                <Th>Evidence item</Th>
                <Th>Supports</Th>
                <Th>Owner</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {EVIDENCE_BACKLOG.map((e, idx) => {
                const meta = EVIDENCE_STATUS_META[e.status];
                const SIcon = meta.icon;
                return (
                  <tr
                    key={e.item}
                    className={
                      idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                    }
                  >
                    <Td>
                      <span className="font-semibold text-white">{e.item}</span>
                    </Td>
                    <Td className="text-[rgba(226,219,255,0.78)]">
                      {e.supports}
                    </Td>
                    <Td className="text-[rgba(226,219,255,0.78)]">{e.owner}</Td>
                    <Td>
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
                        style={meta.chip}
                      >
                        <SIcon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 移动卡片 */}
        <ul className="mt-5 space-y-3 lg:hidden">
          {EVIDENCE_BACKLOG.map((e) => {
            const meta = EVIDENCE_STATUS_META[e.status];
            const SIcon = meta.icon;
            return (
              <li
                key={e.item}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{e.item}</p>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={meta.chip}
                  >
                    <SIcon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </div>
                <dl className="mt-3 space-y-2 text-xs text-[rgba(226,219,255,0.82)]">
                  <KV label="Supports">{e.supports}</KV>
                  <KV label="Owner">{e.owner}</KV>
                </dl>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Appendix Principle / Closing */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,91,176,0.16) 0%, rgba(167,87,255,0.16) 50%, rgba(91,135,255,0.16) 100%)",
          border: "1px solid rgba(167,87,255,0.45)",
          boxShadow: "0 0 0 1px rgba(167,87,255,0.2) inset",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{
              background:
                "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
              boxShadow: "0 12px 30px -10px rgba(167,87,255,0.6)",
            }}
          >
            <Compass className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="dow-eyebrow">APPENDIX PRINCIPLE</p>
            <p className="mt-2 text-sm leading-relaxed text-white sm:text-base">
              Appendix 证明团队有执行细节，但正文必须继续保持 CEO 决策视角。
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[rgba(226,219,255,0.7)] sm:text-sm">
              Anchor：Dowsure does not lend; Dowsure makes lending possible.
            </p>
          </div>
        </div>
      </section>

      {/* 底部导航 */}
      <section className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={`${DASHBOARD_BASE}/risks`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-[rgba(226,219,255,0.85)] transition hover:border-white/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          上一模块：Risks &amp; Decisions
        </a>
        <a href={DASHBOARD_BASE} className="dow-cta-primary">
          返回 Dashboard 目录
          <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </div>
  );
}

// ────────────────── 占位（其它 5 个模块） ──────────────────

function ModulePlaceholder({ module }: { module: DashboardModule }) {
  const Icon = module.icon;
  return (
    <section className="dow-glass-card relative overflow-hidden p-8 sm:p-10 lg:p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(167,87,255,0.42), transparent)",
        }}
      />
      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="dow-eyebrow dow-eyebrow-dot">{module.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl font-display text-[36px] font-black leading-[1.06] tracking-tight text-white sm:text-[48px]">
            {module.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[rgba(226,219,255,0.72)] sm:text-lg">
            {module.desc}
          </p>
          <p className="mt-4 text-sm text-[rgba(226,219,255,0.5)]">
            这是模块占位页。后续将按 CEO dashboard 结构填入表格、KPI 卡、流程图或风险决策卡。
          </p>
        </div>
        <div className="dow-console-panel p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] text-[#a7f3ff]">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.5)]">
                Route
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {module.path}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────── helpers ──────────────────

function StatusChip({ status }: { status: GateStatus }) {
  const meta = GATE_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.18em] ${meta.chip}`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgba(226,219,255,0.55)]">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`border-t border-white/[0.06] px-4 py-3 align-top text-sm ${className}`}
    >
      {children}
    </td>
  );
}

function KV({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(226,219,255,0.5)]">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-[rgba(226,219,255,0.85)]">
        {children}
      </dd>
    </div>
  );
}
