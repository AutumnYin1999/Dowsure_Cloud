import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardList,
  Gift,
  Home,
  PartyPopper,
  ShieldCheck,
  Unlock,
  UserRound,
  Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { KNOWLEDGE_BASE } from "@/data/knowledgeBase";
import { cn, formatCNY } from "@/lib/utils";
import type { BenefitCategory, BenefitItem, ProviderProfile } from "@/types";
import { CATEGORY_META } from "./categoryMeta";

interface CheckoutPageProps {
  profile: ProviderProfile;
  /** 工作台当前生效的权益 id 集合。 */
  selectedBenefitIds: string[];
  /** 返回推荐页（保留选中集）。 */
  onBack: () => void;
  /** 返回首页。 */
  onHome: () => void;
  /** D · 查看服务进度（占位）。 */
  onViewServiceStatus: () => void;
}

const CATEGORY_GROUP_ORDER: BenefitCategory[] = [
  "base",
  "growth",
  "value-added",
  "finance",
  "premium",
  "exclusive",
  "gift",
];

interface ContactForm {
  company: string;
  contact: string;
  phone: string;
  taxId: string;
  note: string;
}

const EMPTY_FORM: ContactForm = {
  company: "",
  contact: "",
  phone: "",
  taxId: "",
  note: "",
};

/** 演示用示例联系信息（与 A 计划场景 A「海外仓·账期承压」人设一致）。 */
const DEMO_CONTACT: ContactForm = {
  company: "环宇海外仓供应链（深圳）有限公司",
  contact: "陈航",
  phone: "13800138000", // 纯数字以通过 1[3-9]\d{9} 校验
  taxId: "91440300MA5XXXXXXX",
  note: "旺季在即，希望优先开通精准获客与账期相关权益，本月内能对接顾问。",
};

type CheckoutStep = 0 | 1 | 2;

const STEP_LABELS = ["补充信息", "确认订单", "提交完成"];

function isGiftBenefit(b: BenefitItem): boolean {
  return b.category === "gift";
}
function isUnlockBenefit(b: BenefitItem): boolean {
  return b.unlockThreshold != null && b.price === 0;
}

function benefitTag(b: BenefitItem, recommendedIds: Set<string>): {
  label: string;
  tone: "violet" | "emerald" | "gold" | "muted";
} {
  if (b.alwaysIncluded) return { label: "必选", tone: "violet" };
  if (isGiftBenefit(b)) return { label: "赠送", tone: "emerald" };
  if (isUnlockBenefit(b)) return { label: "满额解锁", tone: "gold" };
  if (recommendedIds.has(b.id)) return { label: "Agent 推荐", tone: "violet" };
  return { label: "自选", tone: "muted" };
}

export function CheckoutPage({
  profile,
  selectedBenefitIds,
  onBack,
  onHome,
  onViewServiceStatus,
}: CheckoutPageProps) {
  const [step, setStep] = useState<CheckoutStep>(0);
  const [form, setForm] = useState<ContactForm>(() => ({
    ...EMPTY_FORM,
    company: profile.companyName ?? "",
  }));
  const [showErrors, setShowErrors] = useState(false);
  const [orderNo, setOrderNo] = useState<string | null>(null);

  // 选中集 → BenefitItem 列表（保持 knowledgeBase 顺序），单一数据源
  const activeBenefits = useMemo(() => {
    const set = new Set(selectedBenefitIds);
    return KNOWLEDGE_BASE.filter((b) => set.has(b.id));
  }, [selectedBenefitIds]);

  const paidSubtotal = useMemo(
    () =>
      activeBenefits.reduce(
        (sum, b) => (isGiftBenefit(b) || isUnlockBenefit(b) ? sum : sum + b.price),
        0
      ),
    [activeBenefits]
  );

  // 「Agent 推荐」标签判定：这里没有 plan 上下文，简单用「付费且非自选」无法判定，
  // 退化为：付费项统一按「已选」展示，必选/赠送/解锁单独标。recommendedIds 留空即可。
  const recommendedIds = useMemo(() => new Set<string>(), []);

  const update = <K extends keyof ContactForm>(k: K, v: ContactForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const fillDemo = () => {
    setForm({ ...DEMO_CONTACT });
    setShowErrors(false);
  };
  const clearForm = () => {
    setForm({ ...EMPTY_FORM });
    setShowErrors(false);
  };

  const errors = useMemo(() => validate(form), [form]);

  const goConfirm = () => {
    if (errors.length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    setOrderNo(genOrderNo());
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-5">
      {/* 面包屑 + 步骤 */}
      <section className="dow-console-panel relative overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.28), transparent)" }}
        />
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--fg-mute)] transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回方案
        </button>
        <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-white sm:text-[32px]">
          确认方案并
          <span className="dow-gradient-text">下单开通</span>
        </h2>

        {/* 迷你步骤指示 */}
        <ol className="mt-5 grid gap-2 sm:grid-cols-3">
          {STEP_LABELS.map((label, idx) => {
            const done = idx < step;
            const active = idx === step;
            return (
              <li
                key={label}
                className={cn(
                  "dow-step-tab",
                  done && "dow-step-tab-done",
                  active && "dow-step-tab-active"
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="font-mono text-[10px] tracking-[0.18em]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                      done && "border-[#34D399]/60 bg-[#34D399]/15 text-[#34D399]",
                      active && "border-white/40 bg-white/10 text-white",
                      !done && !active && "border-white/15 bg-white/5 text-[color:var(--fg-mute)]"
                    )}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : idx + 1}
                  </div>
                </div>
                <span className="mt-1 text-sm font-medium">{label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Step 1 · 补充信息 */}
      {step === 0 ? (
        <section className="dow-glass-card p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-[color:var(--violet)]" />
            <span className="text-lg font-semibold text-white">补充信息</span>
          </div>
          <p className="mt-1.5 text-sm text-[color:var(--fg-mute)]">
            到这一步才首次收集可识别信息，仅用于开通权益与商务对接。
          </p>

          {/* 演示工具条 */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="darkGhost" size="sm" onClick={fillDemo}>
              <Wand2 className="h-3.5 w-3.5" />
              填入示例数据
            </Button>
            <Button variant="darkOutline" size="sm" onClick={clearForm}>
              清空
            </Button>
            <span className="text-xs text-[color:var(--fg-faint)]">演示用，可一键填好直接走完流程</span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="公司名称" required invalid={showErrors && !form.company.trim()}>
              <input
                className="dow-dark-input dow-focus"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                placeholder="营业执照全称"
              />
            </Field>
            <Field label="联系人" required invalid={showErrors && !form.contact.trim()}>
              <input
                className="dow-dark-input dow-focus"
                value={form.contact}
                onChange={(e) => update("contact", e.target.value)}
                placeholder="您的称呼"
              />
            </Field>
            <Field
              label="手机号"
              required
              invalid={showErrors && !isValidPhone(form.phone)}
              hint={showErrors && form.phone.trim() && !isValidPhone(form.phone) ? "手机号格式不正确" : undefined}
            >
              <input
                className="dow-dark-input dow-focus"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="接收对接通知"
                inputMode="tel"
              />
            </Field>
            <Field label="企业主体 / 统一社会信用代码" optional>
              <input
                className="dow-dark-input dow-focus"
                value={form.taxId}
                onChange={(e) => update("taxId", e.target.value)}
                placeholder="选填"
              />
            </Field>
            <Field label="备注" optional full>
              <textarea
                className="dow-dark-input dow-focus resize-y leading-relaxed"
                rows={3}
                value={form.note}
                onChange={(e) => update("note", e.target.value)}
                placeholder="可补充特殊需求、期望开通时间等"
              />
            </Field>
          </div>

          {showErrors && errors.length > 0 ? (
            <div className="dow-alert-error mt-4">
              <p className="font-medium">请先补充以下信息</p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between">
            <Button variant="darkOutline" size="md" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              返回方案
            </Button>
            <Button variant="gradient" size="md" onClick={goConfirm}>
              下一步 · 核对订单
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {/* Step 2 · 确认单 */}
      {step === 1 ? (
        <section className="space-y-4">
          <div className="dow-glass-card p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[color:var(--violet)]" />
              <span className="text-lg font-semibold text-white">订单确认单</span>
            </div>
            <p className="mt-1.5 text-sm text-[color:var(--fg-mute)]">
              提交前请核对权益清单与联系信息。
            </p>

            {/* 权益清单（按类别分组） */}
            <div className="mt-5 space-y-5">
              {CATEGORY_GROUP_ORDER.map((cat) => {
                const items = activeBenefits.filter((b) => b.category === cat);
                if (items.length === 0) return null;
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--fg-faint)]">
                      {meta.label}
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {items.map((b) => {
                        const free = isGiftBenefit(b) || isUnlockBenefit(b);
                        const tag = benefitTag(b, recommendedIds);
                        return (
                          <div
                            key={b.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-2)] px-3.5 py-2.5"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <TagPill tone={tag.tone} label={tag.label} />
                              <span className="truncate text-sm text-[color:var(--fg-dim)]">
                                {b.name}
                              </span>
                            </div>
                            <span className="shrink-0 font-mono text-sm">
                              {free ? (
                                <span className="text-[#6ee7b7]">—</span>
                              ) : (
                                <span className="dow-gradient-text font-semibold">
                                  {formatCNY(b.price)}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 小计 */}
            <div className="mt-5 flex items-center justify-between border-t border-[color:var(--border)] pt-4">
              <span className="text-sm text-[color:var(--fg-mute)]">付费项小计</span>
              <span className="font-display text-2xl font-black">
                <span className="dow-gradient-text">{formatCNY(paidSubtotal)}</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-[color:var(--fg-faint)]">
              赠送 / 满额解锁项不计入小计，已在清单中点亮。
            </p>
          </div>

          {/* 信息回显 */}
          <div className="dow-glass-card p-5 sm:p-6">
            <span className="text-base font-semibold text-white">联系信息</span>
            <div className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              <InfoRow label="公司名称" value={form.company} />
              <InfoRow label="联系人" value={form.contact} />
              <InfoRow label="手机号" value={form.phone} />
              <InfoRow label="企业主体" value={form.taxId || "—"} />
              <InfoRow label="备注" value={form.note || "—"} full />
            </div>
          </div>

          <p className="px-1 text-xs leading-relaxed text-[color:var(--fg-faint)]">
            Dowsure 提供技术、数据、风控与连接能力；TermPay 的资金与最终授信审批由合作银行 / 资金方承担。一切以双方正式协议为准。
          </p>

          <div className="dow-glass-card flex items-center justify-between gap-3 px-5 py-4">
            <Button variant="darkOutline" size="md" onClick={() => setStep(0)}>
              <ArrowLeft className="h-4 w-4" />
              上一步 · 改信息
            </Button>
            <Button variant="gradient" size="md" onClick={submit}>
              <Check className="h-4 w-4" />
              确认提交
            </Button>
          </div>
        </section>
      ) : null}

      {/* Step 3 · 成功 */}
      {step === 2 ? (
        <section className="dow-glass-card p-6 text-center sm:p-10">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white"
            style={{ background: "var(--grad)", boxShadow: "0 14px 40px -10px rgba(139,92,246,0.6)" }}
          >
            <PartyPopper className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-white">已提交，等待对接开通</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[color:var(--fg-mute)]">
            商务顾问会尽快与你对接，确认权益开通与 TermPay 接入节奏。
          </p>

          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-[color:var(--border-2)] bg-[color:var(--bg-3)] px-4 py-2.5">
            <span className="text-xs text-[color:var(--fg-mute)]">订单号</span>
            <span className="font-mono text-base font-semibold text-white">{orderNo}</span>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <Button variant="gradient" size="md" onClick={onViewServiceStatus}>
              查看服务进度
              <ArrowUpRight className="h-4 w-4" />
            </Button>
            <Button variant="darkOutline" size="md" onClick={onBack}>
              再看看方案
            </Button>
            <Button variant="darkGhost" size="md" onClick={onHome}>
              <Home className="h-4 w-4" />
              返回首页
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[color:var(--fg-faint)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#34D399]" />
            信息仅用于本次开通与商务对接
          </div>
        </section>
      ) : null}
    </div>
  );
}

// ─────────────────────── 子组件 ───────────────────────

function Field({
  label,
  required,
  optional,
  full,
  invalid,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  full?: boolean;
  invalid?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-2 block text-sm font-medium text-white">
        {label}
        {required ? <span className="ml-1 text-[color:var(--violet)]">*</span> : null}
        {optional ? (
          <span className="ml-1.5 text-xs font-normal text-[color:var(--fg-faint)]">选填</span>
        ) : null}
      </span>
      <div
        className={cn(
          invalid && "[&_input]:!border-[rgba(251,113,133,0.55)] [&_textarea]:!border-[rgba(251,113,133,0.55)]"
        )}
      >
        {children}
      </div>
      {hint ? <span className="mt-1 block text-xs text-[#ffbcd2]">{hint}</span> : null}
    </label>
  );
}

function InfoRow({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <span className="text-xs text-[color:var(--fg-faint)]">{label}</span>
      <p className="mt-0.5 text-sm text-[color:var(--fg-dim)]">{value || "—"}</p>
    </div>
  );
}

function TagPill({
  tone,
  label,
}: {
  tone: "violet" | "emerald" | "gold" | "muted";
  label: string;
}) {
  const styles: React.CSSProperties =
    tone === "emerald"
      ? { background: "rgba(52,211,153,0.12)", borderColor: "rgba(52,211,153,0.4)", color: "#6ee7b7" }
      : tone === "gold"
      ? { background: "rgba(245,166,35,0.12)", borderColor: "rgba(245,166,35,0.4)", color: "#ffd187" }
      : tone === "violet"
      ? { background: "rgba(139,92,246,0.16)", borderColor: "rgba(139,92,246,0.45)", color: "#d6c2ff" }
      : { background: "rgba(255,255,255,0.05)", borderColor: "var(--border-2)", color: "var(--fg-mute)" };
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
      style={styles}
    >
      {tone === "emerald" ? <Gift className="h-2.5 w-2.5" /> : null}
      {tone === "gold" ? <Unlock className="h-2.5 w-2.5" /> : null}
      {label}
    </span>
  );
}

// ─────────────────────── helpers ───────────────────────

function isValidPhone(v: string): boolean {
  return /^1[3-9]\d{9}$/.test(v.trim());
}

function validate(form: ContactForm): string[] {
  const errors: string[] = [];
  if (!form.company.trim()) errors.push("公司名称未填写");
  if (!form.contact.trim()) errors.push("联系人未填写");
  if (!form.phone.trim()) errors.push("手机号未填写");
  else if (!isValidPhone(form.phone)) errors.push("手机号格式不正确");
  return errors;
}

function genOrderNo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `DF-${ymd}-${rand}`;
}
