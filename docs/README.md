# Documentation Index

Meet Me Halfway v2 is **Expo mobile** (`MeetMeHalfwayMobile/`) plus a **Next.js API and web app**, with **tiered geo providers**: LocationIQ and RapidAPI OSRM for geocoding, routing, and POIs; OpenRouteService for matrix travel times (Starter/Plus and fallback); HERE for Pro/Business traffic-aware matrices.

For project setup and quick start, see the main [README.md](../README.md) in the repo root.

## Canonical documentation

These documents describe what is deployed and how to operate it today.

| Document | Description |
|----------|-------------|
| [app-structure.md](app-structure.md) | Architecture: web, mobile, API, tiered geo |
| [api-docs.md](api-docs.md) | API endpoints, clients, geo provider matrix |
| [mobile-ios-runbook.md](mobile-ios-runbook.md) | Local Expo iOS development (start here for mobile) |
| [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md) | TestFlight / App Store prep |
| [mobile-qa-checklist.md](mobile-qa-checklist.md) | Manual QA before release |
| [SENTRY_VERCEL.md](SENTRY_VERCEL.md) | Sentry + Vercel for the Next.js web app |
| [MONITORING.md](MONITORING.md) | PostHog, Sentry, uptime, alerting |
| [SUBSCRIPTION_BILLING.md](SUBSCRIPTION_BILLING.md) | Stripe tiers and billing |
| [PRODUCTION.md](PRODUCTION.md) | Production deployment checklist |

## Reference documentation

| Document | Description |
|----------|-------------|
| [auth-docs.md](auth-docs.md) | Clerk authentication |
| [db-schema-docs.md](db-schema-docs.md) | Database schema |
| [rate-limit-docs.md](rate-limit-docs.md) | Upstash rate limiting |
| [theme-docs.md](theme-docs.md) | Theme system |
| [HERE_API_INTEGRATION.md](HERE_API_INTEGRATION.md) | HERE traffic matrix (Pro/Business) |
| [MULTI_ORIGIN_FEATURE.md](MULTI_ORIGIN_FEATURE.md) | Multi-origin algorithms |
| [UPGRADE_MODAL_IMPLEMENTATION.md](UPGRADE_MODAL_IMPLEMENTATION.md) | Upgrade modal and tier enforcement |
| [KEEPALIVE.md](KEEPALIVE.md) | Keepalive / uptime notes |

## Backlog only (not architecture)

| Document | Description |
|----------|-------------|
| [POTENTIAL_FUTURE_FEATURES.md](POTENTIAL_FUTURE_FEATURES.md) | Ideas backlog — **not** current architecture |

## Archived (historical)

Do not use these for onboarding.

| Document | Description |
|----------|-------------|
| [archive/pwa-conversion-guide.md](archive/pwa-conversion-guide.md) | Superseded by Expo |
| [archive/mobile-setup-guide.md](archive/mobile-setup-guide.md) | Superseded by [mobile-ios-runbook.md](mobile-ios-runbook.md) |

---

When you add new documentation, update this index.
