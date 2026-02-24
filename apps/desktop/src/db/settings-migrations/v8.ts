import type { AppSettingsData } from "../schema";

// v7 -> v8: Remove cloud mode data (auth, amical-cloud model/formatting selections from upstream Amical)
export function migrateToV8(data: unknown): AppSettingsData {
  type OldData = Omit<AppSettingsData, "onboarding"> & {
    auth?: unknown;
    onboarding?: {
      completedVersion: number;
      completedAt: string;
      lastVisitedScreen?: string;
      skippedScreens?: string[];
      featureInterests?: string[];
      discoverySource?: string;
      selectedModelType: "cloud" | "local";
      modelRecommendation?: {
        suggested: "cloud" | "local";
        reason: string;
        followed: boolean;
      };
    };
  };

  const oldData = data as OldData;

  // Build new data without auth section
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { auth: _auth, ...dataWithoutAuth } = oldData;
  const newData = { ...dataWithoutAuth } as AppSettingsData;

  // Clear amical-cloud speech model selection
  if (newData.modelProvidersConfig?.defaultSpeechModel === "amical-cloud") {
    newData.modelProvidersConfig = {
      ...newData.modelProvidersConfig,
      defaultSpeechModel: undefined,
    };
  }

  // Clear amical-cloud formatting model selection
  if (newData.formatterConfig?.modelId === "amical-cloud") {
    newData.formatterConfig = {
      ...newData.formatterConfig,
      enabled: false,
      modelId: undefined,
    };
  }
  if (newData.formatterConfig?.fallbackModelId === "amical-cloud") {
    newData.formatterConfig = {
      ...newData.formatterConfig,
      fallbackModelId: undefined,
    };
  }

  // Update onboarding selectedModelType if it was "cloud"
  if (oldData.onboarding?.selectedModelType === "cloud") {
    newData.onboarding = {
      ...newData.onboarding!,
      selectedModelType: "local",
    };
  }
  if (oldData.onboarding?.modelRecommendation?.suggested === "cloud") {
    newData.onboarding = {
      ...newData.onboarding!,
      modelRecommendation: {
        ...newData.onboarding!.modelRecommendation!,
        suggested: "local",
      },
    };
  }

  return newData;
}
