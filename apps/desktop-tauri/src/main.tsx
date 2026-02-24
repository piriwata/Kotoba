import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import { settingsApi } from "@/api/settings";

// ── Theme provider ────────────────────────────────────────────────────────────

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    settingsApi.getUiSettings().then((ui) => {
      setTheme((ui?.theme as "light" | "dark" | "system") ?? "system");
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.toggle("dark", prefersDark);
    }
  }, [theme]);

  return theme;
}

// ── Placeholder pages ─────────────────────────────────────────────────────────

const TranscriptionsPage: React.FC = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Kotoba</h1>
    <p className="text-muted-foreground">
      音声認識の履歴がここに表示されます。
    </p>
  </div>
);

const SettingsPage: React.FC = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">設定</h1>
    <p className="text-muted-foreground">
      アプリの設定をここで行います。
    </p>
  </div>
);

// ── App shell ────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  useTheme();
  const [page, setPage] = useState<"transcriptions" | "settings">(
    "transcriptions",
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <nav className="w-48 border-r flex flex-col p-4 gap-2 shrink-0">
        <span className="font-bold text-lg mb-4">Kotoba</span>
        <button
          className={`text-left px-3 py-2 rounded text-sm ${page === "transcriptions" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          onClick={() => setPage("transcriptions")}
        >
          履歴
        </button>
        <button
          className={`text-left px-3 py-2 rounded text-sm ${page === "settings" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          onClick={() => setPage("settings")}
        >
          設定
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {page === "transcriptions" ? <TranscriptionsPage /> : <SettingsPage />}
      </main>
    </div>
  );
};

// ── Entry point ───────────────────────────────────────────────────────────────

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
