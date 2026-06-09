import {
  ArrowLeft,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock,
  CreditCard,
  Download,
  Flame,
  Headphones,
  Home,
  Image as ImageIcon,
  LogOut,
  MessageSquarePlus,
  QrCode,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import "./provider-console.css";

interface ServiceStatusPageProps {
  /** 返回首页。 */
  onHome: () => void;
}

/* ───────────────────────── mock 数据 ───────────────────────── */

type FulfillStatus = "done" | "active" | "pending";

interface TimelineEvent {
  time: string;
  text: string;
}

interface FulfillItem {
  id: string;
  name: string;
  category: string;
  status: FulfillStatus;
  progress: number; // 0-100
  milestone: string;
  owner: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

const ACCOUNT = {
  company: "环邦海外仓（演示账户）",
  plan: "TermPay 账期金融赋能组合",
  orderNo: "DF-20260530-8721",
  orderDate: "2026-05-30",
  status: "合作中" as const,
};

const FULFILL_ITEMS: FulfillItem[] = [
  {
    id: "base-package",
    name: "豆服云基础包",
    category: "必选 · 基础底座",
    status: "done",
    progress: 100,
    milestone: "已配置上线 · 展示位已生效",
    owner: "对接顾问 · 林悦",
    updatedAt: "2026-05-31 10:22",
    timeline: [
      { time: "05-30 18:40", text: "订单确认，基础包开通流程启动" },
      { time: "05-31 09:15", text: "平台展示位已配置" },
      { time: "05-31 10:22", text: "AI 拓客启航版账号已开通，展示位上线" },
    ],
  },
  {
    id: "growth-leadgen-plus",
    name: "AI 智能拓客跃升版",
    category: "获客增长",
    status: "active",
    progress: 45,
    milestone: "已推送 36 / 80 份卖家分析报告",
    owner: "增长运营 · 周航",
    updatedAt: "2026-06-04 16:08",
    timeline: [
      { time: "06-01 11:00", text: "拓客跃升版数据权限开通" },
      { time: "06-02 14:30", text: "首批 20 份卖家画像报告已推送" },
      { time: "06-04 16:08", text: "累计推送 36 份，销售工单已同步" },
    ],
  },
  {
    id: "value-embed-finance",
    name: "TermPay 嵌入式接入端口",
    category: "增值服务",
    status: "active",
    progress: 60,
    milestone: "技术联调中 · 沙箱已打通",
    owner: "解决方案 · 陈默",
    updatedAt: "2026-06-05 09:40",
    timeline: [
      { time: "06-02 10:00", text: "技术联调启动，分配接入文档与沙箱密钥" },
      { time: "06-04 15:20", text: "官网嵌入入口联调通过（沙箱）" },
      { time: "06-05 09:40", text: "ERP 回调对接中，预计本周完成生产环境切换" },
    ],
  },
  {
    id: "value-risk-model",
    name: "TermPay 账期风控模型",
    category: "增值服务",
    status: "active",
    progress: 30,
    milestone: "数据接入中 · 历史账单已导入",
    owner: "风控 · 苏黎",
    updatedAt: "2026-06-03 17:55",
    timeline: [
      { time: "06-02 13:10", text: "风控模型接入申请通过" },
      { time: "06-03 17:55", text: "历史账单数据已导入，模型校准排期中" },
    ],
  },
  {
    id: "value-platform-sync",
    name: "平台政策同步 + 1v1 商务",
    category: "增值服务",
    status: "done",
    progress: 100,
    milestone: "专属商务已对接 · 政策订阅已开通",
    owner: "商务 · 何琳",
    updatedAt: "2026-06-01 11:30",
    timeline: [
      { time: "05-31 14:00", text: "专属 1v1 商务对接人已分配" },
      { time: "06-01 11:30", text: "亚马逊政策同步订阅已开通" },
    ],
  },
  {
    id: "premium-resource-salon",
    name: "平台资源对接私享会",
    category: "升级尊享 · 满额解锁",
    status: "pending",
    progress: 0,
    milestone: "待排期 · 下一场私享会名额预留中",
    owner: "活动 · 待分配",
    updatedAt: "2026-05-31 10:25",
    timeline: [{ time: "05-31 10:25", text: "满额权益已解锁，等待下一场私享会排期" }],
  },
  {
    id: "growth-bigseller-tour",
    name: "大卖有约 & 游学考察",
    category: "获客增长",
    status: "pending",
    progress: 0,
    milestone: "待启动 · 需确认承办时间与目标画像",
    owner: "活动 · 待分配",
    updatedAt: "2026-05-31 10:25",
    timeline: [{ time: "05-31 10:25", text: "已加入方案，等待与你确认承办细节" }],
  },
  {
    id: "gift-hk-account",
    name: "香港企业开户服务",
    category: "默认赠送",
    status: "done",
    progress: 100,
    milestone: "绿色通道已开通 · 材料清单已发送",
    owner: "顾问 · 林悦",
    updatedAt: "2026-06-02 09:10",
    timeline: [
      { time: "06-01 16:00", text: "香港开户绿色通道已开通" },
      { time: "06-02 09:10", text: "开户材料清单已发送至联系人" },
    ],
  },
];

const GLOBAL_TIMELINE: TimelineEvent[] = [
  { time: "06-05 09:40", text: "TermPay 嵌入端口 ERP 回调对接中" },
  { time: "06-04 16:08", text: "AI 拓客已累计推送 36 / 80 份报告" },
  { time: "06-02 09:10", text: "香港企业开户材料清单已发送" },
  { time: "06-01 11:30", text: "专属商务已对接，平台政策订阅开通" },
  { time: "05-31 10:22", text: "基础包配置完成，展示位上线" },
  { time: "05-30 18:40", text: "订单 DF-20260530-8721 提交成功" },
];

const STATUS_META: Record<
  FulfillStatus,
  { label: string; chip: string; bar: string; icon: LucideIcon }
> = {
  done: {
    label: "已完成",
    chip: "border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.12)] text-[#34D399]",
    bar: "#34D399",
    icon: CheckCircle2,
  },
  active: {
    label: "进行中",
    chip: "border-[rgba(245,166,35,0.4)] bg-[rgba(245,166,35,0.12)] text-[#F5A623]",
    bar: "#F5A623",
    icon: CircleDot,
  },
  pending: {
    label: "待启动",
    chip: "border-[color:var(--border-2)] bg-white/[0.04] text-[color:var(--fg-mute)]",
    bar: "#5A5A6A",
    icon: Clock,
  },
};

/* ───────────────────────── 本月热门资源（轮播） ───────────────────────── */

interface HotResource {
  title: string;
  badge: string;
  tone: keyof typeof TONE;
  desc: string;
  date: string;
}

/** 徽标配色 + 卡片左侧色条（用默认 Tailwind 调色板，和站点紫调协调）。 */
const TONE = {
  violet: { badge: "bg-violet-500/15 text-violet-300", bar: "#8b5cf6" },
  rose: { badge: "bg-rose-500/15 text-rose-300", bar: "#f43f5e" },
  amber: { badge: "bg-amber-500/15 text-amber-300", bar: "#f59e0b" },
  emerald: { badge: "bg-emerald-500/15 text-emerald-300", bar: "#10b981" },
  cyan: { badge: "bg-cyan-500/15 text-cyan-300", bar: "#06b6d4" },
} as const;

const HOT_RESOURCES: HotResource[] = [
  { title: "财税合规专题讲座", badge: "专家主讲", tone: "violet", desc: "金税四期下跨境电商税务合规攻略，香港与海外税务架构搭建实战分享。", date: "2026.07.12" },
  { title: "大卖有约 · 深圳站", badge: "剩 3 席", tone: "rose", desc: "与亿级卖家面对面交流，深度对接合作机会，分享最新行业趋势与运营技巧。", date: "2026.06.15" },
  { title: "香港跨境电商加速器", badge: "限定会员", tone: "violet", desc: "银企对接会，香港银行官方团队主持。了解最新金融政策，对接银行资源。", date: "2026.06.20" },
  { title: "高才通 A 类申请绿色通道", badge: "限时 7 折", tone: "amber", desc: "市场价 8 万元，豆服云专属价 3 万元。快速获取香港身份，享受全球资源。", date: "截止 2026.06.30" },
  { title: "Walmart 招商对接会", badge: "免费参与", tone: "emerald", desc: "Walmart 官方招商团队亲临现场，解读入驻政策，快速开通店铺绿色通道。", date: "2026.07.05" },
  { title: "Amazon 平台私享会", badge: "T0/T1 专属", tone: "cyan", desc: "Amazon 官方团队面对面，获取一手政策信息。了解平台最新规则与发展方向。", date: "2026.06.27" },
];

/** 单张资源卡。 */
function HotCard({ res, onSignup }: { res: HotResource; onSignup: (title: string) => void }) {
  const tone = TONE[res.tone];
  return (
    <div
      className="flex h-full flex-col rounded-xl border-l-4 bg-[color:var(--bg-3)] p-5 transition-shadow hover:shadow-[0_8px_30px_rgba(139,92,246,0.18)]"
      style={{ borderLeftColor: tone.bar }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white">{res.title}</h3>
        <span className={cn("shrink-0 rounded px-2 py-0.5 text-xs font-medium", tone.badge)}>{res.badge}</span>
      </div>
      <p className="mb-4 flex-grow text-sm leading-relaxed text-[color:var(--fg-mute)]">{res.desc}</p>
      <div className="mt-auto flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs text-[color:var(--fg-faint)]">
          <Clock className="h-3 w-3" />
          {res.date}
        </span>
        <button
          type="button"
          onClick={() => onSignup(res.title)}
          className="dow-cta-primary !rounded-lg !px-3 !py-1 text-xs"
        >
          立即报名
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── 报名二维码弹窗 ───────────────────────── */

function QrModal({
  title,
  desc,
  eyebrow,
  footer,
  onClose,
}: {
  title: string;
  desc: string;
  eyebrow: string;
  footer: string;
  onClose: () => void;
}) {
  return (
    <div className="qr-overlay" onClick={onClose}>
      <div className="qr-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute right-3 top-3 text-[color:var(--fg-mute)] transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="dow-eyebrow dow-eyebrow-dot">{eyebrow}</span>
        <h3 className="mt-2 font-display text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-[color:var(--fg-mute)]">{desc}</p>
        <div className="qr-frame mt-4">
          <span className="px-5 text-xs text-[color:var(--fg-faint)]">
            二维码图片请放在 <code>public/signup-qr.png</code>
          </span>
          <img
            src="/signup-qr.png"
            alt={`${title} 二维码`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[color:var(--fg-faint)]">
          <QrCode className="h-3.5 w-3.5" />
          {footer}
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── 提交需求 / 反馈弹窗 ───────────────────────── */

function FeedbackModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="qr-overlay" onClick={onClose}>
      <div className="qr-card !max-w-[460px] !text-left" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute right-3 top-3 text-[color:var(--fg-mute)] transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="dow-eyebrow dow-eyebrow-dot">FEEDBACK · 需求 / 反馈</span>
        <h3 className="mt-2 font-display text-lg font-semibold text-white">提交需求 / 反馈</h3>
        <p className="mt-1 text-sm text-[color:var(--fg-mute)]">
          说说你的需求或遇到的问题，专属顾问会尽快跟进对接。
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="例如：想申请 Banner 续期 / 咨询豆分期额度 / 报名深圳站大卖有约…"
          className="mt-4 w-full resize-none rounded-lg border border-[color:var(--border-2)] bg-[color:var(--bg-3)] p-3 text-sm text-[color:var(--fg-dim)] placeholder:text-[color:var(--fg-faint)] focus:border-[color:var(--violet)] focus:outline-none"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="darkGhost" size="md" onClick={onClose}>
            取消
          </Button>
          <Button variant="gradient" size="md" disabled={!text.trim()} onClick={() => onSubmit(text.trim())}>
            提交需求
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 主组件 ───────────────────────── */

export function ServiceStatusPage({ onHome }: ServiceStatusPageProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  // 二维码弹窗：null = 关闭；对象 = 当前弹窗的标题/文案（报名 or 联系顾问共用）。
  const [qrModal, setQrModal] = useState<{
    title: string;
    desc: string;
    eyebrow: string;
    footer: string;
  } | null>(null);
  // 提交需求 / 反馈弹窗。
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // 报名：扫码 + 备注资源名锁名额。
  const openSignup = (title: string) =>
    setQrModal({
      title,
      desc: `微信扫码联系专属顾问，备注「${title}」即可锁定名额`,
      eyebrow: "SIGN UP · 报名预约",
      footer: "演示用途 · 扫码后由顾问人工跟进报名",
    });
  // 联系顾问：扫码加专属顾问。
  const openContact = () =>
    setQrModal({
      title: "联系专属顾问",
      desc: "微信扫码即可添加你的专属顾问，1 对 1 在线解答与对接。",
      eyebrow: "CONTACT · 专属顾问",
      footer: "演示用途 · 扫码后由顾问人工对接",
    });

  if (!loggedIn) {
    return <LoginCard onLogin={() => setLoggedIn(true)} onHome={onHome} />;
  }

  const quickActions: { icon: LucideIcon; label: string; onClick: () => void }[] = [
    {
      icon: Download,
      label: "下载权益清单",
      onClick: () => {
        // 下载 public/dowfu-benefits.pdf（源自 豆服云内容细则·对服务商版），下载名用中文。
        const a = document.createElement("a");
        a.href = "/dowfu-benefits.pdf";
        a.download = "豆服云内容细则（对服务商版）.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast("权益清单已开始下载");
      },
    },
    {
      icon: ImageIcon,
      label: "申请 Banner 续期",
      onClick: () =>
        setQrModal({
          title: "申请 Banner 续期",
          desc: "微信扫码联系专属顾问，备注「Banner 续期」即可办理续约。",
          eyebrow: "RENEW · 权益续期",
          footer: "演示用途 · 扫码后由顾问人工办理",
        }),
    },
    { icon: CalendarPlus, label: "活动报名", onClick: () => openSignup("活动报名") },
    {
      icon: CalendarClock,
      label: "分析账期情况",
      onClick: () => {
        // 跳到服务商诊断 Agent（/provider-agent）做账期 / 现金流分析，沿用 App 的手写路由。
        window.history.pushState(null, "", "/provider-agent");
        window.dispatchEvent(new PopStateEvent("popstate"));
      },
    },
    {
      icon: CreditCard,
      label: "豆分期申请",
      onClick: () => window.open("https://www.dowsure.com/dowpl/", "_blank", "noopener,noreferrer"),
    },
    { icon: Headphones, label: "联系顾问", onClick: openContact },
  ];

  const counts = {
    done: FULFILL_ITEMS.filter((i) => i.status === "done").length,
    active: FULFILL_ITEMS.filter((i) => i.status === "active").length,
    pending: FULFILL_ITEMS.filter((i) => i.status === "pending").length,
  };

  return (
    <div className="space-y-5">
      {/* 账户概览 */}
      <section className="dow-console-panel relative overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.28), transparent)" }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="dow-eyebrow dow-eyebrow-dot">SERVICE CONSOLE · 服务进度</span>
            <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-white sm:text-[32px]">
              {ACCOUNT.company}
            </h2>
            <p className="mt-1.5 text-sm text-[color:var(--fg-dim)]">
              {ACCOUNT.plan}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--fg-mute)]">
              <MetaChip>订单号 · {ACCOUNT.orderNo}</MetaChip>
              <MetaChip>下单 · {ACCOUNT.orderDate}</MetaChip>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.12)] px-2.5 py-1 font-medium text-[#34D399]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                {ACCOUNT.status}
              </span>
            </div>
          </div>
          <Button variant="darkGhost" size="sm" onClick={() => setLoggedIn(false)}>
            <LogOut className="h-3.5 w-3.5" />
            退出登录
          </Button>
        </div>

        {/* KPI */}
        <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="已开通权益" value={counts.done} tone="done" />
          <Kpi label="进行中" value={counts.active} tone="active" />
          <Kpi label="待启动" value={counts.pending} tone="pending" />
          <Kpi label="本期方案总额" value="¥30.8万" tone="amount" />
        </div>
      </section>

      {/* 本月热门资源 · 无缝轮播 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">本月热门资源</h2>
          </div>
          <button
            type="button"
            onClick={() => showToast("已为你展开全部热门资源（演示）")}
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-400 transition-colors hover:text-white"
          >
            查看全部
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="hot-carousel">
          <div className="hot-track">
            {[...HOT_RESOURCES, ...HOT_RESOURCES].map((res, i) => (
              <div className="hot-item" key={`${res.title}-${i}`}>
                <HotCard res={res} onSignup={openSignup} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 快速操作 */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">快速操作</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.label}
                type="button"
                onClick={qa.onClick}
                className="dow-glass-card flex flex-col items-center gap-3 p-5 text-center transition-transform hover:-translate-y-0.5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-lg border border-violet-500/30 bg-violet-500/15">
                  <Icon className="h-5 w-5 text-violet-300" />
                </span>
                <span className="text-sm font-medium text-[color:var(--fg-dim)]">{qa.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* 权益履约列表 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[color:var(--violet)]" />
            <span className="text-lg font-semibold text-white">权益履约进度</span>
          </div>
          <div className="space-y-3">
            {FULFILL_ITEMS.map((item) => (
              <FulfillCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* 右侧：时间线 + 支持入口 */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <section className="dow-glass-card p-5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[color:var(--violet)]" />
              <span className="text-base font-semibold text-white">最新动态</span>
            </div>
            <ol className="mt-4 space-y-3">
              {GLOBAL_TIMELINE.map((ev, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 rounded-full",
                        i === 0 ? "bg-[#34D399]" : "bg-[color:var(--border-2)]"
                      )}
                    />
                    {i < GLOBAL_TIMELINE.length - 1 ? (
                      <span className="mt-1 w-px flex-1 bg-[color:var(--border)]" />
                    ) : null}
                  </div>
                  <div className="pb-1">
                    <p className="font-mono text-[11px] text-[color:var(--fg-faint)]">{ev.time}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[color:var(--fg-dim)]">
                      {ev.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="dow-glass-card p-5">
            <span className="text-base font-semibold text-white">服务支持</span>
            <p className="mt-1.5 text-xs text-[color:var(--fg-mute)]">
              有任何问题，随时联系你的专属顾问。
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="gradient" size="md" onClick={openContact}>
                <Headphones className="h-4 w-4" />
                联系我的顾问
              </Button>
              <Button variant="darkOutline" size="md" onClick={() => setFeedbackOpen(true)}>
                <MessageSquarePlus className="h-4 w-4" />
                提交需求 / 反馈
              </Button>
            </div>
            <div className="mt-4 flex items-center gap-1.5 border-t border-[color:var(--border)] pt-3 text-xs text-[color:var(--fg-faint)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#34D399]" />
              履约数据仅你与对接团队可见
            </div>
          </section>

          <Button variant="darkGhost" size="md" onClick={onHome} className="!w-full">
            <Home className="h-4 w-4" />
            返回首页
          </Button>
        </aside>
      </div>

      {qrModal ? (
        <QrModal
          title={qrModal.title}
          desc={qrModal.desc}
          eyebrow={qrModal.eyebrow}
          footer={qrModal.footer}
          onClose={() => setQrModal(null)}
        />
      ) : null}
      {feedbackOpen ? (
        <FeedbackModal
          onClose={() => setFeedbackOpen(false)}
          onSubmit={() => {
            setFeedbackOpen(false);
            showToast("已记录，后续会有专人与你对接");
          }}
        />
      ) : null}
    </div>
  );
}

/* ───────────────────────── 登录占位 ───────────────────────── */

function LoginCard({ onLogin, onHome }: { onLogin: () => void; onHome: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  const sendCode = () => {
    if (countdown > 0) return;
    showToast("验证码已发送（演示环境，任意输入即可）");
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-md py-6">
      <button
        type="button"
        onClick={onHome}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[color:var(--fg-mute)] transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回首页
      </button>
      <section className="dow-console-panel p-6 sm:p-8">
        <span className="dow-eyebrow dow-eyebrow-dot">SERVICE LOGIN · 服务查询</span>
        <h2 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-white">
          登录查看<span className="dow-gradient-text">服务进度</span>
        </h2>
        <p className="mt-1.5 text-sm text-[color:var(--fg-mute)]">
          演示环境，输入任意手机号即可查看示例账户。
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">手机号</label>
            <input
              className="dow-dark-input dow-focus"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              inputMode="tel"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white">验证码</label>
            <div className="flex gap-2">
              <input
                className="dow-dark-input dow-focus flex-1"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入验证码"
                inputMode="numeric"
              />
              <Button
                variant="darkOutline"
                size="md"
                onClick={sendCode}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s 后重发` : "获取验证码"}
              </Button>
            </div>
          </div>
          <Button variant="gradient" size="md" onClick={onLogin} className="!w-full">
            登录并查看服务进度
          </Button>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-[color:var(--fg-faint)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#34D399]" />
          演示用途，不会真实发送短信或校验身份
        </p>
      </section>
    </div>
  );
}

/* ───────────────────────── 子组件 ───────────────────────── */

function FulfillCard({ item }: { item: FulfillItem }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[item.status];
  const StatusIcon = meta.icon;

  return (
    <div className="dow-glass-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold tracking-tight text-white sm:text-base">
              {item.name}
            </h3>
            <span className="rounded-full border border-[color:var(--border-2)] bg-[color:var(--bg-3)] px-2 py-0.5 text-[11px] text-[color:var(--fg-mute)]">
              {item.category}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-[color:var(--fg-dim)]">{item.milestone}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            meta.chip
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {meta.label}
        </span>
      </div>

      {/* 进度条 */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color:var(--bg-3)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${item.progress}%`, background: meta.bar }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[color:var(--fg-mute)]">
        <span>{item.owner}</span>
        <span className="font-mono text-[color:var(--fg-faint)]">更新 {item.updatedAt}</span>
      </div>

      {/* 执行明细 */}
      <div className="mt-3 border-t border-[color:var(--border)] pt-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={open}
        >
          <span className="text-xs font-medium text-[#C4B5FD]">执行明细 · {item.timeline.length} 条</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[color:var(--fg-faint)] transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
        {open ? (
          <ol className="mt-3 space-y-2.5">
            {item.timeline.map((ev, i) => (
              <li key={i} className="flex gap-2.5 text-xs">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--violet)]" />
                <div>
                  <span className="font-mono text-[color:var(--fg-faint)]">{ev.time}</span>
                  <span className="ml-2 text-[color:var(--fg-dim)]">{ev.text}</span>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "done" | "active" | "pending" | "amount";
}) {
  const color =
    tone === "done"
      ? "#34D399"
      : tone === "active"
      ? "#F5A623"
      : tone === "amount"
      ? undefined
      : "var(--fg-mute)";
  return (
    <div className="dow-kpi-card">
      <p className="text-xs text-[color:var(--fg-mute)]">{label}</p>
      <p className="mt-1 font-display text-2xl font-black leading-none">
        {tone === "amount" ? (
          <span className="dow-gradient-text">{value}</span>
        ) : (
          <span style={{ color }}>{value}</span>
        )}
      </p>
    </div>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium"
      style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--border-2)", color: "var(--fg-dim)" }}
    >
      {children}
    </span>
  );
}
