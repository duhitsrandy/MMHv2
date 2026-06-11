import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { InteractionManager, SafeAreaView, StyleSheet, Text } from 'react-native';

import { FatalStartupErrorScreen } from '@/src/components/FatalStartupErrorScreen';
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
import { StripeWrapper } from './StripeWrapper';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

type ClerkShellComponent = React.ComponentType<{
  publishableKey: string;
  children: React.ReactNode;
}>;

function IosMinimalBootScreen() {
  const build =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.nativeBuildVersion ??
    '?';
  const version = Constants.expoConfig?.version ?? Constants.nativeApplicationVersion ?? '?';

  return (
    <SafeAreaView style={minimalStyles.container}>
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
    if (error) {
      captureFatalStartupError(error);
      setFatalError(getFatalStartupError());
    }
  }, [error]);

  useEffect(() => {
    if (!loaded || !shouldGateIosAppShell || minimalBoot) return;
    const task = InteractionManager.runAfterInteractions(() => {
      setAppShellReady(true);
    });
    return () => task.cancel();
  }, [loaded, minimalBoot]);

  useEffect(() => {
    if (!loaded || !appShellReady) return;
    SplashScreen.hideAsync();
  }, [loaded, appShellReady]);

  useEffect(() => {
    if (!appShellReady || !shouldDeferClerkOnIos || minimalBoot) return;
    const task = InteractionManager.runAfterInteractions(() => {
      import('./ClerkAppShell')
        .then((mod) => {
          setDeferredClerkShell(() => mod.ClerkAppShell);
        })
        .catch((clerkLoadError: unknown) => {
          captureFatalStartupError(clerkLoadError);
          setFatalError(getFatalStartupError());
        });
    });
    return () => task.cancel();
  }, [appShellReady, minimalBoot]);

  if (fatalError) {
    return <FatalStartupErrorScreen error={fatalError} />;
  }

  if (!loaded || !appShellReady) {
    return null;
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
    const { ClerkAppShell } = require('./ClerkAppShell') as typeof import('./ClerkAppShell');
    return (
      <StripeWrapper>
        <ClerkAppShell publishableKey={pk}>{nav}</ClerkAppShell>
      </StripeWrapper>
    );
  }

  if (!deferredClerkShell) {
    return null;
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
