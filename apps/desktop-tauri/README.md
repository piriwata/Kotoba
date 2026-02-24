# Kotoba Desktop — Tauri Edition

This is the **Rust + Tauri** remake of the Kotoba desktop app, replacing the previous Electron implementation.

## Architecture

| Layer | Technology | Notes |
|-------|-----------|-------|
| Shell / IPC | **Tauri v2** (Rust) | Replaces Electron main process |
| Backend logic | **Rust** | Settings, DB, recording pipeline, Ollama formatting |
| Database | **rusqlite** (SQLite, bundled) | Replaces Drizzle/libsql |
| Frontend | **React 18** + TypeScript | Kept from original; IPC adapted to Tauri `invoke` |
| Build | **Vite 6** | Multi-entry (main / widget / onboarding) |
| Styling | **Tailwind CSS v3** | Same design tokens as original |

### Why Tauri over Electron?

| Dimension | Electron | Tauri |
|-----------|----------|-------|
| Bundle size | ~120 MB | ~10–20 MB |
| Memory use | ~100–200 MB baseline | ~20–40 MB |
| Native feel | Chromium renderer | System WebView |
| Backend language | TypeScript/Node.js | Rust (memory-safe, zero GC pauses) |
| Cross-platform build | Good | Excellent (macOS/Windows/Linux) |
| Security model | Preload scripts, IPC | Capabilities JSON, fine-grained permissions |

## Project Layout

```
apps/desktop-tauri/
├── src/                        # React frontend
│   ├── main.tsx               # Main window entry
│   ├── widget.tsx             # Floating widget entry
│   ├── onboarding.tsx         # Onboarding wizard entry
│   ├── api/                   # Tauri IPC wrappers (replacing tRPC)
│   │   ├── settings.ts
│   │   ├── transcriptions.ts
│   │   ├── recording.ts
│   │   ├── models.ts
│   │   └── app.ts
│   └── styles/globals.css
├── src-tauri/                  # Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/default.json
│   └── src/
│       ├── main.rs
│       ├── lib.rs             # App setup, plugin/command registration
│       ├── db.rs              # SQLite schema + CRUD helpers
│       ├── state.rs           # Shared application state
│       └── commands/          # Tauri IPC command handlers
│           ├── settings.rs
│           ├── transcriptions.rs
│           ├── recording.rs   # Audio pipeline + Ollama formatting
│           ├── models.rs
│           ├── widget.rs
│           ├── onboarding.rs
│           └── app.rs
├── index.html                 # Main window HTML
├── widget.html                # Widget HTML
├── onboarding.html            # Onboarding HTML
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Prerequisites

### macOS
```bash
xcode-select --install
```

### Linux
```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf
```

### Windows
Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (bundled with Windows 11).

### Common
- [Rust](https://rustup.rs/) 1.70+
- Node.js 20+, pnpm 10+

## Development

```bash
# From the repo root
pnpm install

# Run the Tauri dev server (starts Vite + Rust hot-reload)
cd apps/desktop-tauri
pnpm dev
```

## Build

```bash
# From apps/desktop-tauri
pnpm build
```

## Key IPC Commands

All commands are exposed as Tauri `invoke` calls from the frontend.

### Settings
| Command | Description |
|---------|-------------|
| `get_settings` | Returns full `AppSettingsData` |
| `update_settings` | Saves full settings object |
| `get_ui_settings` / `set_ui_settings` | Theme + locale |
| `get_preferences` / `set_preferences` | Launch-at-login, dock, widget visibility |
| `sync_auto_launch` | Sync launch-at-login with OS |

### Recording & Transcription
| Command | Description |
|---------|-------------|
| `signal_start` | Begin recording session |
| `signal_stop` | Stop recording, transition to Processing |
| `process_audio_chunk` | Send PCM chunk to backend (for VAD / streaming) |
| `finalize_session` | Run Whisper inference + optional Ollama formatting, save to DB |
| `cancel_session` | Discard current session |

### Widget
| Command | Description |
|---------|-------------|
| `show_widget` / `hide_widget` | Show/hide floating widget |
| `set_widget_ignore_mouse` | Enable/disable click-through mode |
| `move_widget_to_cursor_display` | Relocate widget to active monitor |

### Models
| Command | Description |
|---------|-------------|
| `get_models` | List all models in DB |
| `select_model` | Set the default speech model |
| `save_model` / `delete_model` | Manage model records |

## Whisper Integration

The transcription pipeline in `commands/recording.rs` includes a stub for
[whisper-rs](https://github.com/tazz4843/whisper-rs) (Rust bindings to whisper.cpp).
To enable real transcription:

1. Add `whisper-rs = "0.13"` to `Cargo.toml`
2. Implement `transcribe_audio_file()` in `src/commands/recording.rs`
3. Point it at the model downloaded through the onboarding UI

## Tauri Events

Backend → Frontend events emitted via `app.emit(...)`:

| Event | Payload | Description |
|-------|---------|-------------|
| `recording-state-changed` | `RecordingStateUpdate` | State transitions (idle/recording/processing) |
| `transcription-completed` | `string` | Final transcription text after finalize |
| `onboarding-completed` | `()` | Fired when user finishes onboarding |
