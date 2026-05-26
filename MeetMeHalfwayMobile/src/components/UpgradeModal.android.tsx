import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAuth } from '@/src/auth';
import {
  BILLING_RETURN_URL,
  createMobileCheckoutSession,
  mobilePriceIds,
  STRIPE_REDIRECT_URL,
  type UpgradeTierKey,
} from '@/src/services/stripe';

const tierConfigs: Record<
  UpgradeTierKey,
  { name: string; price: string; features: string[] }
> = {
  plus: {
    name: 'Plus',
    price: '$4.99',
    features: [
      'Up to 3 locations per search',
      'Ad-free experience',
      'Priority email support',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$19.00',
    features: [
      'Up to 5 locations per search',
      'Real-time traffic data',
      'Advanced route optimization',
    ],
  },
  business: {
    name: 'Business',
    price: '$99.00',
    features: [
      'Up to 10 locations per search',
      'All Pro features',
      'Team collaboration features',
    ],
  },
};

export type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  requiredTier?: UpgradeTierKey;
  feature?: string;
  onSuccess?: () => void | Promise<void>;
};

function upgradeTierRank(tier: UpgradeTierKey): number {
  if (tier === 'business') return 3;
  if (tier === 'pro') return 2;
  return 1;
}

export function UpgradeModal({
  isOpen,
  onClose,
  requiredTier = 'plus',
  feature = 'additional locations',
  onSuccess,
}: UpgradeModalProps) {
  const router = useRouter();
  const { isSignedIn, getToken } = useSafeAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [selectedTier, setSelectedTier] = useState<UpgradeTierKey>(requiredTier);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (tierKey: UpgradeTierKey = selectedTier) => {
    if (!isSignedIn) {
      onClose();
      router.push('/sign-in' as never);
      return;
    }

    const priceId = mobilePriceIds[tierKey];
    if (!priceId) {
      Alert.alert(
        'Configuration error',
        'Pricing is not configured for this plan. Please contact support.'
      );
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        onClose();
        router.push('/sign-in' as never);
        return;
      }

      const result = await createMobileCheckoutSession(priceId, token);

      if ('alreadySubscribed' in result && result.alreadySubscribed) {
        await WebBrowser.openAuthSessionAsync(result.portalUrl, BILLING_RETURN_URL);
        onClose();
        return;
      }

      if (!('paymentIntentClientSecret' in result)) {
        Alert.alert('Error', 'Could not start checkout. Please try again.');
        return;
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Meet Me Halfway',
        customerId: result.customerId,
        customerEphemeralKeySecret: result.ephemeralKeySecret,
        paymentIntentClientSecret: result.paymentIntentClientSecret,
        returnURL: STRIPE_REDIRECT_URL,
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          return;
        }
        Alert.alert('Payment failed', presentError.message);
        return;
      }

      onClose();
      await onSuccess?.();
      Alert.alert(
        'Success',
        `Your ${tierConfigs[tierKey].name} subscription is being activated.`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred.';
      Alert.alert('Upgrade failed', message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tierKeys = (Object.keys(tierConfigs) as UpgradeTierKey[]).filter(
    (key) => upgradeTierRank(key) >= upgradeTierRank(requiredTier)
  );

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView>
            <Text style={styles.title}>Upgrade to {tierConfigs[requiredTier].name}</Text>
            <Text style={styles.subtitle}>
              You need {feature}, which requires {tierConfigs[requiredTier].name} or higher.
            </Text>

            <View style={styles.tierList}>
              {tierKeys.map((tierKey) => {
                const config = tierConfigs[tierKey];
                const selected = selectedTier === tierKey;
                return (
                  <Pressable
                    key={tierKey}
                    onPress={() => setSelectedTier(tierKey)}
                    style={[styles.tierCard, selected && styles.tierCardSelected]}
                  >
                    <View style={styles.tierHeader}>
                      <Text style={styles.tierName}>{config.name}</Text>
                      <View>
                        <Text style={styles.tierPrice}>{config.price}</Text>
                        <Text style={styles.tierPeriod}>per month</Text>
                      </View>
                    </View>
                    {tierKey === requiredTier && (
                      <Text style={styles.badge}>Minimum required</Text>
                    )}
                    {config.features.map((line) => (
                      <Text key={line} style={styles.feature}>
                        • {line}
                      </Text>
                    ))}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.secondaryText}>Maybe Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => void handleUpgrade()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>
                    Upgrade to {tierConfigs[selectedTier].name}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 16 },
  tierList: { gap: 12, marginBottom: 20 },
  tierCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
  },
  tierCardSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tierName: { fontSize: 18, fontWeight: '600', color: '#111827' },
  tierPrice: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'right' },
  tierPeriod: { fontSize: 12, color: '#6b7280', textAlign: 'right' },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4ed8',
    marginBottom: 6,
  },
  feature: { fontSize: 13, color: '#374151', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  secondaryText: { fontWeight: '600', color: '#374151' },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryText: { fontWeight: '600', color: '#fff' },
});
