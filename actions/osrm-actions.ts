"use server"

import {
  RAPIDAPI_FAST_ROUTING_HOST_ENV_VAR,
  RAPIDAPI_FAST_ROUTING_KEY_ENV_VAR
} from "@/lib/constants"

/**
 * Lightweight wrapper around Fast-Routing's OSRM API hosted on RapidAPI.
 * Returns the raw JSON from /route/v1 (OSRM-compatible structure).
 */
export async function osrmRoute({
  startLon,
  startLat,
  endLon,
  endLat,
  alts = 0, // Changed default to 0 as per RapidAPI curl example structure
}: {
  startLon: string | number
  startLat: string | number
  endLon: string | number
  endLat: string | number
  alts?: number
}) {
  const host = process.env[RAPIDAPI_FAST_ROUTING_HOST_ENV_VAR];
  const apiKey = process.env[RAPIDAPI_FAST_ROUTING_KEY_ENV_VAR];

  if (!host || !apiKey) {
    console.error("RapidAPI Fast Routing host or key missing in environment variables.");
    throw new Error("RapidAPI Fast Routing host or key missing");
  }

  // Construct URL using the RapidAPI host
  const url =
    `https://${host}/route/v1/driving/${startLon},${startLat};${endLon},${endLat}` +
    `?alternatives=${alts}&overview=full&geometries=geojson&steps=false`; // steps=false is common for just geometry

  console.log(`[RapidAPI OSRM] Requesting: ${url}`);

  const res = await fetch(url, {
    method: 'GET', // GET is typical for RapidAPI unless body needed
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': host
    },
    next: { revalidate: 0 } // skip Next.js cache
  });

  // Log rate-limit headers if RapidAPI provides them (check actual headers)
  // console.log('[RapidAPI OSRM] Rate limit headers:', { ... });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'Could not read error body');
    console.error(`[RapidAPI OSRM] Error ${res.status}: ${errorBody}`);
    throw new Error(`RapidAPI OSRM Error ${res.status}`);
  }

  const data = await res.json();
  // console.log('[RapidAPI OSRM] Response:', JSON.stringify(data).substring(0, 200) + '...');
  return data; // OSRM-compatible response
} 