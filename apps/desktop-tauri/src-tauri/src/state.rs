use crate::db::Database;
use serde::{Deserialize, Serialize};

/// In-memory application state shared across Tauri commands.
pub struct AppState {
    pub db: Database,
    pub settings: AppSettingsData,
    pub recording_state: RecordingState,
    pub active_session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettingsData {
    pub formatter_config: Option<FormatterConfig>,
    pub ui: Option<UiSettings>,
    pub transcription: Option<TranscriptionSettings>,
    pub recording: Option<RecordingSettings>,
    pub shortcuts: Option<ShortcutsSettings>,
    pub model_providers_config: Option<ModelProvidersConfig>,
    pub dictation: Option<DictationSettings>,
    pub preferences: Option<AppPreferences>,
    pub onboarding: Option<OnboardingSettings>,
    pub telemetry: Option<TelemetrySettings>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatterConfig {
    pub enabled: bool,
    pub model_id: Option<String>,
    pub fallback_model_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiSettings {
    pub theme: String,
    pub locale: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscriptionSettings {
    pub language: Option<String>,
    pub auto_transcribe: Option<bool>,
    pub preload_whisper_model: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordingSettings {
    pub default_format: Option<String>,
    pub sample_rate: Option<u32>,
    pub preferred_microphone_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutsSettings {
    pub push_to_talk: Option<Vec<i32>>,
    pub toggle_recording: Option<Vec<i32>>,
    pub paste_last_transcript: Option<Vec<i32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelProvidersConfig {
    pub ollama: Option<OllamaConfig>,
    pub default_speech_model: Option<String>,
    pub default_language_model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OllamaConfig {
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DictationSettings {
    pub auto_detect_enabled: bool,
    pub selected_language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPreferences {
    pub launch_at_login: Option<bool>,
    pub minimize_to_tray: Option<bool>,
    pub show_widget_while_inactive: Option<bool>,
    pub show_in_dock: Option<bool>,
    pub mute_system_audio: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingSettings {
    pub completed_version: i32,
    pub completed_at: String,
    pub selected_model_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TelemetrySettings {
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RecordingState {
    Idle,
    Recording,
    Processing,
}

impl AppState {
    pub fn new(db: Database) -> Self {
        let settings = db.load_settings().unwrap_or_default();
        Self {
            db,
            settings,
            recording_state: RecordingState::Idle,
            active_session_id: None,
        }
    }

    /// Check if onboarding needs to be shown (no completed onboarding in settings).
    pub fn needs_onboarding(&self) -> bool {
        self.settings.onboarding.is_none()
    }
}
