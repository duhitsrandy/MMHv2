import type { ErrorEvent, EventHint } from "@sentry/core"

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
])

function getSentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
}

export function isSentryEnabled(): boolean {
  const dsn = getSentryDsn()
  if (!dsn) return false
  return (
    process.env.NODE_ENV === "production" ||
    process.env.SENTRY_ENABLED === "true"
  )
}

function scrubEvent(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
  const headers = event.request?.headers
  if (headers && typeof headers === "object") {
    for (const key of Object.keys(headers)) {
      if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
        ;(headers as Record<string, string>)[key] = "[Filtered]"
      }
    }
  }
  return event
}

export const sentryInitOptions = {
  dsn: getSentryDsn(),
  enabled: isSentryEnabled(),
  environment:
    process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  sendDefaultPii: false,
  beforeSend: scrubEvent,
} as const
