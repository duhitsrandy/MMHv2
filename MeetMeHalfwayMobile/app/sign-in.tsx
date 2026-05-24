import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text, View } from "@/components/Themed";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) {
      setError("Auth is still loading. Wait a moment and try again.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: trimmedEmail,
        password,
      });

      if (result.status === "complete") {
        if (!result.createdSessionId) {
          setError("Sign-in succeeded but no session was created. Try again.");
          return;
        }
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
        return;
      }

      if (result.status === "needs_first_factor") {
        setError(
          "This account needs an extra verification step. Sign in at meetmehalfway.co in a browser, or use email code sign-in if enabled in Clerk."
        );
        return;
      }

      setError(
        `Sign-in could not be completed (${result.status}). Try the web app or contact support.`
      );
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        "Sign in failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>Sign in to sync your saves and unlock your plan tier.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[
          styles.button,
          (loading || !isLoaded) && styles.buttonDisabled,
        ]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            {!isLoaded ? "Loading…" : "Sign In"}
          </Text>
        )}
      </TouchableOpacity>

      <Link href={"/(tabs)" as any} asChild>
        <TouchableOpacity style={styles.skipButton}>
          <Text style={styles.skipText}>Continue without signing in</Text>
        </TouchableOpacity>
      </Link>

      <Link href={"/sign-up" as any} style={styles.link}>
        Don't have an account? Sign up
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: "700" },
  subtitle: { textAlign: "center", color: "#6b7280", marginBottom: 4 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "white",
  },
  error: { color: "#ef4444", textAlign: "center", fontSize: 13 },
  button: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
  skipButton: { marginTop: 4 },
  skipText: { color: "#6b7280", fontSize: 14, textDecorationLine: "underline" },
  link: { color: "#2563eb", marginTop: 4, fontSize: 14 },
});
