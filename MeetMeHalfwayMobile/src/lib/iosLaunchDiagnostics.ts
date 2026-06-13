/** EAS / dev overrides for TestFlight launch crash bisect (builds 11–13). */
export const iosDeferMap = process.env.EXPO_PUBLIC_IOS_DEFER_MAP === "1";
export const iosDeferClerk = process.env.EXPO_PUBLIC_IOS_DEFER_CLERK === "1";

/**
 * Optional iOS launch deferrals (bisect / conservative boot).
 * EXPO_PUBLIC_IOS_LAUNCH_SAFE=1 enables gate + defer; =0 or unset is off.
 * Build 22+ hangs on splash were caused by InteractionManager never draining
 * when the tree rendered null — launch-safe is opt-in only now.
 */
export function isIosLaunchSafeEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_IOS_LAUNCH_SAFE === "1") return true;
  return false;
}

/** Defer only during launch-safe bisect builds — orphan EAS DEFER_* vars are ignored. */
export const shouldDeferMapOnIos = isIosLaunchSafeEnabled() && iosDeferMap;
export const shouldDeferClerkOnIos = isIosLaunchSafeEnabled() && iosDeferClerk;

/** Block entire navigation tree until after first interactions (iOS launch-safe). */
export const shouldGateIosAppShell = isIosLaunchSafeEnabled();

/**
 * TestFlight bisect: render only a minimal shell (no Stack / Clerk / tabs).
 * Set EXPO_PUBLIC_IOS_MINIMAL_BOOT=1 on EAS production for one build only.
 */
export function isIosMinimalBootEnabled(): boolean {
  return process.env.EXPO_PUBLIC_IOS_MINIMAL_BOOT === "1";
}
