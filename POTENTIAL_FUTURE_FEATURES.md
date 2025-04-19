# Potential Future Features & Improvements

This document lists possible future enhancements for analytics, monitoring, and backend infrastructure, based on previous discussions and best practices.

## Analytics & Monitoring (PostHog)

### Currently Implemented
- Backend API event tracking for:
  - `geocodeLocationAction`
  - `searchPoisAction`
  - `getRouteAction`
  - `getAlternateRouteAction`
- Properties tracked:
  - `endpoint` (action name)
  - `userId` (from Clerk, or 'anonymous')
  - `source: 'backend'`
  - `status` (HTTP-like status)
  - `duration` (ms)
  - `error` (if any)
  - Action-specific: `serviceUsed`, `poiCount`, `radius`, `routeDistance`, `routeDuration`, `usedFallback`
  - `environment` (dev/prod)

### Potential Future Features

#### 1. **Frontend–Backend Event Correlation**
- Correlate frontend and backend events for full user journey analytics.
- Use a shared `distinctId` (e.g., Clerk userId) for both frontend and backend events.
- Enables funnel analysis, drop-off tracking, and more.

#### 2. **API Rate Limit Monitoring**
- Track and log rate limit status for each API call.
- Alert or analyze when users are close to being rate-limited.
- Add `rateLimit` property to tracked events.

#### 3. **Alerting & Dashboards in PostHog**
- Set up alerts for error spikes, slow durations, or high failure rates.
- Build dashboards for API usage, error rates, and performance.

#### 4. **Custom Business Metrics**
- Track additional metrics such as:
  - Number of users reaching certain steps
  - Conversion rates
  - Custom events for business logic

#### 5. **User Agent, IP, or Geo Analytics**
- (If privacy policy allows) Track user agent, IP, or geo info for deeper analytics.
- Useful for understanding user demographics and device usage.

#### 6. **Environment-Specific Filtering**
- Further segment analytics by environment (dev, staging, prod).
- Already included as `environment` property, but can be expanded.

#### 7. **Sensitive Data Handling**
- Continue to avoid logging PII, raw addresses, or secrets.
- Consider hashing or redacting sensitive fields if needed for debugging.

#### 8. **API Key Management**
- Implement secure API key rotation and management.
- Use secrets manager or environment variable best practices.

#### 9. **Backend–Frontend Analytics Unification**
- Unify analytics for both backend and frontend in PostHog for a single source of truth.
- Enables more powerful product analytics and debugging.

#### 10. **Performance Optimization**
- Monitor and optimize slowest backend actions.
- Use PostHog duration data to identify bottlenecks.

#### 11. **Monitoring Service Abstraction**
- Abstract monitoring logic to allow for easy switching or addition of analytics providers in the future (e.g., swapping PostHog for another service, or supporting multiple providers).
- Improves maintainability and future-proofs analytics infrastructure.

#### 12. **Remove Legacy File Logging**
- Remove or reduce file-based logging once PostHog is proven reliable and meets compliance needs.
- Simplifies codebase and reduces disk usage.

---

## Context & Rationale
- These features are based on best practices for modern web analytics and backend observability.
- The current setup provides robust backend monitoring and is production-ready.
- Future enhancements can be prioritized based on business needs, user feedback, or scaling requirements.
- Testing and deployment best practices (such as verifying event delivery in dev and prod) are assumed as part of the ongoing workflow.

---

*Last updated: 2024-04-19* 