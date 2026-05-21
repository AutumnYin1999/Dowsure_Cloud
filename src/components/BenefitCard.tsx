import { Check, CheckCircle2, ChevronDown, Gift, Sparkles, Unlock } from "lucide-react";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "dow-glass-card group p-4 transition-all hover:-translate-y-0.5 sm:p-5",
        item.priority === "required" &&
          "ring-1 ring-[rgba(167,87,255,0.45)] shadow-[0_18px_40px_-18px_rgba(167,87,255,0.45)]"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,91,176,0.25), rgba(167,87,255,0.25), rgba(91,135,255,0.25))",
            border: "1px solid rgba(180,150,255,0.3)",
          }}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-[15px] font-semibold tracking-tight text-white sm:text-base">
              {item.benefit.name}
            </h4>
            {qty > 1 ? (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: "rgba(167,87,255,0.18)",
                  color: "#d6c2ff",
                  border: "1px solid rgba(167,87,255,0.35)",
                }}
              >
                × {qty}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[rgba(226,219,255,0.7)] sm:text-sm">
            {item.benefit.summary}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <PriorityChip priority={item.priority} label={pri.label} />
            <CategoryChip label={cat.subtitle} />
          </div>
        </div>

        {/* 右上角:状态/价格 */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          {isGift ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "rgba(16,185,129,0.12)",
                borderColor: "rgba(16,185,129,0.4)",
                color: "#6ee7b7",
              }}
            >
              <Gift className="h-3 w-3" />
              赠送
            </span>
          ) : isUnlock ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "rgba(245,166,35,0.12)",
                borderColor: "rgba(245,166,35,0.4)",
                color: "#ffd187",
              }}
            >
              <Unlock className="h-3 w-3" />
              满额解锁
            </span>
          ) : (
            <>
              <p className="font-display text-base font-bold text-white sm:text-lg">
                <span className="dow-gradient-text">{formatCNY(subtotal)}</span>
              </p>
              {item.benefit.unit ? (
                <p className="text-[10px] text-[rgba(226,219,255,0.5)]">
                  {item.benefit.unit}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="dow-divider mt-4 pt-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 rounded-lg text-left"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-[#d6c2ff]">
            <Sparkles className="h-3.5 w-3.5" />
            为什么推荐？
            <span className="ml-1 text-[rgba(226,219,255,0.5)]">
              · 命中 {item.matchedRules.length} 条规则
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[rgba(226,219,255,0.55)] transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
        {open ? (
          <div className="mt-3 animate-fade-in space-y-3 pl-1">
            <ul className="space-y-1.5">
              {item.reasons.map((reason, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs leading-relaxed text-[rgba(226,219,255,0.78)]"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22d3ee]" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
            <p
              className="rounded-xl px-3 py-2.5 text-xs leading-relaxed text-[rgba(226,219,255,0.72)]"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(180,150,255,0.15)",
              }}
            >
              {item.benefit.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.matchedRules.map((rid) => (
                <span
                  key={rid}
                  className="rounded-md px-1.5 py-0.5 font-mono text-[10px] text-[rgba(226,219,255,0.6)]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(180,150,255,0.15)",
                  }}
                >
                  {rid}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* 必选项：底部高亮条 */}
      {item.priority === "required" ? (
        <div
          className="mt-3 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-medium"
          style={{
            background: "rgba(167,87,255,0.12)",
            border: "1px solid rgba(167,87,255,0.32)",
            color: "#d6c2ff",
          }}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
          每位服务商必选项 · 本方案已默认开启
        </div>
      ) : null}
    </div>
  );
}

function PriorityChip({
  priority,
  label,
}: {
  priority: RecommendedBenefit["priority"];
  label: string;
}) {
  const styleMap: Record<RecommendedBenefit["priority"], React.CSSProperties> = {
    required: {
      background:
        "linear-gradient(135deg, rgba(255,91,176,0.35), rgba(167,87,255,0.35), rgba(91,135,255,0.35))",
      border: "1px solid rgba(167,87,255,0.55)",
      color: "#ffffff",
    },
    strong: {
      background: "rgba(167,87,255,0.18)",
      border: "1px solid rgba(167,87,255,0.45)",
      color: "#d6c2ff",
    },
    optional: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(180,150,255,0.25)",
      color: "rgba(226,219,255,0.85)",
    },
    unlock: {
      background: "rgba(245,166,35,0.12)",
      border: "1px solid rgba(245,166,35,0.4)",
      color: "#ffd187",
    },
    gift: {
      background: "rgba(16,185,129,0.12)",
      border: "1px solid rgba(16,185,129,0.4)",
      color: "#6ee7b7",
    },
  };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={styleMap[priority]}
    >
      {label}
    </span>
  );
}

function CategoryChip({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(180,150,255,0.2)",
        color: "rgba(226,219,255,0.75)",
      }}
    >
      {label}
    </span>
  );
}
