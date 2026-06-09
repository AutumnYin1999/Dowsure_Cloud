import { useEffect, useState } from "react";
import { ArrowUpRight, Home, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  /** 提供后会显示「返回首页」按钮，并让 logo 可点击。 */
  onHome?: () => void;
  /** 「进入控制台」按钮点击（默认进入卖家智能服务台）。 */
  onEnterConsole?: () => void;
  /** 顶部「面向卖家」导航点击 → 卖家智能服务台。 */
  onSellerEntry?: () => void;
  /** 顶部「面向服务商」导航点击 → 服务商问卷。 */
  onProviderEntry?: () => void;
}

export function SiteHeader({
  onHome,
  onEnterConsole,
  onSellerEntry,
  onProviderEntry,
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 16);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const logoContent = (
    <>
      <div
        className="relative h-[22px] w-[22px] shrink-0 rounded-md"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, #EC4899 0%, #8B5CF6 40%, #6366F1 75%, transparent 80%)",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-md"
          style={{
            background:
              "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 24%)",
          }}
        />
      </div>
      <div className="flex items-baseline gap-1.5 leading-tight">
        <p className="text-[16px] font-semibold tracking-tight text-white">
          豆服 DF
        </p>
        <span className="text-[11px] font-medium text-[color:var(--fg-faint)]">
          by 豆沙包
        </span>
      </div>
    </>
  );

  return (
    <header
      className={cn(
        "dow-nav fixed inset-x-0 top-0 z-30",
        scrolled && "dow-nav-scrolled"
      )}
    >
      <div className="container flex h-16 max-w-6xl items-center justify-between gap-3">
        {/* logo — onHome 提供时可点击返回 */}
        {onHome ? (
          <button
            type="button"
            onClick={onHome}
            className="flex items-center gap-2.5 rounded-xl transition-opacity hover:opacity-80"
            aria-label="返回首页"
          >
            {logoContent}
          </button>
        ) : (
          <div className="flex items-center gap-2.5">{logoContent}</div>
        )}

        {/* center links */}
        <nav className="hidden items-center gap-7 md:flex">
          <button
            type="button"
            onClick={onSellerEntry}
            className="text-sm font-normal text-[color:var(--fg-mute)] transition-colors hover:text-white"
          >
            面向卖家
          </button>
          <button
            type="button"
            onClick={onProviderEntry}
            className="text-sm font-normal text-[color:var(--fg-mute)] transition-colors hover:text-white"
          >
            面向服务商
          </button>
        </nav>

        {/* right side */}
        <div className="flex items-center gap-4">
          {onHome ? (
            <button
              type="button"
              onClick={onHome}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--fg-mute)] transition-colors hover:text-white"
            >
              <Home className="h-3.5 w-3.5" />
              返回首页
            </button>
          ) : null}
          <button
            type="button"
            onClick={onEnterConsole}
            className="dow-cta-primary !px-4 !py-2 text-sm"
          >
            进入服务商中心
            <span aria-hidden>→</span>
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
