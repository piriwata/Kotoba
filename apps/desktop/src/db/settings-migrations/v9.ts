import type { AppSettingsData } from "../schema";

// v8 -> v9: Remove obsolete featureFlags and dataMigrations fields from settings
export function migrateToV9(data: unknown): AppSettingsData {
  type OldData = AppSettingsData & {
    featureFlags?: unknown;
    dataMigrations?: unknown;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { featureFlags: _featureFlags, dataMigrations: _dataMigrations, ...rest } =
    data as OldData;

  return rest as AppSettingsData;
}
