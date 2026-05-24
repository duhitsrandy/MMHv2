# Meet Me Halfway — Mobile Gap Audit & Finish Plan

**Repo:** `/Users/randy/mmhv2` · **Branch:** `main`  
**Audit date:** 2026-05-24  
**Scope:** Expo mobile (`MeetMeHalfwayMobile/`) vs Next.js 15 web · Phase A read-only · Phase B skipped (document-only)

Canonical references: [mobile-ios-runbook.md](mobile-ios-runbook.md), [mobile-qa-checklist.md](mobile-qa-checklist.md), [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md), [app-structure.md](app-structure.md)

---

## Executive summary

1. **Mobile is a working v1** — 3 tabs (Map / POIs / Saved), optional Clerk auth, tier-aware UI from `/api/mobile/profile`, 2-origin routing + midpoint, 3+-origin centroid search, ORS-only travel-time matrix, POI list with Apple/Google/Waze deep links, cloud sync for saved locations and searches when signed in.

2. **Authenticated mobile APIs are in good shape** — `/api/mobile/profile`, `/api/mobile/saved/locations`, `/api/mobile/saved/searches` use Clerk bearer JWT and return 401 when required. This matches the stable web handoff work on `main`.

3. **Unauthenticated proxies are the main architectural gap** — Mobile calls `/api/mobile/route`, `/api/ors/geocode`, `/api/ors/matrix`, and `/api/pois/search` without auth. Middleware treats all `/api/(.*)` as public; rate-limit path matching misses `/api/mobile/route` and `/api/ors/geocode` (strict anonymous bucket only).

4. **Tier parity diverges on multi-origin and matrix** — Web blocks >2 origins in `results-map.tsx` unless Pro/Business; mobile allows Plus (3 locations). Web uses HERE traffic matrix for Pro/Business; mobile always uses public ORS matrix. Neither path enforces tier server-side on geo calls.

5. **Stripe is not wired on mobile** — `@stripe/stripe-react-native` is in `package.json` and `app.json` lists the plugin, but `app.config.ts` (active dynamic config) omits the Stripe plugin and no mobile code imports Stripe. Upgrade CTA opens `meetmehalfway.co/pricing` via `Linking`. **Decision:** wire in-app PaymentSheet (Session 2).

6. **Saved-tab UX bug** — When signed in, `useSavedData` shows cloud-only, but search still writes to AsyncStorage; local entries disappear until sign-out.

7. **Config / release blockers (P0)** — EAS `projectId` is `CHANGE_ME_IN_EAS`; bundle ID not registered in App Store Connect; `app.config.ts` vs `app.json` drift; `MeetMeHalfwayMobile/.env` is **tracked in git** (not gitignored).

8. **Docs are partially stale** — QA checklist references web sign-in handoff and `EXPO_PUBLIC_MOBILE_PLAN_TIER` (never read in code). Release checklist points at `app.json` for Stripe plugin while Expo prefers `app.config.ts`.

9. **Positive patterns to keep** — `@shared/tier-limits`, `@shared/poi-navigation-links`, `/api/mobile/profile` + cloud sync, existing QA/release checklists, Vitest on shared modules.

10. **Recommended sequence** — Session 1: P0/P1 parity + TestFlight unblockers → Session 2: Stripe PaymentSheet → Session 3: TestFlight build + QA sign-off. See [mobile-followup-sessions.md](mobile-followup-sessions.md).

---

## Feature matrix (web vs mobile)

| Feature | Web location | Mobile location | Parity | Notes |
|---------|--------------|-----------------|--------|-------|
| Auth (Clerk sign-in/up, session) | Clerk hosted / middleware | `MeetMeHalfwayMobile/app/sign-in.tsx`, `sign-up.tsx`, `src/auth/safe-auth.tsx` | Yes (different UI) | Native email/password; optional `EXPO_PUBLIC_REQUIRE_AUTH` |
| Tier / plan limits | `shared/tier-limits.ts`, `hooks/usePlan.ts`, form + results-map | `usePlan.ts` → `/api/mobile/profile` + `getMaxLocationsForTier` | Partial | Client-only enforcement on geo APIs |
| Geocode | `actions/geocoding-test.ts` (LocationIQ → Nominatim) | `POST /api/ors/geocode` via `src/services/api.ts` | Partial | Different provider; public endpoint |
| Routing (2 points) | `getRouteAction` in `actions/locationiq-actions.ts` | `POST /api/mobile/route` | Yes (logic) | Mobile route is unauthenticated |
| Multi-origin / centroid (3+) | `results-map.tsx` — Pro+ required for >2 | `(tabs)/index.tsx` client centroid | **No** | Plus allowed on mobile; web throws |
| POI search + travel times | LocationIQ/Overpass + HERE (Pro) or ORS matrix | `/api/pois/search` + `/api/ors/matrix` | Partial | No HERE on mobile; `tags` param ignored |
| Saved locations & searches | `actions/db/*`, sidebar + saved-searches page | `/api/mobile/saved/*`, `useSavedData`, `cloudSync.ts` | Yes | Cloud-only display bug when signed in |
| Stripe checkout / portal | `actions/stripe/createCheckoutSession.ts`, `UpgradeModal` | `Linking.openURL` to pricing only | **No** | PaymentSheet planned Session 2 |
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
| 5 | Geocoding | `actions/geocoding-test.ts` | `/api/ors/geocode` | Partial | P1 | Public, no auth; provider split |
| 6 | Routing (2 points) | `getRouteAction` | `/api/mobile/route` | Yes (logic) | P1 | **Unauthenticated** — auth-gate or fix rate limits |
| 7 | Travel-time matrix | ORS or HERE (`getTrafficMatrixHereAction`) | `/api/ors/matrix` always | **No** | P1 | Add `/api/mobile/matrix` with HERE for pro+ |
| 8 | 3+-origin centroid | `results-map.tsx` requires Pro for >2 | `(tabs)/index.tsx` allows Plus | **No** | P1 | Align rule; enforce server-side |
| 9 | POI search | `searchPoisAction` | `/api/pois/search` | Partial | P2 | `tags` query ignored; dead filter UI |
| 10 | POI external nav | N/A | `@shared/poi-navigation-links` | Yes | OK | Verify in Session 3 QA |
| 11 | Stripe checkout | `createCheckoutSession` | External pricing URL only | **No** | **P0** | PaymentSheet — Session 2 |
| 12 | Stripe billing portal | `createBillingPortalSessionAction` | None | **No** | P1 | `/api/mobile/stripe/billing-portal` + in-app browser |
| 13 | PostHog | `posthog-provider.tsx`, `app/lib/monitoring.ts` | None | **No** | P2 | Per `docs/MONITORING.md` |
| 14 | Sentry | `sentry.*.config.ts` | None | **No** | P2 / Defer | ~0.5 day with EAS source maps |
| 15 | Rate-limit 429 UX | Toasts | `Alert.alert` only | Partial | P2 | Read `X-RateLimit-*` headers |
| 16 | Toast / non-blocking UX | `sonner` | `Alert.alert` only | **No** | P2 | e.g. `expo-burnt` |
| 17 | EAS `projectId` | N/A | `CHANGE_ME_IN_EAS` in `app.config.ts` | **No** | **P0** | `eas init` |
| 18 | Stripe plugin config | N/A | Plugin in `app.json` only | **No** | **P0** | Move to `app.config.ts` |
| 19 | Bundle ID in ASC | N/A | `com.meetmehalfway.mobile` | **No** | **P0** | Register before submit |
| 20 | Committed `.env` | N/A | `MeetMeHalfwayMobile/.env` tracked in git | **Risk** | **P0** | Gitignore + rotate keys |
| 21 | Saved tab when signed in | N/A | Cloud-only display; local writes continue | Bug | P1 | Stop local writes when signed in |
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
| `api.ts` → `fetchMobileRoute` | `POST /api/mobile/route` | No | No |
| `api.ts` → `geocodeAddress` | `POST /api/ors/geocode` | No | No |
| `api.ts` → `getTravelTimeMatrix` | `POST /api/ors/matrix` | No | No |
| `poi.ts` → `getNearbyPois` | `GET /api/pois/search` | No | No |
| `usePlan` | `GET /api/mobile/profile` | Bearer | No (returns starter if anon) |
| `cloudSync.ts` | `/api/mobile/saved/*` | Bearer | No |

### Security / parity flags

| Risk | Severity | Detail |
|------|----------|--------|
| Public geocode/route/matrix/POI | High | Unauthenticated quota consumption; web server actions not directly callable cross-origin, but mobile API routes replicate behavior |
| 3+ locations without Pro | High | Plus tier on mobile; web blocks in `results-map`; no API validation |
| HERE matrix unavailable | Medium | Pro/Business subscribers get ORS-only ETAs on mobile |
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
- [ ] Create `MeetMeHalfwayMobile/eas.json` (`development`, `preview`, `production`; `submit.production.ios`)
- [ ] Consolidate Expo config: Stripe plugin + `merchantIdentifier` + `newArchEnabled` in `app.config.ts`
- [ ] Verify `expo prebuild --no-install --platform ios` succeeds (optional sanity check)
- [ ] **Gitignore `MeetMeHalfwayMobile/.env`** — currently **tracked** (`git ls-files` confirms); rotate any exposed keys
- [ ] Set real Stripe publishable key in EAS secrets (not committed)

### P1 (before public launch)

- [ ] Wire native Stripe PaymentSheet (Session 2)
- [ ] Saved tab: stop local writes when signed in (Session 1)
- [ ] Auth-gate `/api/mobile/route` + add `/api/mobile/geocode` + `/api/mobile/matrix` (Session 1)
- [ ] Align 3+-origin tier rule web + mobile (Session 1)
- [ ] Update QA, release, and runbook docs (Session 1)

### P2 (polish)

- [ ] Toast UX + 429 handling
- [ ] POI tags end-to-end or remove dead filter UI
- [ ] Replace starter `modal.tsx` with About/Help
- [ ] PostHog / Sentry mobile (post-TestFlight)

### Session 3 (QA + ship)

- [ ] Run [mobile-qa-checklist.md](mobile-qa-checklist.md) on Simulator + physical device + TestFlight build
- [ ] `eas build --profile production --platform ios`
- [ ] Internal TestFlight distribution
- [ ] `eas submit --platform ios`

---

## Key file index

| Area | Paths |
|------|-------|
| Mobile tabs | `MeetMeHalfwayMobile/app/(tabs)/index.tsx`, `two.tsx`, `saved.tsx` |
| Mobile services | `MeetMeHalfwayMobile/src/services/api.ts`, `poi.ts`, `cloudSync.ts`, `storage.ts` |
| Mobile hooks | `MeetMeHalfwayMobile/src/hooks/usePlan.ts`, `useSavedData.ts` |
| Mobile auth | `MeetMeHalfwayMobile/src/auth/safe-auth.tsx`, `app/_layout.tsx` |
| Mobile API | `app/api/mobile/profile/route.ts`, `route/route.ts`, `saved/**` |
| Public proxies | `app/api/ors/geocode/route.ts`, `ors/matrix/route.ts`, `pois/search/route.ts` |
| Web reference | `app/meet-me-halfway/_components/`, `actions/`, `lib/auth/plan.ts`, `middleware.ts` |
| Shared | `shared/tier-limits.ts`, `shared/poi-navigation-links.ts` |
| Follow-up prompts | [mobile-followup-sessions.md](mobile-followup-sessions.md) |

---

## Out of scope (per audit charter)

- Geo provider consolidation
- Rewriting the web app
- Tailwind v4 / Next.js upgrades unrelated to mobile
- `@sentry/react-native` unless listed as optional P2 (~0.5 day)

---

*Generated from Phase A read-only inventory. Phase B (simulator QA) was skipped; run Session 3 for pass/fail per checklist item.*
