import * as SplashScreen from 'expo-splash-screen';

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

export async function hideIosSplash(_reason: string): Promise<void> {
  if (hideResolved) {
    return;
  }

  try {
    await SplashScreen.hideAsync();
    hideResolved = true;
  } catch {
    // Splash may already be hidden or unavailable.
  }
}
