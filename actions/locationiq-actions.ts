"use server"

import { ActionState } from "@/types"
import { PoiResponse } from "@/types/poi-types"

// Simple rate limiting implementation
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // Reduced to 500ms (2 requests per second)

// Simple in-memory cache
const apiCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper function to enforce rate limiting with retry logic
async function rateLimitedFetch(url: string, maxRetries = 3): Promise<Response> {
  // Check cache first
  if (apiCache[url] && (Date.now() - apiCache[url].timestamp) < CACHE_TTL) {
    return {
      ok: true,
      json: async () => apiCache[url].data,
      text: async () => JSON.stringify(apiCache[url].data),
      status: 200,
      statusText: 'OK (Cached)'
    } as Response;
  }

  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      // Enforce rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }

      // Make the request
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Meet-Me-Halfway/1.0',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      // Update last request time
      lastRequestTime = Date.now();

      // Cache successful responses
      if (response.ok) {
        const data = await response.clone().json();
        apiCache[url] = {
          data,
          timestamp: Date.now()
        };
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      retries++;
      if (retries < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

interface GeocodingResult {
  lat: string
  lon: string
  display_name: string
}

// Add this after the geocodeLocationAction function
async function fallbackGeocodeAction(
  address: string
): Promise<ActionState<GeocodingResult>> {
  try {
    // console.log('Using fallback geocoding service (Nominatim)'); // Keep commented or remove?
    // Using OpenStreetMap Nominatim as a fallback
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Meet-Me-Halfway/1.0',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return {
        isSuccess: false,
        message: "No results found for the provided address"
      };
    }

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
    console.error("Error with fallback geocoding:", error);
    return { isSuccess: false, message: "Failed to geocode location with fallback service" };
  }
}

// Modify the geocodeLocationAction to use the fallback if LocationIQ fails
export async function geocodeLocationAction(
  address: string
): Promise<ActionState<GeocodingResult>> {
  try {
    // console.log('Geocoding address:', address);
    const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY;
    if (!apiKey) {
      console.error('LocationIQ API key is missing');
      return {
        isSuccess: false,
        message: "LocationIQ API key is not configured"
      };
    }

    const url = `https://us1.locationiq.com/v1/search.php?key=${apiKey}&q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    try {
      const response = await rateLimitedFetch(url);
      // console.log('LocationIQ API response status:', response.status);

      if (!response.ok) {
        console.warn(`LocationIQ API error: ${response.statusText}. Trying fallback.`);
        return fallbackGeocodeAction(address);
      }

      const data = await response.json();
      // console.log('LocationIQ API response:', data);

      if (!data || data.length === 0) {
        console.warn('No results from LocationIQ. Trying fallback.');
        return fallbackGeocodeAction(address);
      }

      return {
        isSuccess: true,
        message: "Location geocoded successfully",
        data: {
          lat: data[0].lat,
          lon: data[0].lon,
          display_name: data[0].display_name
        }
      };
    } catch (error) {
      console.warn("Error with primary geocoding service:", error);
      return fallbackGeocodeAction(address);
    }
  } catch (error) {
    console.error("Error geocoding location:", error);
    return { isSuccess: false, message: "Failed to geocode location" };
  }
}

// Add this new function to search POIs using Overpass API
export async function searchPoisAction(
  lat: string,
  lon: string,
  radius: number = 1500,
  types: string[] = ["restaurant", "cafe", "bar", "park", "library", "cinema", "theatre", "museum", "hotel"]
): Promise<ActionState<PoiResponse[]>> {
  // console.log(`[POI Search] Starting search at ${lat},${lon} with radius ${radius}m`);

  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

    // Build a more comprehensive query
    const amenityTypes = ["restaurant", "cafe", "bar", "library", "cinema", "theatre", "hospital", "marketplace"];
    const leisureTypes = ["park", "garden", "playground", "sports_centre"];
    const tourismTypes = ["museum", "hotel", "gallery", "attraction", "viewpoint"];
    const shopTypes = ["supermarket", "mall", "department_store", "bakery", "convenience"];
    
    // Simple, direct Overpass query with common POI types
    const query = `
      [out:json][timeout:60];
      (
        node["amenity"~"${amenityTypes.join("|")}"](around:${radius},${lat},${lon});
        way["amenity"~"${amenityTypes.join("|")}"](around:${radius},${lat},${lon});
        relation["amenity"~"${amenityTypes.join("|")}"](around:${radius},${lat},${lon});
        
        node["leisure"~"${leisureTypes.join("|")}"](around:${radius},${lat},${lon});
        way["leisure"~"${leisureTypes.join("|")}"](around:${radius},${lat},${lon});
        relation["leisure"~"${leisureTypes.join("|")}"](around:${radius},${lat},${lon});
        
        node["tourism"~"${tourismTypes.join("|")}"](around:${radius},${lat},${lon});
        way["tourism"~"${tourismTypes.join("|")}"](around:${radius},${lat},${lon});
        relation["tourism"~"${tourismTypes.join("|")}"](around:${radius},${lat},${lon});
        
        node["shop"~"${shopTypes.join("|")}"](around:${radius},${lat},${lon});
        way["shop"~"${shopTypes.join("|")}"](around:${radius},${lat},${lon});
        relation["shop"~"${shopTypes.join("|")}"](around:${radius},${lat},${lon});
      );
      out body center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[POI Search] Overpass API error: ${response.status} ${response.statusText}`);
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Create a Set to track unique POIs by their coordinates
    const uniquePois = new Set<string>();
    
    // Process POIs with relaxed filtering and deduplication
    const pois = data.elements
      .filter((poi: any) => {
        const lat = poi.lat || poi.center?.lat;
        const lon = poi.lon || poi.center?.lon;
        const hasValidCoords = lat && lon;
        
        // Create a unique key for this POI
        const poiKey = `${lat},${lon}`;
        const isUnique = !uniquePois.has(poiKey);
        
        if (isUnique) {
          uniquePois.add(poiKey);
        }
        
        return hasValidCoords && isUnique;
      })
      .map((poi: any) => {
        const poiLat = poi.lat || poi.center?.lat || 0;
        const poiLon = poi.lon || poi.center?.lon || 0;
        
        // Determine the type from tags
        const poiType = 
          poi.tags?.amenity || 
          poi.tags?.leisure || 
          poi.tags?.tourism || 
          poi.tags?.shop || 
          'place';
        
        return {
          id: poi.id.toString(),
          osm_id: poi.id.toString(),
          name: poi.tags?.name || poi.tags?.['addr:housename'] || 'Unnamed Location',
          type: poiType,
          lat: poiLat.toString(),
          lon: poiLon.toString(),
          address: {
            street: poi.tags?.['addr:street'] || '',
            city: poi.tags?.['addr:city'] || '',
            state: poi.tags?.['addr:state'] || '',
            country: poi.tags?.['addr:country'] || '',
            postal_code: poi.tags?.['addr:postcode'] || ''
          },
          tags: poi.tags
        };
      });
    
    // Calculate distances and sort by closest to the specified point
    const sortedPois = pois
      .sort((a: PoiResponse, b: PoiResponse) => {
        // Prioritize named locations
        if (a.name !== 'Unnamed Location' && b.name === 'Unnamed Location') return -1;
        if (a.name === 'Unnamed Location' && b.name !== 'Unnamed Location') return 1;
        
        // Then sort by distance
        const distanceA = calculateDistance(parseFloat(lat), parseFloat(lon), parseFloat(a.lat), parseFloat(a.lon));
        const distanceB = calculateDistance(parseFloat(lat), parseFloat(lon), parseFloat(b.lat), parseFloat(b.lon));
        return distanceA - distanceB;
      })
      .slice(0, 8); // Back to 8 POIs per route
    
    // console.log(`[POI Search] Found ${processedPois.length} unique POIs after deduplication`);

    return {
      isSuccess: true,
      message: "Successfully found points of interest",
      data: sortedPois
    };

  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error("[POI Search] Search timed out after 30 seconds");
      return {
        isSuccess: false,
        message: "POI search timed out after 30 seconds",
        data: undefined
      };
    }
    
    console.error("[POI Search] Error:", error);
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to search for points of interest",
      data: undefined
    };
  }
}

// Helper function to calculate viewbox for LocationIQ search
function calculateViewbox(lat: string, lon: string, radiusKm: number): string {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  
  // Convert radius from km to degrees (approximately)
  // 1 degree of latitude = 111 km
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180));
  
  const minLon = lonNum - lonDelta;
  const minLat = latNum - latDelta;
  const maxLon = lonNum + lonDelta;
  const maxLat = latNum + latDelta;
  
  return `${minLon},${minLat},${maxLon},${maxLat}`;
}

// Function to calculate driving route using LocationIQ
interface RouteResult {
  distance: number
  duration: number
  geometry: {
    coordinates: [number, number][]
    type: string
  }
}

// Internal function to handle OSRM routing
async function getOsrmRoute(
  startLat: string,
  startLng: string,
  endLat: string,
  endLng: string,
  options: { alternatives: boolean; exclude?: string }
): Promise<ActionState<RouteResult | RouteResult[]>> {
  // console.log(`[Route Calculation] Calculating route from (${startLat},${startLng}) to (${endLat},${endLng})`);

  const coordinates = `${startLng},${startLat};${endLng},${endLat}`;
  let url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
  if (options.alternatives) {
    url += `&alternatives=true`;
  }
  if (options.exclude) {
    url += `&exclude=${options.exclude}`;
  }

  try {
    // console.log(`[Route Calculation] Requesting route from OSRM: ${url}`);
    const response = await rateLimitedFetch(url);
    // console.log(`[Route Calculation] OSRM response:`, await response.clone().json());

    if (!response.ok) {
      console.error(`[Route Calculation] OSRM API error: ${response.status} ${response.statusText}`);
      throw new Error(`OSRM API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || !data.routes || data.routes.length === 0) {
      console.error('[Route Calculation] No routes found by OSRM.');
      throw new Error("No routes found");
    }

    const routes = data.routes.map((route: any) => ({
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry
    }));

    // console.log(`[Route Calculation] Returning calculated route:`, {
    //   isSuccess: true,
    //   message: "Route calculated successfully",
    //   data: options.alternatives ? routes : routes[0]
    // });

    return {
      isSuccess: true,
      message: "Route calculated successfully",
      data: options.alternatives ? routes : routes[0]
    };
  } catch (error) {
    console.error("[Route Calculation] Error calculating route:", error);
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to calculate route"
    };
  }
}

export async function getRouteAction(
  startLat: string,
  startLng: string,
  endLat: string,
  endLng: string
): Promise<ActionState<RouteResult>> {
  return getOsrmRoute(startLat, startLng, endLat, endLng, { alternatives: false }) as Promise<ActionState<RouteResult>>;
}

export async function getAlternateRouteAction(
  startLat: string,
  startLng: string,
  endLat: string,
  endLng: string
): Promise<ActionState<RouteResult>> {
  const result = await getOsrmRoute(startLat, startLng, endLat, endLng, { alternatives: true });
  if (result.isSuccess && Array.isArray(result.data) && result.data.length > 1) {
    // Find the best alternative (different geometry, similar duration)
    const mainRoute = result.data[0];
    const alternative = result.data.slice(1).find(route => {
      // Simple geometry check (e.g., different first coordinate after start)
      const mainStartPoint = mainRoute.geometry.coordinates[1];
      const altStartPoint = route.geometry.coordinates[1];
      const geometryDiffers = mainStartPoint[0] !== altStartPoint[0] || mainStartPoint[1] !== altStartPoint[1];
      
      // Duration check (e.g., within 20% of main route duration)
      const durationDifference = Math.abs(route.duration - mainRoute.duration) / mainRoute.duration;
      const durationSimilar = durationDifference < 0.2;
      
      return geometryDiffers && durationSimilar;
    });

    return {
      isSuccess: true,
      message: "Alternate route calculated successfully",
      data: alternative || mainRoute // Fallback to main route if no good alternative
    };
  } else if (result.isSuccess && Array.isArray(result.data)) {
    // Only one route found, return it
    return {
      isSuccess: true,
      message: "Only one route found",
      data: result.data[0]
    };
  }
  // Handle error case
  return { isSuccess: false, message: result.message || "Failed to get alternate routes" };
}

export async function reverseGeocodeAction(
  lat: string,
  lon: string
): Promise<ActionState<{ display_name: string }>> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY;
    if (!apiKey) {
      console.error('LocationIQ API key is missing');
      return {
        isSuccess: false,
        message: "LocationIQ API key is not configured"
      };
    }

    const url = `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lon}&format=json`;

    try {
      const response = await rateLimitedFetch(url);
      if (!response.ok) {
        throw new Error(`LocationIQ API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data || !data.display_name) {
        throw new Error("No address found for the coordinates");
      }

      return {
        isSuccess: true,
        message: "Address found successfully",
        data: { display_name: data.display_name }
      };
    } catch (error) {
      console.error("Error reverse geocoding location:", error);
      // Fallback or more specific error handling could be added here
      return {
        isSuccess: false,
        message: error instanceof Error ? error.message : "Failed to find address for coordinates"
      };
    }
  } catch (error) {
    console.error("Error in reverseGeocodeAction setup:", error);
    return { isSuccess: false, message: "Failed to reverse geocode location" };
  }
}

// Helper function to calculate distance between two points using the Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
} 