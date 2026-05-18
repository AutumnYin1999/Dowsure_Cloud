import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-card", className)} {...rest} />;
}

export function CardHeader({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-b border-surface-line px-5 py-4 sm:px-6 sm:py-5",
        className
      )}
      {...rest}
    />
  );
}

export function CardTitle({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <h3
      className={cn("text-base font-semibold tracking-tight text-ink", className)}
      {...rest}
    />
  );
}

export function CardDescription({
  className,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 text-sm text-ink-muted leading-relaxed", className)}
      {...rest}
    />
  );
}

export function CardBody({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-5 sm:px-6 sm:py-6", className)} {...rest} />;
}

export function CardFooter({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-t border-surface-line px-5 py-4 sm:px-6 sm:py-5",
        className
      )}
      {...rest}
    />
  );
}
