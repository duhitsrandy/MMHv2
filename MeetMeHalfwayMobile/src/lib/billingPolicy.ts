import { Platform } from "react-native";

/**
 * App Store Guideline 3.1.1: do not offer in-app purchase UI for digital
 * subscriptions on iOS. Upgrades happen on web; Android keeps PaymentSheet.
 */
export const canShowUpgradeUI = Platform.OS !== "ios";

/** Plain text only — no Linking.openURL to pricing (3.1.1 safe). */
export const IOS_UPGRADE_NOTICE =
  "Upgrade plans on the web at meetmehalfway.co";
