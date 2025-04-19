import { NextResponse, NextRequest } from 'next/server'
// import { checkApiKey } from '@/app/lib/api-protection' // Assuming we'll remove this
import { rateLimit } from '@/lib/rate-limit' // Import the main rateLimit function
// import { checkRateLimit } from '@/app/lib/rate-limit' // Remove old import
import { withMonitoring } from '@/app/lib/monitoring' // Assuming this is still needed

// API key validation - Kept for testing identifier logic, but checkApiKey is removed
const API_KEY = process.env.API_KEY || 'mmh_sk_test_51Qtc7Z06WDeGONfGPNebAm5w4oUkfPYQabOuZZvHtIKJj8UNg8ps2BmEgO0M9mAD48vybaBYesmwbD7BUPT3pw3Y00btR838SY'

// Helper to get API key from headers (simplified replacement for checkApiKey)
function getApiKey(request: NextRequest): string | null {
  return request.headers.get('Authorization')?.replace('Bearer ', '') || null;
}

// Base handler function
async function handler(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = getApiKey(request);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing or invalid API key format (Bearer token required)' },
        { status: 401 }
      )
    }

    // Use the API key as the identifier for the main rateLimit function
    // We can choose a rate limit type, e.g., 'authenticated' or a custom one if needed
    const rateLimitResult = await rateLimit({ type: 'authenticated', identifier: apiKey })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message || 'Rate limit exceeded' },
        { 
          status: 429,
          headers: { // Construct headers from the result
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'X-RateLimit-Type': rateLimitResult.type.toString(), // Add type
          }
        }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Basic input validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Return success response with rate limit headers
    return NextResponse.json(
      { 
        success: true,
        message: 'API request successful',
        data: body
      },
      { 
        status: 200,
        headers: { // Construct headers from the result
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'X-RateLimit-Type': rateLimitResult.type.toString(), // Add type
        }
      }
    )
  } catch (error) {
    console.error('API Error:', error)
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export monitored handler
export const POST = withMonitoring(handler) 