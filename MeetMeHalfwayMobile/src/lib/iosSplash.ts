import * as SplashScreen from 'expo-splash-screen';

import { debugBootLog } from '@/src/lib/debugBootLog';

const SPLASH_FALLBACK_MS = 4000;

let hideResolved = false;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

/** Force-hide splash if RootLayout never calls hideAsync (release TestFlight hang). */
export function startIosSplashFallbackHide(): void {
  if (fallbackTimer !== null) {
    return;
  }

  fallbackTimer = setTimeout(() => {
    void hideIosSplash('fallback-timeout');
  }, SPLASH_FALLBACK_MS);
}

export async function hideIosSplash(reason: string): Promise<void> {
  if (hideResolved) {
    return;
  }

  try {
    await SplashScreen.hideAsync();
    hideResolved = true;
    debugBootLog('F', 'iosSplash.ts:hide', 'hideAsync ok', { reason });
  } catch (error) {
    debugBootLog('F', 'iosSplash.ts:hide', 'hideAsync failed', {
      reason,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
