# Monitoring & Analytics Documentation

## Overview
This document describes the monitoring, analytics, and observability setup for the Meet Me Halfway application. It covers uptime monitoring, error tracking, analytics, log aggregation, alerting, dashboards, and best practices for both development and production environments.

---

## 1. Uptime Monitoring

**Purpose:** Ensure the application is available and responsive for users.

### Recommended Tools
- [UptimeRobot](https://uptimerobot.com/) or [StatusCake](https://www.statuscake.com/)
- Cloud provider health checks (e.g., Vercel, AWS, GCP)

### Setup Checklist
- [ ] Add all public endpoints (e.g., `/`, `/api/health`) to uptime monitors
- [ ] Configure alerting (email, Slack, etc.) for downtime
- [ ] Review uptime reports regularly

---

## 2. Error Tracking

**Purpose:** Detect, log, and resolve application errors in real time.

### Recommended Tools
- [Sentry](https://sentry.io/) (or similar: LogRocket, Bugsnag)
- Server logs (see below)

### Current Tool: [Sentry](https://sentry.io/) (web)

The Next.js web app reports unhandled client, server, and edge errors via `@sentry/nextjs`. Configuration lives in `lib/sentry/options.ts`, `instrumentation.ts`, and `sentry.*.config.ts`. Clerk user id is attached in `components/utilities/sentry/sentry-user.tsx` (id only, no email). PostHog remains the source for API usage analytics.

Expo mobile (`MeetMeHalfwayMobile/`) is not wired to Sentry yet.

### Setup Checklist
- [x] Integrate Sentry with the Next.js web app (client, server, edge)
- [x] Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel production (project `v0-meet-me-halfway2` → [meetmehalfway.co](https://meetmehalfway.co))
- [x] Install [Sentry Vercel integration](https://vercel.com/integrations/sentry) on `v0-meet-me-halfway2` (`SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, DSN; prod build **2026-05-24** logs `Successfully uploaded source maps to Sentry`)
- [ ] Enable issue alerts in the Sentry project (email/Slack on new issues) — [wizard](https://meetmehalfway.sentry.io/alerts/wizard/)
- [ ] (Future) Integrate `@sentry/react-native` for mobile
- [ ] Regularly review error dashboards and resolve issues

### Sentry verification (Phase 1)

Org `meetmehalfway`, project `javascript-nextjs`, Vercel project `v0-meet-me-halfway2`:

| Check | Status | Evidence |
|-------|--------|----------|
| Prod events ingested | Done | [JAVASCRIPT-NEXTJS-1](https://meetmehalfway.sentry.io/issues/JAVASCRIPT-NEXTJS-1) from meetmehalfway.co |
| `environment:production` | Done | Tag on test issue |
| Release / commit tag | Done | `release:03b1cb7924aeedab08ef80ce4ad2d4105940e916`; Vercel deploy linked in Sentry |
| Source maps at build | Done | Prod build logs: `Successfully uploaded source maps to Sentry` (Node, Edge, Client) |
| Clerk `user.id` on event | Optional | Sign in on prod and trigger an app error to confirm (test issue was anonymous) |
| New-issue alert | Pending | [Alerts wizard](https://meetmehalfway.sentry.io/alerts/wizard/) |

- **Runbook:** [SENTRY_VERCEL.md](SENTRY_VERCEL.md)

---

## 3. Analytics & Event Tracking

**Purpose:** Track user behavior, API usage, and business metrics.

### Current Tool: [PostHog](https://posthog.com/)

#### What's Tracked
- Backend API events (see `POTENTIAL_FUTURE_FEATURES.md` for details)
- Rate limit violations (see `rate-limit-docs.md`)
- Custom business metrics (planned/future)

#### Setup Checklist
- [ ] Ensure PostHog keys are set in environment variables
- [ ] Track key backend events (API actions, errors, performance)
- [ ] (Optional) Track frontend events for full user journey
- [ ] Build dashboards for API usage, errors, and performance
- [ ] Set up alerts for error spikes or slow performance

---

## 4. Log Aggregation

**Purpose:** Centralize and analyze logs for debugging and auditing.

### Recommended Tools
- File-based logs (development)
- [Logtail](https://logtail.com/), [Datadog](https://www.datadoghq.com/), or [Papertrail](https://www.papertrail.com/) (production)

### Setup Checklist
- [ ] Aggregate logs from all services (API, frontend, background jobs)
- [ ] Set up log rotation and retention policies
- [ ] Monitor logs for errors, warnings, and unusual activity

---

## 5. Alerting & Dashboards

**Purpose:** Proactively notify the team of issues and provide visibility into system health.

### Setup Checklist
- [ ] Configure alerts for downtime, error spikes, and rate limit violations
- [ ] Build dashboards for key metrics (uptime, errors, API usage, performance)
- [ ] Review dashboards regularly and iterate on alert thresholds

---

## 6. Environment-Specific Monitoring

**Purpose:** Ensure monitoring is tailored for each environment (dev, staging, prod).

### Best Practices
- Use separate API keys/DSNs for each environment
- Filter analytics and error reports by environment
- Suppress non-critical alerts in development
- Enable all critical monitoring in production

---

## 7. Best Practices & Troubleshooting

### Best Practices
- Monitor all critical paths (auth, API, database, third-party services)
- Avoid logging sensitive data (PII, secrets)
- Regularly review and update monitoring/alerting setup
- Document incident response procedures

### Troubleshooting
- **No data in dashboards:** Check API keys, network access, and integration code
- **Too many alerts:** Tune thresholds and filter out noise
- **Missed incidents:** Test alerting regularly and review escalation policies
- **Performance issues:** Use analytics and logs to identify bottlenecks

---

## 8. Cross-References
- [API Documentation](api-docs.md)
- [Authentication](auth-docs.md)
- [Rate Limiting](rate-limit-docs.md)
- [Production Checklist](PRODUCTION.md)
- [Potential Future Features](POTENTIAL_FUTURE_FEATURES.md)
- [README](README.md)

---

## 9. Future Enhancements
- Correlate frontend and backend events for full user journey analytics
- Add custom business metrics and funnel analysis
- Implement unified log aggregation for all environments
- Expand alerting to cover more business-critical events

---

*Last updated: 2026-05-24* 