import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 0,
});

export function formatCNY(amount: number): string {
  return `￥${CURRENCY_FORMATTER.format(amount)}`;
}

export function formatCNYShort(amount: number): string {
  if (amount >= 10_000) {
    const wan = amount / 10_000;
    const text =
      wan >= 10 ? wan.toFixed(0) : wan.toFixed(wan % 1 === 0 ? 0 : 1);
    return `￥${text}万`;
  }
  return formatCNY(amount);
}
