/**
 * Simple context management for the pipeline - no over-engineering
 * Based on ARCHITECTURE.md specifications
 */

export interface PipelineContext {
  sessionId: string;
  sharedData: SharedPipelineData;
  metadata: Map<string, any>;
}

export interface SharedPipelineData {
  userPreferences: {
    language?: string; // Optional - undefined means auto-detect
    formattingStyle: "formal" | "casual" | "technical";
  };
  audioMetadata: {
    source: "microphone" | "file" | "stream";
    duration?: number;
  };
}

/**
 * Create a default context for pipeline execution
 */
export function createDefaultContext(sessionId: string): PipelineContext {
  return {
    sessionId,
    sharedData: {
      userPreferences: {
        language: "en",
        formattingStyle: "formal",
      },
      audioMetadata: {
        source: "microphone",
      },
    },
    metadata: new Map(),
  };
}
