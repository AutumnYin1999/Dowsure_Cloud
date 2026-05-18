import { ArrowUpRight, Headphones, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "matrix", label: "权益矩阵" },
  { key: "center", label: "赋能中心" },
  { key: "eco", label: "生态圈" },
];

interface SiteHeaderProps {
  /** 当前激活的 tab,由顶部页面状态决定。 */
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

export function SiteHeader({
  activeTab = "matrix",
  onTabChange,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-line/70 bg-white/85 backdrop-blur">
      <div className="container flex h-16 max-w-6xl items-center justify-between gap-3">
        {/* logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-pop">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-ink">
              豆服云{" "}
              <span className="ml-0.5 text-xs font-medium text-ink-soft">
                / Dowsure Cloud
              </span>
            </p>
            <p className="text-[11px] text-ink-soft">服务商增长引擎</p>
          </div>
        </div>

        {/* tabs */}
        <nav className="hidden items-center gap-1 rounded-full border border-surface-line bg-white p-1 shadow-soft md:flex">
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange?.(tab.key)}
                className={cn("ds-tab", active && "ds-tab-active")}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* right side —— 未登录状态:只保留联系商务入口 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ds-focus inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-3.5 py-1.5 text-xs font-semibold text-white shadow-pop transition-transform hover:-translate-y-0.5"
          >
            <Headphones className="h-3.5 w-3.5" />
            1v1 商务
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-surface-line bg-white">
      <div className="container max-w-6xl py-6 text-center text-[11px] text-ink-soft">
        <p>
          豆服云 · 服务商增长引擎 · demo 版本 · 推荐逻辑由本地规则引擎 + mock
          agent 产生
        </p>
        <p className="mt-1">
          线上正式版本将由 RAG 检索 + LLM Agent 接管推荐推理链路
        </p>
      </div>
    </footer>
  );
}

interface FloatingCTAProps {
  onClick?: () => void;
  /** 主按钮文案。 */
  label: string;
  /** 上方副气泡文案。 */
  hint?: string;
}

/**
 * 右下角悬浮 CTA —— 对齐设计稿:
 *   - 上方一个白底气泡 "联系专属商务经理"
 *   - 下方一个玫红 pill "升级 / 购买权益"
 */
export function FloatingCTA({ onClick, label, hint }: FloatingCTAProps) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 sm:bottom-7 sm:right-7">
      {hint ? (
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-surface-line bg-white px-3.5 py-1.5 text-xs font-medium text-ink shadow-soft">
          <Star className="h-3.5 w-3.5 text-brand-500" />
          {hint}
        </div>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto ds-focus inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-pop transition-transform hover:-translate-y-0.5"
      >
        {label}
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>
  );
}
