import { NextResponse } from 'next/server';
import { getTravelTimeMatrixAction } from '@/actions/ors-actions';
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
          reset: new Date(reset * 1000).toISOString(),
          remaining,
        },
        { status: 429 }
      );
    }
    console.log(`[Rate Limit OK] Type: ${type}, Remaining: ${remaining}/${limit}`);
    // --- Rate Limiting End ---

    const body = await request.json();
    const { coordinates, sources, destinations } = body;

    if (!coordinates || !sources || !destinations) {
      return NextResponse.json(
        { error: 'Missing required parameters: coordinates, sources, destinations' },
        { status: 400 }
      );
    }

    console.log('[ORS Matrix API] Requesting travel time matrix...');

    const result = await getTravelTimeMatrixAction(coordinates, sources, destinations);

    if (!result.isSuccess) {
      console.error('[ORS Matrix API] Matrix calculation failed:', result.message);
      return NextResponse.json(
        { error: result.message || 'Matrix calculation failed' },
        { status: 500 }
      );
    }

    console.log('[ORS Matrix API] Successfully calculated travel time matrix');
    return NextResponse.json(result.data);

  } catch (error) {
    console.error('[ORS Matrix API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
