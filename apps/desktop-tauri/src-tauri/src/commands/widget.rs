use tauri::Manager;

/// Show the floating widget window.
#[tauri::command]
pub fn show_widget(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(widget) = app.get_webview_window("widget") {
        widget.show().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Hide the floating widget window.
#[tauri::command]
pub fn hide_widget(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(widget) = app.get_webview_window("widget") {
        widget.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Toggle whether the widget window should ignore (pass-through) mouse events.
/// When `ignore` is true the widget is click-through; false makes it interactive.
#[tauri::command]
pub fn set_widget_ignore_mouse(app: tauri::AppHandle, ignore: bool) -> Result<(), String> {
    if let Some(widget) = app.get_webview_window("widget") {
        widget
            .set_ignore_cursor_events(ignore)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Move the widget window to the display where the cursor is currently located.
/// Uses the primary display as a fallback.
#[tauri::command]
pub fn move_widget_to_cursor_display(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(widget) = app.get_webview_window("widget") {
        // Position widget at the bottom-centre of the primary monitor.
        // A full implementation would query the monitor containing the cursor.
        let monitor = widget
            .primary_monitor()
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "No primary monitor found".to_string())?;

        let work_area_pos = monitor.position();
        let work_size = monitor.size();

        const WIDGET_WIDTH: u32 = 640;
        const WIDGET_HEIGHT: u32 = 320;

        let x = work_area_pos.x + ((work_size.width as i32 - WIDGET_WIDTH as i32) / 2);
        let y = work_area_pos.y + (work_size.height as i32 - WIDGET_HEIGHT as i32);

        widget
            .set_position(tauri::PhysicalPosition::new(x, y))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
