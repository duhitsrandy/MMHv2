import fs from 'fs';
import path from 'path';

interface ApiEvent {
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  error?: string;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
  timestamp?: string;
}

const LOG_DIR = path.join(process.cwd(), 'logs');
const API_LOG_FILE = path.join(LOG_DIR, 'api.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export async function trackApiEvent(event: ApiEvent) {
  try {
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    // Append to log file
    fs.appendFileSync(
      API_LOG_FILE,
      JSON.stringify(logEntry) + '\n'
    );

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Event:', logEntry);
    }

    // If there's an error, log it separately
    if (event.error) {
      const errorLogFile = path.join(LOG_DIR, 'errors.log');
      fs.appendFileSync(
        errorLogFile,
        JSON.stringify({ ...logEntry, type: 'error' }) + '\n'
      );
    }

    // If rate limit is low, log it as a warning
    if (event.rateLimit && event.rateLimit.remaining < 3) {
      const warningLogFile = path.join(LOG_DIR, 'warnings.log');
      fs.appendFileSync(
        warningLogFile,
        JSON.stringify({ ...logEntry, type: 'rate_limit_warning' }) + '\n'
      );
    }
  } catch (error) {
    console.error('Failed to track API event:', error);
  }
}

// Helper function to wrap API handlers with monitoring
export function withMonitoring(handler: Function) {
  return async (request: Request) => {
    const startTime = Date.now();
    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;

      // Track the API event
      await trackApiEvent({
        endpoint: request.url,
        method: request.method,
        status: response.status,
        duration,
        rateLimit: {
          limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
          remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
          reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0')
        }
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track the error
      await trackApiEvent({
        endpoint: request.url,
        method: request.method,
        status: 500,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  };
} 