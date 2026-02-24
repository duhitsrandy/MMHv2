import { Link } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Text, View } from "@/components/Themed";

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.copy}>
        Mobile auth routes are enabled. If you require strict auth, set
        `EXPO_PUBLIC_REQUIRE_AUTH=true` and wire your Clerk sign-in UI.
      </Text>
      <Link href={"/(tabs)" as any} asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Continue to App</Text>
        </TouchableOpacity>
      </Link>
      <Link href={"/sign-up" as any} style={styles.link}>
        Need an account? Go to sign up
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  copy: { textAlign: "center", color: "#6b7280" },
  button: { backgroundColor: "#111827", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  buttonText: { color: "white", fontWeight: "600" },
  link: { color: "#2563eb", marginTop: 8 },
});

