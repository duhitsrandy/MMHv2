# Production Deployment Checklist

This document outlines the comprehensive steps and considerations for deploying the Meet Me Halfway application to production, including the subscription billing system, multi-origin features, and HERE API integration.

## Pre-Deployment Requirements

### 1. Subscription & Billing Setup
- [ ] Configure Stripe live mode with production API keys
- [ ] Create production products and pricing in Stripe Dashboard
- [ ] Set up webhook endpoints for subscription events
- [ ] Test complete subscription lifecycle (signup → payment → access)
- [ ] Verify tier-based feature access enforcement
- [ ] Test upgrade/downgrade flows and billing portal

### 2. Multi-Origin Feature Validation
- [ ] Test 2-location traditional midpoint calculation
- [ ] Test 3+ location centroid calculation
- [ ] Verify tier-based location limits enforcement
- [ ] Test upgrade modal triggers for location limits
- [ ] Validate POI search around centroids
- [ ] Test travel time matrix calculations for multiple origins

### 3. HERE API Integration (Pro Tier)
- [ ] Configure production HERE API credentials
- [ ] Test traffic-aware travel time calculations
- [ ] Verify Pro tier access enforcement
- [ ] Test fallback to ORS for Free/Plus users
- [ ] Monitor HERE API usage and quotas
- [ ] Validate error handling and fallback strategies

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
- [ ] Verify PostHog events are being sent from both backend and frontend (see [MONITORING.md](MONITORING.md))
- [ ] If PostHog is unavailable, ensure file logging fallback is enabled for critical events (see `app/lib/monitoring.ts`)
- [ ] Troubleshoot analytics by checking server logs for `[PostHog Debug]` messages and reviewing the PostHog dashboard

### Environment Variables
- [ ] Update all production environment variables:
  ```env
  # Core API Keys
  NEXT_PUBLIC_LOCATIONIQ_KEY=your_production_locationiq_key
  RAPIDAPI_FAST_ROUTING_HOST=fast-routing.p.rapidapi.com
  RAPIDAPI_FAST_ROUTING_KEY=your_production_rapidapi_key
  OPENROUTESERVICE_API_KEY=your_production_ors_key
  HERE_API_KEY=your_production_here_api_key

  # Database
  DATABASE_URL=your_production_database_url
  NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key

  # Authentication (Clerk)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_production_clerk_publishable_key
  CLERK_SECRET_KEY=your_production_clerk_secret_key
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/meet-me-halfway
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/meet-me-halfway

  # Stripe (Live Mode)
  STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret_key
  STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

  # Stripe Price IDs (Production)
  STRIPE_PRICE_PLUS_WEEKLY=price_production_plus_weekly
  STRIPE_PRICE_PLUS_MONTHLY=price_production_plus_monthly
  STRIPE_PRICE_PLUS_YEARLY=price_production_plus_yearly
  STRIPE_PRICE_PRO_WEEKLY=price_production_pro_weekly
  STRIPE_PRICE_PRO_MONTHLY=price_production_pro_monthly
  STRIPE_PRICE_PRO_YEARLY=price_production_pro_yearly
  STRIPE_PRICE_BUSINESS_WEEKLY=price_production_business_weekly
  STRIPE_PRICE_BUSINESS_MONTHLY=price_production_business_monthly
  STRIPE_PRICE_BUSINESS_YEARLY=price_production_business_yearly

  # Rate Limiting (Upstash Redis)
  UPSTASH_REDIS_URL=your_production_redis_url
  UPSTASH_REDIS_TOKEN=your_production_redis_token

  # Rate Limit Configuration (Production Values)
  RATE_LIMIT_REQUESTS=100
  RATE_LIMIT_WINDOW=60
  RATE_LIMIT_REQUESTS_AUTH=500
  RATE_LIMIT_WINDOW_AUTH=60
  RATE_LIMIT_REQUESTS_SPECIAL=1000
  RATE_LIMIT_WINDOW_SPECIAL=60

  # Analytics (PostHog)
  NEXT_PUBLIC_POSTHOG_KEY=your_production_posthog_key
  NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
  ```
- [ ] Remove development-only environment variables
- [ ] Ensure all sensitive keys are properly secured in production environment
- [ ] Verify Stripe webhook endpoints are configured correctly
- [ ] Test all API integrations with production credentials

### Secret & API Key Rotation
- [ ] Regularly rotate API keys and secrets (Clerk, Supabase, Upstash, LocationIQ, Fast Routing OSRM (RapidAPI), OpenRouteService (for travel time matrix), PostHog)
- [ ] Use a secrets manager or environment variable best practices
- [ ] Document the rotation process and update `.env.example` as needed

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
- [ ] Review analytics/monitoring setup in [MONITORING.md](MONITORING.md)

### CI/CD
- [ ] Set up automated testing in CI pipeline
- [ ] Configure automated deployments
- [ ] Set up rollback procedures

### Documentation
- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create incident response playbook
- [ ] Document monitoring and alerting procedures
- [ ] Cross-link to [README.md](README.md), [MONITORING.md](MONITORING.md), and other docs

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

### Payment Processing & Subscription Management
- [ ] Set up Stripe webhooks for production (`/api/stripe/webhooks`)
- [ ] Configure proper error handling for payment failures
- [ ] Set up payment monitoring and alerts
- [ ] Test complete subscription lifecycle events:
  - [ ] New subscription creation (`checkout.session.completed`)
  - [ ] Subscription updates (`customer.subscription.updated`)
  - [ ] Subscription cancellations (`customer.subscription.deleted`)
  - [ ] Failed payment handling
- [ ] Configure proper refund handling
- [ ] Test billing portal functionality
- [ ] Verify tier-based feature access enforcement
- [ ] Monitor subscription metrics (MRR, churn, conversion rates)
- [ ] Set up alerts for failed webhook deliveries
- [ ] Test upgrade/downgrade flows between all tiers
- [ ] Verify proration calculations for plan changes

### Location Services & API Management
- [ ] Update LocationIQ configuration for production load (geocoding & POI search)
- [ ] Update Fast Routing OSRM (RapidAPI) configuration for production load
- [ ] Configure HERE API for Pro/Business tier traffic-aware routing
- [ ] Set up fallback strategies:
  - [ ] ORS fallback for OSRM routing failures
  - [ ] ORS matrix for HERE API failures (Pro tier fallback)
  - [ ] Graceful degradation when APIs are unavailable
- [ ] Configure caching for location and routing data
- [ ] Set up monitoring for all location service availability:
  - [ ] LocationIQ (geocoding & POI)
  - [ ] Fast Routing OSRM (RapidAPI)
  - [ ] OpenRouteService (matrix calculations)
  - [ ] HERE API (Pro tier matrix with traffic)
- [ ] Monitor API usage quotas and set up alerts
- [ ] Test tier-based API routing (ORS for Free/Plus, HERE for Pro/Business)
- [ ] Verify multi-origin calculations work correctly for all tiers

### Feature Flags
- [ ] Set up feature flag service (if needed)
- [ ] Configure gradual rollout strategy
- [ ] Set up A/B testing capabilities
- [ ] Document feature flag states

### Disaster Recovery
- [ ] Document and test database restore procedures
- [ ] Document and test restoring from backup for all critical services (Supabase, Upstash, etc.)
- [ ] Document what to do if a critical service (Clerk, PostHog, LocationIQ, etc.) is down
- [ ] Ensure all backups are scheduled and tested regularly

## Notes

### Current Application State
- **Subscription System**: Fully implemented with Stripe integration and live payments
- **Multi-Origin Feature**: Production-ready with tier-based location limits
- **HERE API Integration**: Implemented for Pro/Business tiers with traffic data
- **Authentication**: Clerk integration with user profiles and plan enforcement
- **Database**: Supabase with proper schema and migrations
- **Rate Limiting**: Upstash Redis implementation with tier-based limits

### Monitoring & Analytics
- Current development monitoring uses file-based logging in `logs/` directory
- Production should use proper monitoring services instead of file logs
- PostHog analytics integrated for user behavior tracking
- Consider implementing different monitoring strategies for different environments (staging vs production)

### Related Documentation
- [App Structure](app-structure.md) - Comprehensive application architecture
- [Subscription & Billing](SUBSCRIPTION_BILLING.md) - Complete billing system documentation
- [HERE API Integration](HERE_API_INTEGRATION.md) - Pro tier traffic data implementation
- [Multi-Origin Feature](MULTI_ORIGIN_FEATURE.md) - Advanced location handling
- [Upgrade Modal Implementation](UPGRADE_MODAL_IMPLEMENTATION.md) - Tier enforcement UI
- [API Documentation](api-docs.md) - Complete API reference
- [MONITORING.md](MONITORING.md) - Analytics and monitoring setup
- [README.md](README.md) - General project information

### Production Readiness
The application is production-ready with:
- ✅ Live Stripe payments and subscription management
- ✅ Tier-based feature access and enforcement
- ✅ Multi-origin location support (2-10 locations)
- ✅ Traffic-aware routing for Pro subscribers
- ✅ Comprehensive error handling and fallbacks
- ✅ Rate limiting and security measures
- ✅ Analytics and monitoring integration 