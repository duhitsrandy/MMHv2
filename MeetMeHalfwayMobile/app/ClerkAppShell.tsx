import React, { useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { ClerkActiveContext } from '@/src/auth';
import { ClerkAuthBridge } from '@/src/auth/clerk-auth-bridge';

const tokenCache = {
  getToken: () => SecureStore.getItemAsync('clerk_token'),
  saveToken: (token: string) => SecureStore.setItemAsync('clerk_token', token),
};

function ClerkAuthGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const requireAuth = process.env.EXPO_PUBLIC_REQUIRE_AUTH === 'true';

  useEffect(() => {
    if (!requireAuth || !isLoaded) return;
    const inAuthGroup = segments[0] === 'sign-in' || segments[0] === 'sign-up';
    if (!isSignedIn && !inAuthGroup) {
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
