import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { FieldHelp, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { OptionCard } from "@/components/ui/OptionCard";
import { Progress } from "@/components/ui/Progress";
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
  };
}

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
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                第 {stepIdx + 1} / {totalSteps} 步
              </p>
              <CardTitle className="mt-1 text-lg sm:text-xl">
                {step.title}
              </CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </div>
            <div className="w-full sm:w-48">
              <Progress value={((stepIdx + 1) / totalSteps) * 100} />
              <p className="mt-1.5 text-right text-[11px] text-ink-soft">
                {Math.round(((stepIdx + 1) / totalSteps) * 100)}% 完成
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody className="space-y-8">
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
            <StepBudgetAndCapabilities
              draft={draft}
              update={update}
              showErrors={showErrors}
            />
          ) : null}

          {showErrors && stepErrors.length > 0 ? (
            <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/5 px-4 py-3 text-sm text-accent-rose">
              <p className="font-medium">请先补充以下信息</p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs">
                {stepErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="md" onClick={goPrev}>
          <ArrowLeft className="h-4 w-4" />
          {stepIdx === 0 ? "返回欢迎页" : "上一步"}
        </Button>
        <Button size="md" onClick={goNext}>
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
  );
}

// ──────────────────────── 分步 ────────────────────────

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
    <div className="space-y-6">
      <div>
        <Label htmlFor="company-name">公司名称</Label>
        <Input
          id="company-name"
          value={draft.companyName}
          onChange={(e) => update("companyName", e.target.value)}
          placeholder="例如:豆沙包跨境物流"
          className={cn(
            showErrors && !draft.companyName.trim() && "border-accent-rose"
          )}
        />
        <FieldHelp>用于生成推荐摘要时的署名,不会上传服务端</FieldHelp>
      </div>

      <div>
        <Label>服务商类型</Label>
        <FieldHelp className="mb-3">单选,影响金融、风控、嵌入式入口的推荐</FieldHelp>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {PROVIDER_TYPES.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={draft.providerType === opt.value}
              onClick={() => update("providerType", opt.value)}
              title={opt.label}
              hint={opt.hint}
            />
          ))}
        </div>
        {showErrors && !draft.providerType ? (
          <p className="mt-2 text-xs text-accent-rose">请选择一个服务商类型</p>
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
    <div className="space-y-6">
      <div>
        <Label>当前主要目标</Label>
        <FieldHelp className="mb-3">
          可多选,建议 2-4 项;最影响最终方案命名
        </FieldHelp>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {GOALS.map((opt) => (
            <OptionCard
              key={opt.value}
              multi
              selected={draft.goals.includes(opt.value)}
              onClick={() => toggleGoal(opt.value)}
              title={opt.label}
            />
          ))}
        </div>
        {showErrors && draft.goals.length === 0 ? (
          <p className="mt-2 text-xs text-accent-rose">至少勾选 1 个目标</p>
        ) : null}
      </div>

      <div>
        <Label>客户层级</Label>
        <FieldHelp className="mb-3">
          单选,用于判断是否推荐「大卖有约」「私享会」等高净值权益
        </FieldHelp>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {CUSTOMER_TIERS.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={draft.customerTier === opt.value}
              onClick={() => update("customerTier", opt.value)}
              title={opt.label}
            />
          ))}
        </div>
        {showErrors && !draft.customerTier ? (
          <p className="mt-2 text-xs text-accent-rose">请选择客户层级</p>
        ) : null}
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
    <div className="space-y-6">
      <div>
        <Label>年度预算</Label>
        <FieldHelp className="mb-3">
          预算决定方案上限。≥20 万解锁尊享权益,≥80 万额外赠送独家权益
        </FieldHelp>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {BUDGET_BANDS.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={draft.budget === opt.value}
              onClick={() => update("budget", opt.value)}
              title={opt.label}
            />
          ))}
        </div>
        {showErrors && !draft.budget ? (
          <p className="mt-2 text-xs text-accent-rose">请选择年度预算</p>
        ) : null}
      </div>

      <div>
        <Label>希望的数据获客报告数量</Label>
        <FieldHelp className="mb-3">
          基础包默认 20 份;80 份对应跃升版;120 份及深度营销对应领航版 (需 ≥20 万)
        </FieldHelp>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {REPORT_TIERS.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={draft.reportTier === opt.value}
              onClick={() => update("reportTier", opt.value)}
              title={opt.label}
              hint={opt.hint}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-1">
        <Toggle
          id="embed-system"
          checked={draft.hasEmbeddableSystem}
          onChange={(v) => update("hasEmbeddableSystem", v)}
          label="是否已有自有系统 / 官网 / 客户后台 / ERP,可用于嵌入金融入口"
          hint="若有,系统会强烈推荐「嵌入式金融跳转端口」"
        />
        <Toggle
          id="offline"
          checked={draft.wantsOfflineEvents}
          onChange={(v) => update("wantsOfflineEvents", v)}
          label="是否希望参与线下活动 / 游学 / 闭门会"
        />
        <Toggle
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
  if (stepIdx === 2) {
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
  };
}
