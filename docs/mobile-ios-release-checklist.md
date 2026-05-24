# Mobile iOS Release Checklist

This checklist reflects the current repository state: Expo managed mobile app with no committed native `ios/` directory.

## Workflow Decision

- Current strategy: **Expo managed workflow** (`MeetMeHalfwayMobile`).
- Native `ios/` artifacts are not committed in this repository.
- If you switch to committed native artifacts, do it in an isolated PR with explicit simulator/build verification.

## Pre-Release Config

Update these values before TestFlight/App Store submission:

- **[MeetMeHalfwayMobile/app.config.ts](MeetMeHalfwayMobile/app.config.ts)** (canonical Expo config — `app.json` removed)
  - `expo.ios.bundleIdentifier`: `com.meetmehalfway.mobile`
  - `expo.plugins` includes `@stripe/stripe-react-native` with `merchantIdentifier: merchant.com.meetmehalfway.mobile`
  - `expo.extra.stripePublishableKey` from `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `expo.extra.eas.projectId`: run **`eas init`** from `MeetMeHalfwayMobile/` to replace `CHANGE_ME_IN_EAS`
- **[MeetMeHalfwayMobile/eas.json](MeetMeHalfwayMobile/eas.json)** — `development`, `preview`, `production` build profiles

### EAS project setup (manual)

```bash
cd MeetMeHalfwayMobile
eas init
```

After `eas init`, confirm `extra.eas.projectId` in `app.config.ts` matches your EAS project UUID.

## Environment Validation

Run:

```bash
npm run mobile:check-env
```

Set production secrets in EAS (not in git):

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live `pk_live_...`)
- `EXPO_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY` (Stripe Price ID, monthly)
- `EXPO_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`
- `EXPO_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY`
- Supabase public keys as needed

### App Store — digital subscriptions (iOS)

**Chosen approach (Session 3): multiplatform pattern.** iOS hides in-app upgrade UI (`MeetMeHalfwayMobile/src/lib/billingPolicy.ts` — `canShowUpgradeUI`). Users upgrade on the web; **Manage Subscription** (Stripe billing portal) remains on iOS for existing subscribers. Android keeps PaymentSheet. See [mobile-gap-audit.md](mobile-gap-audit.md) § Stripe + App Store.

## Local Validation

```bash
npm run dev
npm run --prefix ./MeetMeHalfwayMobile ios
```

Validate:

- Multi-location input on map tab.
- Route and midpoint rendering for 2-origin search.
- POI enrichment and list rendering.
- Saved locations/search history in Saved tab (cloud when signed in).
- 3-origin search blocked for Starter/Plus; works for Pro.
- **iOS:** upgrade alerts show text-only web notice; no PaymentSheet. **Android:** PaymentSheet with test card `4242 4242 4242 4242`; tier updates via `/api/mobile/profile`.
- Manage Subscription: header account menu and Saved tab → Stripe Customer Portal (iOS + Android).

## App Store Connect (manual)

- Register bundle ID `com.meetmehalfway.mobile` in Apple Developer + App Store Connect before first TestFlight submit.

## Optional Native/Xcode Path

If needed for native debugging:

```bash
cd MeetMeHalfwayMobile
npx expo prebuild --platform ios
```

Then commit native changes only if your team decides to adopt the Xcode-first workflow.

---

## TestFlight first-time setup

Use this when you are ready to install the app on a **physical iPhone** (not just Simulator). Prerequisites: Apple Developer Program membership ($99/year).

### 1. Apple Developer Program

1. Enroll at [Apple Developer Program](https://developer.apple.com/programs/enroll/).
2. Wait for approval (can take 24–48 hours).

### 2. App Store Connect — register the app

1. Open [App Store Connect](https://appstoreconnect.apple.com/) → **Apps** → **+** (New App).
2. Platform: **iOS**.
3. Name: e.g. `Meet Me Halfway`.
4. Primary language, bundle ID: **`com.meetmehalfway.mobile`** (must match [`app.config.ts`](../MeetMeHalfwayMobile/app.config.ts)).
5. If the bundle ID is missing, create it first in [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) → **Identifiers** → **+** → App IDs.
6. SKU: any unique string (e.g. `mmh-mobile-001`).

### 3. Expo Application Services (EAS) project

```bash
cd MeetMeHalfwayMobile
npm install -g eas-cli   # if not installed
eas login
eas init
```

- Link to an existing Expo project or create a new one.
- Confirm `extra.eas.projectId` in `app.config.ts` is no longer `CHANGE_ME_IN_EAS`.

### 4. iOS signing credentials

First build will prompt for Apple ID credentials. Recommended:

```bash
cd MeetMeHalfwayMobile
eas credentials
```

Let EAS manage distribution certificate and provisioning profile for `com.meetmehalfway.mobile`.

### 5. EAS production environment variables

Set secrets in EAS (not in git). Example:

```bash
cd MeetMeHalfwayMobile
eas env:create --environment production --name EXPO_PUBLIC_API_BASE_URL --value "https://your-vercel-app.vercel.app"
```

Required for production builds:

| Variable | Example / notes |
|----------|-----------------|
| `EXPO_PUBLIC_API_BASE_URL` | Vercel production URL (not `localhost`) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk production `pk_live_...` |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe live `pk_live_...` (Android builds; iOS upgrade is web-only) |
| `EXPO_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY` | Stripe Price ID |
| `EXPO_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` | Stripe Price ID |
| `EXPO_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY` | Stripe Price ID |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

### 6. First cloud build (optional sanity — internal)

```bash
cd MeetMeHalfwayMobile
eas build --profile preview --platform ios
```

- `preview` = internal distribution, good for a first device install without full TestFlight workflow.
- Watch build logs on [expo.dev](https://expo.dev); download `.ipa` or install via QR if using internal distribution.

### 7. Production build for TestFlight

```bash
cd MeetMeHalfwayMobile
eas build --profile production --platform ios
```

- `production` profile uses `autoIncrement` in [`eas.json`](../MeetMeHalfwayMobile/eas.json).
- Build runs on EAS servers (~15–25 minutes).

### 8. Submit to App Store Connect

When the production build succeeds:

```bash
cd MeetMeHalfwayMobile
eas submit --platform ios
```

Or upload the `.ipa` manually with [Transporter](https://apps.apple.com/app/transporter/id1450874784).

### 9. Enable TestFlight testers

1. App Store Connect → your app → **TestFlight**.
2. Wait for **Processing** to complete (Apple scans the build).
3. **Internal Testing** → add yourself (Apple ID on the team) → install **TestFlight** app on iPhone → open invite.
4. Physical device must use production `EXPO_PUBLIC_API_BASE_URL` (your laptop does not need to run `npm run dev`).

### 10. What TestFlight is for (vs Simulator)

| | Simulator (`npm run mobile:dev`) | TestFlight |
|--|----------------------------------|------------|
| Device | Mac Simulator | Real iPhone |
| API | `localhost:3000` on your Mac | Vercel / production URL |
| Who can install | You, on this Mac | You + testers via TestFlight app |
| Billing UI on iOS | Same as dev build (multiplatform gating) | Same — no in-app upgrade on iOS |

**QA results:** [mobile-qa-results-2026-05-24.md](mobile-qa-results-2026-05-24.md)
