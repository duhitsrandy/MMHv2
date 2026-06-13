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
import { debugBootLog } from '@/src/lib/debugBootLog';
import { setIosBootPhase, useIosBootPhase } from '@/src/lib/iosBootPhase';
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

function LaunchPlaceholder({
  label = 'Loading…',
  diag,
}: {
  label?: string;
  diag?: string;
}) {
  const bootPhase = useIosBootPhase();
  const build =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.nativeBuildVersion ??
    '?';

  return (
    <SafeAreaView
      style={launchStyles.container}
      onLayout={() => {
        setIosBootPhase(`placeholder-layout:${label}`);
        void hideIosSplash(`launch-placeholder:${label}`);
      }}
    >
      <View style={launchStyles.bootHud}>
        <Text style={launchStyles.bootHudText}>
          MMH BOOT b{build} | {bootPhase}
        </Text>
      </View>
      <ActivityIndicator size="large" />
      <Text style={launchStyles.label}>{label}</Text>
      {diag ? <Text style={launchStyles.diag}>{diag}</Text> : null}
    </SafeAreaView>
  );
}

function bootDiagLine(parts: Record<string, string | boolean | number | null | undefined>): string {
  return Object.entries(parts)
    .map(([k, v]) => `${k}=${v ?? '?'}`)
    .join(' ');
}

function IosMinimalBootScreen() {
  const bootPhase = useIosBootPhase();
  const build =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.nativeBuildVersion ??
    '?';
  const version = Constants.expoConfig?.version ?? Constants.nativeApplicationVersion ?? '?';

  return (
    <SafeAreaView
      style={minimalStyles.container}
      onLayout={() => {
        setIosBootPhase('minimal-boot-layout');
        void hideIosSplash('minimal-boot');
      }}
    >
      <View style={launchStyles.bootHud}>
        <Text style={launchStyles.bootHudText}>MMH MINIMAL | {bootPhase}</Text>
      </View>
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
    setIosBootPhase('root-layout-mounted');
    // #region agent log
    debugBootLog('F', '_layout.tsx:splash', 'hideAsync on mount');
    // #endregion
    void hideIosSplash('root-layout-mount');
  }, []);

  useEffect(() => {
    if (!loaded || !appShellReady) {
      return;
    }
    setIosBootPhase('gates-open');
    // #region agent log
    debugBootLog('F', '_layout.tsx:splash', 'hideAsync when gates open');
    // #endregion
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
    // #region agent log
    debugBootLog('C', '_layout.tsx:clerk-import', 'starting ClerkAppShell dynamic import');
    // #endregion
    import('@/src/components/ClerkAppShell')
      .then((mod) => {
        // #region agent log
        debugBootLog('C', '_layout.tsx:clerk-import', 'ClerkAppShell import resolved');
        // #endregion
        if (!cancelled) setDeferredClerkShell(() => mod.ClerkAppShell);
      })
      .catch((clerkLoadError: unknown) => {
        // #region agent log
        debugBootLog('C', '_layout.tsx:clerk-import', 'ClerkAppShell import failed', {
          message: clerkLoadError instanceof Error ? clerkLoadError.message : String(clerkLoadError),
        });
        // #endregion
        if (!cancelled) {
          captureFatalStartupError(clerkLoadError);
          setFatalError(getFatalStartupError());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [appShellReady, minimalBoot]);

  useEffect(() => {
    // #region agent log
    debugBootLog('AB', '_layout.tsx:gate-snapshot', 'startup gate state', {
      build: Constants.nativeBuildVersion ?? Constants.expoConfig?.ios?.buildNumber,
      loaded,
      fontError: error ? (error instanceof Error ? error.message : String(error)) : null,
      appShellReady,
      shouldGateIosAppShell,
      shouldDeferClerkOnIos,
      hasDeferredClerk: !!deferredClerkShell,
      minimalBoot,
      hasFatal: !!fatalError,
    });
    // #endregion
  }, [loaded, error, appShellReady, deferredClerkShell, fatalError, minimalBoot]);

  useEffect(() => {
    if (fatalError) {
      setIosBootPhase('fatal-error-screen');
      return;
    }
    if (!loaded || !appShellReady) {
      setIosBootPhase(
        `gate-wait loaded=${loaded ? '1' : '0'} shell=${appShellReady ? '1' : '0'}`
      );
      return;
    }
    if (minimalBoot) {
      setIosBootPhase('minimal-boot-screen');
      return;
    }
    if (!shouldDeferClerkOnIos) {
      setIosBootPhase('clerk-sync-path');
      return;
    }
    if (!deferredClerkShell) {
      setIosBootPhase('clerk-defer-wait');
      return;
    }
    setIosBootPhase('main-nav-ready');
  }, [
    fatalError,
    loaded,
    appShellReady,
    minimalBoot,
    deferredClerkShell,
  ]);

  if (fatalError) {
    return <FatalStartupErrorScreen error={fatalError} />;
  }

  if (!loaded || !appShellReady) {
    // #region agent log
    debugBootLog('A', '_layout.tsx:render', 'branch=font-or-shell-gate', { loaded, appShellReady });
    // #endregion
    return (
      <LaunchPlaceholder
        diag={bootDiagLine({
          build: Constants.nativeBuildVersion ?? Constants.expoConfig?.ios?.buildNumber,
          branch: 'font-or-shell',
          loaded,
          shell: appShellReady,
          gate: shouldGateIosAppShell,
        })}
      />
    );
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
    // #region agent log
    debugBootLog('C', '_layout.tsx:render', 'branch=clerk-defer-wait');
    // #endregion
    return (
      <LaunchPlaceholder
        label="Loading account…"
        diag={bootDiagLine({
          build: Constants.nativeBuildVersion ?? Constants.expoConfig?.ios?.buildNumber,
          branch: 'clerk-defer',
          deferClerk: shouldDeferClerkOnIos,
        })}
      />
    );
  }

  const DeferredClerk = deferredClerkShell;
  // #region agent log
  debugBootLog('D', '_layout.tsx:render', 'branch=main-nav-with-clerk');
  // #endregion
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
  bootHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
  },
  bootHudText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: { fontSize: 15, color: '#6b7280' },
  diag: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Menlo',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
  },
});

const minimalStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#6b7280' },
});
