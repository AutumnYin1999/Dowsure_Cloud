import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-ink",
        className
      )}
      {...rest}
    />
  );
}

export function FieldHelp({
  className,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1.5 text-xs text-ink-soft", className)}
      {...rest}
    />
  );
}
