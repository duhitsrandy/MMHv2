import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { profilesTable } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    // Test database connectivity (keeps Supabase active)
    const result = await db.select({ count: sql`count(*)` }).from(profilesTable);

    // Test Redis connectivity (keeps Upstash active)
    // This creates a Redis connection which counts as activity
    const { success } = await rateLimit({
      identifier: 'health-check-' + Date.now(),
      type: 'anonymous'
    });

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      redis: success ? 'connected' : 'rate-limited',
      profileCount: result[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      redis: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
