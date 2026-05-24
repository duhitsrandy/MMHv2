import 'dotenv/config';

export default () => ({
  expo: {
    name: 'Meet Me Halfway',
    slug: 'meet-me-halfway',
    scheme: 'mmh',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    icon: './assets/images/icon.png',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      bundleIdentifier: 'com.meetmehalfway.mobile',
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'This app needs location access to find meeting points near you',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'This app needs location access to find meeting points near you',
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
      [
        '@stripe/stripe-react-native',
        {
          merchantIdentifier: 'merchant.com.meetmehalfway.mobile',
          enableGooglePay: false,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      // Run `eas init` from MeetMeHalfwayMobile/ to replace CHANGE_ME_IN_EAS
      eas: {
        projectId: 'CHANGE_ME_IN_EAS',
      },
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  },
});
