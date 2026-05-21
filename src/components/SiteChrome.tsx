import { ArrowUpRight, Headphones, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "matrix", label: "权益矩阵" },
  { key: "center", label: "赋能中心" },
  { key: "eco", label: "生态圈" },
];

interface SiteHeaderProps {
  /** 当前激活的 tab，由顶部页面状态决定。 */
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

export function SiteHeader({
  activeTab = "matrix",
  onTabChange,
}: SiteHeaderProps) {
  return (
    <header className="dow-nav sticky top-0 z-30">
      <div className="container flex h-16 max-w-6xl items-center justify-between gap-3">
        {/* logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{
              background:
                "linear-gradient(135deg, #ff5bb0 0%, #a757ff 55%, #5b87ff 100%)",
              boxShadow:
                "0 8px 24px -6px rgba(167, 87, 255, 0.55), inset 0 0 0 1px rgba(255,255,255,0.18)",
            }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-white">
              豆服云{" "}
              <span className="ml-0.5 text-xs font-medium text-[rgba(226,219,255,0.55)]">
                / Dowsure Cloud
              </span>
            </p>
            <p className="text-[11px] text-[rgba(226,219,255,0.5)]">
              Provider OS · TermPay
            </p>
          </div>
        </div>

        {/* tabs */}
        <nav
          className="hidden items-center gap-1 rounded-full p-1 md:flex"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(180,150,255,0.16)",
          }}
        >
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange?.(tab.key)}
                className={cn(
                  "dow-nav-link",
                  active && "dow-nav-link-active"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* right side */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="dow-cta-primary !px-3.5 !py-1.5 text-xs"
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
    <footer className="dow-divider">
      <div className="container max-w-6xl py-6 text-center text-[11px] text-[rgba(226,219,255,0.55)]">
        <p>
          豆服云 · TermPay 服务商增长引擎 · demo 版本 · 推荐由本地规则引擎 + mock agent 产生
        </p>
        <p className="mt-1">
          合规说明：Dowsure 提供技术、数据、风控与连接能力；资金和最终审批由合作银行 / 资金方承担。
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
 * 右下角悬浮 CTA —— 深色版：
 *   - 上方一个玻璃气泡 hint
 *   - 下方一个粉紫蓝渐变 pill
 */
export function FloatingCTA({ onClick, label, hint }: FloatingCTAProps) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 sm:bottom-7 sm:right-7">
      {hint ? (
        <div
          className="pointer-events-auto flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-white"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(180,150,255,0.22)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <Star className="h-3.5 w-3.5 text-[#ff5bb0]" />
          {hint}
        </div>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        className="dow-cta-primary pointer-events-auto"
      >
        {label}
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>
  );
}
