import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text, View } from "@/components/Themed";

type Stage = "credentials" | "verify";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    setError("");
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStage("verify");
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Sign up failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    setError("");
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      await setActive({ session: result.createdSessionId });
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Verification failed. Check the code and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (stage === "verify") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>
          A verification code was sent to {email}. Enter it below.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Verification code"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={() => setStage("credentials")}>
          <Text style={styles.skipText}>Back to sign up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to sync your saves across devices.</Text>

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
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <Link href={"/(tabs)" as any} asChild>
        <TouchableOpacity style={styles.skipButton}>
          <Text style={styles.skipText}>Continue without signing in</Text>
        </TouchableOpacity>
      </Link>

      <Link href={"/sign-in" as any} style={styles.link}>
        Already have an account? Sign in
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
