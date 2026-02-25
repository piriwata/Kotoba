import { invoke } from "@tauri-apps/api/core";

export interface Transcription {
  id: number;
  text: string;
  timestamp: number;
  language?: string;
  audioFile?: string;
  confidence?: number;
  duration?: number;
  speechModel?: string;
  formattingModel?: string;
  meta?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface GetTranscriptionsOptions {
  limit?: number;
  offset?: number;
}

export interface CreateTranscriptionInput {
  text: string;
  language?: string;
  audioFile?: string;
  duration?: number;
  speechModel?: string;
  formattingModel?: string;
  meta?: Record<string, unknown>;
}

export const transcriptionsApi = {
  getTranscriptions: (options?: GetTranscriptionsOptions) =>
    invoke<Transcription[]>("get_transcriptions", { options: options ?? null }),

  getTranscription: (id: number) =>
    invoke<Transcription | null>("get_transcription", { id }),

  saveTranscription: (input: CreateTranscriptionInput) =>
    invoke<number>("save_transcription", { input }),

  deleteTranscription: (id: number) =>
    invoke<void>("delete_transcription", { id }),

  deleteAllTranscriptions: () => invoke<void>("delete_all_transcriptions"),
};
