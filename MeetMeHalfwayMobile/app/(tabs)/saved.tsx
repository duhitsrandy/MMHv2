import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAuth as useAuth } from "../_layout";
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
import {
  fetchCloudLocations,
  fetchCloudSearches,
  deleteCloudLocation,
  deleteCloudSearch,
} from "../../src/services/cloudSync";

export default function SavedScreen() {
  const router = useRouter();
  const { setPendingSearch } = usePoi();
  const { isSignedIn, isLoaded, getToken } = useAuth();

  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoadError(false);
    setLoading(true);
    try {
      if (isSignedIn) {
        const token = await getToken();
        if (!token) throw new Error("No token");
        const [cloudLocs, cloudSearches] = await Promise.all([
          fetchCloudLocations(token),
          fetchCloudSearches(token),
        ]);
        setLocations(cloudLocs);
        setSearches(cloudSearches);
      } else {
        const [savedLocations, savedSearches] = await Promise.all([
          getSavedLocations(),
          getSavedSearches(),
        ]);
        setLocations(savedLocations);
        setSearches(savedSearches);
      }
    } catch {
      setLoadError(true);
      setLocations([]);
      setSearches([]);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    load();
  }, [isLoaded, load]);

  const handleRemoveLocation = async (id: string) => {
    try {
      if (isSignedIn) {
        const token = await getToken();
        if (token) await deleteCloudLocation(token, id);
      } else {
        await removeSavedLocation(id);
      }
      load();
    } catch {
      load();
    }
  };

  const handleRemoveSearch = async (id: string) => {
    try {
      if (isSignedIn) {
        const token = await getToken();
        if (token) await deleteCloudSearch(token, id);
      } else {
        await removeSavedSearch(id);
      }
      load();
    } catch {
      load();
    }
  };

  const applySearch = (item: SavedSearch) => {
    setPendingSearch({ locations: item.locations });
    router.push("/(tabs)");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Could not load saved data.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isSignedIn && (
        <Text style={styles.syncBadge}>Synced to cloud</Text>
      )}

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
              onPress={() => handleRemoveLocation(item.id)}
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
                onPress={() => handleRemoveSearch(item.id)}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  syncBadge: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "right",
  },
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
  retryButton: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryText: { color: "white", fontWeight: "600" },
});
