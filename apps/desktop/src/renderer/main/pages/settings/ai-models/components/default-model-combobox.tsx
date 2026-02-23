"use client";
import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface DefaultModelComboboxProps {
  modelType: "speech" | "language";
  title?: string;
}

export default function DefaultModelCombobox({
  modelType,
  title,
}: DefaultModelComboboxProps) {
  const { t } = useTranslation();
  const modelTypeLabel = t(`settings.aiModels.modelTypes.${modelType}`);
  const resolvedTitle = title ?? t("settings.aiModels.defaultModels.default");

  // tRPC queries and mutations
  const utils = api.useUtils();

  // Unified queries
  const modelsQuery = api.models.getModels.useQuery({
    type: modelType,
    selectable: true, // Only show models that can be selected (downloaded local or synced provider)
  });

  const defaultModelQuery = api.models.getDefaultModel.useQuery({
    type: modelType,
  });

  // Subscribe to model selection changes
  api.models.onSelectionChanged.useSubscription(undefined, {
    onData: ({ modelType: changedType }) => {
      // Only invalidate if the change is for our model type
      if (changedType === modelType) {
        utils.models.getDefaultModel.invalidate({ type: modelType });
        utils.models.getModels.invalidate({ type: modelType });
      }
    },
    onError: (error) => {
      console.error("Selection changed subscription error:", error);
    },
  });

  api.models.onDownloadComplete.useSubscription(undefined, {
    onData: () => {
      utils.models.getModels.invalidate({ type: modelType });
    },
    onError: (error) => {
      console.error("Selection changed subscription error:", error);
    },
  });

  api.models.onModelDeleted.useSubscription(undefined, {
    onData: () => {
      utils.models.getModels.invalidate({ type: modelType });
    },
    onError: (error) => {
      console.error("Selection changed subscription error:", error);
    },
  });

  // Unified mutation
  const setDefaultModelMutation = api.models.setDefaultModel.useMutation({
    onSuccess: () => {
      utils.models.getDefaultModel.invalidate({ type: modelType });
      toast.success(
        t("settings.aiModels.defaultModel.toast.updated", {
          modelType: modelTypeLabel,
        }),
      );
    },
    onError: (error) => {
      console.error(`Failed to set default ${modelType} model:`, error);
      toast.error(
        t("settings.aiModels.defaultModel.toast.updateFailed", {
          modelType: modelTypeLabel,
        }),
      );
    },
  });

  // Transform models for display
  const modelOptions = useMemo(() => {
    if (!modelsQuery.data) return [];
    return modelsQuery.data.map((m) => ({
      value: m.id,
      label: m.name,
    }));
  }, [modelsQuery.data]);

  const handleModelChange = (modelId: string) => {
    if (!modelId || modelId === defaultModelQuery.data) return;
    setDefaultModelMutation.mutate({ type: modelType, modelId });
  };

  // Loading state
  if (modelsQuery.isLoading || defaultModelQuery.isLoading) {
    return (
      <div>
        <Label className="text-lg font-semibold">{resolvedTitle}</Label>
        <div className="mt-2 max-w-xs">
          <Combobox
            options={[]}
            value=""
            onChange={() => {}}
            placeholder={t("settings.aiModels.defaultModel.loading")}
            disabled
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label className="text-lg font-semibold">{resolvedTitle}</Label>
      <div className="mt-2 max-w-xs">
        <Combobox
          options={modelOptions}
          value={defaultModelQuery.data || ""}
          onChange={handleModelChange}
          placeholder={t("settings.aiModels.defaultModel.placeholder")}
        />
      </div>
    </div>
  );
}
