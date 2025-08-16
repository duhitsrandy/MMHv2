import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // --- Rate Limiting Start ---
    const { success, limit, reset, remaining, type } = await rateLimit();
    if (!success) {
      console.warn(`[Rate Limit Exceeded] Type: ${type}, Identifier: (determined by rateLimit function)`);
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          limit,
          reset: new Date(reset * 1000).toISOString(), // Convert Unix timestamp to ISO string
          remaining,
        },
        { status: 429 } // Too Many Requests
      );
    }
    console.log(`[Rate Limit OK] Type: ${type}, Remaining: ${remaining}/${limit}`);
    // --- Rate Limiting End ---

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouteService API key is missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { startLat, startLon, endLat, endLon } = body;

    // ORS expects "coordinates": [[lon,lat],[lon,lat]]; request GeoJSON for easy decoding
    const params = {
      coordinates: [
        [parseFloat(startLon), parseFloat(startLat)],
        [parseFloat(endLon), parseFloat(endLat)],
      ],
      // Ask for more than one route if available
      alternative_routes: { target_count: 2, share_factor: 0.6, weight_factor: 1.2 },
      instructions: false,
      elevation: false,
    };

    console.log('[Test Route] Request params:', JSON.stringify(params, null, 2));

    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Test Route] ORS error: ${response.status} - ${response.statusText}`);
      console.error(`[Test Route] Error details: ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to fetch route from ORS' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Test Route] ORS response OK');

    // Extract coordinates from GeoJSON response
    let mainRoute: number[][] = [];
    let alternateRoute: number[][] = [];
    
    if (data?.features?.[0]?.geometry?.coordinates) {
      // Main route (first feature)
      mainRoute = data.features[0].geometry.coordinates;
      console.log(`[Test Route] Main route: ${mainRoute.length} points`);
      
      // Alternate route (second feature if exists)
      if (data?.features?.[1]?.geometry?.coordinates) {
        alternateRoute = data.features[1].geometry.coordinates;
        console.log(`[Test Route] Alternate route: ${alternateRoute.length} points`);
      }
    } else {
      console.warn('[Test Route] Could not extract coordinates from GeoJSON response');
      console.log('[Test Route] Response structure:', JSON.stringify(Object.keys(data || {})));
    }

    // Calculate midpoints for both routes
    let mainMidpoint = null;
    let alternateMidpoint = null;
    
    if (mainRoute.length > 0) {
      const midIndex = Math.floor(mainRoute.length / 2);
      mainMidpoint = { lat: mainRoute[midIndex][1], lng: mainRoute[midIndex][0] };
    }
    
    if (alternateRoute.length > 0) {
      const midIndex = Math.floor(alternateRoute.length / 2);
      alternateMidpoint = { lat: alternateRoute[midIndex][1], lng: alternateRoute[midIndex][0] };
    }

    console.log(`[Test Route] Main route: ${mainRoute.length} points, Alternate: ${alternateRoute.length} points`);

    // Return normalized format that mobile expects
    return NextResponse.json({
      coordinates: mainRoute, // Backward compatibility
      mainRoute,
      alternateRoute,
      mainMidpoint,
      alternateMidpoint
    });
  } catch (error) {
    console.error('[Test Route] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 