import { useEffect, useState } from "react";
import { AnalyzingPage } from "@/components/AnalyzingPage";
import { DiagnosisPage } from "@/components/DiagnosisPage";
import { GatewayPage } from "@/components/GatewayPage";
import { ProviderProfilePage } from "@/components/ProviderProfilePage";
import { QuestionnairePage } from "@/components/QuestionnairePage";
import { RecommendationPage } from "@/components/RecommendationPage";
import { SellerHomePage } from "@/components/SellerHomePage";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { StepsHeader, type FlowStep } from "@/components/StepsHeader";
import { TermPayDashboardPreview } from "@/components/TermPayDashboardPreview";
import { ToastHost, showToast } from "@/components/ui/Toast";
import type { ProviderProfile } from "@/types";

type AppStep = "gateway" | "seller-home" | "provider-profile" | FlowStep;

const STEP_PATHS: Record<AppStep, string> = {
  gateway: "/",
  "seller-home": "/seller",
  "provider-profile": "/seller/provider",
  questionnaire: "/provider/intake",
  analyzing: "/provider/analyzing",
  diagnosis: "/provider/diagnosis",
  result: "/provider/result",
  welcome: "/",
};

function stepFromPath(pathname: string): AppStep {
  if (pathname.startsWith("/seller/provider")) return "provider-profile";
  if (pathname.startsWith("/seller")) return "seller-home";
  if (pathname.startsWith("/provider/analyzing")) return "analyzing";
  if (pathname.startsWith("/provider/diagnosis")) return "diagnosis";
  if (pathname.startsWith("/provider/result")) return "result";
  if (pathname.startsWith("/provider")) return "questionnaire";
  return "gateway";
}

export default function App() {
  const dashboardPath = window.location.pathname.startsWith("/termpay-dashboard")
    ? window.location.pathname
    : null;
  const [step, setStep] = useState<AppStep>(() =>
    stepFromPath(window.location.pathname)
  );
  const [profile, setProfile] = useState<ProviderProfile | null>(null);

  useEffect(() => {
    const onPopState = () => {
      setStep(stepFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(next: AppStep) {
    const path = STEP_PATHS[next];
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetHome() {
    setProfile(null);
    navigate("gateway");
  }

  if (dashboardPath) {
    return (
      <div className="dow-dark-page relative min-h-full">
        <ToastHost />
        <TermPayDashboardPreview path={dashboardPath} />
      </div>
    );
  }

  return (
    <div className="dow-dark-page relative min-h-full">
      <ToastHost />
      <SiteHeader
        onHome={
          step === "gateway"
            ? undefined
            : resetHome
        }
        onEnterConsole={() => navigate("seller-home")}
        onSellerEntry={() => navigate("seller-home")}
        onProviderEntry={() => navigate("questionnaire")}
      />

      {step === "gateway" ? (
        <GatewayPage
          onSelectProvider={() => navigate("questionnaire")}
          onSelectSeller={() => navigate("seller-home")}
        />
      ) : step === "seller-home" ? (
        <SellerHomePage
          onViewProfile={() =>
            window.open(STEP_PATHS["provider-profile"], "_blank", "noopener")
          }
        />
      ) : step === "provider-profile" ? (
        <ProviderProfilePage
          onBackToDesk={() => navigate("seller-home")}
          onHome={resetHome}
        />
      ) : (
        <main className="container max-w-6xl pb-24 pt-20 sm:pt-24">
          <div className="space-y-4 sm:space-y-5">
            <StepsHeader current={step as FlowStep} />

            {step === "questionnaire" ? (
              <QuestionnairePage
                initial={profile ?? undefined}
                onBack={resetHome}
                onSubmit={(p) => {
                  setProfile(p);
                  navigate("analyzing");
                }}
              />
            ) : null}

            {step === "analyzing" ? (
              <AnalyzingPage onDone={() => navigate("diagnosis")} />
            ) : null}

            {step === "diagnosis" && profile ? (
              <DiagnosisPage
                profile={profile}
                onBack={() => navigate("questionnaire")}
                onContinue={() => navigate("result")}
              />
            ) : null}

            {step === "result" && profile ? (
              <RecommendationPage
                profile={profile}
                onProfileChange={(p) => setProfile(p)}
                onEditQuestionnaire={() => navigate("questionnaire")}
                onRestart={resetHome}
                onConfirmOrder={() =>
                  showToast("已记录方案，确认下单流程即将上线")
                }
              />
            ) : null}
          </div>
        </main>
      )}

      <SiteFooter />
    </div>
  );
}
