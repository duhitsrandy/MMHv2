import React from 'react';

/** Default / web: no native Stripe SDK. */
export function StripeWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
