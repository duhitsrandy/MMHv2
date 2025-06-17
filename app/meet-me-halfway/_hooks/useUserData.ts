import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getLocationsAction } from '@/actions/db/locations-actions';
import { getSearchesAction } from '@/actions/db/searches-actions';
import { Location } from '@/types';
import { SelectSearch } from '@/db/schema';

export function useUserData(userId: string | null | undefined) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [searches, setSearches] = useState<SelectSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserData() {
      if (!userId) {
        setLocations([]);
        setSearches([]);
        setError(null);
        setIsLoading(false); // Ensure loading stops if no userId
        return;
      }

      setIsLoading(true);
      setError(null); // Reset error state on new load
      try {
        const [locationsRes, searchesRes] = await Promise.all([
          getLocationsAction(userId),
          getSearchesAction(userId),
        ]);

        if (!locationsRes.isSuccess) {
          console.error('Failed to load locations:', locationsRes.message);
          setError(locationsRes.message || 'Failed to load saved locations');
          toast.error('Failed to load saved locations');
        } else {
          setLocations(locationsRes.data || []);
        }

        if (!searchesRes.isSuccess) {
          console.error('Failed to load searches:', searchesRes.message);
          // Append error message if locations also failed
          setError(
            (prev) =>
              prev ? `${prev}; ${searchesRes.message || 'Failed to load recent searches'}` : searchesRes.message || 'Failed to load recent searches'
          );
          toast.error('Failed to load recent searches');
        } else {
          setSearches(searchesRes.data || []);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load user data due to an unexpected error.';
        setError(errorMessage);
        toast.error('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    }

    // Only load data if userId is definitively available (not just loaded state)
    if (userId) {
        loadUserData();
    } else {
        // Clear data if user signs out or userId becomes null/undefined
        setLocations([]);
        setSearches([]);
        setError(null);
        setIsLoading(false); 
    }
  }, [userId]); // Dependency array only includes userId

  return { locations, searches, isLoading, error, setLocations, setSearches };
} 