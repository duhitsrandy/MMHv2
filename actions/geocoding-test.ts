"use server";

import { ActionState } from "@/types"

interface GeocodingResult {
  lat: string
  lon: string
  display_name: string
}

// MINIMAL TEST - Geocoding function without any problematic imports
export async function geocodeLocationAction(
  address: string
): Promise<ActionState<GeocodingResult>> {
  console.log('[GEOCODING TEST] Starting test geocoding for address:', address);
  
  try {
    console.log('[GEOCODING TEST] Test mode - returning mock data');
    return {
      isSuccess: true,
      message: "Test geocoding successful",
      data: {
        lat: "40.7128",
        lon: "-74.0060",
        display_name: "Test Location: " + address
      }
    };
  } catch (error) {
    console.error("[GEOCODING TEST] Error in test geocoding:", error);
    if (error instanceof Error) {
      console.error("[GEOCODING TEST] Error name:", error.name);
      console.error("[GEOCODING TEST] Error message:", error.message); 
      console.error("[GEOCODING TEST] Error stack:", error.stack);
    }
    return { isSuccess: false, message: "Test geocoding failed" };
  }
} 