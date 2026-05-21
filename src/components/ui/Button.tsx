import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "subtle"
  | "gradient"
  | "darkOutline"
  | "darkGhost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
  secondary:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200",
  ghost: "bg-transparent text-ink hover:bg-surface-line/60",
  outline:
    "border border-surface-line bg-white text-ink hover:bg-surface-alt",
  subtle: "bg-ink/5 text-ink hover:bg-ink/10",
  // 粉紫蓝渐变主 CTA（深色风格首选）
  gradient:
    "text-white shadow-[0_10px_30px_-8px_rgba(167,87,255,0.55)] hover:translate-y-[-1px] transition-transform " +
    "bg-[linear-gradient(120deg,#ff5bb0_0%,#a757ff_50%,#5b87ff_100%)]",
  // 深色 outline / ghost
  darkOutline:
    "text-white hover:bg-white/[0.08] " +
    "bg-white/[0.04] border border-[rgba(180,150,255,0.22)] hover:border-[rgba(180,150,255,0.4)]",
  darkGhost:
    "text-[rgba(226,219,255,0.85)] hover:text-white hover:bg-white/[0.05] bg-transparent",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", type = "button", ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "ds-focus inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...rest}
      />
    );
  }
);
