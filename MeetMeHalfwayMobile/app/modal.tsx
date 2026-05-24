import { StatusBar } from 'expo-status-bar';
import { Linking, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';

import { Text, View } from '@/components/Themed';

const HELP_URL = 'https://meetmehalfway.co';

export default function AboutModalScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meet Me Halfway</Text>
      <Text style={styles.version}>Version {version}</Text>
      <Text style={styles.body}>
        Find a fair meeting point between friends, family, or colleagues.
      </Text>
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => Linking.openURL(HELP_URL)}
      >
        <Text style={styles.linkText}>Need help? meetmehalfway.co</Text>
      </TouchableOpacity>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    textAlign: 'center',
    color: '#374151',
    marginBottom: 24,
    lineHeight: 22,
  },
  linkButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#111827',
    borderRadius: 8,
  },
  linkText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
