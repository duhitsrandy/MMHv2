import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

export function StripeWrapper({ children }: { children: React.ReactNode }) {
  const stripePk = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  const looksValid = !!stripePk && /^pk_(test|live)_.+/.test(stripePk);

  if (!looksValid) {
    if (__DEV__) {
      console.warn(
        '[Stripe] EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY missing or invalid; PaymentSheet disabled.'
      );
    }
    return <>{children}</>;
  }

  return (
    <StripeProvider
      publishableKey={stripePk}
      merchantIdentifier="merchant.com.meetmehalfway.mobile"
      urlScheme="mmh"
    >
      <React.Fragment>{children}</React.Fragment>
    </StripeProvider>
  );
}
