import { NextResponse } from 'next/server';
import { searchPoisAction } from '@/actions/locationiq-actions';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radiusParam = searchParams.get('radius') ?? '1200';

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const radius = parseInt(radiusParam, 10);
    if (!Number.isFinite(radius) || radius <= 0) {
      return NextResponse.json({ error: 'radius must be a positive integer' }, { status: 400 });
    }

    const result = await searchPoisAction({
      lat,
      lon: lng,
      radius,
    });

    if (!result.isSuccess || !result.data) {
      return NextResponse.json(
        { error: result.message || 'POI search failed' },
        { status: 500 }
      );
    }

    const pois = result.data
      .map((d) => ({
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
        name: d.name || 'Unnamed Location',
        address: d.address?.city || d.address?.street || undefined,
        type: d.type,
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    return NextResponse.json({ pois });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
