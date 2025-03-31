import { NextResponse, NextRequest } from 'next/server'
import { auth } from "@clerk/nextjs/server"

interface ApiProtectionConfig {
  requireApiKey?: boolean
  allowedOrigins?: string[]
  maxRequestsPerMinute?: number
}

const defaultConfig: ApiProtectionConfig = {
  requireApiKey: true,
  allowedOrigins: ['http://localhost:3000'], // Add your production domain
  maxRequestsPerMinute: 60
}

// In-memory store for API keys (replace with database in production)
const validApiKeys = new Set<string>([
  process.env.API_KEY || 'test-key'
])

export function withApiProtection(handler: Function, config: ApiProtectionConfig = {}) {
  return async (req: NextRequest) => {
    try {
      // Check origin
      const origin = req.headers.get('origin')
      if (config.allowedOrigins?.length && 
          !config.allowedOrigins.includes(origin || '')) {
        return NextResponse.json(
          { error: 'Unauthorized origin' },
          { status: 403 }
        )
      }

      // Check API key if required
      if (config.requireApiKey) {
        const apiKey = req.headers.get('x-api-key')
        if (!apiKey || !validApiKeys.has(apiKey)) {
          return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 401 }
          )
        }
      }

      // Check authentication
      const { userId } = auth()
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Add user context to request
      const userContext = {
        userId,
        timestamp: Date.now()
      }

      // Create a new request with user context
      const enhancedReq = new NextRequest(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        // @ts-ignore - Adding custom property
        userContext
      })

      return handler(enhancedReq)
    } catch (error) {
      console.error('API protection error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Helper function to validate API key format
export function validateApiKey(apiKey: string): boolean {
  // Basic validation - can be enhanced based on your needs
  return typeof apiKey === 'string' && apiKey.length >= 32
}

// Helper function to generate API key
export function generateApiKey(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
} 