import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') ?? '1200';
    const tags = searchParams.get('tags') ?? 'restaurant,cafe,park';

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const key =
      process.env.LOCATIONIQ_KEY ||
      process.env.NEXT_PUBLIC_LOCATIONIQ_KEY ||
      process.env.EXPO_PUBLIC_LOCATIONIQ_KEY; // last resort in dev

    if (!key) {
      return NextResponse.json({ error: 'LocationIQ key missing' }, { status: 500 });
    }

    const url = `https://us1.locationiq.com/v1/nearby.php?key=${encodeURIComponent(
      key
    )}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&radius=${encodeURIComponent(
      radius
    )}&tag=${encodeURIComponent(tags)}&format=json`;

    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'LocationIQ error', details: text }, { status: res.status });
    }
    const data = await res.json();
    const pois = Array.isArray(data)
      ? data
          .map((d: any) => ({
            lat: parseFloat(d?.lat),
            lng: parseFloat(d?.lon),
            name: d?.name || d?.display_name?.split(',')[0], // Use first part of display_name as name
            address: d?.display_name, // Full address
            type: d?.type || d?.class,
          }))
          .filter((p: any) => isFinite(p.lat) && isFinite(p.lng))
      : [];

    return NextResponse.json({ pois });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


