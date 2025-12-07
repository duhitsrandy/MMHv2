/*
<ai_context>
Health check endpoint that performs real database and Redis operations to keep services active.
- Queries the database to prevent Supabase from pausing the project
- Connects to Upstash Redis to keep it active
- Returns service status information
- Designed to be called by automated monitoring (e.g., GitHub Actions)
</ai_context>
*/

import { NextResponse } from 'next/server'
import { db } from '@/db/db'
import { profilesTable } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const startTime = Date.now()
    const checks: Record<string, any> = {}

    // 1. Database health check - perform a real query
    try {
      // Query to count profiles (lightweight but real DB activity)
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(profilesTable)
        .limit(1)
      
      checks.database = {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        activity: 'profile_count_query_executed'
      }
    } catch (dbError) {
      checks.database = {
        status: 'unhealthy',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        responseTime: Date.now() - startTime
      }
    }

    // 2. Redis health check - perform a real operation
    try {
      const redisStart = Date.now()
      const redis = Redis.fromEnv()
      
      // Set and get a health check value
      const key = 'health:check'
      const timestamp = Date.now()
      await redis.set(key, timestamp, { ex: 300 }) // Expires in 5 minutes
      const value = await redis.get(key)
      
      checks.redis = {
        status: 'healthy',
        responseTime: Date.now() - redisStart,
        activity: 'set_and_get_executed'
      }
    } catch (redisError) {
      checks.redis = {
        status: 'unhealthy',
        error: redisError instanceof Error ? redisError.message : 'Unknown Redis error',
        responseTime: Date.now() - startTime
      }
    }

    // 3. Overall health status
    const allHealthy = Object.values(checks).every(
      check => check.status === 'healthy'
    )

    const response = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      totalResponseTime: Date.now() - startTime,
      checks,
      message: allHealthy 
        ? 'All services operational' 
        : 'Some services are experiencing issues'
    }

    return NextResponse.json(response, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    })

  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Health check failed'
      },
      { status: 500 }
    )
  }
}

