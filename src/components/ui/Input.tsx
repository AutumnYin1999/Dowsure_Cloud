import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "ds-focus w-full rounded-xl border border-surface-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft transition-colors hover:border-brand-200 focus:border-brand-500",
        className
      )}
      {...rest}
    />
  );
});
