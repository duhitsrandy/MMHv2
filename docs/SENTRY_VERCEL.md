# Sentry + Vercel setup

After merging `feat/sentry-web`, configure production in Vercel (not in git):

1. **DSN** — In Sentry: Project Settings → Client Keys (DSN). Add to Vercel:
   - `NEXT_PUBLIC_SENTRY_DSN` = your DSN

2. **Source maps (recommended)** — Install [Sentry for Vercel](https://vercel.com/integrations/sentry) on the MMHv2 project. It sets `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` for builds.

   Or set manually in Vercel → Settings → Environment Variables:
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN` (from Sentry → Settings → Auth Tokens)

3. **Redeploy** production after env vars are set.

4. **Alerts** — In Sentry → Alerts → create “New issue” notification (email or Slack).

5. **Verify** — Sentry → Settings → Projects → your project → “Send test event”, or trigger an error on preview/production and confirm the issue appears with readable stack traces.

Local testing: set `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_ENABLED=true` in `.env.local`, run `npm run dev`, throw a test error in the browser console or add a temporary API route.
