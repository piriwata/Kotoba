import React, { useState, useEffect } from "react";
import { OnboardingLayout } from "../shared/OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/trpc/react";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ModelSelectionScreenProps {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Model selection screen - lets users select an Ollama model for AI formatting.
 * Users who haven't installed Ollama can skip this step.
 */
export function ModelSelectionScreen({
  onNext,
  onBack,
}: ModelSelectionScreenProps) {
  const { t } = useTranslation();
  const DEFAULT_OLLAMA_URL = "http://localhost:11434";

  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL);
  const [isConnecting, setIsConnecting] = useState(false);
  const [models, setModels] = useState<
    Array<{ id: string; name: string; size?: string | null }>
  >([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const utils = api.useUtils();

  // Load saved Ollama URL if available
  const modelProvidersConfigQuery =
    api.settings.getModelProvidersConfig.useQuery();
  useEffect(() => {
    if (modelProvidersConfigQuery.data?.ollama?.url) {
      setOllamaUrl(modelProvidersConfigQuery.data.ollama.url);
    }
  }, [modelProvidersConfigQuery.data]);

  const setOllamaConfigMutation = api.settings.setOllamaConfig.useMutation();
  const syncModelsMutation =
    api.models.syncProviderModelsToDatabase.useMutation();
  const setDefaultLanguageModelMutation =
    api.models.setDefaultLanguageModel.useMutation();

  const handleConnect = async () => {
    if (!ollamaUrl.trim()) return;

    setIsConnecting(true);
    setConnected(false);
    setModels([]);
    setSelectedModelId(null);

    try {
      const fetched = await utils.models.fetchOllamaModels.fetch({
        url: ollamaUrl,
      });
      // Exclude embedding models (consistent with getModels type:"language" filter)
      const languageModels = fetched.filter(
        (m) => !m.name.toLowerCase().includes("embed"),
      );
      setModels(languageModels);
      if (languageModels.length > 0) {
        setSelectedModelId(languageModels[0].id);
      }
      setConnected(true);
    } catch (error) {
      console.error("Failed to fetch Ollama models:", error);
      toast.error(t("onboarding.modelSelection.ollama.connectionFailed"));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      await setOllamaConfigMutation.mutateAsync({ url: ollamaUrl });

      if (selectedModelId) {
        const modelsToSync = models.filter((m) => m.id === selectedModelId);
        await syncModelsMutation.mutateAsync({
          provider: "Ollama",
          models: modelsToSync,
        });
        await setDefaultLanguageModelMutation.mutateAsync({
          modelId: selectedModelId,
        });
      }

      onNext();
    } catch (error) {
      console.error("Failed to save Ollama settings:", error);
      toast.error(t("onboarding.modelSelection.ollama.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingLayout
      title={t("onboarding.modelSelection.title")}
      subtitle={t("onboarding.modelSelection.subtitle")}
      footer={
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("onboarding.navigation.back")}
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onNext} type="button">
              {t("onboarding.modelSelection.ollama.skip")}
            </Button>
            {connected && (
              <Button
                onClick={handleContinue}
                disabled={isSaving || !selectedModelId}
                className="gap-2"
                type="button"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {t("onboarding.navigation.continue")}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Ollama URL input */}
        <div className="space-y-2">
          <Label htmlFor="ollama-url">
            {t("onboarding.modelSelection.ollama.urlLabel")}
          </Label>
          <div className="flex gap-2">
            <Input
              id="ollama-url"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
              className="flex-1"
            />
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !ollamaUrl.trim()}
              type="button"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("onboarding.modelSelection.ollama.connect")
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("onboarding.modelSelection.ollama.urlHint")}
          </p>
        </div>

        {/* Model list */}
        {connected && models.length > 0 && (
          <div className="space-y-3">
            <Label>{t("onboarding.modelSelection.ollama.selectModel")}</Label>
            <RadioGroup
              value={selectedModelId || ""}
              onValueChange={setSelectedModelId}
              className="space-y-2"
            >
              {models.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30"
                >
                  <RadioGroupItem value={model.id} id={model.id} />
                  <Label
                    htmlFor={model.id}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    <span className="font-medium">{model.name}</span>
                    {model.size && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {model.size}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {connected && models.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            {t("onboarding.modelSelection.ollama.noModels")}
          </p>
        )}
      </div>
    </OnboardingLayout>
  );
}
