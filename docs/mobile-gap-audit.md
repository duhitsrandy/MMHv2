# Meet Me Halfway — Mobile Gap Audit & Finish Plan

**Repo:** `/Users/randy/mmhv2` · **Branch:** `cursor/mobile-gap-audit-docs` (Sessions 1–2)  
**Audit date:** 2026-05-24 · **Doc updated:** 2026-05-24 (post Sessions 1–2)  
**Scope:** Expo mobile (`MeetMeHalfwayMobile/`) vs Next.js 15 web

Canonical references: [mobile-ios-runbook.md](mobile-ios-runbook.md), [mobile-qa-checklist.md](mobile-qa-checklist.md), [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md), [app-structure.md](app-structure.md)

### Session status (this branch)

| Session | Status | Notes |
|---------|--------|-------|
| **1** — P0/P1 parity & TestFlight unblockers | **Done** | Auth mobile APIs, tier rules, EAS scaffold, `.env` untracked, docs |
| **2** — Stripe PaymentSheet + billing portal | **Done** | `UpgradeModal`, `/api/mobile/stripe/*`, Vercel webhook build fix |
| **3** — TestFlight + QA sign-off | **Done** | iOS multiplatform billing; QA results doc; TestFlight runbook; `eas build` deferred (manual Apple/EAS) |

---

## Executive summary

1. **Mobile is a working v1** — 3 tabs (Map / POIs / Saved), optional Clerk auth, tier-aware UI from `/api/mobile/profile`, 2-origin routing + midpoint, 3+-origin centroid search (Pro+ enforced client-side), travel-time matrix via `/api/mobile/matrix` (HERE for Pro/Business when signed in), POI list with Apple/Google/Waze deep links, cloud sync for saved locations and searches when signed in.

2. **Authenticated mobile APIs are in good shape** — `/api/mobile/profile`, `/api/mobile/saved/*`, `/api/mobile/geocode`, `/api/mobile/matrix`, and optional Bearer on `/api/mobile/route` use Clerk JWT where applicable. Saved data writes go to cloud when signed in (no local-only search writes on map tab).

3. **Remaining architectural gap** — `GET /api/pois/search` is still a public proxy (no Bearer). Rate limits apply; tier is not enforced server-side on POI. Acceptable for TestFlight; tighten in a follow-up if abuse appears.

4. **Tier parity (multi-origin + matrix)** — **Aligned in Sessions 1–2:** `requiresProForOriginCount` on mobile map tab; `/api/mobile/matrix` uses HERE for Pro/Business when authenticated. Web `results-map` should stay in sync with `shared/tier-limits.ts`.

5. **Stripe on mobile** — **Done (Sessions 2–3):** PaymentSheet on **Android** (and web); **iOS uses multiplatform pattern** — no in-app upgrade UI (`MeetMeHalfwayMobile/src/lib/billingPolicy.ts`). Billing portal for existing subs remains on iOS. App Store 3.1.1 addressed for public iOS submit.

6. **Config / release blockers (TestFlight)** — EAS `projectId` still `CHANGE_ME_IN_EAS` until you run `eas init`; bundle ID must be registered in App Store Connect; see [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md) § TestFlight first-time setup.

7. **Docs** — [mobile-qa-results-2026-05-24.md](mobile-qa-results-2026-05-24.md); QA checklist + release checklist updated Session 3.

8. **Positive patterns to keep** — `@shared/tier-limits`, `@shared/poi-navigation-links`, `/api/mobile/profile` + cloud sync, existing QA/release checklists, Vitest on shared modules.

9. **Next step** — You: complete remaining **MANUAL** Simulator rows in [mobile-qa-results-2026-05-24.md](mobile-qa-results-2026-05-24.md); then Apple Dev + `eas init` + `eas build` per release checklist.

---

## Feature matrix (web vs mobile)

| Feature | Web location | Mobile location | Parity | Notes |
|---------|--------------|-----------------|--------|-------|
| Auth (Clerk sign-in/up, session) | Clerk hosted / middleware | `MeetMeHalfwayMobile/app/sign-in.tsx`, `sign-up.tsx`, `src/auth/safe-auth.tsx` | Yes (different UI) | Native email/password; optional `EXPO_PUBLIC_REQUIRE_AUTH` |
| Tier / plan limits | `shared/tier-limits.ts`, `hooks/usePlan.ts`, form + results-map | `usePlan.ts` → `/api/mobile/profile` + `getMaxLocationsForTier` | Partial | Client-only enforcement on geo APIs |
| Geocode | `actions/geocoding-test.ts` (LocationIQ → Nominatim) | `POST /api/mobile/geocode` via `api.ts` (optional Bearer) | Partial | Web parity path; provider may still differ |
| Routing (2 points) | `getRouteAction` in `actions/locationiq-actions.ts` | `POST /api/mobile/route` (optional Bearer) | Yes | Rate-limited; auth optional |
| Multi-origin / centroid (3+) | `results-map.tsx` — Pro+ required for >2 | `(tabs)/index.tsx` + `requiresProForOriginCount` | **Yes** | Session 1 |
| POI search + travel times | LocationIQ/Overpass + HERE (Pro) or ORS matrix | `/api/pois/search` + `/api/mobile/matrix` | Partial | HERE on mobile when Pro+ signed in; `tags` still ignored |
| Saved locations & searches | `actions/db/*`, sidebar + saved-searches page | `/api/mobile/saved/*`, `useSavedData`, `cloudSync.ts` | Yes | Cloud writes on map search when signed in |
| Stripe checkout / portal | `actions/stripe/createCheckoutSession.ts`, `UpgradeModal` | `UpgradeModal` + PaymentSheet + billing portal | **Yes** | Session 2 |
| PostHog / Sentry | Web wired per `docs/MONITORING.md` | None | **No** | Deferred P2 |
| Rate limits / error UX | Middleware + toasts | Generic `Alert.alert` | Partial | No 429-specific handling |

---

## Gap table (prioritized backlog)

**Priority:** **P0** = blocks TestFlight · **P1** = blocks proper launch · **P2** = polish · **Defer** = out of scope

| # | Capability | Web path | Mobile path | Parity | Priority | Notes |
|---|------------|----------|-------------|--------|----------|-------|
| 1 | Clerk auth | Clerk hosted | Native screens + optional gate | Yes | P2 | Update QA checklist (stale “Sign In on Web”) |
| 2 | Current plan / tier | `lib/auth/plan.ts` → `getUserPlanInfoAction` | `GET /api/mobile/profile` + bearer | Yes | OK | Unauthenticated → `tier: "starter"` (200) |
| 3 | Saved locations CRUD | `actions/db/locations-actions.ts` | `/api/mobile/saved/locations` | Yes | OK | No server count limit |
| 4 | Saved searches CRUD | `actions/db/searches-actions.ts` | `/api/mobile/saved/searches` | Yes | OK | Zod min 2 locations |
| 5 | Geocoding | `actions/geocoding-test.ts` | `/api/mobile/geocode` | Partial | P2 | Done Session 1; optional Bearer |
| 6 | Routing (2 points) | `getRouteAction` | `/api/mobile/route` | Yes | OK | Optional Bearer + rate limits |
| 7 | Travel-time matrix | ORS or HERE (`getTrafficMatrixHereAction`) | `/api/mobile/matrix` | Yes | OK | HERE when Pro+ signed in |
| 8 | 3+-origin centroid | `results-map.tsx` requires Pro for >2 | `requiresProForOriginCount` on map | Yes | OK | Session 1 |
| 9 | POI search | `searchPoisAction` | `/api/pois/search` | Partial | P2 | `tags` query ignored; dead filter UI |
| 10 | POI external nav | N/A | `@shared/poi-navigation-links` | Yes | OK | Verify in Session 3 QA |
| 11 | Stripe checkout | `createCheckoutSession` | PaymentSheet + `checkout-session` API | Yes | OK | Session 2 |
| 12 | Stripe billing portal | `createBillingPortalSessionAction` | `billing-portal` + `useManageSubscription` | Yes | OK | Session 2 |
| 13 | PostHog | `posthog-provider.tsx`, `app/lib/monitoring.ts` | None | **No** | P2 | Per `docs/MONITORING.md` |
| 14 | Sentry | `sentry.*.config.ts` | None | **No** | P2 / Defer | ~0.5 day with EAS source maps |
| 15 | Rate-limit 429 UX | Toasts | `Alert.alert` only | Partial | P2 | Read `X-RateLimit-*` headers |
| 16 | Toast / non-blocking UX | `sonner` | `Alert.alert` only | **No** | P2 | e.g. `expo-burnt` |
| 17 | EAS `projectId` | N/A | `CHANGE_ME_IN_EAS` in `app.config.ts` | **No** | **P0** | Session 3 — `eas init` |
| 18 | Stripe plugin config | N/A | `app.config.ts` + `@stripe/stripe-react-native` | Yes | OK | Session 1–2; `app.json` removed |
| 19 | Bundle ID in ASC | N/A | `com.meetmehalfway.mobile` | **No** | **P0** | Session 3 — manual ASC step |
| 20 | Committed `.env` | N/A | Untracked + `.gitignore` | Yes | OK | Session 1 |
| 21 | Saved tab when signed in | N/A | Cloud sync on map search when signed in | Yes | OK | Session 1 |
| 22 | Dead code | N/A | `searchPOIs`, `AccountButton`, `setFilter`, unused env | N/A | P2 | Session 1 cleanup |
| 23 | Modal screen | N/A | Expo starter `modal.tsx` | N/A | P2 | Replace or remove |
| 24 | Docs accuracy | N/A | QA / release / runbook stale lines | N/A | P1 | Listed below |
| 25 | Geo provider consolidation | N/A | N/A | N/A | **Defer** | Explicitly out of scope |
| 26 | Tailwind v4 / Next upgrades | N/A | N/A | N/A | **Defer** | Out of scope |

---

## API contract audit (summary)

### Mobile network calls

| Client | Endpoint | Auth | Tier-gated |
|--------|----------|------|------------|
| `api.ts` → `fetchMobileRoute` | `POST /api/mobile/route` | Optional Bearer | Rate limit by user |
| `api.ts` → `geocodeAddress` | `POST /api/mobile/geocode` | Optional Bearer | No |
| `api.ts` → `getTravelTimeMatrix` | `POST /api/mobile/matrix` | Optional Bearer | HERE if Pro+ |
| `poi.ts` → `getNearbyPois` | `GET /api/pois/search` | No | No |
| `usePlan` | `GET /api/mobile/profile` | Bearer | No (returns starter if anon) |
| `cloudSync.ts` | `/api/mobile/saved/*` | Bearer | No |

### Security / parity flags

| Risk | Severity | Detail |
|------|----------|--------|
| Public POI search | Medium | `/api/pois/search` still unauthenticated; geocode/route/matrix improved |
| 3+ locations without Pro | Low | Client + shared tier rule on mobile; confirm web stays aligned |
| HERE matrix unavailable | Low | Available on mobile when signed in Pro+ via `/api/mobile/matrix` |
| Geocoder provider split | Medium | ORS vs LocationIQ may resolve addresses differently |
| POI `tags` ignored | Low | Mobile sends categories; server uses fixed set |
| Profile returns starter for anon | Low | Masks auth failures; intentional for guest UX |

**Recommendation:** Route mobile through authenticated `/api/mobile/*` siblings (`geocode`, `matrix`, optionally `pois`) with tier checks; deprecate direct public ORS/POI calls from the client.

---

## Architecture assessment (by gap)

| Gap | Recommendation | Rationale |
|-----|----------------|-----------|
| Public `/api/ors/*`, `/api/pois/search` | **Add mobile API routes** + require Bearer | Enables tier gating and HERE matrix |
| HERE matrix for Pro | **Add `/api/mobile/matrix`** | Reuse `getTrafficMatrixHereAction` + `requireProPlan()` |
| 3+-origin tier rule | **Extend shared module** + enforce in API | Use `shared/tier-limits.ts`; align web `results-map` and mobile `index.tsx` |
| Geocode provider split | **Add `/api/mobile/geocode`** OR document intentional ORS split | Prefer LocationIQ path for parity if product requires |
| Stripe checkout | **Needs native** (`@stripe/stripe-react-native`) | User decision: in-app PaymentSheet |
| Stripe portal | **Web checkout in browser** via `WebBrowser.openAuthSessionAsync` | Reuse `createBillingPortalSessionAction` |
| Saved tab bug | **Extend mobile hook** | Cloud-as-source-of-truth; skip local writes when signed in |
| PostHog / Sentry | **Defer** (P2) | Per `docs/MONITORING.md` |
| EAS / ASC / config | **Native release plumbing** | Not code parity — Session 1 + 3 |

---

## Optimal-path recommendations

1. **Authenticated mobile data APIs** — Require Bearer JWT on `/api/mobile/route` and add `/api/mobile/geocode` + `/api/mobile/matrix`. Lets you tier-gate HERE and protect ORS quota. Fix `getRateLimitType` in `middleware.ts` if any public proxies remain.

2. **HERE traffic matrix on mobile** — `POST /api/mobile/matrix`: Pro/Business → `getTrafficMatrixHereAction`; otherwise → `getTravelTimeMatrixAction` (ORS). Mobile already has Bearer pattern in `cloudSync.ts` / `usePlan.ts`.

3. **3+-origin tier rule** — Default: **enforce Pro for >2 origins everywhere** (web rule is stricter; mobile is more permissive today). Alternative: allow Plus on web too — product decision required.

4. **Stripe in-app** — `POST /api/mobile/stripe/checkout-session` (PaymentSheet secrets) + `POST /api/mobile/stripe/billing-portal`. Reuse existing Stripe webhook; poll `/api/mobile/profile` after purchase.

5. **Single Expo config** — Consolidate into `app.config.ts` (Stripe plugin, `merchantIdentifier`, `newArchEnabled`, `extra.stripePublishableKey`); trim or remove conflicting `app.json` fields.

6. **Monitoring** — Keep Sentry/PostHog mobile deferred post-TestFlight (~0.5 day Sentry with EAS source maps).

---

## Docs vs reality

| Doc | Issue | Fix (Session 1) |
|-----|-------|-----------------|
| [mobile-qa-checklist.md](mobile-qa-checklist.md) | Lines 15–16: “Sign In on Web” / “Sign Up on Web” — app uses native Clerk screens | Remove or replace with native auth steps |
| [mobile-qa-checklist.md](mobile-qa-checklist.md) | Line 27: `EXPO_PUBLIC_MOBILE_PLAN_TIER` — **not read in code** | Reference `/api/mobile/profile` for signed-in tier |
| [mobile-ios-runbook.md](mobile-ios-runbook.md) | API baseline list omits auth/tier posture | Note endpoints are public today; update after auth-gating |
| [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md) | Stripe plugin in `app.json` | State plugin must live in `app.config.ts` |
| [SUBSCRIPTION_BILLING.md](SUBSCRIPTION_BILLING.md) | Claims tier limits enforced on shared backend for mobile | Partially true — geo APIs are not tier-gated server-side |

---

## TestFlight readiness checklist

Mapped to [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md):

### P0 (blocks TestFlight)

- [ ] Register `com.meetmehalfway.mobile` in Apple Developer + App Store Connect
- [ ] Run `eas init` from `MeetMeHalfwayMobile/`; replace `CHANGE_ME_IN_EAS` in `app.config.ts`
- [x] Create `MeetMeHalfwayMobile/eas.json` (`development`, `preview`, `production`)
- [x] Consolidate Expo config: Stripe plugin + `merchantIdentifier` + `newArchEnabled` in `app.config.ts`
- [ ] Verify `expo prebuild --no-install --platform ios` succeeds (optional sanity check)
- [x] **Gitignore `MeetMeHalfwayMobile/.env`** (no longer tracked)
- [ ] Set real Stripe publishable key + price IDs in EAS secrets (not committed)

### P1 (before public launch)

- [x] Wire native Stripe PaymentSheet (Session 2)
- [x] Saved tab / map search: cloud writes when signed in (Session 1)
- [x] `/api/mobile/geocode` + `/api/mobile/matrix`; optional Bearer on `/api/mobile/route` (Session 1)
- [x] Align 3+-origin tier rule via `requiresProForOriginCount` (Session 1)
- [x] Update QA, release, and runbook docs (Session 1)

### P2 (polish)

- [ ] Toast UX + 429 handling
- [ ] POI tags end-to-end or remove dead filter UI
- [ ] Replace starter `modal.tsx` with About/Help
- [ ] PostHog / Sentry mobile (post-TestFlight)

### Session 3 (QA + ship)

- [x] Run [mobile-qa-checklist.md](mobile-qa-checklist.md) — results in [mobile-qa-results-2026-05-24.md](mobile-qa-results-2026-05-24.md) (automated + code-verified; some MANUAL rows for Randy)
- [x] iOS multiplatform billing gating ([`billingPolicy.ts`](../MeetMeHalfwayMobile/src/lib/billingPolicy.ts))
- [ ] `eas build --profile production --platform ios` (blocked: `eas init`, Apple Dev, ASC)
- [ ] Internal TestFlight distribution
- [ ] `eas submit --platform ios`

---

## Key file index

| Area | Paths |
|------|-------|
| Mobile tabs | `MeetMeHalfwayMobile/app/(tabs)/index.tsx`, `two.tsx`, `saved.tsx` |
| Mobile services | `MeetMeHalfwayMobile/src/services/api.ts`, `stripe.ts`, `poi.ts`, `cloudSync.ts`, `storage.ts` |
| Mobile hooks | `MeetMeHalfwayMobile/src/hooks/usePlan.ts`, `useManageSubscription.ts`, `useSavedData.ts` |
| Mobile Stripe UI | `MeetMeHalfwayMobile/src/components/UpgradeModal.tsx` |
| Mobile Stripe API | `app/api/mobile/stripe/checkout-session/route.ts`, `billing-portal/route.ts`, `lib/stripe/mobile-stripe.ts` |
| Mobile auth | `MeetMeHalfwayMobile/src/auth/safe-auth.tsx`, `app/_layout.tsx` |
| Mobile API | `app/api/mobile/profile/route.ts`, `route/route.ts`, `saved/**` |
| Public proxies | `app/api/ors/geocode/route.ts`, `ors/matrix/route.ts`, `pois/search/route.ts` |
| Web reference | `app/meet-me-halfway/_components/`, `actions/`, `lib/auth/plan.ts`, `middleware.ts` |
| Shared | `shared/tier-limits.ts`, `shared/poi-navigation-links.ts` |
| Follow-up prompts | [mobile-followup-sessions.md](mobile-followup-sessions.md) |

---

## Stripe PaymentSheet + App Store (Sessions 2–3)

**Decision (Session 3): multiplatform pattern** — implemented in [`MeetMeHalfwayMobile/src/lib/billingPolicy.ts`](../MeetMeHalfwayMobile/src/lib/billingPolicy.ts).

| Platform | New subscription purchase | Manage existing subscription |
|----------|---------------------------|------------------------------|
| **iOS** | No PaymentSheet, no upgrade CTA, no pricing URL — plain-text notice to upgrade on web (`meetmehalfway.co`) | Stripe billing portal via account menu / Saved tab |
| **Android** | PaymentSheet via `UpgradeModal` + `POST /api/mobile/stripe/checkout-session` | Same billing portal |
| **Web** | Stripe Checkout (unchanged) | Stripe portal (unchanged) |

Backend routes (`/api/mobile/stripe/*`) remain for Android. Webhook unchanged.

**Apple Guideline 3.1.1:** Addressed for iOS App Store by not offering in-app digital purchase UI. IAP (`react-native-iap`) is optional future work if you want in-app upgrades on iOS later.

**EAS production secrets (Stripe):** Still required for Android builds; iOS TestFlight builds need `EXPO_PUBLIC_API_BASE_URL`, Clerk, Supabase at minimum.

---

## Out of scope (per audit charter)

- Geo provider consolidation
- Rewriting the web app
- Tailwind v4 / Next.js upgrades unrelated to mobile
- `@sentry/react-native` unless listed as optional P2 (~0.5 day)

---

*Phase A inventory (2026-05-24). Sessions 1–3 on `cursor/mobile-gap-audit-docs`. TestFlight cloud build: manual steps in [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md).*
