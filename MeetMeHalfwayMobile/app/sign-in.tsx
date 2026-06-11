import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/** Route shell: Clerk loads only when this screen is opened (dynamic import). */
export default function SignInRoute() {
  const [Screen, setScreen] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("./screens/SignInScreen").then((mod) => {
      setScreen(() => mod.default);
    });
  }, []);

  if (!Screen) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const Loaded = Screen;
  return <Loaded />;
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
});
