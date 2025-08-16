import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { profilesTable } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Simple database connectivity test
    const result = await db.select({ count: sql`count(*)` }).from(profilesTable);
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      profileCount: result[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
