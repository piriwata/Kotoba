import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type RecordingStateValue = "idle" | "recording" | "processing";

export interface RecordingStateUpdate {
  state: RecordingStateValue;
  sessionId?: string;
}

export const recordingApi = {
  signalStart: () => invoke<RecordingStateUpdate>("signal_start"),

  signalStop: () => invoke<RecordingStateUpdate>("signal_stop"),

  getRecordingState: () => invoke<RecordingStateUpdate>("get_recording_state"),

  /**
   * Send a PCM audio chunk (Float32Array) to the Rust backend.
   * The array is serialised as a plain number array for JSON transport.
   */
  processAudioChunk: (
    sessionId: string,
    audioChunk: Float32Array,
    recordingStartedAt?: number,
  ) =>
    invoke<string>("process_audio_chunk", {
      options: {
        sessionId,
        audioChunk: Array.from(audioChunk),
        recordingStartedAt,
      },
    }),

  finalizeSession: (options: {
    sessionId: string;
    audioFilePath?: string;
    recordingStartedAt?: number;
    recordingStoppedAt?: number;
  }) => invoke<string>("finalize_session", { options }),

  cancelSession: () => invoke<void>("cancel_session"),

  onStateChanged: (
    callback: (update: RecordingStateUpdate) => void,
  ): Promise<UnlistenFn> =>
    listen<RecordingStateUpdate>("recording-state-changed", (event) => {
      callback(event.payload);
    }),

  onTranscriptionCompleted: (
    callback: (text: string) => void,
  ): Promise<UnlistenFn> =>
    listen<string>("transcription-completed", (event) => {
      callback(event.payload);
    }),
};
