import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ClerkActiveContext } from '@/src/auth';
import { iosDeferClerk } from '@/src/lib/iosLaunchDiagnostics';
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

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [deferredClerkShell, setDeferredClerkShell] = useState<ClerkShellComponent | null>(
    null
  );

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (!iosDeferClerk) return;
    const task = InteractionManager.runAfterInteractions(() => {
      import('./ClerkAppShell').then((mod) => {
        setDeferredClerkShell(() => mod.ClerkAppShell);
      });
    });
    return () => task.cancel();
  }, []);

  if (!loaded) {
    return null;
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

  if (!iosDeferClerk) {
    const { ClerkAppShell } = require('./ClerkAppShell') as typeof import('./ClerkAppShell');
    return (
      <StripeWrapper>
        <ClerkAppShell publishableKey={pk}>{nav}</ClerkAppShell>
      </StripeWrapper>
    );
  }

  if (!deferredClerkShell) {
    return (
      <StripeWrapper>
        <ClerkActiveContext.Provider value={false}>{nav}</ClerkActiveContext.Provider>
      </StripeWrapper>
    );
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
