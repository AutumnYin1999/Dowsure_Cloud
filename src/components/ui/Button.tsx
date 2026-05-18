import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "subtle";
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
