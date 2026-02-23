import * as si from "systeminformation";
import { logger } from "../main/logger";

export interface SystemInfo {
  // Hardware
  cpu_model: string;
  cpu_cores: number;
  cpu_threads: number;
  cpu_speed_ghz: number;
  memory_total_gb: number;

  // OS
  os_platform: string;
  os_distro: string;
  os_release: string;
  os_arch: string;

  // Graphics
  gpu_model: string;
  gpu_vendor: string;

  // System
  manufacturer: string;
  model: string;
}

export interface TranscriptionMetrics {
  session_id?: string;
  model_id: string;
  model_preloaded?: boolean;
  whisper_native_binding?: string;
  total_duration_ms?: number;
  recording_duration_ms?: number;
  processing_duration_ms?: number;
  audio_duration_seconds?: number;
  realtime_factor?: number;
  text_length?: number;
  word_count?: number;
  formatting_enabled?: boolean;
  formatting_model?: string;
  formatting_duration_ms?: number;
  vad_enabled?: boolean;
  session_type?: "streaming" | "batch";
  language?: string;
}

/**
 * Local-only service that collects system hardware information for model
 * recommendations. All tracking methods are no-ops — no data leaves the machine.
 */
export class TelemetryService {
  private _systemInfo: SystemInfo | null = null;

  async initialize(): Promise<void> {
    this._systemInfo = await this.collectSystemInfo();
    logger.main.info("System information collected");
  }

  // ============================================================================
  // System Information (local-only, used for model recommendations)
  // ============================================================================

  private async collectSystemInfo(): Promise<SystemInfo> {
    try {
      const [cpu, mem, osInfo, graphics, system] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.osInfo(),
        si.graphics(),
        si.system(),
      ]);

      return {
        cpu_model: `${cpu.manufacturer} ${cpu.brand}`.trim(),
        cpu_cores: cpu.physicalCores,
        cpu_threads: cpu.cores,
        cpu_speed_ghz: cpu.speed,
        memory_total_gb: Math.round(mem.total / 1073741824),
        os_platform: osInfo.platform,
        os_distro: osInfo.distro,
        os_release: osInfo.release,
        os_arch: osInfo.arch,
        gpu_model: graphics.controllers[0]?.model || "Unknown",
        gpu_vendor: graphics.controllers[0]?.vendor || "Unknown",
        manufacturer: system.manufacturer || "Unknown",
        model: system.model || "Unknown",
      };
    } catch (error) {
      logger.main.error("Failed to collect system info:", error);
      return {
        cpu_model: "Unknown",
        cpu_cores: 0,
        cpu_threads: 0,
        cpu_speed_ghz: 0,
        memory_total_gb: 0,
        os_platform: process.platform,
        os_distro: "Unknown",
        os_release: "Unknown",
        os_arch: process.arch,
        gpu_model: "Unknown",
        gpu_vendor: "Unknown",
        manufacturer: "Unknown",
        model: "Unknown",
      };
    }
  }

  getSystemInfo(): SystemInfo | null {
    return this._systemInfo;
  }

  // ============================================================================
  // No-op stubs — kept for interface compatibility while callers are updated.
  // None of these methods send any data over the network.
  // ============================================================================

  isEnabled(): boolean {
    return false;
  }

  getMachineId(): string {
    return "";
  }

  async setEnabled(_enabled: boolean): Promise<void> {}
  async optIn(): Promise<void> {}
  async optOut(): Promise<void> {}

  trackTranscriptionCompleted(_metrics: TranscriptionMetrics): void {}
  trackAppLaunch(): void {}
  captureException(_error: unknown, _props?: Record<string, unknown>): void {}
  async captureExceptionImmediateAndShutdown(
    _error: unknown,
    _props?: Record<string, unknown>,
  ): Promise<void> {}

  identifyUser(
    _userId: string,
    _email?: string,
    _name?: string,
  ): void {}

  trackOnboardingStarted(_props: object): void {}
  trackOnboardingScreenViewed(_props: object): void {}
  trackOnboardingFeaturesSelected(_props: object): void {}
  trackOnboardingDiscoverySelected(_props: object): void {}
  trackOnboardingModelSelected(_props: object): void {}
  trackOnboardingCompleted(_props: object): void {}
  trackOnboardingAbandoned(_props: object): void {}
  trackNativeHelperCrashed(_props: object): void {}
  trackNoteCreated(_props: object): void {}
}
