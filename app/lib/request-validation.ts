import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface ValidationConfig {
  maxBodySize?: number // in bytes
  allowedContentTypes?: string[]
  requiredHeaders?: string[]
  validateBody?: (body: any) => boolean
}

const defaultConfig: ValidationConfig = {
  maxBodySize: 1024 * 1024, // 1MB
  allowedContentTypes: ['application/json'],
  requiredHeaders: ['content-type'],
  validateBody: (body: any) => {
    // Basic validation - can be extended based on needs
    return typeof body === 'object' && body !== null
  }
}

export function withValidation(handler: Function, config: ValidationConfig = {}) {
  return async (req: NextRequest) => {
    try {
      // Check content type
      const contentType = req.headers.get('content-type')
      if (config.allowedContentTypes?.length && 
          !config.allowedContentTypes.some(type => contentType?.includes(type))) {
        return NextResponse.json(
          { error: 'Invalid content type' },
          { status: 415 }
        )
      }

      // Check required headers
      for (const header of config.requiredHeaders || []) {
        if (!req.headers.has(header)) {
          return NextResponse.json(
            { error: `Missing required header: ${header}` },
            { status: 400 }
          )
        }
      }

      // Check body size
      const contentLength = parseInt(req.headers.get('content-length') || '0')
      if (config.maxBodySize && contentLength > config.maxBodySize) {
        return NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 }
        )
      }

      // Validate body if present
      if (req.method !== 'GET' && config.validateBody) {
        const body = await req.json()
        if (!config.validateBody(body)) {
          return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
          )
        }
      }

      return handler(req)
    } catch (error) {
      console.error('Request validation error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Helper function to validate coordinates
export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

// Helper function to sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potentially dangerous characters
    .slice(0, 1000) // Limit length
} 