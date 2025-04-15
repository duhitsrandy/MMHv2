# Production Deployment Checklist

## API Security & Monitoring

### PostHog Analytics Integration
- [ ] Replace development file-based logging with PostHog analytics
- [ ] Update `app/lib/monitoring.ts` to use PostHog HTTP API for server-side tracking
- [ ] Example implementation:
  ```typescript
  // Using fetch for direct PostHog API calls
  async function trackServerEvent(eventName: string, properties: any) {
    await fetch('https://app.posthog.com/capture/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.POSTHOG_KEY,
        event: eventName,
        properties: {
          ...properties,
          environment: 'production'
        }
      })
    });
  }
  ```

### Environment Variables
- [ ] Update environment variables:
  ```
  POSTHOG_KEY=your_production_key
  POSTHOG_HOST=https://app.posthog.com
  ```
- [ ] Remove development-only environment variables
- [ ] Ensure all sensitive keys are properly secured in production environment

### Rate Limiting
- [ ] Review and adjust rate limit values for production load:
  - Current defaults (via ENV vars):
    - Anonymous: 10 req / 10 sec (`RATE_LIMIT_REQUESTS` / `RATE_LIMIT_WINDOW`)
    - Authenticated: 50 req / 60 sec (`RATE_LIMIT_REQUESTS_AUTH` / `RATE_LIMIT_WINDOW_AUTH`)
    - Special (Geocode/Route): 100 req / 60 sec (`RATE_LIMIT_REQUESTS_SPECIAL` / `RATE_LIMIT_WINDOW_SPECIAL`)
  - Verify these defaults are suitable for expected production traffic.
  - Monitor Upstash usage and adjust ENV variables as needed.

### Error Handling
- [ ] Implement production error logging strategy
- [ ] Set up error monitoring service (e.g., Sentry)
- [ ] Configure error notifications for critical issues

### Security Measures
- [ ] Enable CORS with specific origins
- [ ] Set up proper CSP headers
- [ ] Enable HTTPS
- [ ] Review and update security headers

### Database
- [ ] Review and optimize database indexes
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Set up database monitoring

### Caching
- [ ] Implement Redis caching for frequently accessed data
- [ ] Set up CDN for static assets
- [ ] Configure browser caching headers

### Performance
- [ ] Enable compression
- [ ] Optimize bundle sizes
- [ ] Set up performance monitoring
- [ ] Configure proper Node.js memory limits

### Monitoring & Alerts
- [ ] Set up uptime monitoring
- [ ] Configure alert thresholds
- [ ] Set up logging aggregation
- [ ] Create monitoring dashboards

### CI/CD
- [ ] Set up automated testing in CI pipeline
- [ ] Configure automated deployments
- [ ] Set up rollback procedures

### Documentation
- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create incident response playbook
- [ ] Document monitoring and alerting procedures

### Database Security
- [ ] Review and test Row Level Security (RLS) policies in production
- [ ] Verify audit logging is working correctly
- [ ] Set up alerts for suspicious database activity
- [ ] Review and update table permissions
- [ ] Ensure secure database connection strings

### Authentication & Authorization
- [ ] Configure Clerk for production
- [ ] Set up proper webhook handling for Clerk events
- [ ] Review and update authentication middleware
- [ ] Set up proper session handling
- [ ] Configure user role management

### Payment Processing
- [ ] Set up Stripe webhooks for production
- [ ] Configure proper error handling for payment failures
- [ ] Set up payment monitoring and alerts
- [ ] Test subscription lifecycle events
- [ ] Configure proper refund handling

### Location Services
- [ ] Update LocationIQ configuration for production load
- [ ] Set up fallback geocoding services
- [ ] Configure caching for location data
- [ ] Set up monitoring for location service availability

### Feature Flags
- [ ] Set up feature flag service (if needed)
- [ ] Configure gradual rollout strategy
- [ ] Set up A/B testing capabilities
- [ ] Document feature flag states

## Notes
- Current development monitoring uses file-based logging in `logs/` directory
- Production should use proper monitoring services instead of file logs
- Consider implementing different monitoring strategies for different environments (staging vs production) 