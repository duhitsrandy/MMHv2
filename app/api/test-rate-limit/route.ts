import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  // Get the type from query params
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as 'anonymous' | 'authenticated' | 'special' || 'anonymous'

  // Apply rate limiting based on type
  const rateLimitResult = await rateLimit({ type })

  return NextResponse.json({
    message: 'Test endpoint',
    rateLimit: rateLimitResult,
    type
  }, {
    headers: {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.reset.toString(),
      'X-RateLimit-Type': type
    }
  })
} 