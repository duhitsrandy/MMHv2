import { useCallback, useEffect, useState } from "react";
import { useSafeAuth } from "@/src/auth";
import {
  SavedLocation,
  SavedSearch,
  getSavedLocations,
  getSavedSearches,
  removeSavedLocation,
  removeSavedSearch,
} from "../services/storage";
import {
  fetchCloudLocations,
  fetchCloudSearches,
  deleteCloudLocation,
  deleteCloudSearch,
} from "../services/cloudSync";

export function useSavedData() {
  const { isSignedIn, isLoaded, getToken } = useSafeAuth();
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

  const removeLocation = useCallback(
    async (id: string) => {
      const previous = locations;
      setLocations((current) => current.filter((item) => item.id !== id));
      try {
        if (isSignedIn) {
          const token = await getToken();
          if (token) await deleteCloudLocation(token, id);
        } else {
          await removeSavedLocation(id);
        }
      } catch {
        setLocations(previous);
        await load();
      }
    },
    [isSignedIn, getToken, locations, load]
  );

  const removeSearch = useCallback(
    async (id: string) => {
      const previous = searches;
      setSearches((current) => current.filter((item) => item.id !== id));
      try {
        if (isSignedIn) {
          const token = await getToken();
          if (token) await deleteCloudSearch(token, id);
        } else {
          await removeSavedSearch(id);
        }
      } catch {
        setSearches(previous);
        await load();
      }
    },
    [isSignedIn, getToken, searches, load]
  );

  return {
    locations,
    searches,
    loading,
    loadError,
    isSignedIn,
    reload: load,
    removeLocation,
    removeSearch,
  };
}
