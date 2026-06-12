'use strict';

/**
 * TestFlight bisect entry — no expo-router, Clerk, maps, or tabs.
 * Enabled when EXPO_PUBLIC_IOS_MINIMAL_BOOT=1 at EAS build time.
 */
const { registerRootComponent } = require('expo');
const React = require('react');
const { SafeAreaView, StyleSheet, Text } = require('react-native');
const Constants = require('expo-constants').default;

function MinimalBootScreen() {
  const build =
    Constants.expoConfig?.ios?.buildNumber ?? Constants.nativeBuildVersion ?? '?';
  const version = Constants.expoConfig?.version ?? Constants.nativeApplicationVersion ?? '?';

  return React.createElement(
    SafeAreaView,
    { style: styles.container },
    React.createElement(Text, { style: styles.title }, 'Minimal boot OK'),
    React.createElement(Text, { style: styles.subtitle }, `v${version} (build ${build})`)
  );
}

const styles = StyleSheet.create({
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

registerRootComponent(MinimalBootScreen);
