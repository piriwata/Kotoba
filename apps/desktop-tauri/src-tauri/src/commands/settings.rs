use crate::state::{AppSettingsData, AppState};
use std::sync::Mutex;
use tauri::State;

type AppStateGuard<'a> = State<'a, Mutex<AppState>>;

#[tauri::command]
pub fn get_settings(state: AppStateGuard) -> Result<AppSettingsData, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.settings.clone())
}

#[tauri::command]
pub fn update_settings(
    state: AppStateGuard,
    settings: AppSettingsData,
) -> Result<AppSettingsData, String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.settings = settings.clone();
    state
        .db
        .save_settings(&state.settings)
        .map_err(|e| e.to_string())?;
    Ok(settings)
}

#[tauri::command]
pub fn get_ui_settings(
    state: AppStateGuard,
) -> Result<crate::state::UiSettings, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state
        .settings
        .ui
        .clone()
        .unwrap_or(crate::state::UiSettings {
            theme: "system".to_string(),
            locale: None,
        }))
}

#[tauri::command]
pub fn set_ui_settings(
    state: AppStateGuard,
    ui: crate::state::UiSettings,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.settings.ui = Some(ui);
    state
        .db
        .save_settings(&state.settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_transcription_settings(
    state: AppStateGuard,
) -> Result<Option<crate::state::TranscriptionSettings>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.settings.transcription.clone())
}

#[tauri::command]
pub fn set_transcription_settings(
    state: AppStateGuard,
    transcription: crate::state::TranscriptionSettings,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.settings.transcription = Some(transcription);
    state
        .db
        .save_settings(&state.settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_shortcut_settings(
    state: AppStateGuard,
) -> Result<Option<crate::state::ShortcutsSettings>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.settings.shortcuts.clone())
}

#[tauri::command]
pub fn set_shortcut_settings(
    state: AppStateGuard,
    shortcuts: crate::state::ShortcutsSettings,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.settings.shortcuts = Some(shortcuts);
    state
        .db
        .save_settings(&state.settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_formatter_config(
    state: AppStateGuard,
) -> Result<Option<crate::state::FormatterConfig>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.settings.formatter_config.clone())
}

#[tauri::command]
pub fn set_formatter_config(
    state: AppStateGuard,
    config: crate::state::FormatterConfig,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.settings.formatter_config = Some(config);
    state
        .db
        .save_settings(&state.settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_dictation_settings(
    state: AppStateGuard,
) -> Result<Option<crate::state::DictationSettings>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.settings.dictation.clone())
}

#[tauri::command]
pub fn set_dictation_settings(
    state: AppStateGuard,
    dictation: crate::state::DictationSettings,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.settings.dictation = Some(dictation);
    state
        .db
        .save_settings(&state.settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_preferences(
    state: AppStateGuard,
) -> Result<Option<crate::state::AppPreferences>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.settings.preferences.clone())
}

#[tauri::command]
pub fn set_preferences(
    state: AppStateGuard,
    preferences: crate::state::AppPreferences,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.settings.preferences = Some(preferences);
    state
        .db
        .save_settings(&state.settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn sync_auto_launch(
    state: AppStateGuard,
    app: tauri::AppHandle,
) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;
    let launch_at_login = {
        let state = state.lock().map_err(|e| e.to_string())?;
        state
            .settings
            .preferences
            .as_ref()
            .and_then(|p| p.launch_at_login)
            .unwrap_or(false)
    };

    let autostart = app.autolaunch();
    if launch_at_login {
        autostart.enable().map_err(|e| e.to_string())?;
    } else {
        autostart.disable().map_err(|e| e.to_string())?;
    }
    Ok(())
}
