import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { OnboardingLayout } from "../shared/OnboardingLayout";
import { NavigationButtons } from "../shared/NavigationButtons";
import { ModelSetupModal } from "./ModelSetupModal";
import { ModelType } from "../../../../types/onboarding";
import { Laptop, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ModelSelectionScreenProps {
  onNext: (modelType: ModelType, recommendationFollowed: boolean) => void;
  onBack: () => void;
  initialSelection?: ModelType;
}

/**
 * Model selection screen - shows local model setup
 */
export function ModelSelectionScreen({
  onNext,
  onBack,
  initialSelection,
}: ModelSelectionScreenProps) {
  const { t } = useTranslation();
  const [showSetupModal, setShowSetupModal] = useState(
    initialSelection === ModelType.Local,
  );
  const [setupComplete, setSetupComplete] = useState(false);

  const handleModelSelect = () => {
    setShowSetupModal(true);
  };

  const handleSetupComplete = () => {
    setSetupComplete(true);
  };

  const handleContinue = () => {
    if (!setupComplete) {
      toast.error(t("onboarding.modelSelection.toast.completeSetup"));
      return;
    }
    onNext(ModelType.Local, true);
  };

  return (
    <OnboardingLayout
      title={t("onboarding.modelSelection.title")}
      subtitle={t("onboarding.modelSelection.subtitle")}
      footer={
        <NavigationButtons
          onBack={onBack}
          onNext={handleContinue}
          disableNext={!setupComplete}
          nextLabel={
            setupComplete
              ? t("onboarding.navigation.continue")
              : t("onboarding.modelSelection.completeSetupToContinue")
          }
        />
      }
    >
      <div className="space-y-4">
        <Card
          className={`cursor-pointer transition-colors ${
            setupComplete
              ? "border-primary bg-primary/5"
              : "hover:border-muted-foreground/50"
          }`}
          onClick={handleModelSelect}
        >
          <div className="flex items-start gap-4 px-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-slate-500/10">
                    <Laptop className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-medium">
                      {t("onboarding.modelSelection.models.local.title")}
                    </h3>
                    <p className="text-sm">
                      {t("onboarding.modelSelection.models.local.subtitle")}
                    </p>
                  </div>
                </div>
                {setupComplete && (
                  <div className="rounded-full bg-green-500/10 p-1">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {t("onboarding.modelSelection.models.local.description")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <ModelSetupModal
        isOpen={showSetupModal}
        onClose={(wasCompleted) => {
          setShowSetupModal(false);
          if (!wasCompleted && !setupComplete) {
            // User cancelled without completing
          }
        }}
        modelType={ModelType.Local}
        onContinue={() => {
          handleSetupComplete();
          onNext(ModelType.Local, true);
        }}
      />
    </OnboardingLayout>
  );
}
