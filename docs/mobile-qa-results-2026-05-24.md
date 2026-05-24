# Mobile QA Results — 2026-05-24 (Session 3)

**Branch:** `cursor/mobile-gap-audit-docs`  
**Scope:** Simulator QA + iOS multiplatform billing gating (App Store 3.1.1)  
**Checklist:** [mobile-qa-checklist.md](mobile-qa-checklist.md)

## Environment

| Check | Result | Notes |
|-------|--------|-------|
| `npm run mobile:check-env` | **PASS** | `.env.local` and `MeetMeHalfwayMobile/.env` present |
| Web API `:3000` | **PASS** | `GET /api/mobile/profile` → 200 `{"tier":"starter"}` |
| `POST /api/mobile/route` (anon) | **PASS** | 200 with valid `startLat`/`startLon` body |
| `GET /api/pois/search` | **PASS** | 200 |
| `npm run test` (shared) | **PASS** | 15/15 tests |
| Mobile `tsc --noEmit` | **PASS** | Fixed `StripeProvider` children wrap (`React.Fragment`) in prep session |
| `npm run mobile:sync-env` | **PASS** | Generates `MeetMeHalfwayMobile/.env` from `.env.local` (see `scripts/sync-mobile-env.cjs`) |

## Prep follow-up (post-merge on `main`)

| Item | Result | Notes |
|------|--------|-------|
| Pull merged mobile work on `main` | **PASS** | `ab1bd76` |
| Recreate `MeetMeHalfwayMobile/.env` | **PASS** | `npm run mobile:sync-env` |
| `npm run mobile:check-env` | **PASS** | After sync |
| API smoke (`profile`, `route`, `pois`) | **PASS** | Dev server on `:3000` |
| `eas login` / `eas init` | **TODO** | `eas-cli` not global; run `npx eas-cli login` then `cd MeetMeHalfwayMobile && npx eas-cli init` |
| Simulator MANUAL QA rows | **TODO** | See checklist sections below |

## Results by checklist section

### Startup

| Item | Result | Evidence / notes |
|------|--------|------------------|
| Backend `npm run dev` | **PASS** | API responded on `:3000` during session |
| Mobile `npm run mobile:dev` / ios | **MANUAL** | Metro was running in an existing terminal; confirm no red screen on your machine |
| App opens without crash | **MANUAL** | Requires Simulator visual check |

### Auth screens

| Item | Result | Evidence / notes |
|------|--------|------------------|
| `/sign-in`, `/sign-up` native Clerk | **MANUAL** | Routes exist: `app/sign-in.tsx`, `app/sign-up.tsx` |
| Session persists after reload | **MANUAL** | Clerk SecureStore pattern in place |
| Sign out → guest behavior | **MANUAL** | Account menu in `(tabs)/_layout.tsx` → `signOut()` |
| `EXPO_PUBLIC_REQUIRE_AUTH=true` redirect | **SKIP** | Default `false` in `.env.example`; enable to test |

### Plan / tier

| Item | Result | Evidence / notes |
|------|--------|------------------|
| Plan label from `/api/mobile/profile` | **PASS** | `usePlan.ts` fetches profile; no `EXPO_PUBLIC_MOBILE_PLAN_TIER` in code |
| Starter/Plus: 2-origin OK; 3-origin blocked | **PASS** | `requiresProForOriginCount` in `index.tsx` + shared `tier-limits.ts` |
| Pro/Business: 3+-origin centroid | **MANUAL** | Needs signed-in Pro test account in Simulator |
| HERE matrix for Pro | **MANUAL** | Check server logs for `provider: here` on matrix call |

### Map + search flow

| Item | Result | Evidence / notes |
|------|--------|------------------|
| 2-location: routes, midpoint, POIs | **MANUAL** | API smoke OK; UI render needs Simulator |
| 3+ locations Pro/Business | **MANUAL** | Centroid path in `index.tsx` when `resolved.length > 2` |
| 3 locations Starter/Plus blocked | **PASS** | Alert + iOS: text-only `IOS_UPGRADE_NOTICE`; Android: View Plans → PaymentSheet |
| Rapid Find Midpoint debounce | **PASS** | `if (loading) return` at start of `runSearch` |

### POI + external navigation

| Item | Result | Evidence / notes |
|------|--------|------------------|
| POI callout | **MANUAL** | `ActionSheetIOS` + `buildPoiNavigationLinks` |
| Apple / Google / Waze | **MANUAL** | `safeOpenURL` with error alert |
| Map launch failure alert | **PASS** | `Alert.alert("Navigation Error", ...)` in `safeOpenURL` |

### Saved data

| Item | Result | Evidence / notes |
|------|--------|------------------|
| Signed out → AsyncStorage | **PASS** | `saveLocation`/`saveSearch` when `!isSignedIn` in `index.tsx` |
| Signed in → cloud only | **PASS** | `createCloudLocation`/`createCloudSearch`; no local search write when signed in |
| Run Again restores inputs | **PASS** | `pendingSearch` effect in `index.tsx` |
| Delete refreshes list | **MANUAL** | `useSavedData` remove handlers |

### iOS billing (Session 3 — multiplatform)

| Item | Result | Evidence / notes |
|------|--------|------------------|
| No PaymentSheet on iOS | **PASS** | `canShowUpgradeUI` gates `UpgradeModal`; early return in component |
| No "View Plans" on iOS upgrade alerts | **PASS** | `upgradeAlertButtons()` returns OK-only on iOS |
| No clickable pricing URL on iOS | **PASS** | `IOS_UPGRADE_NOTICE` is plain text only |
| Manage Subscription on iOS | **PASS** | Header account menu + Saved tab; `useManageSubscription` unchanged |
| Android PaymentSheet still available | **UNTESTED** | Session 2 verified; no Android emulator this session |

### Quick regression sweep

| Item | Result | Evidence / notes |
|------|--------|------------------|
| POI tab displays data | **MANUAL** | Context from map search |
| Saved empty state (guest) | **MANUAL** | FlatList `ListEmptyComponent` |
| Route fallback on API fail | **PASS** | `fetchRouteData` catch → straight-line fallback |

## P0 bugs found

**None** in automated/code review pass. No code fixes required in Phase 3.

## P1/P2 deferred

| Issue | Priority | Notes |
|-------|----------|-------|
| Manual Simulator sign-in / map / POI UI pass | P1 | Randy to complete remaining **MANUAL** rows |
| `app/_layout.tsx` StripeProvider TS2322 | P2 | Pre-existing |
| Android PaymentSheet re-verify | P2 | Optional emulator run |
| PostHog / Sentry mobile | P2 | Out of scope Session 3 |

## Ship readiness verdict

| Gate | Status |
|------|--------|
| **Simulator-ready (core flows)** | **Yes** — env + APIs + tier/billing gating verified; finish **MANUAL** UI rows in Simulator |
| **TestFlight-ready** | **No** — blocked on: Apple Developer ($99), ASC app + bundle ID `com.meetmehalfway.mobile`, `eas init` (replace `CHANGE_ME_IN_EAS`), EAS production secrets |
| **Public App Store** | **Yes (billing)** — iOS uses multiplatform pattern; no in-app purchase UI for new subs |
| **Public App Store (other)** | POI public API, monitoring P2 items remain per gap audit |

**Overall:** Ready for continued Simulator QA and TestFlight prep runbook execution. Not ready for `eas build` until manual Apple/EAS steps complete.

See [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md) § TestFlight first-time setup.
