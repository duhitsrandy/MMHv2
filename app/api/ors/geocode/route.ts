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

    const { address } = await request.json();

    console.log('[Geocoding] Requesting geocoding for:', address);

    const response = await fetch(
      'https://api.openrouteservice.org/geocode/search',
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: address,
          size: 1
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Geocoding] ORS error:', response.status, '-', response.statusText);
      console.error('[Geocoding] Error details:', errorText);
      return NextResponse.json(
        { error: "Failed to geocode address" },
        { status: 400 }
      );
    }

    const data = await response.json();
    console.log('[Geocoding] Successfully geocoded address');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Geocoding] Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 