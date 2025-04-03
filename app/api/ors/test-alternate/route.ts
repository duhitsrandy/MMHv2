import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouteService API key is missing" },
        { status: 500 }
      );
    }

    const { startLat, startLon, endLat, endLon } = await request.json();

    // Format coordinates as required by ORS: [[lon1,lat1], [lon2,lat2]]
    const coordinates = [
      [parseFloat(startLon), parseFloat(startLat)],
      [parseFloat(endLon), parseFloat(endLat)]
    ];

    console.log('[Test Alternate] Requesting routes with alternatives...');

    const response = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates,
          alternative_routes: {
            target_count: 2,
            weight_factor: 1.4,
            share_factor: 0.6
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Test Alternate] ORS error:', response.status, '-', response.statusText);
      console.error('[Test Alternate] Error details:', errorText);
      return NextResponse.json(
        { error: "Failed to fetch routes from ORS" },
        { status: 400 }
      );
    }

    const data = await response.json();
    console.log('[Test Alternate] Successfully fetched routes');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Test Alternate] Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 