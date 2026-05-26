import type { UpgradeTierKey } from '@/src/services/stripe';

export type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  requiredTier?: UpgradeTierKey;
  feature?: string;
  onSuccess?: () => void | Promise<void>;
};

/** iOS uses web billing only; PaymentSheet UI is not offered (App Store 3.1.1). */
export function UpgradeModal(_props: UpgradeModalProps) {
  return null;
}
