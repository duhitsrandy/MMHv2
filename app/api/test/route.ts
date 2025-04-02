import { NextResponse, NextRequest } from 'next/server'
import { checkApiKey } from '@/app/lib/api-protection'
import { checkRateLimit } from '@/app/lib/rate-limit'
import { withMonitoring } from '@/app/lib/monitoring'

// API key validation
const API_KEY = process.env.API_KEY || 'mmh_sk_test_51Qtc7Z06WDeGONfGPNebAm5w4oUkfPYQabOuZZvHtIKJj8UNg8ps2BmEgO0M9mAD48vybaBYesmwbD7BUPT3pw3Y00btR838SY'

// Base handler function
async function handler(request: NextRequest) {
  try {
    // Check API key
    const apiKeyCheck = await checkApiKey(request)
    if (!apiKeyCheck.success || !apiKeyCheck.apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Check rate limit using the API key as identifier
    const rateLimitCheck = await checkRateLimit(apiKeyCheck.apiKey)
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: rateLimitCheck.headers
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
        headers: rateLimitCheck.headers
      }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export monitored handler
export const POST = withMonitoring(handler) 