import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import { onboardingApi } from "@/api/app";
import { settingsApi } from "@/api/settings";

// ── Step definitions ──────────────────────────────────────────────────────────

type Step = "welcome" | "model" | "complete";

// ── Welcome step ──────────────────────────────────────────────────────────────

const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => (
  <div className="flex flex-col items-center justify-center h-full gap-8 p-12 text-center">
    <div className="text-6xl">🎤</div>
    <h1 className="text-4xl font-bold">Kotoba へようこそ</h1>
    <p className="text-lg text-muted-foreground max-w-md">
      ローカル AI を使用した日本語音声認識アプリです。
      音声データは外部に送信されません。
    </p>
    <button
      className="px-8 py-3 rounded-lg bg-primary text-primary-foreground text-base font-medium hover:opacity-90 transition-opacity"
      onClick={onNext}
    >
      始める
    </button>
  </div>
);

// ── Model step ────────────────────────────────────────────────────────────────

interface AvailableModel {
  id: string;
  name: string;
  size: string;
  description: string;
  recommended?: boolean;
}

const BUNDLED_MODELS: AvailableModel[] = [
  {
    id: "large-v3-turbo",
    name: "Whisper large-v3-turbo",
    size: "~809 MB",
    description: "高精度・高速。日本語に最適。",
    recommended: true,
  },
  {
    id: "large-v3",
    name: "Whisper large-v3",
    size: "~1.5 GB",
    description: "最高精度モデル。",
  },
  {
    id: "medium",
    name: "Whisper medium",
    size: "~1.4 GB",
    description: "バランスの取れたモデル。",
  },
  {
    id: "small",
    name: "Whisper small",
    size: "~461 MB",
    description: "軽量・高速。",
  },
];

const ModelStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [selected, setSelected] = useState<string>("large-v3-turbo");
  const [downloading, setDownloading] = useState(false);

  const handleSelect = async () => {
    setDownloading(true);
    try {
      await settingsApi.updateSettings({
        modelProvidersConfig: { defaultSpeechModel: selected },
      });
    } finally {
      setDownloading(false);
      onNext();
    }
  };

  return (
    <div className="flex flex-col h-full p-12 gap-6">
      <h2 className="text-2xl font-bold">音声認識モデルを選択</h2>
      <p className="text-muted-foreground">
        初回起動時に選択したモデルをダウンロードします。
      </p>
      <div className="flex flex-col gap-3 flex-1 overflow-auto">
        {BUNDLED_MODELS.map((model) => (
          <div
            key={model.id}
            className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
              selected === model.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50"
            }`}
            onClick={() => setSelected(model.id)}
          >
            <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
              {selected === model.id && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{model.name}</span>
                {model.recommended && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    おすすめ
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {model.size} — {model.description}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        onClick={handleSelect}
        disabled={downloading}
      >
        {downloading ? "設定中…" : "続ける"}
      </button>
    </div>
  );
};

// ── Complete step ─────────────────────────────────────────────────────────────

const CompleteStep: React.FC<{ onFinish: () => void }> = ({ onFinish }) => (
  <div className="flex flex-col items-center justify-center h-full gap-8 p-12 text-center">
    <div className="text-6xl">✅</div>
    <h2 className="text-3xl font-bold">準備完了！</h2>
    <p className="text-lg text-muted-foreground max-w-md">
      Kotoba の設定が完了しました。ウィジェットのマイクボタンを押して録音を開始してください。
    </p>
    <button
      className="px-8 py-3 rounded-lg bg-primary text-primary-foreground text-base font-medium hover:opacity-90 transition-opacity"
      onClick={onFinish}
    >
      開始する
    </button>
  </div>
);

// ── Onboarding shell ──────────────────────────────────────────────────────────

const Onboarding: React.FC = () => {
  const [step, setStep] = useState<Step>("welcome");

  const handleFinish = async () => {
    await onboardingApi.complete();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-6">
        {(["welcome", "model", "complete"] as Step[]).map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              s === step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {step === "welcome" && <WelcomeStep onNext={() => setStep("model")} />}
        {step === "model" && (
          <ModelStep onNext={() => setStep("complete")} />
        )}
        {step === "complete" && <CompleteStep onFinish={handleFinish} />}
      </div>
    </div>
  );
};

// ── Entry point ───────────────────────────────────────────────────────────────

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Onboarding />);
}
