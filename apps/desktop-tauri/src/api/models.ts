import { invoke } from "@tauri-apps/api/core";

export interface Model {
  id: string;
  provider: string;
  name: string;
  modelType: string;
  size?: string;
  context?: string;
  description?: string;
  localPath?: string;
  sizeBytes?: number;
  checksum?: string;
  downloadedAt?: number;
  speed?: number;
  accuracy?: number;
  createdAt: number;
  updatedAt: number;
}

export const modelsApi = {
  getModels: () => invoke<Model[]>("get_models"),

  getSelectedModel: () => invoke<string | null>("get_selected_model"),

  selectModel: (modelId: string) =>
    invoke<void>("select_model", { modelId }),

  saveModel: (model: Model) => invoke<void>("save_model", { model }),

  deleteModel: (id: string, provider: string) =>
    invoke<void>("delete_model", { id, provider }),
};
