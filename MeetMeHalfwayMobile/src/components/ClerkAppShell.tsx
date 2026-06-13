import React, { useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { ClerkActiveContext } from '@/src/auth';
import { ClerkAuthBridge } from '@/src/auth/clerk-auth-bridge';
import { debugBootLog } from '@/src/lib/debugBootLog';
import { setIosBootPhase } from '@/src/lib/iosBootPhase';

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, token: string) => SecureStore.setItemAsync(key, token),
  clearToken: (key: string) => SecureStore.deleteItemAsync(key),
};

function ClerkAuthGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const requireAuth = process.env.EXPO_PUBLIC_REQUIRE_AUTH === 'true';

  useEffect(() => {
    // #region agent log
    debugBootLog('D', 'ClerkAppShell.tsx:auth-gate', 'clerk auth state', {
      requireAuth,
      isLoaded,
      isSignedIn,
      segment0: segments[0] ?? null,
    });
    // #endregion
    if (!requireAuth || !isLoaded) return;
    const inAuthGroup = segments[0] === 'sign-in' || segments[0] === 'sign-up';
    if (!isSignedIn && !inAuthGroup) {
      // #region agent log
      debugBootLog('D', 'ClerkAppShell.tsx:auth-gate', 'redirecting to sign-in');
      // #endregion
      router.replace('/sign-in' as never);
    }
  }, [isSignedIn, isLoaded, segments, requireAuth, router]);

  return <>{children}</>;
}

type ClerkAppShellProps = {
  publishableKey: string;
  children: React.ReactNode;
};

export function ClerkAppShell({ publishableKey, children }: ClerkAppShellProps) {
  useEffect(() => {
    setIosBootPhase('clerk-shell-mounted');
    // #region agent log
    debugBootLog('D', 'ClerkAppShell.tsx:mount', 'ClerkAppShell mounted');
    // #endregion
  }, []);

  return (
    <ClerkActiveContext.Provider value={true}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkAuthBridge>
          <ClerkAuthGate>{children}</ClerkAuthGate>
        </ClerkAuthBridge>
      </ClerkProvider>
    </ClerkActiveContext.Provider>
  );
}
