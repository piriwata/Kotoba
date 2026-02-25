use crate::state::{AppState, OnboardingSettings};
use std::sync::Mutex;
use tauri::{Emitter, Manager, State};

type AppStateGuard<'a> = State<'a, Mutex<AppState>>;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingCheckResult {
    pub needed: bool,
}

#[tauri::command]
pub fn check_needs_onboarding(state: AppStateGuard) -> Result<OnboardingCheckResult, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(OnboardingCheckResult {
        needed: state.needs_onboarding(),
    })
}

#[tauri::command]
pub fn complete_onboarding(
    state: AppStateGuard,
    app: tauri::AppHandle,
) -> Result<(), String> {
    {
        let mut state = state.lock().map_err(|e| e.to_string())?;
        state.settings.onboarding = Some(OnboardingSettings {
            completed_version: 1,
            completed_at: chrono_now(),
            selected_model_type: "local".to_string(),
        });
        state
            .db
            .save_settings(&state.settings)
            .map_err(|e| e.to_string())?;
    }

    // Close onboarding window and show main window
    if let Some(onboarding) = app.get_webview_window("onboarding") {
        let _ = onboarding.hide();
    }
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.set_focus();
    }

    let _ = app.emit("onboarding-completed", ());
    Ok(())
}

#[tauri::command]
pub fn cancel_onboarding(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(onboarding) = app.get_webview_window("onboarding") {
        let _ = onboarding.hide();
    }
    app.exit(0);
    Ok(())
}

/// Simple ISO 8601-like timestamp from Unix epoch seconds.
/// Uses `std::time` to avoid pulling in the `chrono`/`time` crate.
/// Format: "YYYY-MM-DDTHH:MM:SSZ" (UTC, second precision).
fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    // Convert Unix epoch seconds to a rough ISO 8601 string.
    // Days since epoch → year/month/day via proleptic Gregorian calendar.
    let days = secs / 86400;
    let time_of_day = secs % 86400;
    let hh = time_of_day / 3600;
    let mm = (time_of_day % 3600) / 60;
    let ss = time_of_day % 60;

    // Compute year/month/day from days since 1970-01-01
    let (y, mo, d) = days_to_ymd(days);
    format!("{y:04}-{mo:02}-{d:02}T{hh:02}:{mm:02}:{ss:02}Z")
}

/// Convert days since Unix epoch (1970-01-01) to (year, month, day).
fn days_to_ymd(mut days: u64) -> (u64, u64, u64) {
    // 400-year cycle = 146097 days
    let mut year = 1970u64;
    loop {
        let leap = is_leap(year);
        let days_in_year = if leap { 366 } else { 365 };
        if days < days_in_year {
            break;
        }
        days -= days_in_year;
        year += 1;
    }
    let leap = is_leap(year);
    let month_days: [u64; 12] = [
        31,
        if leap { 29 } else { 28 },
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ];
    let mut month = 1u64;
    for &md in &month_days {
        if days < md {
            break;
        }
        days -= md;
        month += 1;
    }
    (year, month, days + 1)
}

fn is_leap(y: u64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}
