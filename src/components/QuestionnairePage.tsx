import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Database,
  Layers,
  Plug,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";
import { Button } from "@/components/ui/Button";
import { OptionCard } from "@/components/ui/OptionCard";
import { Toggle } from "@/components/ui/Toggle";
import {
  BUDGET_BANDS,
  CUSTOMER_TIERS,
  GOALS,
  PROVIDER_TYPES,
  QUESTIONNAIRE_STEPS,
  REPORT_TIERS,
} from "@/schema/questionnaireSchema";
import type {
  BudgetBand,
  CustomerTier,
  GoalTag,
  ProviderProfile,
  ProviderType,
  ReportTier,
} from "@/types";
import { cn } from "@/lib/utils";

interface QuestionnairePageProps {
  initial?: Partial<ProviderProfile>;
  onSubmit: (profile: ProviderProfile) => void;
  onBack: () => void;
}

interface DraftProfile {
  companyName: string;
  providerType?: ProviderType;
  goals: GoalTag[];
  customerTier?: CustomerTier;
  budget?: BudgetBand;
  hasEmbeddableSystem: boolean;
  reportTier: ReportTier;
  wantsOfflineEvents: boolean;
  needsFinanceServices: boolean;
  offersCreditToCustomers: boolean;
  hasReceivablePressure: boolean;
  wantsCustomerInstallment: boolean;
}

function toDraft(initial?: Partial<ProviderProfile>): DraftProfile {
  return {
    companyName: initial?.companyName ?? "",
    providerType: initial?.providerType,
    goals: initial?.goals ?? [],
    customerTier: initial?.customerTier,
    budget: initial?.budget,
    hasEmbeddableSystem: initial?.hasEmbeddableSystem ?? false,
    reportTier: initial?.reportTier ?? "20",
    wantsOfflineEvents: initial?.wantsOfflineEvents ?? false,
    needsFinanceServices: initial?.needsFinanceServices ?? false,
    offersCreditToCustomers: initial?.offersCreditToCustomers ?? false,
    hasReceivablePressure: initial?.hasReceivablePressure ?? false,
    wantsCustomerInstallment: initial?.wantsCustomerInstallment ?? false,
  };
}

// 各步骤侧边帮助文案 + ETA
interface StepMeta {
  eyebrow: string;
  icon: ComponentType<{ className?: string }>;
  helpTitle: string;
  helpBody: string;
  helpBullets: string[];
  eta: string;
}

const STEP_META: StepMeta[] = [
  {
    eyebrow: "STEP 01 · INTAKE",
    icon: Database,
    helpTitle: "为什么需要这些信息？",
    helpBody:
      "用于生成 Provider Profile，作为后续 TermPay 适配扫描与权益推荐的输入。",
    helpBullets: [
      "只采集经营判断必要字段",
      "公司名称仅用于推荐摘要署名",
      "信息不上传服务端，仅本地推理",
    ],
    eta: "预计剩余 02:40",
  },
  {
    eyebrow: "STEP 02 · SIGNAL",
    icon: ScanSearch,
    helpTitle: "增长目标决定方案命名",
    helpBody:
      "目标会决定推荐组合的命名与优先级（曝光、获客、账期、大卖、香港等）。",
    helpBullets: [
      "目标可多选，建议 2-4 项",
      "客户层级影响是否推荐大卖 / 私享会",
      "无需提交真实客户名单",
    ],
    eta: "预计剩余 02:00",
  },
  {
    eyebrow: "STEP 03 · TERMPAY",
    icon: Wallet,
    helpTitle: "TermPay 适配是什么？",
    helpBody:
      "扫描你给客户提供账期 / 应收压力 / 客户分期 / 嵌入意愿四个信号，判断是否推荐接入 TermPay。",
    helpBullets: [
      "勾选越多 = 适配信号越强",
      "命中后会展示 TermPay 资金流与风控方案",
      "Dowsure 不放款；最终授信由资金方决定",
    ],
    eta: "预计剩余 01:20",
  },
  {
    eyebrow: "STEP 04 · BRIEFING",
    icon: Layers,
    helpTitle: "预算决定方案上限",
    helpBody: "预算档位会触发尊享 / 独家解锁规则；报告数量影响 AI 拓客版本。",
    helpBullets: [
      "≥20 万：解锁尊享权益",
      "≥80 万：赠送独家亚马逊大会权益",
      "报告档位：启航 / 跃升 / 领航版",
    ],
    eta: "预计剩余 00:30",
  },
];

const COMPLIANCE_LINE =
  "Dowsure 提供技术、数据、风控与连接能力；TermPay 的资金与最终授信审批由合作银行 / 资金方承担。本问卷不构成授信承诺。";

export function QuestionnairePage({
  initial,
  onSubmit,
  onBack,
}: QuestionnairePageProps) {
  const [draft, setDraft] = useState<DraftProfile>(() => toDraft(initial));
  const [stepIdx, setStepIdx] = useState(0);
  const [showErrors, setShowErrors] = useState(false);

  const totalSteps = QUESTIONNAIRE_STEPS.length;
  const step = QUESTIONNAIRE_STEPS[stepIdx];
  const meta = STEP_META[stepIdx];

  const stepErrors = useMemo(() => validateStep(draft, stepIdx), [draft, stepIdx]);

  const update = <K extends keyof DraftProfile>(key: K, value: DraftProfile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleGoal = (g: GoalTag) =>
    setDraft((d) => ({
      ...d,
      goals: d.goals.includes(g)
        ? d.goals.filter((x) => x !== g)
        : [...d.goals, g],
    }));

  const goNext = () => {
    if (stepErrors.length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (stepIdx < totalSteps - 1) {
      setStepIdx(stepIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onSubmit(finalize(draft));
    }
  };

  const goPrev = () => {
    if (stepIdx === 0) {
      onBack();
      return;
    }
    setShowErrors(false);
    setStepIdx(stepIdx - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-5">
      {/* 顶部 console header */}
      <section className="dow-console-panel relative overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(167,87,255,0.35), transparent)" }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="dow-eyebrow dow-eyebrow-dot">
              {meta.eyebrow}
            </span>
            <h2 className="mt-2 font-display text-[26px] font-black leading-tight tracking-tight text-white sm:text-[32px]">
              服务商 3 分钟
              <span className="dow-gradient-text">激活流程</span>
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[rgba(226,219,255,0.7)] sm:text-base">
              用 4 步识别服务商增长目标、TermPay 适配度和权益推荐路径。
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] tracking-[0.18em]"
              style={{
                background: "rgba(34,211,238,0.08)",
                borderColor: "rgba(34,211,238,0.35)",
                color: "#a7f3ff",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee] shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
              {meta.eta}
            </span>
            <span className="font-mono text-[11px] tracking-[0.18em] text-[rgba(226,219,255,0.55)]">
              STEP {String(stepIdx + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Step tabs */}
        <ol className="mt-5 grid gap-2 sm:grid-cols-4">
          {QUESTIONNAIRE_STEPS.map((s, idx) => {
            const done = idx < stepIdx;
            const active = idx === stepIdx;
            return (
              <li key={s.id} className="flex">
                <button
                  type="button"
                  onClick={() => {
                    if (idx <= stepIdx) {
                      setStepIdx(idx);
                      setShowErrors(false);
                    }
                  }}
                  disabled={idx > stepIdx}
                  className={cn(
                    "dow-step-tab w-full disabled:cursor-not-allowed",
                    done && "dow-step-tab-done",
                    active && "dow-step-tab-active"
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span
                      className="font-mono text-[10px] tracking-[0.18em]"
                      style={{ color: "inherit" }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                        done && "border-[#22d3ee]/60 bg-[#22d3ee]/15 text-[#a7f3ff]",
                        active && "border-white/40 bg-white/10 text-white",
                        !done && !active && "border-white/15 bg-white/5 text-[rgba(226,219,255,0.6)]"
                      )}
                    >
                      {done ? <CheckCircle2 className="h-3 w-3" strokeWidth={3} /> : idx + 1}
                    </div>
                  </div>
                  <span className="mt-1 text-sm font-medium">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 主体：左侧表单 + 右侧 help sidebar */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="dow-glass-card p-5 sm:p-7">
          <div className="mb-5">
            <p className="dow-eyebrow">{step.description}</p>
            <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-white sm:text-xl">
              {step.title}
            </h3>
          </div>

          <div className="space-y-8">
            {stepIdx === 0 ? (
              <StepCompanyAndType
                draft={draft}
                update={update}
                showErrors={showErrors}
              />
            ) : null}
            {stepIdx === 1 ? (
              <StepGoalsAndTier
                draft={draft}
                update={update}
                toggleGoal={toggleGoal}
                showErrors={showErrors}
              />
            ) : null}
            {stepIdx === 2 ? (
              <StepTermPayFit draft={draft} update={update} />
            ) : null}
            {stepIdx === 3 ? (
              <StepBudgetAndCapabilities
                draft={draft}
                update={update}
                showErrors={showErrors}
              />
            ) : null}

            {showErrors && stepErrors.length > 0 ? (
              <div className="dow-alert-error">
                <p className="font-medium">请先补充以下信息</p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs">
                  {stepErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>

        {/* 右侧帮助栏 */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="dow-glass-card p-5">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,91,176,0.3), rgba(167,87,255,0.3), rgba(91,135,255,0.3))",
                  border: "1px solid rgba(180,150,255,0.3)",
                }}
              >
                <meta.icon className="h-4 w-4" />
              </div>
              <span className="dow-eyebrow">CONTEXT</span>
            </div>
            <p className="mt-3 text-base font-semibold text-white">
              {meta.helpTitle}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[rgba(226,219,255,0.7)]">
              {meta.helpBody}
            </p>
            <ul className="mt-3 space-y-1.5">
              {meta.helpBullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-xs leading-relaxed text-[rgba(226,219,255,0.78)]"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22d3ee]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="dow-glass-card p-5">
            <span className="dow-eyebrow">MINIMUM DATA</span>
            <p className="mt-2.5 text-sm font-semibold text-white">
              最小数据原则
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-[rgba(226,219,255,0.75)]">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a757ff]" />
                只采集经营判断必要字段
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a757ff]" />
                金融申请前不强制完整 KYB
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a757ff]" />
                所有 Agent action 写入 audit log
              </li>
            </ul>
          </div>

          <div className="dow-glass-card p-5">
            <span className="dow-eyebrow">COMPLIANCE</span>
            <p className="mt-2.5 text-xs leading-relaxed text-[rgba(226,219,255,0.7)]">
              {COMPLIANCE_LINE}
            </p>
          </div>
        </aside>
      </div>

      {/* 底部操作栏 */}
      <div className="dow-glass-card flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Button variant="darkOutline" size="md" onClick={goPrev}>
            <ArrowLeft className="h-4 w-4" />
            {stepIdx === 0 ? "返回欢迎页" : "上一步"}
          </Button>
          <Button
            variant="darkGhost"
            size="md"
            onClick={() => {
              // demo: 保存草稿（不持久化）
              setShowErrors(false);
            }}
          >
            保存草稿
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[11px] tracking-[0.18em] text-[rgba(226,219,255,0.55)] sm:inline">
            Step {stepIdx + 1} / {totalSteps}
          </span>
          <Button variant="gradient" size="md" onClick={goNext}>
            {stepIdx === totalSteps - 1 ? (
              <>
                生成方案
                <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                下一步
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────── 分步 ────────────────────────

function DarkLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium text-white">{children}</p>
  );
}

function DarkHelp({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 text-xs leading-relaxed text-[rgba(226,219,255,0.6)]">
      {children}
    </p>
  );
}

function StepCompanyAndType({
  draft,
  update,
  showErrors,
}: {
  draft: DraftProfile;
  update: <K extends keyof DraftProfile>(k: K, v: DraftProfile[K]) => void;
  showErrors: boolean;
}) {
  return (
    <div className="space-y-7">
      <div>
        <DarkLabel>公司名称</DarkLabel>
        <DarkHelp>用于生成推荐摘要时的署名，不会上传服务端</DarkHelp>
        <input
          id="company-name"
          value={draft.companyName}
          onChange={(e) => update("companyName", e.target.value)}
          placeholder="例如：豆沙包跨境物流"
          className={cn(
            "dow-dark-input dow-focus mt-2",
            showErrors && !draft.companyName.trim() &&
              "!border-[rgba(255,87,130,0.55)] !shadow-[0_0_0_3px_rgba(255,87,130,0.15)]"
          )}
        />
      </div>

      <div>
        <DarkLabel>服务商类型</DarkLabel>
        <DarkHelp>单选，影响 TermPay 接入方式、风控模型与权益推荐</DarkHelp>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {PROVIDER_TYPES.map((opt) => (
            <OptionCard
              key={opt.value}
              dark
              selected={draft.providerType === opt.value}
              onClick={() => update("providerType", opt.value)}
              title={opt.label}
              hint={opt.hint}
            />
          ))}
        </div>
        {showErrors && !draft.providerType ? (
          <p className="mt-2 text-xs text-[#ffbcd2]">请选择一个服务商类型</p>
        ) : null}
      </div>
    </div>
  );
}

function StepGoalsAndTier({
  draft,
  update,
  toggleGoal,
  showErrors,
}: {
  draft: DraftProfile;
  update: <K extends keyof DraftProfile>(k: K, v: DraftProfile[K]) => void;
  toggleGoal: (g: GoalTag) => void;
  showErrors: boolean;
}) {
  return (
    <div className="space-y-7">
      <div>
        <DarkLabel>当前主要目标</DarkLabel>
        <DarkHelp>可多选，建议 2-4 项；最影响最终方案命名</DarkHelp>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {GOALS.map((opt) => (
            <OptionCard
              key={opt.value}
              dark
              multi
              selected={draft.goals.includes(opt.value)}
              onClick={() => toggleGoal(opt.value)}
              title={opt.label}
            />
          ))}
        </div>
        {showErrors && draft.goals.length === 0 ? (
          <p className="mt-2 text-xs text-[#ffbcd2]">至少勾选 1 个目标</p>
        ) : null}
      </div>

      <div>
        <DarkLabel>客户层级</DarkLabel>
        <DarkHelp>用于判断是否推荐「大卖有约」「私享会」等高净值权益</DarkHelp>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {CUSTOMER_TIERS.map((opt) => (
            <OptionCard
              key={opt.value}
              dark
              selected={draft.customerTier === opt.value}
              onClick={() => update("customerTier", opt.value)}
              title={opt.label}
            />
          ))}
        </div>
        {showErrors && !draft.customerTier ? (
          <p className="mt-2 text-xs text-[#ffbcd2]">请选择客户层级</p>
        ) : null}
      </div>
    </div>
  );
}

function StepTermPayFit({
  draft,
  update,
}: {
  draft: DraftProfile;
  update: <K extends keyof DraftProfile>(k: K, v: DraftProfile[K]) => void;
}) {
  return (
    <div className="space-y-6">
      {/* 顶部说明 —— 渐变面板 */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,91,176,0.18) 0%, rgba(167,87,255,0.18) 50%, rgba(34,211,238,0.16) 100%)",
          border: "1px solid rgba(167,87,255,0.4)",
          boxShadow: "0 0 0 1px rgba(167,87,255,0.25) inset",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{
              background:
                "linear-gradient(135deg, #ff5bb0 0%, #a757ff 50%, #5b87ff 100%)",
              boxShadow: "0 12px 30px -8px rgba(167,87,255,0.6)",
            }}
          >
            <Banknote className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="dow-eyebrow">EMBEDDED AP FINANCE</p>
            <p className="mt-1.5 text-lg font-semibold text-white sm:text-xl">
              TermPay 适配扫描
            </p>
            <p className="mt-0.5 text-xs text-[rgba(226,219,255,0.75)] sm:text-sm">
              豆分期升级版 · 嵌入式账期金融能力。Dowsure 仅提供技术、数据、风控与连接，资金与最终授信审批由合作银行 / 资金方承担。
            </p>
          </div>
        </div>
      </div>

      {/* 2x2 toggle cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          dark
          id="offers-credit"
          checked={draft.offersCreditToCustomers}
          onChange={(v) => update("offersCreditToCustomers", v)}
          label="你目前是否给客户提供账期 / 月结？"
          hint="例如允许卖家先发货后付款、月结、半月结等"
        />
        <Toggle
          dark
          id="receivable-pressure"
          checked={draft.hasReceivablePressure}
          onChange={(v) => update("hasReceivablePressure", v)}
          label="你是否存在应收账款压力或回款慢？"
          hint="若是，TermPay 可让资金方直接把账单结算到你账户"
        />
        <Toggle
          dark
          id="customer-installment"
          checked={draft.wantsCustomerInstallment}
          onChange={(v) => update("wantsCustomerInstallment", v)}
          label="是否希望支持客户使用延期 / 分期付款？"
          hint="物流、海外仓、广告、采购等大额账单尤其适合"
        />
        <Toggle
          dark
          id="embed-system"
          checked={draft.hasEmbeddableSystem}
          onChange={(v) => update("hasEmbeddableSystem", v)}
          label="希望把 TermPay 嵌入自有官网 / ERP / 客户后台 / 公众号？"
          hint="若是，将强烈推荐「TermPay 嵌入式接入端口」"
        />
      </div>

      <div
        className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs leading-relaxed text-[rgba(226,219,255,0.65)]"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(180,150,255,0.15)",
        }}
      >
        <Plug className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a757ff]" />
        <span>
          勾选越多，TermPay 适配信号越强；完成问卷后推荐结果会给出资金流路径与风控边界说明。
        </span>
      </div>
    </div>
  );
}

function StepBudgetAndCapabilities({
  draft,
  update,
  showErrors,
}: {
  draft: DraftProfile;
  update: <K extends keyof DraftProfile>(k: K, v: DraftProfile[K]) => void;
  showErrors: boolean;
}) {
  return (
    <div className="space-y-7">
      <div>
        <DarkLabel>年度预算</DarkLabel>
        <DarkHelp>
          预算决定方案上限。≥20 万解锁尊享权益；≥80 万额外赠送独家权益
        </DarkHelp>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {BUDGET_BANDS.map((opt) => (
            <OptionCard
              key={opt.value}
              dark
              selected={draft.budget === opt.value}
              onClick={() => update("budget", opt.value)}
              title={opt.label}
            />
          ))}
        </div>
        {showErrors && !draft.budget ? (
          <p className="mt-2 text-xs text-[#ffbcd2]">请选择年度预算</p>
        ) : null}
      </div>

      <div>
        <DarkLabel>希望的数据获客报告数量</DarkLabel>
        <DarkHelp>
          基础包默认 20 份；80 份对应跃升版；120 份及深度营销对应领航版（需 ≥20 万）
        </DarkHelp>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {REPORT_TIERS.map((opt) => (
            <OptionCard
              key={opt.value}
              dark
              selected={draft.reportTier === opt.value}
              onClick={() => update("reportTier", opt.value)}
              title={opt.label}
              hint={opt.hint}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          dark
          id="offline"
          checked={draft.wantsOfflineEvents}
          onChange={(v) => update("wantsOfflineEvents", v)}
          label="是否希望参与线下活动 / 游学 / 闭门会"
        />
        <Toggle
          dark
          id="fin-needs"
          checked={draft.needsFinanceServices}
          onChange={(v) => update("needsFinanceServices", v)}
          label="是否有融资、财税、开户、保险等需求"
        />
      </div>
    </div>
  );
}

// ──────────────────────── 校验 / 收尾 ────────────────────────

function validateStep(draft: DraftProfile, stepIdx: number): string[] {
  const errors: string[] = [];
  if (stepIdx === 0) {
    if (!draft.companyName.trim()) errors.push("公司名称未填写");
    if (!draft.providerType) errors.push("服务商类型未选择");
  }
  if (stepIdx === 1) {
    if (draft.goals.length === 0) errors.push("至少勾选 1 个目标");
    if (!draft.customerTier) errors.push("客户层级未选择");
  }
  // stepIdx === 2 (TermPay 适配) 全部可选 toggle，无强制校验
  if (stepIdx === 3) {
    if (!draft.budget) errors.push("年度预算未选择");
  }
  return errors;
}

function finalize(draft: DraftProfile): ProviderProfile {
  if (!draft.providerType || !draft.customerTier || !draft.budget) {
    throw new Error("[finalize] draft 未通过校验");
  }
  return {
    companyName: draft.companyName.trim(),
    providerType: draft.providerType,
    goals: draft.goals,
    customerTier: draft.customerTier,
    budget: draft.budget,
    hasEmbeddableSystem: draft.hasEmbeddableSystem,
    reportTier: draft.reportTier,
    wantsOfflineEvents: draft.wantsOfflineEvents,
    needsFinanceServices: draft.needsFinanceServices,
    offersCreditToCustomers: draft.offersCreditToCustomers,
    hasReceivablePressure: draft.hasReceivablePressure,
    wantsCustomerInstallment: draft.wantsCustomerInstallment,
  };
}
