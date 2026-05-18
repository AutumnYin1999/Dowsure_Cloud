import { useState } from "react";
import { AnalyzingPage } from "@/components/AnalyzingPage";
import { QuestionnairePage } from "@/components/QuestionnairePage";
import { RecommendationPage } from "@/components/RecommendationPage";
import { FloatingCTA, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { StepsHeader, type FlowStep } from "@/components/StepsHeader";
import { ToastHost } from "@/components/ui/Toast";
import { WelcomePage } from "@/components/WelcomePage";
import type { ProviderProfile } from "@/types";

export default function App() {
  const [step, setStep] = useState<FlowStep>("welcome");
  const [profile, setProfile] = useState<ProviderProfile | null>(null);

  const onPrimaryCTA = () => {
    if (step === "welcome") setStep("questionnaire");
    else if (step === "result") {
      // 推荐页右下角 CTA = 复制摘要 (由该页面自己处理)
    }
  };

  return (
    <div className="relative min-h-full bg-surface-alt">
      <ToastHost />
      <SiteHeader activeTab="matrix" />

      <main className="container max-w-6xl pb-20 pt-4 sm:pt-6">
        <div className="space-y-4 sm:space-y-5">
          <StepsHeader current={step} />

          {step === "welcome" ? (
            <WelcomePage onStart={() => setStep("questionnaire")} />
          ) : null}

          {step === "questionnaire" ? (
            <QuestionnairePage
              initial={profile ?? undefined}
              onBack={() => setStep("welcome")}
              onSubmit={(p) => {
                setProfile(p);
                setStep("analyzing");
              }}
            />
          ) : null}

          {step === "analyzing" ? (
            <AnalyzingPage onDone={() => setStep("result")} />
          ) : null}

          {step === "result" && profile ? (
            <RecommendationPage
              profile={profile}
              onProfileChange={(p) => setProfile(p)}
              onEditQuestionnaire={() => setStep("questionnaire")}
              onRestart={() => {
                setProfile(null);
                setStep("welcome");
              }}
            />
          ) : null}
        </div>
      </main>

      {step === "welcome" ? (
        <FloatingCTA
          label="开始评估 / 生成方案"
          hint="联系专属商务经理"
          onClick={onPrimaryCTA}
        />
      ) : null}

      <SiteFooter />
    </div>
  );
}
