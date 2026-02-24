use crate::db::Transcription;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

type AppStateGuard<'a> = State<'a, Mutex<AppState>>;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTranscriptionsOptions {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTranscriptionInput {
    pub text: String,
    pub language: Option<String>,
    pub audio_file: Option<String>,
    pub duration: Option<i64>,
    pub speech_model: Option<String>,
    pub formatting_model: Option<String>,
    pub meta: Option<serde_json::Value>,
}

#[tauri::command]
pub fn get_transcriptions(
    state: AppStateGuard,
    options: Option<GetTranscriptionsOptions>,
) -> Result<Vec<Transcription>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let limit = options.as_ref().and_then(|o| o.limit).unwrap_or(50);
    let offset = options.as_ref().and_then(|o| o.offset).unwrap_or(0);
    state
        .db
        .get_transcriptions(limit, offset)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_transcription(
    state: AppStateGuard,
    id: i64,
) -> Result<Option<Transcription>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state.db.get_transcription(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_transcription(
    state: AppStateGuard,
    input: CreateTranscriptionInput,
) -> Result<i64, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state
        .db
        .create_transcription(
            &input.text,
            input.language.as_deref(),
            input.audio_file.as_deref(),
            input.duration,
            input.speech_model.as_deref(),
            input.formatting_model.as_deref(),
            input.meta.as_ref(),
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_transcription(state: AppStateGuard, id: i64) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state
        .db
        .delete_transcription(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_all_transcriptions(state: AppStateGuard) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state
        .db
        .delete_all_transcriptions()
        .map_err(|e| e.to_string())
}
