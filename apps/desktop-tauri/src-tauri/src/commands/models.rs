use crate::db::Model;
use crate::state::AppState;
use std::sync::Mutex;
use tauri::State;

type AppStateGuard<'a> = State<'a, Mutex<AppState>>;

#[tauri::command]
pub fn get_models(state: AppStateGuard) -> Result<Vec<Model>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state.db.get_models().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_selected_model(state: AppStateGuard) -> Result<Option<String>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state
        .settings
        .model_providers_config
        .as_ref()
        .and_then(|c| c.default_speech_model.clone()))
}

#[tauri::command]
pub fn select_model(
    state: AppStateGuard,
    model_id: String,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    let config = state
        .settings
        .model_providers_config
        .get_or_insert_with(|| crate::state::ModelProvidersConfig {
            ollama: None,
            default_speech_model: None,
            default_language_model: None,
        });
    config.default_speech_model = Some(model_id);
    state
        .db
        .save_settings(&state.settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_model(state: AppStateGuard, model: Model) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state.db.save_model(&model).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_model(
    state: AppStateGuard,
    id: String,
    provider: String,
) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state
        .db
        .delete_model(&id, &provider)
        .map_err(|e| e.to_string())
}
