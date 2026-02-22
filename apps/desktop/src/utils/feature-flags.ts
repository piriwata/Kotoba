export function isFeatureFlagEnabled(
  value: string | boolean | undefined,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return !["false", "0", "off", "disabled"].includes(normalized);
}
