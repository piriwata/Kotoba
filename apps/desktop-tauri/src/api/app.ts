import { invoke } from "@tauri-apps/api/core";

export const appApi = {
  openExternal: (url: string) => invoke<void>("open_external", { url }),

  getPlatform: () => invoke<string>("get_platform"),

  getAppVersion: () => invoke<string>("get_app_version"),
};

export const widgetApi = {
  show: () => invoke<void>("show_widget"),
  hide: () => invoke<void>("hide_widget"),
  setIgnoreMouse: (ignore: boolean) =>
    invoke<void>("set_widget_ignore_mouse", { ignore }),
  moveToCursorDisplay: () => invoke<void>("move_widget_to_cursor_display"),
};

export const onboardingApi = {
  checkNeedsOnboarding: () =>
    invoke<{ needed: boolean }>("check_needs_onboarding"),
  complete: () => invoke<void>("complete_onboarding"),
  cancel: () => invoke<void>("cancel_onboarding"),
};
