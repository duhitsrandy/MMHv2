# Sentry + Vercel setup

Production Vercel project: **`v0-meet-me-halfway2`** ([meetmehalfway.co](https://meetmehalfway.co)). The local `mmhv2` folder may still link to a different Vercel project name — set env vars on the project that serves production.

Configure in Vercel (not in git):

1. **DSN** — In Sentry: Project Settings → Client Keys (DSN). Add to Vercel (Production, and Preview if desired):
   - `NEXT_PUBLIC_SENTRY_DSN` = your DSN

2. **Source maps (recommended)** — Install [Sentry for Vercel](https://vercel.com/integrations/sentry) on **`v0-meet-me-halfway2`**. It sets `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` for builds.

   Or set manually on **`v0-meet-me-halfway2`** → Settings → Environment Variables (enable for **Production** and **Preview** if you use preview):

   | Variable | Value (Meet Me Halfway) |
   |----------|-------------------------|
   | `SENTRY_ORG` | `meetmehalfway` |
   | `SENTRY_PROJECT` | `javascript-nextjs` |
   | `SENTRY_AUTH_TOKEN` | Org auth token with `project:releases` (from Sentry → Settings → Auth Tokens) |

   `next.config.mjs` reads these at **build** time. If they are missing, the build log shows `No auth token provided. Will not upload source maps` and stacks stay minified.

3. **Redeploy** production after env vars are set.

4. **Alerts** — In Sentry → Alerts → create “New issue” notification (email or Slack).

5. **Verify** — Sentry → Settings → Projects → your project → “Send test event”, or trigger an error on preview/production and confirm the issue appears with readable stack traces. Build log success line: `Successfully uploaded source maps to Sentry`.

   **Build log check** (after redeploy):

   ```bash
   npx vercel inspect <production-deployment-url> --logs | grep -i sentry
   ```

   Success: uploads/releases run without `No auth token provided. Will not upload source maps`.

Local testing: set `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_ENABLED=true` in `.env.local`, run `npm run dev`, throw a test error in the browser console or add a temporary API route.
