use std::sync::Mutex;
use crate::state::AppState;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Runtime,
};

mod commands;
mod db;
mod state;

/// Build the system tray menu and icon.
fn build_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let show_item = MenuItemBuilder::with_id("show", "Show Kotoba").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit Kotoba").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&show_item)
        .separator()
        .item(&quit_item)
        .build()?;

    TrayIconBuilder::with_id("main")
        .tooltip("Kotoba")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

/// Initialize the application: open onboarding or main windows based on DB state.
async fn initialize_app(app: tauri::AppHandle) {
    let state = app.state::<Mutex<AppState>>();
    let needs_onboarding = {
        let state = state.lock().unwrap();
        state.needs_onboarding()
    };

    if needs_onboarding {
        if let Some(onboarding) = app.get_webview_window("onboarding") {
            let _ = onboarding.show();
            let _ = onboarding.set_focus();
        }
    } else {
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.show();
            let _ = main.set_focus();
        }
        // Show widget based on preferences
        let show_widget = {
            let state = state.lock().unwrap();
            state
                .settings
                .preferences
                .as_ref()
                .and_then(|p| p.show_widget_while_inactive)
                .unwrap_or(false)
        };
        if show_widget {
            if let Some(widget) = app.get_webview_window("widget") {
                let _ = widget.show();
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = db::Database::new().expect("Failed to initialize database");
    let app_state = AppState::new(db);

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .manage(Mutex::new(app_state))
        .invoke_handler(tauri::generate_handler![
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::get_ui_settings,
            commands::settings::set_ui_settings,
            commands::settings::get_transcription_settings,
            commands::settings::set_transcription_settings,
            commands::settings::get_shortcut_settings,
            commands::settings::set_shortcut_settings,
            commands::settings::get_formatter_config,
            commands::settings::set_formatter_config,
            commands::settings::get_dictation_settings,
            commands::settings::set_dictation_settings,
            commands::settings::get_preferences,
            commands::settings::set_preferences,
            commands::settings::sync_auto_launch,
            commands::transcriptions::get_transcriptions,
            commands::transcriptions::get_transcription,
            commands::transcriptions::delete_transcription,
            commands::transcriptions::delete_all_transcriptions,
            commands::transcriptions::save_transcription,
            commands::recording::signal_start,
            commands::recording::signal_stop,
            commands::recording::get_recording_state,
            commands::recording::process_audio_chunk,
            commands::recording::finalize_session,
            commands::recording::cancel_session,
            commands::models::get_models,
            commands::models::get_selected_model,
            commands::models::select_model,
            commands::models::delete_model,
            commands::models::save_model,
            commands::widget::show_widget,
            commands::widget::hide_widget,
            commands::widget::set_widget_ignore_mouse,
            commands::widget::move_widget_to_cursor_display,
            commands::onboarding::check_needs_onboarding,
            commands::onboarding::complete_onboarding,
            commands::onboarding::cancel_onboarding,
            commands::app::open_external,
            commands::app::get_platform,
            commands::app::get_app_version,
        ])
        .setup(|app| {
            // Initialize system tray
            build_tray(app.handle())?;

            // Initialize app asynchronously
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                initialize_app(handle).await;
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // On macOS, hide instead of close for the main window
                #[cfg(target_os = "macos")]
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Kotoba application");
}
