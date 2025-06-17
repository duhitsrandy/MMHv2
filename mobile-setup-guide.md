# iOS App Store Development Guide for Meet Me Halfway

## Overview
This guide outlines the steps to convert your Next.js web application to a React Native iOS app for App Store deployment.

## Prerequisites
- macOS computer (required for iOS development)
- Xcode 14+ installed
- Apple Developer Account ($99/year)
- Node.js 18+
- React Native CLI or Expo CLI

## Step 1: Choose Your React Native Approach

### Option A: Expo (Easier, Faster)
```bash
npx create-expo-app@latest MeetMeHalfwayMobile --template
# Choose: Navigation (TypeScript)
cd MeetMeHalfwayMobile
```

### Option B: React Native CLI (More Control)
```bash
npx react-native@latest init MeetMeHalfwayMobile --template react-native-template-typescript
cd MeetMeHalfwayMobile
```

## Step 2: Install Required Dependencies

### Core Dependencies
```bash
npm install @react-navigation/native @react-navigation/stack
npm install react-native-maps
npm install @react-native-async-storage/async-storage
npm install react-native-geolocation-service
npm install react-native-vector-icons
npm install react-native-elements
npm install @stripe/stripe-react-native
npm install react-native-clipboard
npm install react-native-share
```

### For Expo (if using Expo)
```bash
npx expo install expo-location
npx expo install expo-clipboard
npx expo install expo-sharing
npx expo install expo-constants
npx expo install expo-secure-store
```

## Step 3: Environment Setup

### iOS Permissions (Info.plist)
Add these permissions to your iOS project:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to find meeting points near you</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs location access to find meeting points near you</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>This app needs location access to find meeting points near you</string>
```

### API Keys Configuration
Create a config file for your API keys:
```typescript
// src/config/api.ts
export const API_CONFIG = {
  LOCATIONIQ_KEY: 'your_locationiq_key',
  HERE_API_KEY: 'your_here_api_key',
  OPENROUTESERVICE_API_KEY: 'your_ors_key',
  CLERK_PUBLISHABLE_KEY: 'your_clerk_key',
  SUPABASE_URL: 'your_supabase_url',
  SUPABASE_ANON_KEY: 'your_supabase_anon_key',
  STRIPE_PUBLISHABLE_KEY: 'your_stripe_key',
};
```

## Step 4: Core Components Migration

### 1. Authentication (Clerk)
```bash
npm install @clerk/clerk-expo
```

### 2. Database (Supabase)
```bash
npm install @supabase/supabase-js
```

### 3. Maps Integration
Replace Leaflet with React Native Maps:
```typescript
// src/components/Map.tsx
import MapView, { Marker, Polyline } from 'react-native-maps';

export const Map = ({ origins, midpoint, routes, pois }) => {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: midpoint.lat,
        longitude: midpoint.lng,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {/* Markers and routes */}
    </MapView>
  );
};
```

## Step 5: UI Components Migration

### Convert Tailwind CSS to React Native Styles
Your current Tailwind classes need to be converted to React Native StyleSheet objects:

```typescript
// Before (Tailwind)
<div className="container mx-auto max-w-7xl px-4 py-4">

// After (React Native)
<View style={styles.container}>
```

### Create StyleSheet
```typescript
// src/styles/global.ts
import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## Step 6: Navigation Structure

### App Navigation
```typescript
// src/navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="SavedSearches" component={SavedSearchesScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

## Step 7: API Integration

### Reuse Your Existing API Logic
Most of your server actions can be converted to API calls:

```typescript
// src/services/api.ts
export const apiService = {
  async findMidpoint(origins: GeocodedOrigin[]) {
    const response = await fetch('/api/meet-me-halfway/find-midpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origins }),
    });
    return response.json();
  },
  
  async searchPOIs(lat: number, lng: number, radius: number) {
    const response = await fetch(`/api/pois/search?lat=${lat}&lng=${lng}&radius=${radius}`);
    return response.json();
  },
};
```

## Step 8: iOS-Specific Features

### 1. Location Services
```typescript
// src/hooks/useLocation.ts
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  return { location, errorMsg };
};
```

### 2. Share Functionality
```typescript
// src/utils/share.ts
import * as Sharing from 'expo-sharing';

export const shareLocation = async (latitude: number, longitude: number, address: string) => {
  const message = `Meet me at: ${address}\n\nLocation: ${latitude}, ${longitude}\n\nOpens in: https://maps.apple.com/?q=${latitude},${longitude}`;
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(message);
  }
};
```

## Step 9: App Store Preparation

### 1. App Icon & Screenshots
- Create app icon in various sizes (1024x1024, 180x180, etc.)
- Take screenshots for different iPhone sizes
- Create App Store description and keywords

### 2. App Store Connect Setup
1. Create app in App Store Connect
2. Configure app information
3. Set up pricing and availability
4. Configure in-app purchases (for subscriptions)

### 3. Build Configuration
```json
// app.json (Expo) or package.json
{
  "expo": {
    "name": "Meet Me Halfway",
    "slug": "meet-me-halfway",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.meetmehalfway",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app needs location access to find meeting points near you"
      }
    }
  }
}
```

## Step 10: Testing & Deployment

### 1. Local Testing
```bash
# For Expo
npx expo start

# For React Native CLI
npx react-native run-ios
```

### 2. Build for App Store
```bash
# Expo
eas build --platform ios

# React Native CLI
npx react-native run-ios --configuration Release
```

### 3. Submit to App Store
1. Archive app in Xcode
2. Upload to App Store Connect
3. Submit for review

## Estimated Timeline

- **Week 1-2**: Project setup and core dependencies
- **Week 3-4**: Component migration and UI adaptation
- **Week 5-6**: API integration and testing
- **Week 7-8**: iOS-specific features and optimization
- **Week 9-10**: App Store preparation and submission

## Cost Breakdown

- **Apple Developer Account**: $99/year
- **Development Time**: 8-10 weeks (if full-time)
- **Design Assets**: $500-2000 (if outsourcing)
- **Testing Devices**: $0-1000 (if you don't have iOS devices)

## Alternative: Progressive Web App (PWA)

If you want a faster path to mobile, consider making your current web app a PWA:

1. Add service worker for offline functionality
2. Configure web app manifest
3. Add "Add to Home Screen" functionality
4. Optimize for mobile performance

This would give you 80% of the mobile app experience with 20% of the development effort.

## Next Steps

1. Choose between React Native and PWA approach
2. Set up development environment
3. Start with core functionality migration
4. Test thoroughly on iOS devices
5. Prepare App Store submission materials 