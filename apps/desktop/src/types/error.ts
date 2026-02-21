/**
 * Error code constants for type safety
 */
export const ErrorCodes = {
  // Generic errors
  UNKNOWN: "UNKNOWN",

  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",

  // Whisper/local errors
  MODEL_MISSING: "MODEL_MISSING",
  WORKER_INITIALIZATION_FAILED: "WORKER_INITIALIZATION_FAILED",
  WORKER_CRASHED: "WORKER_CRASHED",
  LOCAL_TRANSCRIPTION_FAILED: "LOCAL_TRANSCRIPTION_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Application error with error code for UI mapping.
 *
 * - `message`: Technical details for logging (not user-facing)
 * - `errorCode`: Used to look up user-facing strings from ERROR_CODE_CONFIG
 * - `uiTitle`/`uiMessage`: Optional overrides for user-facing display
 */
export class AppError extends Error {
  constructor(
    message: string,
    public errorCode: ErrorCode,
    public statusCode?: number,
    public uiTitle?: string,
    public uiMessage?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
