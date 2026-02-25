import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, useContext, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

// Propagates whether a valid ClerkProvider is in the tree so that
// Clerk hooks are only called when the provider is present.
export const ClerkActiveContext = createContext(false);

// Safe auth context — provides Clerk auth state when available, or no-op defaults otherwise.
type SafeAuthValue = {
  isSignedIn: boolean;
  isLoaded: boolean;
  getToken: () => Promise<string | null>;
  signOut: () => void;
};
const SafeAuthContext = createContext<SafeAuthValue>({
  isSignedIn: false,
  isLoaded: true,
  getToken: async () => null,
  signOut: () => {},
});

export function useSafeAuth() {
  return useContext(SafeAuthContext);
}

// Only rendered inside ClerkProvider — bridges real Clerk state into SafeAuthContext
function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken, signOut } = useAuth();
  const value: SafeAuthValue = {
    isSignedIn: !!isSignedIn,
    isLoaded: !!isLoaded,
    getToken: getToken ?? (async () => null),
    signOut: signOut ?? (() => {}),
  };
  return <SafeAuthContext.Provider value={value}>{children}</SafeAuthContext.Provider>;
}

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
      <ClerkActiveContext.Provider value={false}>
        <RootLayoutNav />
      </ClerkActiveContext.Provider>
    );
  }

  return (
    <ClerkActiveContext.Provider value={true}>
      <AnyClerkProvider publishableKey={pk} tokenCache={tokenCache}>
        <ClerkAuthBridge>
          <RootLayoutNav />
        </ClerkAuthBridge>
      </AnyClerkProvider>
    </ClerkActiveContext.Provider>
  );
}

// Only rendered when ClerkProvider is in the tree
function AccountButtonInner() {
  const { isSignedIn, signOut } = useAuth();
  const router = useRouter();

  if (isSignedIn) {
    return (
      <TouchableOpacity
        onPress={() => signOut()}
        style={{ marginRight: 12 }}
        accessibilityLabel="Sign out"
      >
        <FontAwesome name="user-circle" size={22} color="#111827" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => router.push('/sign-in' as any)}
      style={{ marginRight: 12 }}
      accessibilityLabel="Sign in"
    >
      <FontAwesome name="user" size={22} color="#6b7280" />
    </TouchableOpacity>
  );
}

function AccountButton() {
  const clerkActive = useContext(ClerkActiveContext);
  if (!clerkActive) return null;
  return <AccountButtonInner />;
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
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthGate>
    </ThemeProvider>
  );
}
