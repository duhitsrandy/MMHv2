import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Text, View } from "@/components/Themed";
import { PRIVACY_POLICY_URL } from "@/src/constants/legal";
import { useSafeAuth } from "@/src/auth";
import { deleteAccount } from "@/src/services/api";

const CONFIRM_PHRASE = "DELETE";

export default function DeleteAccountScreen() {
  const { getToken, isSignedIn, signOut } = useSafeAuth();
  const router = useRouter();

  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = confirmText.trim() === CONFIRM_PHRASE && !loading && !success;

  const handleDelete = async () => {
    if (!canSubmit) return;

    setError("");
    setLoading(true);
    try {
      if (!isSignedIn) {
        setError("You must be signed in to delete your account.");
        return;
      }

      const token = await getToken();
      if (!token) {
        setError("Could not verify your session. Sign in again and retry.");
        return;
      }

      await deleteAccount(token);
      setSuccess(true);
      await signOut();
      router.replace("/(tabs)");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not delete your account.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Delete Account</Text>
        <Text style={styles.body}>Sign in to delete your Meet Me Halfway account.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace("/sign-in" as any)}>
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Account deleted</Text>
        <Text style={styles.body}>
          Your account and associated data have been removed. You have been signed out.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.body}>
        This permanently deletes your Meet Me Halfway account and cannot be undone.
      </Text>

      <Text style={styles.sectionHeading}>What will be deleted</Text>
      <Text style={styles.listItem}>• Your profile and plan information</Text>
      <Text style={styles.listItem}>• Saved locations</Text>
      <Text style={styles.listItem}>• Saved searches</Text>
      <Text style={styles.note}>
        Active subscriptions are canceled when possible. Residual copies may remain in backups
        for a limited time as described in our privacy policy.
      </Text>

      <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
        <Text style={styles.link}>Privacy Policy</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeading}>Confirm deletion</Text>
      <Text style={styles.body}>
        Type <Text style={styles.mono}>{CONFIRM_PHRASE}</Text> below to confirm.
      </Text>
      <TextInput
        style={styles.input}
        placeholder={CONFIRM_PHRASE}
        placeholderTextColor="#9ca3af"
        autoCapitalize="characters"
        autoCorrect={false}
        value={confirmText}
        onChangeText={setConfirmText}
        editable={!loading}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.deleteButton, !canSubmit && styles.deleteButtonDisabled]}
        onPress={handleDelete}
        disabled={!canSubmit}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete my account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} disabled={loading}>
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
    marginBottom: 8,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
    marginBottom: 4,
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 8,
  },
  link: {
    fontSize: 15,
    color: "#2563eb",
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 8,
  },
  mono: {
    fontFamily: "SpaceMono",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
});
