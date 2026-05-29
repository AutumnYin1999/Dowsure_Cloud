import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coins,
  Database,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { OptionCard } from "@/components/ui/OptionCard";
import {
  ACQUISITION_CHANNEL_OPTIONS,
  ACQUISITION_PAIN_OPTIONS,
  ANNUAL_SPEND_OPTIONS,
  BAD_DEBT_OPTIONS,
  BUSINESS_PRESSURE_OPTIONS,
  CASH_TIGHTNESS_OPTIONS,
  COMPANY_SCALE_OPTIONS,
  CREDIT_TERM_OPTIONS,
  FINANCING_PLAN_OPTIONS,
  FOUNDED_YEARS_OPTIONS,
  PLATFORM_OPTIONS,
  PROVIDER_TYPE_OPTIONS,
  PROVIDER_TYPE_TO_DOMAIN,
  QUESTIONNAIRE_STEPS,
  RECEIVABLE_CYCLE_OPTIONS,
  REGION_OPTIONS,
  SELLER_TIER_OPTIONS,
  SERVICE_SCOPE_OPTIONS,
  SETTLEMENT_MODE_OPTIONS,
  TARGET_CATEGORY_OPTIONS,
  type OptionDef,
} from "@/schema/questionnaireSchema";
import type {
  BadDebtLevel,
  BudgetBand,
  CashTightness,
  CompanyScale,
  CreditTerm,
  CustomerTier,
  FinancingPlan,
  FoundedYears,
  GoalTag,
  ProviderProfile,
  ProviderType,
  ReceivableCycle,
  SellerTier,
} from "@/types";
import { cn } from "@/lib/utils";

interface QuestionnairePageProps {
  initial?: Partial<ProviderProfile>;
  onSubmit: (profile: ProviderProfile) => void;
  onBack: () => void;
}

interface DraftProfile {
  // 模块 1 · 基础画像
  providerTypeRaw?: string;
  serviceScopes: string[];
  foundedYears?: FoundedYears;
  companyScale?: CompanyScale;
  platforms: string[];
  customerRegions: string[];
  // 模块 2 · 获客现状
  acquisitionChannels: string[];
  acquisitionPains: string[];
  targetCategories: string[];
  targetSellerTiers: SellerTier[];
  targetRegions: string[];
  currentCustomers: string;
  monthlyNewCustomers: string;
  // 模块 3 · 回款与坏账
  settlementModes: string[];
  creditTerm?: CreditTerm;
  badDebt?: BadDebtLevel;
  receivableCycle?: ReceivableCycle;
  // 模块 4 · 经营压力与期望
  businessPressures: string[];
  cashTightness?: CashTightness;
  financingPlan?: FinancingPlan;
  annualSpend?: BudgetBand;
  openConcern: string;
  // 各题「其他」自由输入
  otherText: Record<string, string>;
}

function toDraft(initial?: Partial<ProviderProfile>): DraftProfile {
  return {
    providerTypeRaw: undefined,
    serviceScopes: initial?.serviceScopes ?? [],
    foundedYears: initial?.foundedYears,
    companyScale: initial?.companyScale,
    platforms: initial?.platforms ?? [],
    customerRegions: initial?.customerRegions ?? [],
    acquisitionChannels: initial?.acquisitionChannels ?? [],
    acquisitionPains: initial?.acquisitionPains ?? [],
    targetCategories: initial?.targetCategories ?? [],
    targetSellerTiers: initial?.targetSellerTiers ?? [],
    targetRegions: initial?.targetRegions ?? [],
    currentCustomers: initial?.currentCustomers ?? "",
    monthlyNewCustomers: initial?.monthlyNewCustomers ?? "",
    settlementModes: initial?.settlementModes ?? [],
    creditTerm: initial?.creditTerm,
    badDebt: initial?.badDebt,
    receivableCycle: initial?.receivableCycle,
    businessPressures: initial?.businessPressures ?? [],
    cashTightness: initial?.cashTightness,
    financingPlan: initial?.financingPlan,
    annualSpend: initial?.budget,
    openConcern: initial?.openConcern ?? "",
    otherText: initial?.otherText ?? {},
  };
}

interface StepMeta {
  eyebrow: string;
  icon: LucideIcon;
  helpTitle: string;
  helpBody: string;
  helpBullets: string[];
}

const STEP_META: StepMeta[] = [
  {
    eyebrow: "STEP 01 · PROFILE",
    icon: Database,
    helpTitle: "为什么先问基础画像？",
    helpBody:
      "服务类型、成立年限与规模会用于后续的服务商多维评分，也帮助理解你所处的赛道。",
    helpBullets: [
      "每个选择题都可补充「其他」",
      "公司名称仅用于诊断摘要署名",
      "信息不上传服务端，仅本地推理",
    ],
  },
  {
    eyebrow: "STEP 02 · ACQUISITION",
    icon: ScanSearch,
    helpTitle: "获客是行业第一痛点",
    helpBody:
      "我们想了解你现在怎么找客户、卡在哪里、想触达谁，从而判断获客现状是否健康。",
    helpBullets: [
      "如实选择当前真实做法即可",
      "目标卖家画像帮助理解你的客户结构",
      "客户数为选填，不强制",
    ],
  },
  {
    eyebrow: "STEP 03 · RECEIVABLES",
    icon: Coins,
    helpTitle: "回款健康度怎么看？",
    helpBody:
      "结算方式、账期和坏账反映你的现金流风险。这里只问经营现状，不涉及任何金融产品。",
    helpBullets: [
      "给账期越长，账期错配风险越高",
      "坏账与逾期是行业第二大痛点",
      "回款周期用于现金流诊断",
    ],
  },
  {
    eyebrow: "STEP 04 · OUTLOOK",
    icon: TrendingUp,
    helpTitle: "经营压力与期望",
    helpBody:
      "最后了解你当前的经营压力、资金周转和融资计划，并用一句话描述最头疼的问题。",
    helpBullets: [
      "压力可多选，反映真实经营状态",
      "年度投入用于匹配方案规模",
      "开放题帮助我们更懂你的处境",
    ],
  },
];

const COMPLIANCE_LINE =
  "Dowsure 提供技术、数据、风控与连接能力；如涉及账期金融，资金与最终授信审批由合作银行 / 资金方承担。本问卷不构成授信承诺。";

/* ───────── 演示用示例数据（value 均来自 schema OPTIONS） ───────── */
type DemoScenario = "warehouse" | "erp";

const DEMO_SCENARIOS: { id: DemoScenario; label: string }[] = [
  { id: "warehouse", label: "海外仓 · 账期承压" },
  { id: "erp", label: "ERP 工具 · 获客驱动" },
];

const DEMO_DATA: Record<DemoScenario, DraftProfile> = {
  // 场景 A：触发现金流错配 + 获客错位
  warehouse: {
    providerTypeRaw: "overseas-warehouse",
    serviceScopes: ["warehousing", "head-haul", "customs"],
    foundedYears: "3-5",
    companyScale: "medium",
    platforms: ["amazon", "walmart"],
    customerRegions: ["na", "eu"],
    acquisitionChannels: ["referral", "exhibition"],
    acquisitionPains: ["no-precise", "low-conversion"],
    targetCategories: ["home", "auto-tool"],
    targetSellerTiers: ["billion", "t0-t1"],
    targetRegions: ["na", "eu"],
    currentCustomers: "约 40 家",
    monthlyNewCustomers: "2-3 家",
    settlementModes: ["credit"],
    creditTerm: "60",
    badDebt: "few",
    receivableCycle: "gt-60",
    businessPressures: ["price-war", "cash-flow", "acquisition"],
    cashTightness: "tight",
    financingPlan: "exploring",
    annualSpend: "10w-20w",
    openConcern: "旺季仓位压货，回款又慢，垫资压力很大。",
    otherText: {},
  },
  // 场景 B：健康度较好，主诉求获客
  erp: {
    providerTypeRaw: "erp-tool",
    serviceScopes: ["saas"],
    foundedYears: "1-3",
    companyScale: "small",
    platforms: ["amazon", "independent", "tiktok"],
    customerRegions: ["na", "sea"],
    acquisitionChannels: ["ads", "referral"],
    acquisitionPains: ["high-cost"],
    targetCategories: ["3c", "apparel"],
    targetSellerTiers: ["new", "mid"],
    targetRegions: ["na", "sea"],
    currentCustomers: "约 200 家",
    monthlyNewCustomers: "15+ 家",
    settlementModes: ["monthly", "prepay-full"],
    creditTerm: "none",
    badDebt: "none",
    receivableCycle: "16-30",
    businessPressures: ["price-war"],
    cashTightness: "normal",
    financingPlan: "none",
    annualSpend: "3w-10w",
    openConcern: "客户基数不小，但转介绍增长慢，想更高效地拉新。",
    otherText: {},
  },
};

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

  const setOther = (key: string, value: string) =>
    setDraft((d) => ({ ...d, otherText: { ...d.otherText, [key]: value } }));

  const toggleIn = <K extends keyof DraftProfile>(key: K, value: string) =>
    setDraft((d) => {
      const arr = d[key] as string[];
      const next = arr.includes(value)
        ? arr.filter((x) => x !== value)
        : [...arr, value];
      return { ...d, [key]: next };
    });

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

  // 演示：一键填入示例数据 / 清空重填
  const fillDemoData = (scenario: DemoScenario) => {
    setDraft({ ...DEMO_DATA[scenario] });
    setShowErrors(false);
    setStepIdx(totalSteps - 1); // 跳到最后一步，方便直接提交看诊断
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearDemoData = () => {
    setDraft(toDraft());
    setShowErrors(false);
    setStepIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-5">
      {/* 顶部 console header */}
      <section className="dow-console-panel relative overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.28), transparent)" }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="dow-eyebrow dow-eyebrow-dot">{meta.eyebrow}</span>
            <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-white sm:text-[32px]">
              服务商经营
              <span className="dow-gradient-text">现状问卷</span>
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[color:var(--fg-mute)] sm:text-base">
              4 个模块了解你的真实经营现状，结尾给出一份客观的经营诊断。
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="font-mono text-[11px] tracking-[0.18em] text-[color:var(--fg-faint)]">
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
                      {done ? <CheckCircle2 className="h-3 w-3" strokeWidth={3} /> : idx + 1}
                    </div>
                  </div>
                  <span className="mt-1 text-sm font-medium">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* 演示工具条：一键填入示例 / 清空 */}
        <div className="mt-4 flex flex-col gap-2 border-t border-[color:var(--border)] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-faint)]">
              DEMO
            </span>
            {DEMO_SCENARIOS.map((sc) => (
              <Button
                key={sc.id}
                variant="darkGhost"
                size="sm"
                onClick={() => fillDemoData(sc.id)}
              >
                <Wand2 className="h-3.5 w-3.5" />
                {sc.label}
              </Button>
            ))}
            <Button variant="darkOutline" size="sm" onClick={clearDemoData}>
              清空重填
            </Button>
          </div>
          <span className="text-[11px] text-[color:var(--fg-faint)]">
            将根据所选场景填入不同示例
          </span>
        </div>
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
              <StepProfile draft={draft} update={update} toggleIn={toggleIn} setOther={setOther} showErrors={showErrors} />
            ) : null}
            {stepIdx === 1 ? (
              <StepAcquisition draft={draft} update={update} toggleIn={toggleIn} setOther={setOther} showErrors={showErrors} />
            ) : null}
            {stepIdx === 2 ? (
              <StepReceivables draft={draft} update={update} toggleIn={toggleIn} showErrors={showErrors} />
            ) : null}
            {stepIdx === 3 ? (
              <StepPressure draft={draft} update={update} toggleIn={toggleIn} setOther={setOther} showErrors={showErrors} />
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
                    "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3), rgba(236,72,153,0.3))",
                  border: "1px solid rgba(139,92,246,0.3)",
                }}
              >
                <meta.icon className="h-4 w-4" />
              </div>
              <span className="dow-eyebrow">CONTEXT</span>
            </div>
            <p className="mt-3 text-base font-semibold text-white">{meta.helpTitle}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--fg-mute)]">{meta.helpBody}</p>
            <ul className="mt-3 space-y-1.5">
              {meta.helpBullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs leading-relaxed text-[color:var(--fg-dim)]">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#34D399]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="dow-glass-card p-5">
            <span className="dow-eyebrow">COMPLIANCE</span>
            <p className="mt-2.5 text-xs leading-relaxed text-[color:var(--fg-mute)]">{COMPLIANCE_LINE}</p>
          </div>
        </aside>
      </div>

      {/* 底部操作栏 */}
      <div className="dow-glass-card flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Button variant="darkOutline" size="md" onClick={goPrev}>
          <ArrowLeft className="h-4 w-4" />
          {stepIdx === 0 ? "返回" : "上一步"}
        </Button>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[11px] tracking-[0.18em] text-[color:var(--fg-faint)] sm:inline">
            Step {stepIdx + 1} / {totalSteps}
          </span>
          <Button variant="gradient" size="md" onClick={goNext}>
            {stepIdx === totalSteps - 1 ? (
              <>
                生成经营诊断
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

// ──────────────────────── 复用小组件 ────────────────────────

function DarkLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p className="text-sm font-medium text-white">
      {children}
      {optional ? <span className="ml-1.5 text-xs font-normal text-[color:var(--fg-faint)]">选填</span> : null}
    </p>
  );
}

function DarkHelp({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs leading-relaxed text-[color:var(--fg-mute)]">{children}</p>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "dow-dark-input dow-focus",
        invalid && "!border-[rgba(251,113,133,0.55)] !shadow-[0_0_0_3px_rgba(251,113,133,0.15)]"
      )}
    />
  );
}

/** 单选卡组（含「其他」自由输入）。 */
function SingleCards<V extends string>({
  options,
  value,
  onSelect,
  cols = 2,
}: {
  options: OptionDef<V>[];
  value?: V;
  onSelect: (v: V) => void;
  cols?: 2 | 3;
}) {
  return (
    <div className={cn("mt-3 grid grid-cols-1 gap-2.5", cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {options.map((opt) => (
        <OptionCard
          key={opt.value}
          dark
          selected={value === opt.value}
          onClick={() => onSelect(opt.value)}
          title={opt.label}
          hint={opt.hint}
        />
      ))}
    </div>
  );
}

/** 多选卡组。 */
function MultiCards<V extends string>({
  options,
  selected,
  onToggle,
  cols = 2,
}: {
  options: OptionDef<V>[];
  selected: string[];
  onToggle: (v: V) => void;
  cols?: 2 | 3;
}) {
  return (
    <div className={cn("mt-3 grid grid-cols-1 gap-2.5", cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {options.map((opt) => (
        <OptionCard
          key={opt.value}
          dark
          multi
          selected={selected.includes(opt.value)}
          onClick={() => onToggle(opt.value)}
          title={opt.label}
          hint={opt.hint}
        />
      ))}
    </div>
  );
}

/** 「其他（请填写）」自由输入行。 */
function OtherInput({
  fieldKey,
  draft,
  setOther,
  placeholder = "其他（请填写）",
}: {
  fieldKey: string;
  draft: DraftProfile;
  setOther: (key: string, value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mt-2.5">
      <TextInput
        value={draft.otherText[fieldKey] ?? ""}
        onChange={(v) => setOther(fieldKey, v)}
        placeholder={placeholder}
      />
    </div>
  );
}

type StepProps = {
  draft: DraftProfile;
  update: <K extends keyof DraftProfile>(k: K, v: DraftProfile[K]) => void;
  toggleIn: <K extends keyof DraftProfile>(k: K, v: string) => void;
  setOther: (key: string, value: string) => void;
  showErrors: boolean;
};

// ──────────────────────── 模块 1 · 基础画像 ────────────────────────

function StepProfile({ draft, update, toggleIn, setOther, showErrors }: StepProps) {
  return (
    <div className="space-y-7">
      <div
        className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs leading-relaxed text-[color:var(--fg-mute)]"
        style={{
          background: "rgba(52,211,153,0.06)",
          border: "1px solid rgba(52,211,153,0.22)",
        }}
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#34D399]" />
        <span>问卷全程匿名，不收集任何可识别信息；填写内容仅用于本地生成经营诊断。</span>
      </div>

      <div>
        <DarkLabel>服务商类型</DarkLabel>
        <DarkHelp>单选，颗粒度尽量贴近你的主营业务</DarkHelp>
        <SingleCards
          options={PROVIDER_TYPE_OPTIONS}
          value={draft.providerTypeRaw}
          onSelect={(v) => update("providerTypeRaw", v)}
          cols={3}
        />
        {draft.providerTypeRaw === "other" ? (
          <OtherInput fieldKey="providerType" draft={draft} setOther={setOther} placeholder="请描述你的服务类型" />
        ) : null}
        {showErrors && !draft.providerTypeRaw ? (
          <p className="mt-2 text-xs text-[#ffbcd2]">请选择服务商类型</p>
        ) : null}
      </div>

      <div>
        <DarkLabel>主营服务环节</DarkLabel>
        <DarkHelp>可多选</DarkHelp>
        <MultiCards options={SERVICE_SCOPE_OPTIONS} selected={draft.serviceScopes} onToggle={(v) => toggleIn("serviceScopes", v)} cols={3} />
        <OtherInput fieldKey="serviceScopes" draft={draft} setOther={setOther} />
      </div>

      <div>
        <DarkLabel>成立年限</DarkLabel>
        <SingleCards options={FOUNDED_YEARS_OPTIONS} value={draft.foundedYears} onSelect={(v) => update("foundedYears", v)} cols={3} />
      </div>

      <div>
        <DarkLabel>团队 / 营收规模</DarkLabel>
        <SingleCards options={COMPANY_SCALE_OPTIONS} value={draft.companyScale} onSelect={(v) => update("companyScale", v)} />
      </div>

      <div>
        <DarkLabel>主营平台</DarkLabel>
        <DarkHelp>可多选</DarkHelp>
        <MultiCards options={PLATFORM_OPTIONS} selected={draft.platforms} onToggle={(v) => toggleIn("platforms", v)} cols={3} />
        <OtherInput fieldKey="platforms" draft={draft} setOther={setOther} />
      </div>

      <div>
        <DarkLabel>主要客户区域</DarkLabel>
        <DarkHelp>可多选</DarkHelp>
        <MultiCards options={REGION_OPTIONS} selected={draft.customerRegions} onToggle={(v) => toggleIn("customerRegions", v)} cols={3} />
        <OtherInput fieldKey="customerRegions" draft={draft} setOther={setOther} />
      </div>
    </div>
  );
}

// ──────────────────────── 模块 2 · 获客现状 ────────────────────────

function StepAcquisition({ draft, update, toggleIn, setOther, showErrors }: StepProps) {
  return (
    <div className="space-y-7">
      <div>
        <DarkLabel>目前主要获客方式</DarkLabel>
        <DarkHelp>可多选</DarkHelp>
        <MultiCards options={ACQUISITION_CHANNEL_OPTIONS} selected={draft.acquisitionChannels} onToggle={(v) => toggleIn("acquisitionChannels", v)} />
        <OtherInput fieldKey="acquisitionChannels" draft={draft} setOther={setOther} />
        {showErrors && draft.acquisitionChannels.length === 0 ? (
          <p className="mt-2 text-xs text-[#ffbcd2]">至少选择 1 项获客方式</p>
        ) : null}
      </div>

      <div>
        <DarkLabel>获客最大的困难</DarkLabel>
        <DarkHelp>可多选</DarkHelp>
        <MultiCards options={ACQUISITION_PAIN_OPTIONS} selected={draft.acquisitionPains} onToggle={(v) => toggleIn("acquisitionPains", v)} />
        <OtherInput fieldKey="acquisitionPains" draft={draft} setOther={setOther} />
        {showErrors && draft.acquisitionPains.length === 0 ? (
          <p className="mt-2 text-xs text-[#ffbcd2]">至少选择 1 项获客困难</p>
        ) : null}
      </div>

      <div>
        <DarkLabel>最想触达的目标品类</DarkLabel>
        <DarkHelp>可多选；选「全品类 / 不限」会清空其他品类</DarkHelp>
        <MultiCards
          options={TARGET_CATEGORY_OPTIONS}
          selected={draft.targetCategories}
          onToggle={(v) => {
            const cur = draft.targetCategories;
            let next: string[];
            if (v === "all") {
              // 选中「全品类 / 不限」→ 互斥，清空其他
              next = cur.includes("all") ? [] : ["all"];
            } else {
              // 选中具体品类 → 取消「全品类 / 不限」
              const base = cur.filter((x) => x !== "all");
              next = base.includes(v) ? base.filter((x) => x !== v) : [...base, v];
            }
            update("targetCategories", next);
          }}
          cols={3}
        />
        {draft.targetCategories.includes("other") ? (
          <OtherInput fieldKey="targetCategories" draft={draft} setOther={setOther} placeholder="请填写目标品类" />
        ) : null}
      </div>

      <div>
        <DarkLabel>目标卖家规模层级</DarkLabel>
        <DarkHelp>可多选</DarkHelp>
        <MultiCards options={SELLER_TIER_OPTIONS} selected={draft.targetSellerTiers} onToggle={(v) => toggleIn("targetSellerTiers", v)} />
      </div>

      <div>
        <DarkLabel>目标地区</DarkLabel>
        <DarkHelp>可多选</DarkHelp>
        <MultiCards options={REGION_OPTIONS} selected={draft.targetRegions} onToggle={(v) => toggleIn("targetRegions", v)} cols={3} />
        <OtherInput fieldKey="targetRegions" draft={draft} setOther={setOther} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <DarkLabel optional>当前客户数</DarkLabel>
          <div className="mt-2">
            <TextInput value={draft.currentCustomers} onChange={(v) => update("currentCustomers", v)} placeholder="如：约 120 家" />
          </div>
        </div>
        <div>
          <DarkLabel optional>月新增客户数</DarkLabel>
          <div className="mt-2">
            <TextInput value={draft.monthlyNewCustomers} onChange={(v) => update("monthlyNewCustomers", v)} placeholder="如：约 8 家 / 月" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────── 模块 3 · 回款与坏账 ────────────────────────

function StepReceivables({
  draft,
  update,
  toggleIn,
  showErrors,
}: Omit<StepProps, "setOther">) {
  return (
    <div className="space-y-7">
      <div>
        <DarkLabel>与客户的结算方式</DarkLabel>
        <DarkHelp>可多选</DarkHelp>
        <MultiCards options={SETTLEMENT_MODE_OPTIONS} selected={draft.settlementModes} onToggle={(v) => toggleIn("settlementModes", v)} />
        {showErrors && draft.settlementModes.length === 0 ? (
          <p className="mt-2 text-xs text-[#ffbcd2]">至少选择 1 种结算方式</p>
        ) : null}
      </div>

      <div>
        <DarkLabel>若给账期，平均账期</DarkLabel>
        <SingleCards options={CREDIT_TERM_OPTIONS} value={draft.creditTerm} onSelect={(v) => update("creditTerm", v)} cols={3} />
      </div>

      <div>
        <DarkLabel>去年是否遇到坏账或逾期</DarkLabel>
        <SingleCards options={BAD_DEBT_OPTIONS} value={draft.badDebt} onSelect={(v) => update("badDebt", v)} />
      </div>

      <div>
        <DarkLabel>平均应收回款周期</DarkLabel>
        <SingleCards options={RECEIVABLE_CYCLE_OPTIONS} value={draft.receivableCycle} onSelect={(v) => update("receivableCycle", v)} cols={3} />
      </div>
    </div>
  );
}

// ──────────────────────── 模块 4 · 经营压力与期望 ────────────────────────

function StepPressure({ draft, update, toggleIn, showErrors }: StepProps) {
  return (
    <div className="space-y-7">
      <div>
        <DarkLabel>当前最大的经营压力</DarkLabel>
        <DarkHelp>可多选</DarkHelp>
        <MultiCards options={BUSINESS_PRESSURE_OPTIONS} selected={draft.businessPressures} onToggle={(v) => toggleIn("businessPressures", v)} cols={3} />
        {showErrors && draft.businessPressures.length === 0 ? (
          <p className="mt-2 text-xs text-[#ffbcd2]">至少选择 1 项经营压力</p>
        ) : null}
      </div>

      <div>
        <DarkLabel>资金周转紧张度</DarkLabel>
        <SingleCards options={CASH_TIGHTNESS_OPTIONS} value={draft.cashTightness} onSelect={(v) => update("cashTightness", v)} cols={3} />
      </div>

      <div>
        <DarkLabel>是否有融资计划</DarkLabel>
        <SingleCards options={FINANCING_PLAN_OPTIONS} value={draft.financingPlan} onSelect={(v) => update("financingPlan", v)} />
      </div>

      <div>
        <DarkLabel>年度服务投入预期</DarkLabel>
        <DarkHelp>用于匹配适合你的方案规模</DarkHelp>
        <SingleCards options={ANNUAL_SPEND_OPTIONS} value={draft.annualSpend} onSelect={(v) => update("annualSpend", v)} cols={3} />
        {showErrors && !draft.annualSpend ? (
          <p className="mt-2 text-xs text-[#ffbcd2]">请选择年度服务投入预期</p>
        ) : null}
      </div>

      <div>
        <DarkLabel>用一两句话描述你现在最头疼的经营问题</DarkLabel>
        <DarkHelp>开放题，帮助我们更懂你的真实处境</DarkHelp>
        <textarea
          value={draft.openConcern}
          onChange={(e) => update("openConcern", e.target.value)}
          placeholder="例如：旺季前客户都在压价，回款又慢，资金一下子很紧……"
          rows={3}
          className="dow-dark-input dow-focus mt-2 resize-y leading-relaxed"
        />
      </div>
    </div>
  );
}

// ──────────────────────── 校验 / 收尾 ────────────────────────

function validateStep(draft: DraftProfile, stepIdx: number): string[] {
  const errors: string[] = [];
  if (stepIdx === 0) {
    if (!draft.providerTypeRaw) errors.push("服务商类型未选择");
  }
  if (stepIdx === 1) {
    if (draft.acquisitionChannels.length === 0) errors.push("获客方式未选择");
    if (draft.acquisitionPains.length === 0) errors.push("获客困难未选择");
  }
  if (stepIdx === 2) {
    if (draft.settlementModes.length === 0) errors.push("结算方式未选择");
  }
  if (stepIdx === 3) {
    if (draft.businessPressures.length === 0) errors.push("经营压力未选择");
    if (!draft.annualSpend) errors.push("年度服务投入预期未选择");
  }
  return errors;
}

/* ============================================================
   finalize：把客观答案派生为 recommender 依赖的旧字段
   ============================================================ */

function deriveGoals(draft: DraftProfile): GoalTag[] {
  const goals = new Set<GoalTag>();
  // 获客困难 → lead-gen
  if (draft.acquisitionPains.includes("no-precise") || draft.acquisitionPains.includes("low-quality")) {
    goals.add("lead-gen");
  }
  if (draft.acquisitionPains.length > 0) goals.add("lead-gen");
  // 坏账 / 给账期 → reduce-bad-debt / offer-credit
  const givesCredit = draft.settlementModes.includes("credit") || (draft.creditTerm && draft.creditTerm !== "none");
  if (givesCredit) goals.add("offer-credit");
  if (draft.badDebt === "few" || draft.badDebt === "many") goals.add("reduce-bad-debt");
  // 融资计划 → financing-tax
  if (draft.financingPlan && draft.financingPlan !== "none") goals.add("financing-tax");
  // 目标大卖 → reach-top-sellers
  if (draft.targetSellerTiers.includes("billion") || draft.targetSellerTiers.includes("t0-t1")) {
    goals.add("reach-top-sellers");
  }
  if (goals.size === 0) goals.add("lead-gen");
  return Array.from(goals);
}

function deriveCustomerTier(draft: DraftProfile): CustomerTier {
  const t = draft.targetSellerTiers;
  if (t.includes("t0-t1")) return "t0-t1";
  if (t.includes("billion")) return "billion-sellers";
  if (t.includes("mid")) return "mid-sellers";
  if (t.includes("new")) return "new-sellers";
  return "mid-sellers";
}

function deriveReceivablePressure(draft: DraftProfile): boolean {
  if (draft.cashTightness === "tight") return true;
  if (draft.creditTerm === "60" || draft.creditTerm === "gte-90") return true;
  if (draft.receivableCycle === "gt-60") return true;
  if (draft.badDebt === "many") return true;
  return false;
}

function deriveProviderType(draft: DraftProfile): ProviderType {
  return PROVIDER_TYPE_TO_DOMAIN[draft.providerTypeRaw ?? "other"] ?? "other";
}

function finalize(draft: DraftProfile): ProviderProfile {
  if (!draft.providerTypeRaw || !draft.annualSpend) {
    throw new Error("[finalize] draft 未通过校验");
  }

  const givesCredit = draft.settlementModes.includes("credit") || (draft.creditTerm != null && draft.creditTerm !== "none");
  const needsFinance = (draft.financingPlan != null && draft.financingPlan !== "none");

  return {
    // ── recommender 依赖的派生字段 ──
    companyName: "", // 匿名问卷，不收集公司名
    providerType: deriveProviderType(draft),
    goals: deriveGoals(draft),
    customerTier: deriveCustomerTier(draft),
    budget: draft.annualSpend,
    hasEmbeddableSystem: false, // 问卷未问，安全默认
    reportTier: "20", // 不再由问卷询问，默认启航版
    wantsOfflineEvents: draft.acquisitionChannels.includes("exhibition"),
    needsFinanceServices: needsFinance || draft.businessPressures.includes("compliance"),
    offersCreditToCustomers: givesCredit,
    hasReceivablePressure: deriveReceivablePressure(draft),
    wantsCustomerInstallment: false, // 问卷未问，安全默认

    // ── 客观字段（诊断 + 未来评分用） ──
    serviceScopes: draft.serviceScopes,
    foundedYears: draft.foundedYears,
    companyScale: draft.companyScale,
    platforms: draft.platforms,
    customerRegions: draft.customerRegions,
    acquisitionChannels: draft.acquisitionChannels,
    acquisitionPains: draft.acquisitionPains,
    targetCategories: draft.targetCategories,
    targetSellerTiers: draft.targetSellerTiers,
    targetRegions: draft.targetRegions,
    currentCustomers: draft.currentCustomers.trim(),
    monthlyNewCustomers: draft.monthlyNewCustomers.trim(),
    settlementModes: draft.settlementModes,
    creditTerm: draft.creditTerm,
    badDebt: draft.badDebt,
    receivableCycle: draft.receivableCycle,
    businessPressures: draft.businessPressures,
    cashTightness: draft.cashTightness,
    financingPlan: draft.financingPlan,
    openConcern: draft.openConcern.trim(),
    otherText: draft.otherText,
  };
}
