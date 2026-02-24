import React, { useEffect, useState, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import { recordingApi, type RecordingStateValue } from "@/api/recording";
import { widgetApi } from "@/api/app";
import type { UnlistenFn } from "@tauri-apps/api/event";

// ── Mic icon ──────────────────────────────────────────────────────────────────

const MicIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-5 h-5 ${active ? "text-red-500" : "text-foreground"}`}
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

// ── Widget component ──────────────────────────────────────────────────────────

const Widget: React.FC = () => {
  const [recordingState, setRecordingState] =
    useState<RecordingStateValue>("idle");
  const [lastTranscription, setLastTranscription] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const unlistenRefs = useRef<UnlistenFn[]>([]);

  useEffect(() => {
    // Subscribe to recording state changes from backend
    recordingApi.onStateChanged((update) => {
      setRecordingState(update.state);
      if (update.sessionId) {
        sessionIdRef.current = update.sessionId;
      }
    }).then((fn) => unlistenRefs.current.push(fn));

    // Subscribe to transcription completions
    recordingApi.onTranscriptionCompleted((text) => {
      if (text) setLastTranscription(text);
    }).then((fn) => unlistenRefs.current.push(fn));

    return () => {
      unlistenRefs.current.forEach((fn) => fn());
    };
  }, []);

  // Make widget interactive when hovered, pass-through otherwise
  useEffect(() => {
    widgetApi.setIgnoreMouse(!isHovered);
  }, [isHovered]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100); // collect chunks every 100ms

      const stateUpdate = await recordingApi.signalStart();
      sessionIdRef.current = stateUpdate.sessionId ?? null;
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    const sessionId = sessionIdRef.current;

    await recordingApi.signalStop();

    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((t) => t.stop());

    // Wait for all data to be collected
    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
    });

    if (sessionId) {
      // Collect audio — future implementation will encode to WAV and
      // pass the file path to `finalize_session` for whisper-rs transcription.
      new Blob(audioChunksRef.current, { type: "audio/webm" });
      await recordingApi.finalizeSession({
        sessionId,
        recordingStoppedAt: performance.now(),
      });
    }
  }, []);

  const handleClick = useCallback(() => {
    if (recordingState === "idle") {
      startRecording();
    } else if (recordingState === "recording") {
      stopRecording();
    }
  }, [recordingState, startRecording, stopRecording]);

  const isActive = recordingState === "recording";
  const isProcessing = recordingState === "processing";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-sm"
      style={{
        background: isActive
          ? "rgba(239, 68, 68, 0.15)"
          : "rgba(255, 255, 255, 0.85)",
        border: isActive ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(0,0,0,0.1)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
        style={{
          background: isActive ? "rgba(239, 68, 68, 0.2)" : "rgba(0,0,0,0.05)",
          cursor: isProcessing ? "wait" : "pointer",
        }}
        aria-label={isActive ? "録音を停止" : "録音を開始"}
      >
        {isProcessing ? (
          <span className="text-xs animate-spin">⏳</span>
        ) : (
          <MicIcon active={isActive} />
        )}
      </button>

      {lastTranscription && (
        <span
          className="text-sm max-w-xs truncate"
          style={{ color: "rgba(0,0,0,0.7)" }}
        >
          {lastTranscription}
        </span>
      )}
    </div>
  );
};

// ── Entry point ───────────────────────────────────────────────────────────────

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Widget />);
}
