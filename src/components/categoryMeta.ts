import {
  Award,
  Banknote,
  Building2,
  Crown,
  Gift,
  Megaphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { BenefitCategory, BenefitPriority } from "@/types";

/**
 * 把 BenefitCategory / Priority 映射到展示元数据。
 * 单点维护色调和图标。
 */
export const CATEGORY_META: Record<
  BenefitCategory,
  {
    label: string;
    subtitle: string;
    icon: LucideIcon;
    tone: string;
    chipClass: string;
  }
> = {
  base: {
    label: "必选项 · 基础底座",
    subtitle: "每位服务商即刻开通",
    icon: Building2,
    tone: "brand",
    chipClass: "bg-brand-50 text-brand-700 border-brand-100",
  },
  growth: {
    label: "获客增长 · Growth",
    subtitle: "把流量变成订单",
    icon: Megaphone,
    tone: "brand",
    chipClass: "bg-brand-100 text-brand-700 border-brand-200",
  },
  "value-added": {
    label: "增值服务 · Value-added",
    subtitle: "把能力嵌进客户旅程",
    icon: Sparkles,
    tone: "brand",
    chipClass: "bg-brand-50 text-brand-700 border-brand-100",
  },
  finance: {
    label: "金融赋能 · Finance",
    subtitle: "融资 / 财税 / 合规",
    icon: Banknote,
    tone: "gold",
    chipClass: "bg-accent-gold/10 text-accent-gold border-accent-gold/30",
  },
  premium: {
    label: "升级尊享 · Premium",
    subtitle: "选购满 20 万解锁",
    icon: Crown,
    tone: "violet",
    chipClass: "bg-accent-violet/10 text-accent-violet border-accent-violet/30",
  },
  exclusive: {
    label: "独家权益 · Exclusive",
    subtitle: "选购满 80 万赠送",
    icon: Award,
    tone: "brand",
    chipClass:
      "bg-gradient-to-r from-brand-100 to-accent-violet/15 text-brand-700 border-brand-200",
  },
  gift: {
    label: "默认赠送 · Gift",
    subtitle: "所有方案附带",
    icon: Gift,
    tone: "emerald",
    chipClass: "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30",
  },
};

export const PRIORITY_META: Record<
  BenefitPriority,
  { label: string; chipClass: string; sort: number }
> = {
  required: {
    label: "必选",
    chipClass: "bg-brand-gradient text-white border-transparent",
    sort: 0,
  },
  strong: {
    label: "强推荐",
    chipClass: "bg-brand-600 text-white border-brand-600",
    sort: 1,
  },
  optional: {
    label: "可选增强",
    chipClass: "bg-brand-50 text-brand-700 border-brand-100",
    sort: 2,
  },
  unlock: {
    label: "满额解锁",
    chipClass: "bg-accent-gold/15 text-accent-gold border-accent-gold/30",
    sort: 3,
  },
  gift: {
    label: "赠送",
    chipClass: "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30",
    sort: 4,
  },
};
