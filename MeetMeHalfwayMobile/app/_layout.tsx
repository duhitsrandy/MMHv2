import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useContext, useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { ClerkActiveContext, ClerkAuthBridge } from '@/src/auth';
import { StripeProvider } from '@stripe/stripe-react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const tokenCache = {
  getToken: () => SecureStore.getItemAsync('clerk_token'),
  saveToken: (token: string) => SecureStore.setItemAsync('clerk_token', token),
};
const AnyClerkProvider = ClerkProvider as any;

function StripeWrapper({ children }: { children: React.ReactNode }) {
  const stripePk = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  const looksValid =
    !!stripePk && /^pk_(test|live)_.+/.test(stripePk);

  if (!looksValid) {
    if (__DEV__) {
      console.warn(
        "[Stripe] EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY missing or invalid; PaymentSheet disabled."
      );
    }
    return <>{children}</>;
  }

  return (
    <StripeProvider
      publishableKey={stripePk}
      merchantIdentifier="merchant.com.meetmehalfway.mobile"
      urlScheme="mmh"
    >
      {children}
    </StripeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const pkRaw = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string | undefined;
  const pk = pkRaw?.trim();
  const looksValid = !!pk && /^pk_(test|live)_.+/.test(pk) && pk !== 'pk_test_invalid';

  if (!looksValid) {
    return (
      <StripeWrapper>
        <ClerkActiveContext.Provider value={false}>
          <RootLayoutNav />
        </ClerkActiveContext.Provider>
      </StripeWrapper>
    );
  }

  return (
    <StripeWrapper>
      <ClerkActiveContext.Provider value={true}>
        <AnyClerkProvider publishableKey={pk} tokenCache={tokenCache}>
          <ClerkAuthBridge>
            <RootLayoutNav />
          </ClerkAuthBridge>
        </AnyClerkProvider>
      </ClerkActiveContext.Provider>
    </StripeWrapper>
  );
}

// Only enforces auth redirect when ClerkProvider is in the tree
function AuthGateInner({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const requireAuth = process.env.EXPO_PUBLIC_REQUIRE_AUTH === 'true';

  useEffect(() => {
    if (!requireAuth || !isLoaded) return;
    const inAuthGroup = segments[0] === 'sign-in' || segments[0] === 'sign-up';
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/sign-in' as any);
    }
  }, [isSignedIn, isLoaded, segments, requireAuth]);

  return <>{children}</>;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const clerkActive = useContext(ClerkActiveContext);
  if (!clerkActive) return <>{children}</>;
  return <AuthGateInner>{children}</AuthGateInner>;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate>
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="sign-in"
            options={{ title: "Sign In", headerRight: () => null }}
          />
          <Stack.Screen
            name="sign-up"
            options={{ title: "Sign Up", headerRight: () => null }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'About' }} />
        </Stack>
      </AuthGate>
    </ThemeProvider>
  );
}
