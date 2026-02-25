use crate::state::{AppState, RecordingState};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Emitter, State};
use uuid::Uuid;

type AppStateGuard<'a> = State<'a, Mutex<AppState>>;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RecordingStateUpdate {
    pub state: RecordingState,
    pub session_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessChunkOptions {
    pub session_id: String,
    /// PCM samples as a JSON array of f32 values.
    pub audio_chunk: Vec<f32>,
    pub recording_started_at: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinalizeSessionOptions {
    pub session_id: String,
    pub audio_file_path: Option<String>,
    pub recording_started_at: Option<f64>,
    pub recording_stopped_at: Option<f64>,
}

/// Signal that the user wants to start recording.
/// Transitions: Idle -> Recording.
#[tauri::command]
pub fn signal_start(
    state: AppStateGuard<'_>,
    app: tauri::AppHandle,
) -> Result<RecordingStateUpdate, String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;

    if state.recording_state != RecordingState::Idle {
        return Err("Recording already in progress".to_string());
    }

    let session_id = Uuid::new_v4().to_string();
    state.recording_state = RecordingState::Recording;
    state.active_session_id = Some(session_id.clone());

    let update = RecordingStateUpdate {
        state: state.recording_state.clone(),
        session_id: Some(session_id),
    };

    // Notify all windows
    let _ = app.emit("recording-state-changed", &update);

    Ok(update)
}

/// Signal that the user wants to stop recording.
/// Transitions: Recording -> Processing.
#[tauri::command]
pub fn signal_stop(
    state: AppStateGuard<'_>,
    app: tauri::AppHandle,
) -> Result<RecordingStateUpdate, String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;

    if state.recording_state == RecordingState::Idle {
        return Err("No recording in progress".to_string());
    }

    state.recording_state = RecordingState::Processing;

    let update = RecordingStateUpdate {
        state: state.recording_state.clone(),
        session_id: state.active_session_id.clone(),
    };

    let _ = app.emit("recording-state-changed", &update);
    Ok(update)
}

/// Get current recording state.
#[tauri::command]
pub fn get_recording_state(state: AppStateGuard<'_>) -> Result<RecordingStateUpdate, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(RecordingStateUpdate {
        state: state.recording_state.clone(),
        session_id: state.active_session_id.clone(),
    })
}

/// Receive an audio chunk from the renderer for VAD inspection.
/// Actual transcription is handled in `finalize_session`.
/// Returns current accumulated transcription (empty during streaming).
#[tauri::command]
pub fn process_audio_chunk(
    _state: AppStateGuard<'_>,
    _options: ProcessChunkOptions,
) -> Result<String, String> {
    // In Tauri, the renderer-side MediaRecorder sends audio chunks here.
    // Streaming VAD and partial transcription would run here against whisper-rs.
    // For this skeleton, we acknowledge receipt and return empty string.
    Ok(String::new())
}

/// Finalize the recording session: run full transcription, optionally format,
/// save to DB, transition state back to Idle.
#[tauri::command]
pub async fn finalize_session(
    state: AppStateGuard<'_>,
    app: tauri::AppHandle,
    options: FinalizeSessionOptions,
) -> Result<String, String> {
    // Retrieve settings needed for transcription
    let (language, formatter_config, ollama_url) = {
        let state = state.lock().map_err(|e| e.to_string())?;
        let language = state
            .settings
            .dictation
            .as_ref()
            .and_then(|d| {
                if d.auto_detect_enabled {
                    None
                } else {
                    Some(d.selected_language.clone())
                }
            });
        let formatter_config = state.settings.formatter_config.clone();
        let ollama_url = state
            .settings
            .model_providers_config
            .as_ref()
            .and_then(|c| c.ollama.as_ref())
            .map(|o| o.url.clone());
        (language, formatter_config, ollama_url)
    };

    // NOTE: Actual whisper-rs transcription would happen here.
    // The audio_file_path provides the WAV file recorded by the renderer.
    // For this skeleton, we return a placeholder transcription.
    let raw_text = if options.audio_file_path.is_some() {
        // Real implementation: load WAV file, run whisper-rs inference
        transcribe_audio_file(options.audio_file_path.as_deref(), language.as_deref()).await
    } else {
        Ok(String::new())
    }?;

    // Optional Ollama formatting
    let final_text = if !raw_text.is_empty() {
        if let Some(ref fc) = formatter_config {
            if fc.enabled {
                if let Some(ref url) = ollama_url {
                    if let Some(ref model_id) = fc.model_id {
                        format_with_ollama(url, model_id, &raw_text)
                            .await
                            .unwrap_or(raw_text.clone())
                    } else {
                        raw_text.clone()
                    }
                } else {
                    raw_text.clone()
                }
            } else {
                raw_text.clone()
            }
        } else {
            raw_text.clone()
        }
    } else {
        raw_text.clone()
    };

    // Save to database
    {
        let state = state.lock().map_err(|e| e.to_string())?;
        let meta = serde_json::json!({
            "sessionId": options.session_id,
            "source": "microphone"
        });
        state
            .db
            .create_transcription(
                &final_text,
                language.as_deref().or(Some("ja")),
                options.audio_file_path.as_deref(),
                None,
                Some("whisper-local"),
                None,
                Some(&meta),
            )
            .map_err(|e| e.to_string())?;
    }

    // Transition back to Idle
    {
        let mut state = state.lock().map_err(|e| e.to_string())?;
        state.recording_state = RecordingState::Idle;
        state.active_session_id = None;
    }

    let update = RecordingStateUpdate {
        state: RecordingState::Idle,
        session_id: None,
    };
    let _ = app.emit("recording-state-changed", &update);
    let _ = app.emit("transcription-completed", &final_text);

    Ok(final_text)
}

/// Cancel the active recording session without processing.
#[tauri::command]
pub fn cancel_session(
    state: AppStateGuard<'_>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.recording_state = RecordingState::Idle;
    state.active_session_id = None;
    let update = RecordingStateUpdate {
        state: RecordingState::Idle,
        session_id: None,
    };
    let _ = app.emit("recording-state-changed", &update);
    Ok(())
}

/// Perform Whisper transcription on a WAV file.
/// In a full implementation this calls whisper-rs; here we return a stub.
async fn transcribe_audio_file(
    audio_path: Option<&str>,
    _language: Option<&str>,
) -> Result<String, String> {
    // TODO: Integrate whisper-rs once the whisper.cpp shared library is available.
    // Example integration (pseudo-code):
    //
    //   let model_path = get_selected_model_path()?;
    //   let ctx = WhisperContext::new(&model_path)?;
    //   let params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
    //   if let Some(lang) = language { params.set_language(lang); }
    //   let pcm = read_wav_as_f32(audio_path)?;
    //   let state = ctx.create_state()?;
    //   state.full(params, &pcm)?;
    //   let segments: Vec<String> = (0..state.full_n_segments())
    //       .map(|i| state.full_get_segment_text(i).unwrap_or_default())
    //       .collect();
    //   Ok(segments.join(""))
    log::warn!(
        "transcribe_audio_file: whisper-rs integration not yet implemented. \
         Audio path: {:?}. Returning empty transcription.",
        audio_path
    );
    Ok(String::new())
}

/// Call Ollama to format/clean up the raw transcription text.
async fn format_with_ollama(
    ollama_url: &str,
    model_id: &str,
    text: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let prompt = format!(
        "以下の日本語音声認識テキストを自然な文章に整形してください。\
         句読点を適切に追加し、不要な言い淀みを除去してください。\
         テキストのみを返し、説明は不要です。\n\n{text}"
    );
    let body = serde_json::json!({
        "model": model_id,
        "prompt": prompt,
        "stream": false
    });
    let response = client
        .post(format!("{}/api/generate", ollama_url.trim_end_matches('/')))
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    Ok(json
        .get("response")
        .and_then(|v| v.as_str())
        .unwrap_or(text)
        .to_string())
}
