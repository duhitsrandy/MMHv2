import React, { useContext } from 'react';
import 'react-native-url-polyfill/auto';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, useRouter } from 'expo-router';
import { Pressable, TouchableOpacity } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { PoiProvider } from '../contexts/PoiContext';
import { useAuth } from '@clerk/clerk-expo';
import { ClerkActiveContext } from '../_layout';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

function AccountHeaderButtonInner() {
  const { isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const color = Colors[colorScheme ?? 'light'].text;

  if (isSignedIn) {
    return (
      <TouchableOpacity onPress={() => signOut()} style={{ marginRight: 12 }}>
        <FontAwesome name="user-circle" size={22} color={color} />
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={() => router.push('/sign-in' as any)} style={{ marginRight: 12 }}>
      <FontAwesome name="user" size={22} color={color} />
    </TouchableOpacity>
  );
}

function AccountHeaderButton() {
  const clerkActive = useContext(ClerkActiveContext);
  if (!clerkActive) return null;
  return <AccountHeaderButtonInner />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <PoiProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          // Disable the static render of the header on web
          // to prevent a hydration error in React Navigation v6.
          headerShown: useClientOnlyValue(false, true),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Map',
            tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
            headerRight: () => (
              <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 4 }}>
                {({ pressed }) => (
                  <>
                    <AccountHeaderButton />
                    <Link href="/modal" asChild>
                      <Pressable>
                        {({ pressed: infoPPressed }) => (
                          <FontAwesome
                            name="info-circle"
                            size={25}
                            color={Colors[colorScheme ?? 'light'].text}
                            style={{ marginRight: 15, opacity: infoPPressed ? 0.5 : 1 }}
                          />
                        )}
                      </Pressable>
                    </Link>
                  </>
                )}
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            title: 'POIs',
            tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Saved',
            tabBarIcon: ({ color }) => <TabBarIcon name="bookmark" color={color} />,
          }}
        />
      </Tabs>
    </PoiProvider>
  );
}
