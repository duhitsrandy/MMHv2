import { StatusBar } from 'expo-status-bar';
import { Linking, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import {
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
  TERMS_URL,
} from '@/src/constants/legal';
import { useSafeAuth } from '@/src/auth';

export default function AboutModalScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const router = useRouter();
  const { isSignedIn } = useSafeAuth();

  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  const openSupportEmail = () => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meet Me Halfway</Text>
      <Text style={styles.version}>Version {version}</Text>
      <Text style={styles.body}>
        Find a fair meeting point between friends, family, or colleagues.
      </Text>

      <View style={styles.linksSection}>
        <TouchableOpacity style={styles.linkRow} onPress={() => openUrl(PRIVACY_POLICY_URL)}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => openUrl(TERMS_URL)}>
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={openSupportEmail}>
          <Text style={styles.linkText}>Support: {SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      {isSignedIn ? (
        <TouchableOpacity
          style={styles.deleteLink}
          onPress={() => router.push('/delete-account' as any)}
        >
          <Text style={styles.deleteLinkText}>Delete Account</Text>
        </TouchableOpacity>
      ) : null}

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
  linksSection: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 16,
  },
  linkRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  linkText: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
  deleteLink: {
    marginTop: 8,
    paddingVertical: 12,
  },
  deleteLinkText: {
    fontSize: 15,
    color: '#dc2626',
    fontWeight: '600',
  },
});
