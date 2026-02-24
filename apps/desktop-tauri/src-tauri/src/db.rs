use crate::state::AppSettingsData;
use rusqlite::{Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Transcription record matching the DB schema.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transcription {
    pub id: i64,
    pub text: String,
    pub timestamp: i64,
    pub language: Option<String>,
    pub audio_file: Option<String>,
    pub confidence: Option<f64>,
    pub duration: Option<i64>,
    pub speech_model: Option<String>,
    pub formatting_model: Option<String>,
    pub meta: Option<serde_json::Value>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Model record matching the DB schema.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Model {
    pub id: String,
    pub provider: String,
    pub name: String,
    pub model_type: String,
    pub size: Option<String>,
    pub context: Option<String>,
    pub description: Option<String>,
    pub local_path: Option<String>,
    pub size_bytes: Option<i64>,
    pub checksum: Option<String>,
    pub downloaded_at: Option<i64>,
    pub speed: Option<f64>,
    pub accuracy: Option<f64>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Thin wrapper around a SQLite connection.
pub struct Database {
    conn: Connection,
}

impl Database {
    /// Open (or create) the Kotoba SQLite database in the app data directory.
    pub fn new() -> SqlResult<Self> {
        let path = Self::db_path();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).ok();
        }
        let conn = Connection::open(&path)?;
        let db = Self { conn };
        db.run_migrations()?;
        Ok(db)
    }

    fn db_path() -> PathBuf {
        dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("dev.piriwata.kotoba")
            .join("kotoba.db")
    }

    fn run_migrations(&self) -> SqlResult<()> {
        self.conn.execute_batch(
            "PRAGMA journal_mode=WAL;

            CREATE TABLE IF NOT EXISTS transcriptions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                text        TEXT    NOT NULL,
                timestamp   INTEGER NOT NULL DEFAULT (unixepoch()),
                language    TEXT    DEFAULT 'en',
                audio_file  TEXT,
                confidence  REAL,
                duration    INTEGER,
                speech_model      TEXT,
                formatting_model  TEXT,
                meta        TEXT,
                created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
                updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
            );

            CREATE TABLE IF NOT EXISTS app_settings (
                id          INTEGER PRIMARY KEY,
                data        TEXT    NOT NULL,
                version     INTEGER NOT NULL DEFAULT 1,
                created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
                updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
            );

            CREATE TABLE IF NOT EXISTS models (
                id          TEXT    NOT NULL,
                provider    TEXT    NOT NULL,
                name        TEXT    NOT NULL,
                type        TEXT    NOT NULL,
                size        TEXT,
                context     TEXT,
                description TEXT,
                local_path  TEXT,
                size_bytes  INTEGER,
                checksum    TEXT,
                downloaded_at INTEGER,
                original_model TEXT,
                speed       REAL,
                accuracy    REAL,
                created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
                updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
                PRIMARY KEY (provider, id)
            );

            CREATE INDEX IF NOT EXISTS models_provider_idx ON models (provider);
            CREATE INDEX IF NOT EXISTS models_type_idx     ON models (type);
            ",
        )
    }

    // ── Settings ──────────────────────────────────────────────────────────────

    pub fn load_settings(&self) -> SqlResult<AppSettingsData> {
        let result: rusqlite::Result<String> = self.conn.query_row(
            "SELECT data FROM app_settings WHERE id = 1",
            [],
            |row| row.get(0),
        );
        match result {
            Ok(json) => serde_json::from_str(&json).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    0,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            }),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(AppSettingsData::default()),
            Err(e) => Err(e),
        }
    }

    pub fn save_settings(&self, settings: &AppSettingsData) -> SqlResult<()> {
        let json = serde_json::to_string(settings).map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(
                0,
                rusqlite::types::Type::Text,
                Box::new(e),
            )
        })?;
        self.conn.execute(
            "INSERT INTO app_settings (id, data, updated_at)
             VALUES (1, ?1, unixepoch())
             ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
            [&json],
        )?;
        Ok(())
    }

    // ── Transcriptions ────────────────────────────────────────────────────────

    pub fn get_transcriptions(&self, limit: i64, offset: i64) -> SqlResult<Vec<Transcription>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, text, timestamp, language, audio_file, confidence, duration,
                    speech_model, formatting_model, meta, created_at, updated_at
             FROM transcriptions
             ORDER BY created_at DESC
             LIMIT ?1 OFFSET ?2",
        )?;
        let rows = stmt.query_map([limit, offset], |row| {
            Ok(Transcription {
                id: row.get(0)?,
                text: row.get(1)?,
                timestamp: row.get(2)?,
                language: row.get(3)?,
                audio_file: row.get(4)?,
                confidence: row.get(5)?,
                duration: row.get(6)?,
                speech_model: row.get(7)?,
                formatting_model: row.get(8)?,
                meta: row
                    .get::<_, Option<String>>(9)?
                    .and_then(|s| serde_json::from_str(&s).ok()),
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        rows.collect()
    }

    pub fn get_transcription(&self, id: i64) -> SqlResult<Option<Transcription>> {
        let result = self.conn.query_row(
            "SELECT id, text, timestamp, language, audio_file, confidence, duration,
                    speech_model, formatting_model, meta, created_at, updated_at
             FROM transcriptions WHERE id = ?1",
            [id],
            |row| {
                Ok(Transcription {
                    id: row.get(0)?,
                    text: row.get(1)?,
                    timestamp: row.get(2)?,
                    language: row.get(3)?,
                    audio_file: row.get(4)?,
                    confidence: row.get(5)?,
                    duration: row.get(6)?,
                    speech_model: row.get(7)?,
                    formatting_model: row.get(8)?,
                    meta: row
                        .get::<_, Option<String>>(9)?
                        .and_then(|s| serde_json::from_str(&s).ok()),
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            },
        );
        match result {
            Ok(t) => Ok(Some(t)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn create_transcription(
        &self,
        text: &str,
        language: Option<&str>,
        audio_file: Option<&str>,
        duration: Option<i64>,
        speech_model: Option<&str>,
        formatting_model: Option<&str>,
        meta: Option<&serde_json::Value>,
    ) -> SqlResult<i64> {
        let meta_json = meta.map(|m| m.to_string());
        self.conn.execute(
            "INSERT INTO transcriptions (text, language, audio_file, duration, speech_model,
             formatting_model, meta)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                text,
                language,
                audio_file,
                duration,
                speech_model,
                formatting_model,
                meta_json
            ],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn delete_transcription(&self, id: i64) -> SqlResult<()> {
        self.conn
            .execute("DELETE FROM transcriptions WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn delete_all_transcriptions(&self) -> SqlResult<()> {
        self.conn.execute("DELETE FROM transcriptions", [])?;
        Ok(())
    }

    // ── Models ────────────────────────────────────────────────────────────────

    pub fn get_models(&self) -> SqlResult<Vec<Model>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, provider, name, type, size, context, description, local_path,
                    size_bytes, checksum, downloaded_at, speed, accuracy, created_at, updated_at
             FROM models ORDER BY created_at ASC",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Model {
                id: row.get(0)?,
                provider: row.get(1)?,
                name: row.get(2)?,
                model_type: row.get(3)?,
                size: row.get(4)?,
                context: row.get(5)?,
                description: row.get(6)?,
                local_path: row.get(7)?,
                size_bytes: row.get(8)?,
                checksum: row.get(9)?,
                downloaded_at: row.get(10)?,
                speed: row.get(11)?,
                accuracy: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })?;
        rows.collect()
    }

    pub fn save_model(&self, model: &Model) -> SqlResult<()> {
        self.conn.execute(
            "INSERT INTO models (id, provider, name, type, size, context, description,
             local_path, size_bytes, checksum, downloaded_at, speed, accuracy)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
             ON CONFLICT(provider, id) DO UPDATE SET
               name = excluded.name,
               local_path = excluded.local_path,
               size_bytes = excluded.size_bytes,
               checksum = excluded.checksum,
               downloaded_at = excluded.downloaded_at,
               updated_at = unixepoch()",
            rusqlite::params![
                model.id,
                model.provider,
                model.name,
                model.model_type,
                model.size,
                model.context,
                model.description,
                model.local_path,
                model.size_bytes,
                model.checksum,
                model.downloaded_at,
                model.speed,
                model.accuracy,
            ],
        )?;
        Ok(())
    }

    pub fn delete_model(&self, id: &str, provider: &str) -> SqlResult<()> {
        self.conn.execute(
            "DELETE FROM models WHERE id = ?1 AND provider = ?2",
            rusqlite::params![id, provider],
        )?;
        Ok(())
    }
}
