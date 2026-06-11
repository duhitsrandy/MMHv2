import { Platform } from "react-native";

/** EAS / dev overrides for TestFlight launch crash bisect (builds 11–13). */
export const iosDeferMap = process.env.EXPO_PUBLIC_IOS_DEFER_MAP === "1";
export const iosDeferClerk = process.env.EXPO_PUBLIC_IOS_DEFER_CLERK === "1";

/**
 * Permanent iOS launch-safe mode (build 14+).
 * EXPO_PUBLIC_IOS_LAUNCH_SAFE=1 forces on; =0 forces off on iOS.
 * When unset on iOS, defaults to enabled.
 */
export function isIosLaunchSafeEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_IOS_LAUNCH_SAFE === "1") return true;
  if (process.env.EXPO_PUBLIC_IOS_LAUNCH_SAFE === "0") return false;
  return Platform.OS === "ios";
}

/** Effective defer flags (bisect env OR permanent iOS launch-safe). */
export const shouldDeferMapOnIos = iosDeferMap || isIosLaunchSafeEnabled();
export const shouldDeferClerkOnIos = iosDeferClerk || isIosLaunchSafeEnabled();

/** Block entire navigation tree until after first interactions (iOS launch-safe). */
export const shouldGateIosAppShell = isIosLaunchSafeEnabled();

/**
 * TestFlight bisect: render only a minimal shell (no Stack / Clerk / tabs).
 * Set EXPO_PUBLIC_IOS_MINIMAL_BOOT=1 on EAS production for one build only.
 */
export function isIosMinimalBootEnabled(): boolean {
  return process.env.EXPO_PUBLIC_IOS_MINIMAL_BOOT === "1";
}
