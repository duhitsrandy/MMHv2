# TestFlight Readiness

Use after **[P0 blockers](mobile-ios-p0-blockers.md)** are in progress or complete. Goal: a **production-configured** build on a **physical iPhone**.

**Hub:** [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md) · **Before:** [P0 blockers](mobile-ios-p0-blockers.md) · **After:** [App Store submission](mobile-ios-app-store-submission.md)

---

## Prerequisites

- [x] Apple Developer Program enrolled ($99/yr)
- [x] P0 items that affect the build: production env vars, location plist, Clerk Native API
- [x] [mobile-ios-runbook.md](mobile-ios-runbook.md) preflight: `npm run mobile:check-env`

---

## App Store Connect (app record)

- [ ] App created in [App Store Connect](https://appstoreconnect.apple.com/)
- [ ] Bundle ID **`com.meetmehalfway.mobile`** (matches `MeetMeHalfwayMobile/app.config.ts`)
- [ ] Bundle ID created in [Identifiers](https://developer.apple.com/account/resources/identifiers/list) if missing
- [ ] SKU set (e.g. `mmh-mobile-001`)

---

## EAS project and config

```bash
cd MeetMeHalfwayMobile
npx eas-cli login
npx eas-cli init    # if not done
```

- [ ] `extra.eas.projectId` in `app.config.ts` matches EAS project
- [ ] `eas.json` production profile has `autoIncrement`
- [ ] App version / icon / splash acceptable for testers

---

## EAS production secrets

Set in EAS (not git):

```bash
cd MeetMeHalfwayMobile
eas env:create --environment production --name EXPO_PUBLIC_API_BASE_URL --value "https://your-production-host"
```

| Variable | TestFlight |
|----------|------------|
| `EXPO_PUBLIC_API_BASE_URL` | **Required** — production host |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Required** — `pk_live_...` |
| `EXPO_PUBLIC_SUPABASE_URL` | **Required** |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Required** |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional for iOS-only TestFlight (Stripe plugin may still bundle) |
| `EXPO_PUBLIC_STRIPE_PRICE_*` | Android checkout only |

- [x] All required production secrets set (`npm run mobile:eas-env` to refresh from `.env.local`)
- [x] Verified no staging/localhost URL in production environment (`EXPO_PUBLIC_API_BASE_URL=https://meetmehalfway.co`)

---

## Signing

**Must run in your Mac Terminal** (interactive Apple login — Cursor’s agent terminal is non-TTY):

```bash
cd MeetMeHalfwayMobile
npx eas-cli credentials --platform ios
# or: npm run mobile:eas-build   (first run prompts for Distribution cert + profile)
```

- [ ] Distribution certificate + provisioning profile for `com.meetmehalfway.mobile`

---

## Local Simulator QA (before cloud build)

```bash
npm run mobile:preflight   # check-env + expo-doctor + tsc (MeetMeHalfwayMobile)
npm run dev
npm run --prefix ./MeetMeHalfwayMobile ios
```

For **release binaries**, also test a **development build** or TestFlight on a **physical iPhone** — Simulator and Expo Go do not catch all native launch crashes.

Run [mobile-qa-checklist.md](mobile-qa-checklist.md); record in [mobile-qa-results-2026-05-24.md](mobile-qa-results-2026-05-24.md).

- [ ] `npm run mobile:preflight` passes
- [ ] API smoke: `/api/mobile/profile`, `/api/mobile/route`, `/api/pois/search`
- [ ] App opens without red screen (Simulator)
- [ ] Core flows from P0 checklist pass on Simulator
- [ ] iOS billing: no PaymentSheet; upgrade messaging is conservative per P0 doc

---

## Launch crashes (TestFlight builds 8–9)

| Build | Symptom | Likely cause |
|-------|---------|----------------|
| **8** | Instant quit (~0.5s), `EXC_BAD_ACCESS` on `com.meta.react.turbomodulemanager.queue` | New Architecture + native module init on iOS 26 |
| **9** | Instant quit, `SIGABRT` on `com.facebook.react.ExceptionsManagerQueue` | Uncaught native `NSException` during bridge invoke; build 9 did **not** include crash fixes (still `newArchEnabled: true`, Stripe native linked) |

**Build 10 mitigations** (commit `e1cf5d0`):

- `newArchEnabled: false` in `MeetMeHalfwayMobile/app.config.ts`
- Stripe **excluded on iOS**: no Stripe Expo plugin when `EAS_BUILD_PLATFORM=ios`, `react-native.config.js` autolinking `ios: null`, platform-specific `StripeWrapper` / `UpgradeModal`
- Android keeps PaymentSheet via `UpgradeModal.android.tsx` and Stripe plugin on Android EAS builds

**Build 10 result:** Still crashes at launch (~0.47s) with the same `SIGABRT` / `ExceptionsManagerQueue` / `NSInvocation` signature as build 9 — Stripe/New Arch were not the remaining root cause.

### Build 11–13 bisect (launch isolation)

**Bisect leak (builds 11–12):** `useSafeAuth` lived in [`safe-auth.tsx`](../MeetMeHalfwayMobile/src/auth/safe-auth.tsx) with a top-level `@clerk/clerk-expo` import, pulled in via `@/src/auth` from root and tabs layouts — so `DEFER_CLERK=1` did not actually defer Clerk. Fixed in build **13** by splitting [`auth-context.tsx`](../MeetMeHalfwayMobile/src/auth/auth-context.tsx) (no Clerk) and [`clerk-auth-bridge.tsx`](../MeetMeHalfwayMobile/src/auth/clerk-auth-bridge.tsx) (Clerk only inside `ClerkAppShell`).

| Build | `DEFER_MAP` | `DEFER_CLERK` | Result |
|-------|-------------|---------------|--------|
| **11** | `1` | `0` | Still crashes (~0.41s) — inconclusive (Clerk still loaded) |
| **12** | `0` | `1` | Still crashes (~0.47s) — inconclusive (maps still sync-loaded) |
| **13** | `1` | `1` | Still crashes (~0.41s), same native offsets as 9–12 |
| **15** | off | off | Launch gate + `isIosLaunchSafeEnabled()` default on iOS (code) |

**Build 13 result:** Still crashes at cold launch; same `SIGABRT` / `ExceptionsManagerQueue` stack and offsets `1546476` / `2010620` / `2013240`. EAS `a13a19cc-136b-48db-9e6f-292aa93bc50d`.

**Build 15:** Full iOS app-shell gate, Reanimated root import removed, committed fixes. EAS build ID: _fill after build_.

Symbolication: [symbolication-build12.md](symbolication-build12.md).

Code: [`iosLaunchDiagnostics.ts`](../MeetMeHalfwayMobile/src/lib/iosLaunchDiagnostics.ts) — `shouldGateIosAppShell`, defer flags; About modal shows native build number.

```bash
cd MeetMeHalfwayMobile
npx eas-cli env:create --environment production --name EXPO_PUBLIC_IOS_DEFER_MAP --value "1" --visibility plaintext --force
# Build 12: delete or set DEFER_MAP to 0, then set EXPO_PUBLIC_IOS_DEFER_CLERK=1
```

**`eas build` ≠ TestFlight.** A successful cloud build only creates the IPA on Expo. You must run **`eas submit`** (or Transporter) for the build to appear in App Store Connect → TestFlight.

```bash
cd MeetMeHalfwayMobile
npx eas-cli submit --platform ios --id <BUILD_ID> --non-interactive
```

Prefer `--id` over `--latest` when multiple builds exist.

---

## Cloud build

### Optional: internal preview build

```bash
cd MeetMeHalfwayMobile
eas build --profile preview --platform ios
```

- [ ] Preview build succeeded (optional sanity check)

### Production build (TestFlight)

**Apple requires iOS 26 SDK (Xcode 26+)** as of April 2026. This repo pins EAS image `macos-sequoia-15.6-xcode-26.2` in `eas.json`. If upload fails with error **90725**, rebuild after confirming that image is set.

```bash
# From repo root (interactive — required once for Apple credentials):
npm run mobile:eas-build
```

Or:

```bash
cd MeetMeHalfwayMobile
npx eas-cli build --profile production --platform ios
```

- [x] Production build **10** succeeded (EAS `6f8942bc-9188-45a9-a225-af6f58713d32`, commit `e1cf5d0`)
- [ ] Build logs reviewed for errors/warnings
- [ ] If Apple rejects with **90683** (missing `NSCameraUsageDescription`), rebuild after `app.config.ts` privacy strings (Clerk/Stripe may reference camera APIs)

---

## Upload to App Store Connect

```bash
npm run mobile:eas-submit
```

Or:

```bash
cd MeetMeHalfwayMobile
npx eas-cli submit --platform ios --latest
```

Or upload `.ipa` via [Transporter](https://apps.apple.com/app/transporter/id1450874784).

- [x] Build **10** uploaded (submission `a15896dd-117e-44ba-a6bf-b134a5a39ab5`)
- [ ] TestFlight processing completed (no “Invalid Binary”)

---

## Physical device validation

| | Simulator | TestFlight |
|--|-----------|------------|
| API | Often `localhost:3000` on dev Mac | **Production URL** |
| Device | Mac | **Real iPhone** |
| Dev server | Mac must run `npm run dev` | **Not required** |

- [ ] Installed via TestFlight app on physical iPhone
- [ ] Cold launch — no crash
- [ ] Guest 2-origin search on production API
- [ ] Sign in with **Pro demo account** — 3+ origins work
- [ ] POI + Apple Maps handoff
- [ ] Saved tab (guest + signed-in) on production
- [ ] Network off → reasonable error (not blank forever)
- [ ] Delete Account flow works on production (once implemented)

---

## TestFlight testers

- [ ] Internal testing group configured
- [ ] Your Apple ID added as internal tester
- [ ] At least one full **review flow** recorded (screenshots/notes for submission doc)

---

## Workflow notes

- **Expo managed** — no committed `ios/` in repo.
- Native debug only if needed: `npx expo prebuild --platform ios` in a dedicated PR.

---

## Blockers — not TestFlight-ready

| Blocker | Fix |
|---------|-----|
| P0 Delete Account missing | [P0 doc](mobile-ios-p0-blockers.md) |
| `eas init` not done | Run `eas init`, fix `projectId` |
| Production API down | Fix Vercel/backend before build |
| Clerk Native API off | Enable in Clerk Dashboard |
| Only Simulator tested | Install TestFlight on iPhone |

---

*TestFlight checklist — complete before App Store submission prep.*
