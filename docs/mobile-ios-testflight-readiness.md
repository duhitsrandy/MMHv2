# TestFlight Readiness

Use after **[P0 blockers](mobile-ios-p0-blockers.md)** are in progress or complete. Goal: a **production-configured** build on a **physical iPhone**.

**Hub:** [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md) · **Before:** [P0 blockers](mobile-ios-p0-blockers.md) · **After:** [App Store submission](mobile-ios-app-store-submission.md)

---

## Prerequisites

- [ ] Apple Developer Program enrolled ($99/yr)
- [ ] P0 items that affect the build: production env vars, location plist, Clerk Native API
- [ ] [mobile-ios-runbook.md](mobile-ios-runbook.md) preflight: `npm run mobile:check-env`

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

- [ ] All required production secrets set
- [ ] Verified no staging/localhost URL in production environment

---

## Signing

```bash
cd MeetMeHalfwayMobile
eas credentials
```

- [ ] Distribution certificate + provisioning profile for `com.meetmehalfway.mobile`

---

## Local Simulator QA (before cloud build)

```bash
npm run mobile:check-env
npm run dev
npm run --prefix ./MeetMeHalfwayMobile ios
```

Run [mobile-qa-checklist.md](mobile-qa-checklist.md); record in [mobile-qa-results-2026-05-24.md](mobile-qa-results-2026-05-24.md).

- [ ] `npm run mobile:check-env` passes
- [ ] API smoke: `/api/mobile/profile`, `/api/mobile/route`, `/api/pois/search`
- [ ] App opens without red screen (Simulator)
- [ ] Core flows from P0 checklist pass on Simulator
- [ ] iOS billing: no PaymentSheet; upgrade messaging is conservative per P0 doc

---

## Cloud build

### Optional: internal preview build

```bash
cd MeetMeHalfwayMobile
eas build --profile preview --platform ios
```

- [ ] Preview build succeeded (optional sanity check)

### Production build (TestFlight)

```bash
cd MeetMeHalfwayMobile
eas build --profile production --platform ios
```

- [ ] Production build succeeded (~15–25 min on EAS)
- [ ] Build logs reviewed for errors/warnings

---

## Upload to App Store Connect

```bash
cd MeetMeHalfwayMobile
eas submit --platform ios
```

Or upload `.ipa` via [Transporter](https://apps.apple.com/app/transporter/id1450874784).

- [ ] Build uploaded
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
