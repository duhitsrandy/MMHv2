import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useSafeAuth } from "@/src/auth";
import {
  BILLING_RETURN_URL,
  createMobileBillingPortal,
} from "@/src/services/stripe";

export function useManageSubscription() {
  const { getToken, isSignedIn } = useSafeAuth();
  const [loading, setLoading] = useState(false);

  const openBillingPortal = useCallback(async () => {
    if (!isSignedIn) {
      Alert.alert("Sign in required", "Please sign in to manage your subscription.");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Sign in required", "Please sign in to manage your subscription.");
        return;
      }

      const url = await createMobileBillingPortal(token);
      await WebBrowser.openAuthSessionAsync(url, BILLING_RETURN_URL);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not open billing portal.";
      Alert.alert("Billing", message);
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  return { openBillingPortal, loading };
}
