import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { FatalStartupErrorScreen } from '@/src/components/FatalStartupErrorScreen';
import { StripeWrapper } from '@/src/components/StripeWrapper';
import { useColorScheme } from '@/components/useColorScheme';
import { ClerkActiveContext } from '@/src/auth';
import {
  captureFatalStartupError,
  getFatalStartupError,
  subscribeFatalStartupError,
  type FatalStartupError,
} from '@/src/lib/fatalStartupError';
import {
  isIosMinimalBootEnabled,
  shouldDeferClerkOnIos,
  shouldGateIosAppShell,
} from '@/src/lib/iosLaunchDiagnostics';
import { hideIosSplash } from '@/src/lib/iosSplash';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

type ClerkShellComponent = React.ComponentType<{
  publishableKey: string;
  children: React.ReactNode;
}>;

function LaunchPlaceholder({ label = 'Loading…' }: { label?: string }) {
  return (
    <SafeAreaView
      style={launchStyles.container}
      onLayout={() => {
        void hideIosSplash(`launch-placeholder:${label}`);
      }}
    >
      <ActivityIndicator size="large" />
      <Text style={launchStyles.label}>{label}</Text>
    </SafeAreaView>
  );
}

function IosMinimalBootScreen() {
  const build =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.nativeBuildVersion ??
    '?';
  const version = Constants.expoConfig?.version ?? Constants.nativeApplicationVersion ?? '?';

  return (
    <SafeAreaView
      style={minimalStyles.container}
      onLayout={() => {
        void hideIosSplash('minimal-boot');
      }}
    >
      <Text style={minimalStyles.title}>Minimal boot OK</Text>
      <Text style={minimalStyles.subtitle}>
        v{version} ({build})
      </Text>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const minimalBoot = isIosMinimalBootEnabled();
  const [fatalError, setFatalError] = useState<FatalStartupError | null>(() =>
    getFatalStartupError()
  );
  const [loaded, error] = useFonts(
    minimalBoot
      ? {}
      : {
          SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
          ...FontAwesome.font,
        }
  );
  const [appShellReady, setAppShellReady] = useState(
    minimalBoot || !shouldGateIosAppShell
  );
  const [deferredClerkShell, setDeferredClerkShell] = useState<ClerkShellComponent | null>(
    null
  );

  useEffect(() => subscribeFatalStartupError(() => setFatalError(getFatalStartupError())), []);

  useEffect(() => {
    void hideIosSplash('root-layout-mount');
  }, []);

  useEffect(() => {
    if (!loaded || !appShellReady) {
      return;
    }
    void hideIosSplash('gates-open');
  }, [loaded, appShellReady]);

  useEffect(() => {
    if (error) {
      captureFatalStartupError(error);
      setFatalError(getFatalStartupError());
    }
  }, [error]);

  useEffect(() => {
    if (!loaded || minimalBoot) return;
    if (!shouldGateIosAppShell) {
      setAppShellReady(true);
      return;
    }
    // Do not use InteractionManager here — with `return null` there are no
    // interactions to drain, so runAfterInteractions can stall forever on splash.
    const id = setTimeout(() => setAppShellReady(true), 0);
    return () => clearTimeout(id);
  }, [loaded, minimalBoot]);

  useEffect(() => {
    if (!appShellReady || !shouldDeferClerkOnIos || minimalBoot) return;
    let cancelled = false;
    import('@/src/components/ClerkAppShell')
      .then((mod) => {
        if (!cancelled) setDeferredClerkShell(() => mod.ClerkAppShell);
      })
      .catch((clerkLoadError: unknown) => {
        if (!cancelled) {
          captureFatalStartupError(clerkLoadError);
          setFatalError(getFatalStartupError());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [appShellReady, minimalBoot]);

  if (fatalError) {
    return <FatalStartupErrorScreen error={fatalError} />;
  }

  if (!loaded || !appShellReady) {
    return <LaunchPlaceholder />;
  }

  if (minimalBoot) {
    return <IosMinimalBootScreen />;
  }

  const pkRaw = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string | undefined;
  const pk = pkRaw?.trim() ?? '';
  const looksValid = !!pk && /^pk_(test|live)_.+/.test(pk) && pk !== 'pk_test_invalid';

  const nav = <RootLayoutNav />;

  if (!looksValid) {
    return (
      <StripeWrapper>
        <ClerkActiveContext.Provider value={false}>{nav}</ClerkActiveContext.Provider>
      </StripeWrapper>
    );
  }

  if (!shouldDeferClerkOnIos) {
    const { ClerkAppShell: SyncClerkAppShell } =
      require('@/src/components/ClerkAppShell') as typeof import('@/src/components/ClerkAppShell');
    return (
      <StripeWrapper>
        <SyncClerkAppShell publishableKey={pk}>{nav}</SyncClerkAppShell>
      </StripeWrapper>
    );
  }

  if (!deferredClerkShell) {
    return <LaunchPlaceholder label="Loading account…" />;
  }

  const DeferredClerk = deferredClerkShell;
  return (
    <StripeWrapper>
      <DeferredClerk publishableKey={pk}>{nav}</DeferredClerk>
    </StripeWrapper>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ title: 'Sign In', headerRight: () => null }} />
        <Stack.Screen name="sign-up" options={{ title: 'Sign Up', headerRight: () => null }} />
        <Stack.Screen
          name="delete-account"
          options={{ title: 'Delete Account', presentation: 'modal' }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'About' }} />
      </Stack>
    </ThemeProvider>
  );
}

const launchStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#fff',
  },
  label: { fontSize: 15, color: '#6b7280' },
});

const minimalStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: '#fff',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6b7280' },
});
