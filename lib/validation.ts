import { NextResponse } from 'next/server';

interface ValidationError {
  field: string;
  message: string;
}

export function validateCoordinates(lat: number, lng: number): ValidationError | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return {
      field: 'coordinates',
      message: 'Latitude and longitude must be numbers'
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      field: 'startLat',
      message: 'Latitude must be between -90 and 90 degrees'
    };
  }

  if (lng < -180 || lng > 180) {
    return {
      field: 'startLng',
      message: 'Longitude must be between -180 and 180 degrees'
    };
  }

  return null;
}

export function sanitizeInput(input: string): string {
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove any script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove any potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

export function withValidation(handler: Function) {
  return async (request: Request) => {
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();
      const errors: ValidationError[] = [];

      // Validate required fields
      const requiredFields = ['startAddress', 'endAddress', 'startLat', 'startLng', 'endLat', 'endLng'];
      for (const field of requiredFields) {
        if (!(field in body)) {
          errors.push({
            field,
            message: `Missing required field: ${field}`
          });
        }
      }

      // Validate coordinates if they exist
      if (body.startLat && body.startLng) {
        const startError = validateCoordinates(body.startLat, body.startLng);
        if (startError) errors.push(startError);
      }

      if (body.endLat && body.endLng) {
        const endError = validateCoordinates(body.endLat, body.endLng);
        if (endError) errors.push(endError);
      }

      // Sanitize string inputs
      if (body.startAddress) body.startAddress = sanitizeInput(body.startAddress);
      if (body.endAddress) body.endAddress = sanitizeInput(body.endAddress);

      // If there are validation errors, return them
      if (errors.length > 0) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: errors
          },
          { status: 400 }
        );
      }

      // Add validated body to request
      (request as any).validatedBody = body;

      // If validation passes, proceed with the handler
      return handler(request);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  };
} 