import { Check, CheckCircle2, Gift, Sparkles, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Disclosure } from "@/components/ui/Disclosure";
import { cn, formatCNY } from "@/lib/utils";
import type { RecommendedBenefit } from "@/types";
import { CATEGORY_META, PRIORITY_META } from "./categoryMeta";

interface BenefitCardProps {
  item: RecommendedBenefit;
}

export function BenefitCard({ item }: BenefitCardProps) {
  const cat = CATEGORY_META[item.benefit.category];
  const pri = PRIORITY_META[item.priority];
  const Icon = cat.icon;
  const qty = item.quantity ?? 1;
  const isGift = item.priority === "gift";
  const isUnlock = item.priority === "unlock";
  const isFree = isGift || isUnlock;
  const subtotal = isFree ? 0 : item.benefit.price * qty;

  return (
    <div
      className={cn(
        "ds-card-soft group bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-pop sm:p-5",
        item.priority === "required" && "border-brand-200 shadow-ring",
        isGift && "bg-accent-emerald/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
            cat.chipClass
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-[15px] font-semibold tracking-tight text-ink sm:text-base">
              {item.benefit.name}
            </h4>
            {qty > 1 ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                × {qty}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted sm:text-sm">
            {item.benefit.summary}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="solid" className={cn("border", pri.chipClass)}>
              {pri.label}
            </Badge>
            <Badge tone="neutral" className={cat.chipClass}>
              {cat.subtitle}
            </Badge>
          </div>
        </div>

        {/* 右上角:状态/价格 */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          {isGift ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent-emerald/40 bg-accent-emerald/10 px-2.5 py-1 text-[11px] font-semibold text-accent-emerald">
              <Gift className="h-3 w-3" />
              赠送
            </span>
          ) : isUnlock ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent-gold/40 bg-accent-gold/15 px-2.5 py-1 text-[11px] font-semibold text-accent-gold">
              <Unlock className="h-3 w-3" />
              满额解锁
            </span>
          ) : (
            <>
              <p className="text-base font-semibold text-brand-600 sm:text-lg">
                {formatCNY(subtotal)}
              </p>
              {item.benefit.unit ? (
                <p className="text-[10px] text-ink-soft">{item.benefit.unit}</p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-surface-line pt-3">
        <Disclosure
          trigger={
            <div className="flex items-center gap-2 text-xs font-medium text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              展开:为什么推荐?
              <span className="ml-1 text-ink-soft">
                · 命中 {item.matchedRules.length} 条规则
              </span>
            </div>
          }
        >
          <div className="space-y-3 pl-1">
            <ul className="space-y-1.5">
              {item.reasons.map((reason, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-ink-muted"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
            <p className="rounded-xl bg-surface-alt p-3 text-xs leading-relaxed text-ink-muted">
              {item.benefit.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.matchedRules.map((rid) => (
                <span
                  key={rid}
                  className="rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-soft"
                >
                  {rid}
                </span>
              ))}
            </div>
          </div>
        </Disclosure>
      </div>

      {/* 必选项:底部高亮条 */}
      {item.priority === "required" ? (
        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-brand-50/70 px-3 py-2 text-[11px] font-medium text-brand-700">
          <Check className="h-3 w-3" strokeWidth={3} />
          每位服务商必选项 · 本方案已默认开启
        </div>
      ) : null}
    </div>
  );
}
