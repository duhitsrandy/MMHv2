"use server";

import { ActionState } from "@/types"
import { LOCATIONIQ_API_BASE, NOMINATIM_API_BASE, DEFAULT_USER_AGENT } from "@/lib/constants";
import {
  buildGeocodeCacheKey,
  getCachedJson,
  getGeocodeCacheTtlSeconds,
  setCachedJson,
} from "@/lib/cache/api-cache";

interface GeocodingResult {
  lat: string
  lon: string
  display_name: string
}

// WORKING - Geocoding function with real API calls but no problematic monitoring
export async function geocodeLocationAction(
  address: string
): Promise<ActionState<GeocodingResult>> {
  console.log('[GEOCODING] Starting geocoding for address:', address);

  const trimmed = address.trim();
  if (!trimmed) {
    return { isSuccess: false, message: "Address is required" };
  }

  const geocodeCacheKey = buildGeocodeCacheKey(trimmed);
  const cached = await getCachedJson<GeocodingResult>(geocodeCacheKey);
  if (cached?.lat && cached?.lon) {
    console.log(`[GEOCODING] cache hit ${geocodeCacheKey}`);
    return {
      isSuccess: true,
      message: "Location geocoded successfully (cached)",
      data: cached,
    };
  }
  
  try {
    // Try LocationIQ first
    const apiKey = process.env.LOCATIONIQ_KEY;
    if (apiKey) {
      const url = `${LOCATIONIQ_API_BASE}/search.php?key=${apiKey}&q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            console.log('[GEOCODING] LocationIQ success');
            const geocodeData: GeocodingResult = {
              lat: data[0].lat,
              lon: data[0].lon,
              display_name: data[0].display_name,
            };
            await setCachedJson(geocodeCacheKey, geocodeData, getGeocodeCacheTtlSeconds());
            return {
              isSuccess: true,
              message: "Location geocoded successfully",
              data: geocodeData,
            };
          }
        }
      } catch (error) {
        console.warn('[GEOCODING] LocationIQ failed, trying fallback:', error);
      }
    }

    // Fallback to Nominatim
    console.log('[GEOCODING] Using Nominatim fallback');
    const fallbackUrl = `${NOMINATIM_API_BASE}/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
    
    const response = await fetch(fallbackUrl, {
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return {
        isSuccess: false,
        message: "No results found for the provided address"
      };
    }

    console.log('[GEOCODING] Nominatim success');
    const geocodeData: GeocodingResult = {
      lat: data[0].lat,
      lon: data[0].lon,
      display_name: data[0].display_name,
    };
    await setCachedJson(geocodeCacheKey, geocodeData, getGeocodeCacheTtlSeconds());
    return {
      isSuccess: true,
      message: "Location geocoded successfully (fallback)",
      data: geocodeData,
    };
  } catch (error) {
    console.error("[GEOCODING] Error:", error);
    if (error instanceof Error) {
      console.error("[GEOCODING] Error message:", error.message);
    }
    return { isSuccess: false, message: "Failed to geocode location" };
  }
}
