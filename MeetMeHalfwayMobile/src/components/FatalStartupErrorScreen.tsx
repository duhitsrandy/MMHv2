import Constants from 'expo-constants';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import type { FatalStartupError } from '@/src/lib/fatalStartupError';

type Props = {
  error: FatalStartupError;
};

export function FatalStartupErrorScreen({ error }: Props) {
  const build =
    Constants.expoConfig?.ios?.buildNumber ?? Constants.nativeBuildVersion ?? '?';
  const version =
    Constants.expoConfig?.version ?? Constants.nativeApplicationVersion ?? '?';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Startup error</Text>
        <Text style={styles.meta}>
          v{version} (build {build})
        </Text>
        {error.name ? <Text style={styles.name}>{error.name}</Text> : null}
        <Text style={styles.message}>{error.message}</Text>
        {error.stack ? <Text style={styles.stack}>{error.stack}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 14, color: '#6b7280' },
  name: { fontSize: 15, fontWeight: '600', color: '#b45309' },
  message: { fontSize: 16, color: '#111827' },
  stack: {
    fontSize: 11,
    fontFamily: 'Menlo',
    color: '#374151',
    lineHeight: 16,
  },
});
