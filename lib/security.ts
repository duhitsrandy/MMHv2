import { NextResponse } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT = 100; // requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Store for rate limiting
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

export function withRateLimit(handler: Function) {
  return async (request: Request) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    // Clean up old entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (now - value.timestamp > RATE_LIMIT_WINDOW) {
        rateLimitStore.delete(key);
      }
    }

    // Get or create rate limit entry
    const rateLimit = rateLimitStore.get(ip) || { count: 0, timestamp: now };

    // Check if rate limit exceeded
    if (rateLimit.count >= RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Update rate limit
    rateLimit.count++;
    rateLimitStore.set(ip, rateLimit);

    // Add rate limit headers
    const response = await handler(request);
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', RATE_LIMIT.toString());
    headers.set('X-RateLimit-Remaining', (RATE_LIMIT - rateLimit.count).toString());
    headers.set('X-RateLimit-Reset', (rateLimit.timestamp + RATE_LIMIT_WINDOW).toString());

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
} 