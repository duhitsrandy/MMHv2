import 'dotenv/config';

const isIosEasBuild = process.env.EAS_BUILD_PLATFORM === 'ios';

const stripePlugin: [string, { merchantIdentifier: string; enableGooglePay: boolean }] = [
  '@stripe/stripe-react-native',
  {
    merchantIdentifier: 'merchant.com.meetmehalfway.mobile',
    enableGooglePay: false,
  },
];

export default () => ({
  expo: {
    name: 'Meet Me Halfway',
    slug: 'meet-me-halfway',
    scheme: 'mmh',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    // Disabled: TestFlight build 8 crashed in Hermes during TurboModule init (iOS 26).
    newArchEnabled: false,
    icon: './assets/images/icon.png',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      bundleIdentifier: 'com.meetmehalfway.mobile',
      appleTeamId: '4DL28SV65N',
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Meet Me Halfway uses your location to fill your starting point and calculate nearby meeting options.',
        NSCameraUsageDescription:
          'Meet Me Halfway uses the camera only if you choose to take a profile photo for your account.',
        NSPhotoLibraryUsageDescription:
          'Meet Me Halfway accesses your photo library only if you choose to select a profile photo for your account.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      ...(isIosEasBuild ? [] : [stripePlugin]),
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: '531b0735-de9e-4406-8089-2e8b1ad78db3',
      },
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  },
});
