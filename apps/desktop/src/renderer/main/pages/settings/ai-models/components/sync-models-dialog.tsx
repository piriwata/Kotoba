"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface SyncModelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: "Ollama";
  modelType?: "language";
}

export default function SyncModelsDialog({
  open,
  onOpenChange,
  provider,
  modelType = "language",
}: SyncModelsDialogProps) {
  const { t } = useTranslation();
  const providerLabel = t("settings.aiModels.providers.ollama");

  // Local state
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState<string>("");

  // tRPC queries and mutations
  const utils = api.useUtils();
  const modelProvidersConfigQuery =
    api.settings.getModelProvidersConfig.useQuery();
  const syncedModelsQuery = api.models.getSyncedProviderModels.useQuery();
  const defaultLanguageModelQuery =
    api.models.getDefaultLanguageModel.useQuery();

  const fetchOllamaModelsQuery = api.models.fetchOllamaModels.useQuery(
    { url: ollamaUrl },
    { enabled: false },
  );

  const syncProviderModelsMutation =
    api.models.syncProviderModelsToDatabase.useMutation({
      onSuccess: () => {
        utils.models.getSyncedProviderModels.invalidate();
        utils.models.getDefaultLanguageModel.invalidate();
        toast.success(t("settings.aiModels.syncDialog.toast.synced"));
      },
      onError: (error: unknown) => {
        console.error("Failed to sync models to database:", error);
        toast.error(t("settings.aiModels.syncDialog.toast.syncFailed"));
      },
    });

  const setDefaultLanguageModelMutation =
    api.models.setDefaultLanguageModel.useMutation({
      onSuccess: () => {
        utils.models.getDefaultLanguageModel.invalidate();
      },
    });

  // Extract credentials when provider config is available
  useEffect(() => {
    if (modelProvidersConfigQuery.data) {
      setOllamaUrl(modelProvidersConfigQuery.data.ollama?.url ?? "");
    }
  }, [modelProvidersConfigQuery.data]);

  // Pre-select already synced models and start fetching when dialog opens
  useEffect(() => {
    if (open && syncedModelsQuery.data) {
      const syncedModelIds = syncedModelsQuery.data
        .filter((m) => m.provider === provider)
        .map((m) => m.id);
      setSelectedModels(syncedModelIds);
      setSearchTerm("");
      if (ollamaUrl) {
        fetchOllamaModelsQuery.refetch();
      }
    }
  }, [open, syncedModelsQuery.data, provider, ollamaUrl]);

  const availableModels = fetchOllamaModelsQuery.data || [];
  const isFetching =
    fetchOllamaModelsQuery.isLoading || fetchOllamaModelsQuery.isFetching;
  const fetchError = fetchOllamaModelsQuery.error?.message || "";

  const filteredModels = availableModels.filter(
    (model) =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleModel = (modelId: string, checked: boolean) => {
    if (checked) {
      setSelectedModels((prev) => [...prev, modelId]);
    } else {
      setSelectedModels((prev) => prev.filter((id) => id !== modelId));
    }
  };

  const handleSync = async () => {
    const modelsToSync = availableModels.filter((model) =>
      selectedModels.includes(model.id),
    );

    await syncProviderModelsMutation.mutateAsync({
      provider,
      models: modelsToSync,
    });

    if (modelsToSync.length > 0 && !defaultLanguageModelQuery.data) {
      setDefaultLanguageModelMutation.mutate({
        modelId: modelsToSync[0].id,
      });
    }

    handleCancel();
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedModels([]);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {t("settings.aiModels.syncDialog.title", {
              provider: providerLabel,
              modelType: "",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("settings.aiModels.syncDialog.description", {
              provider: providerLabel,
              modelType: "",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto">
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>
                {t("settings.aiModels.syncDialog.fetching", {
                  available: t("settings.aiModels.syncDialog.available"),
                })}
              </span>
            </div>
          ) : fetchError ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-2">
                {t("settings.aiModels.syncDialog.fetchFailed")}
              </p>
              <p className="text-sm text-muted-foreground">{fetchError}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Input
                  placeholder={t(
                    "settings.aiModels.syncDialog.searchPlaceholder",
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  {t("settings.aiModels.syncDialog.clear")}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredModels.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() =>
                      toggleModel(model.id, !selectedModels.includes(model.id))
                    }
                  >
                    <Checkbox
                      id={model.id}
                      checked={selectedModels.includes(model.id)}
                      onCheckedChange={(checked) =>
                        toggleModel(model.id, !!checked)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none flex-1">
                      <span className="text-sm font-medium leading-none cursor-pointer">
                        {model.name}
                      </span>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {model.size && (
                          <span>
                            {t("settings.aiModels.syncDialog.size", {
                              size: model.size,
                            })}
                          </span>
                        )}
                        <span>
                          {t("settings.aiModels.syncDialog.context", {
                            context: model.context,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t("settings.aiModels.syncDialog.cancel")}
          </Button>
          <Button
            onClick={handleSync}
            disabled={
              selectedModels.length === 0 ||
              syncProviderModelsMutation.isPending
            }
          >
            {syncProviderModelsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("settings.aiModels.syncDialog.syncing")}
              </>
            ) : (
              t("settings.aiModels.syncDialog.syncButton", {
                count: selectedModels.length,
              })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
