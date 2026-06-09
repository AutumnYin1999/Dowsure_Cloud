import { useEffect, useState } from "react";
import { AgentChatPage } from "@/components/AgentChatPage";
import { ConsolePage } from "@/components/ConsolePage";
import { ProviderAgentPage } from "@/components/ProviderAgentPage";
import { AnalyzingPage } from "@/components/AnalyzingPage";
import { CheckoutPage } from "@/components/CheckoutPage";
import { DiagnosisPage } from "@/components/DiagnosisPage";
import { GatewayPage } from "@/components/GatewayPage";
import { ProviderProfilePage } from "@/components/ProviderProfilePage";
import { EntitlementsMatrix } from "@/components/postLogin/EntitlementsMatrix";
import { QuestionnairePage } from "@/components/QuestionnairePage";
import { RecommendationPage } from "@/components/RecommendationPage";
import { ServiceStatusPage } from "@/components/ServiceStatusPage";
import { SellerChatPage } from "@/components/SellerChatPage";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { StepsHeader, type FlowStep } from "@/components/StepsHeader";
import { TermPayDashboardPreview } from "@/components/TermPayDashboardPreview";
import { ToastHost } from "@/components/ui/Toast";
import type { ProviderProfile } from "@/types";

type AppStep =
  | "gateway"
  | "seller-home"
  | "seller-agent"
  | "provider-agent"
  | "chat"
  | "provider-profile"
  | "checkout"
  | "service-status"
  | "entitlements"
  | "console"
  | FlowStep;

const STEP_PATHS: Record<AppStep, string> = {
  gateway: "/",
  "seller-home": "/seller",
  "seller-agent": "/seller-agent",
  "provider-agent": "/provider-agent",
  chat: "/chat",
  "provider-profile": "/seller/provider",
  questionnaire: "/provider/intake",
  analyzing: "/provider/analyzing",
  diagnosis: "/provider/diagnosis",
  result: "/provider/result",
  checkout: "/provider/checkout",
  "service-status": "/provider/service",
  entitlements: "/provider/entitlements",
  console: "/console",
  welcome: "/",
};

function stepFromPath(pathname: string): AppStep {
  if (pathname.startsWith("/seller-agent")) return "seller-agent";
  if (pathname.startsWith("/provider-agent")) return "provider-agent";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/seller/provider")) return "provider-profile";
  if (pathname.startsWith("/seller")) return "seller-home";
  if (pathname.startsWith("/provider/analyzing")) return "analyzing";
  if (pathname.startsWith("/provider/diagnosis")) return "diagnosis";
  if (pathname.startsWith("/provider/result")) return "result";
  if (pathname.startsWith("/provider/checkout")) return "checkout";
  if (pathname.startsWith("/provider/service")) return "service-status";
  if (pathname.startsWith("/provider/entitlements")) return "entitlements";
  if (pathname.startsWith("/console")) return "console";
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
  const [orderBenefitIds, setOrderBenefitIds] = useState<string[]>([]);

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
        onEnterConsole={() => navigate("service-status")}
        onSellerEntry={() => navigate("seller-agent")}
        onProviderEntry={() => navigate("provider-agent")}
      />

      {step === "gateway" ? (
        <GatewayPage
          onSelectProvider={() => navigate("provider-agent")}
          onSelectSeller={() => navigate("seller-agent")}
          onConsole={() => navigate("console")}
        />
      ) : step === "seller-home" ? (
        <SellerChatPage lockedLine="seller" onHome={resetHome} />
      ) : step === "seller-agent" ? (
        <AgentChatPage onHome={resetHome} />
      ) : step === "provider-agent" ? (
        <ProviderAgentPage
          onHome={resetHome}
          onConfirmOrder={(p) => {
            setProfile(p);
            navigate("result");
          }}
        />
      ) : step === "chat" ? (
        <SellerChatPage onHome={resetHome} />
      ) : step === "provider-profile" ? (
        <ProviderProfilePage
          onBackToDesk={() => navigate("seller-home")}
          onHome={resetHome}
        />
      ) : step === "checkout" && profile ? (
        <main className="container max-w-5xl pb-24 pt-20 sm:pt-24">
          <CheckoutPage
            profile={profile}
            selectedBenefitIds={orderBenefitIds}
            onBack={() => navigate("result")}
            onHome={resetHome}
            onViewServiceStatus={() => navigate("service-status")}
          />
        </main>
      ) : step === "service-status" ? (
        <main className="container max-w-6xl pb-24 pt-20 sm:pt-24">
          <ServiceStatusPage onHome={resetHome} />
        </main>
      ) : step === "entitlements" ? (
        <main className="container max-w-6xl pb-24 pt-20 sm:pt-24">
          <EntitlementsMatrix />
        </main>
      ) : step === "console" ? (
        <ConsolePage onHome={resetHome} />
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
                onConfirmOrder={(ids) => {
                  setOrderBenefitIds(ids);
                  navigate("checkout");
                }}
              />
            ) : null}
          </div>
        </main>
      )}

      <SiteFooter />
    </div>
  );
}
