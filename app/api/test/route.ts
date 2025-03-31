import { NextResponse, NextRequest } from 'next/server'
import { withRateLimit } from '@/lib/security'
import { withValidation } from '@/lib/validation'
import { withApiProtection } from '@/lib/api-protection'

// API key validation
const API_KEY = process.env.API_KEY || 'mmh_sk_test_51Qtc7Z06WDeGONfGPNebAm5w4oUkfPYQabOuZZvHtIKJj8UNg8ps2BmEgO0M9mAD48vybaBYesmwbD7BUPT3pw3Y00btR838SY'

// Base handler function
async function handler(request: NextRequest) {
  // Check API key
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || apiKey !== API_KEY) {
    return NextResponse.json(
      { error: 'Invalid or missing API key' },
      { status: 401 }
    )
  }

  // Return success response with validated body
  return NextResponse.json({
    success: true,
    data: {
      ...(request as any).validatedBody,
      message: 'Route calculated successfully'
    }
  })
}

// Export protected, validated, and rate-limited handler
export const POST = withApiProtection(withRateLimit(withValidation(handler))) 