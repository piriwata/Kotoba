import { invoke } from "@tauri-apps/api/core";

export interface AppSettingsData {
  formatterConfig?: FormatterConfig;
  ui?: UiSettings;
  transcription?: TranscriptionSettings;
  recording?: RecordingSettings;
  shortcuts?: ShortcutsSettings;
  modelProvidersConfig?: ModelProvidersConfig;
  dictation?: DictationSettings;
  preferences?: AppPreferences;
  onboarding?: OnboardingSettings;
  telemetry?: TelemetrySettings;
}

export interface FormatterConfig {
  enabled: boolean;
  modelId?: string;
  fallbackModelId?: string;
}

export interface UiSettings {
  theme: "light" | "dark" | "system";
  locale?: string;
}

export interface TranscriptionSettings {
  language?: string;
  autoTranscribe?: boolean;
  preloadWhisperModel?: boolean;
}

export interface RecordingSettings {
  defaultFormat?: string;
  sampleRate?: number;
  preferredMicrophoneName?: string;
}

export interface ShortcutsSettings {
  pushToTalk?: number[];
  toggleRecording?: number[];
  pasteLastTranscript?: number[];
}

export interface ModelProvidersConfig {
  ollama?: OllamaConfig;
  defaultSpeechModel?: string;
  defaultLanguageModel?: string;
}

export interface OllamaConfig {
  url: string;
}

export interface DictationSettings {
  autoDetectEnabled: boolean;
  selectedLanguage: string;
}

export interface AppPreferences {
  launchAtLogin?: boolean;
  minimizeToTray?: boolean;
  showWidgetWhileInactive?: boolean;
  showInDock?: boolean;
  muteSystemAudio?: boolean;
}

export interface OnboardingSettings {
  completedVersion: number;
  completedAt: string;
  selectedModelType: string;
}

export interface TelemetrySettings {
  enabled?: boolean;
}

export const settingsApi = {
  getSettings: () => invoke<AppSettingsData>("get_settings"),

  updateSettings: (settings: AppSettingsData) =>
    invoke<AppSettingsData>("update_settings", { settings }),

  getUiSettings: () => invoke<UiSettings>("get_ui_settings"),

  setUiSettings: (ui: UiSettings) => invoke<void>("set_ui_settings", { ui }),

  getTranscriptionSettings: () =>
    invoke<TranscriptionSettings | null>("get_transcription_settings"),

  setTranscriptionSettings: (transcription: TranscriptionSettings) =>
    invoke<void>("set_transcription_settings", { transcription }),

  getShortcutSettings: () =>
    invoke<ShortcutsSettings | null>("get_shortcut_settings"),

  setShortcutSettings: (shortcuts: ShortcutsSettings) =>
    invoke<void>("set_shortcut_settings", { shortcuts }),

  getFormatterConfig: () =>
    invoke<FormatterConfig | null>("get_formatter_config"),

  setFormatterConfig: (config: FormatterConfig) =>
    invoke<void>("set_formatter_config", { config }),

  getDictationSettings: () =>
    invoke<DictationSettings | null>("get_dictation_settings"),

  setDictationSettings: (dictation: DictationSettings) =>
    invoke<void>("set_dictation_settings", { dictation }),

  getPreferences: () => invoke<AppPreferences | null>("get_preferences"),

  setPreferences: (preferences: AppPreferences) =>
    invoke<void>("set_preferences", { preferences }),

  syncAutoLaunch: () => invoke<void>("sync_auto_launch"),
};
