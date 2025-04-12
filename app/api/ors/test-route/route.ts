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

    // Using Replit's parameter structure
    const params = {
      start: [[parseFloat(startLon), parseFloat(startLat)]],
      end: [[parseFloat(endLon), parseFloat(endLat)]],
      alternatives: ["true"],
      geometry: "true"
    };

    console.log('[Test Route] Request params:', JSON.stringify(params, null, 2));

    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
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
    console.log('[Test Route] ORS response:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Test Route] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 