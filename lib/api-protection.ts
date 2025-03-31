import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://meetmehalfway.app',
  // Add your production domain here
];

const ALLOWED_METHODS = ['POST', 'GET', 'OPTIONS'];

export function withApiProtection(handler: Function) {
  return async (request: Request) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Validate request method
    if (!ALLOWED_METHODS.includes(request.method)) {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Validate content type for POST requests
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return NextResponse.json(
          { error: 'Content-Type must be application/json' },
          { status: 415 }
        );
      }
    }

    // Get the response from the handler
    const response = await handler(request);

    // Add security headers to the response
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
    headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Return response with security headers
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
} 