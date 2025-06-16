"use server";

import { ActionState } from "@/types"
import { LOCATIONIQ_API_BASE, NOMINATIM_API_BASE, DEFAULT_USER_AGENT } from "@/lib/constants";

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
  
  try {
    // Try LocationIQ first
    const apiKey = process.env.LOCATIONIQ_KEY;
    if (apiKey) {
      const url = `${LOCATIONIQ_API_BASE}/search.php?key=${apiKey}&q=${encodeURIComponent(address)}&format=json&limit=1`;
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            console.log('[GEOCODING] LocationIQ success');
            return {
              isSuccess: true,
              message: "Location geocoded successfully",
              data: {
                lat: data[0].lat,
                lon: data[0].lon,
                display_name: data[0].display_name
              }
            };
          }
        }
      } catch (error) {
        console.warn('[GEOCODING] LocationIQ failed, trying fallback:', error);
      }
    }

    // Fallback to Nominatim
    console.log('[GEOCODING] Using Nominatim fallback');
    const fallbackUrl = `${NOMINATIM_API_BASE}/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    
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
    return {
      isSuccess: true,
      message: "Location geocoded successfully (fallback)",
      data: {
        lat: data[0].lat,
        lon: data[0].lon,
        display_name: data[0].display_name
      }
    };
  } catch (error) {
    console.error("[GEOCODING] Error:", error);
    if (error instanceof Error) {
      console.error("[GEOCODING] Error message:", error.message);
    }
    return { isSuccess: false, message: "Failed to geocode location" };
  }
} 