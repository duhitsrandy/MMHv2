import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Text, View } from "@/components/Themed";
import { usePoi } from "../contexts/PoiContext";
import {
  SavedLocation,
  SavedSearch,
  getSavedLocations,
  getSavedSearches,
  removeSavedLocation,
  removeSavedSearch,
} from "../../src/services/storage";

export default function SavedScreen() {
  const router = useRouter();
  const { setPendingSearch } = usePoi();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);

  const load = useCallback(async () => {
    const [savedLocations, savedSearches] = await Promise.all([
      getSavedLocations(),
      getSavedSearches(),
    ]);
    setLocations(savedLocations);
    setSearches(savedSearches);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applySearch = (item: SavedSearch) => {
    setPendingSearch({ locations: item.locations });
    router.push("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Saved Locations</Text>
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No saved locations yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.label}</Text>
            <Text style={styles.meta} numberOfLines={2}>{item.address}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={async () => {
                await removeSavedLocation(item.id);
                load();
              }}
            >
              <Text style={styles.deleteButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Text style={styles.heading}>Search History</Text>
      <FlatList
        data={searches}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No saved searches yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => applySearch(item)}>
            <Text style={styles.title}>{item.locations.length} locations</Text>
            <Text style={styles.meta} numberOfLines={2}>
              {item.locations.map((loc) => loc.address).join(" • ")}
            </Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => applySearch(item)}
              >
                <Text style={styles.actionText}>Run Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={async () => {
                  await removeSavedSearch(item.id);
                  load();
                }}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#f9fafb" },
  heading: { fontSize: 18, fontWeight: "700", marginVertical: 8, color: "#111827" },
  empty: { color: "#6b7280", paddingVertical: 8 },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  title: { fontSize: 14, fontWeight: "600", color: "#111827" },
  meta: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  actionButton: {
    backgroundColor: "#2563eb",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionText: { color: "white", fontSize: 12, fontWeight: "600" },
  deleteButton: {
    backgroundColor: "#ef4444",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  deleteButtonText: { color: "white", fontSize: 12, fontWeight: "600" },
});

