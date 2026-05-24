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

### App Store — digital subscriptions

PaymentSheet checkout unlocks in-app features (tier limits). Apple Guideline **3.1.1** may require IAP for App Store release. TestFlight QA is fine; plan IAP or review response before public App Store submit. See [mobile-gap-audit.md](mobile-gap-audit.md) (Stripe PaymentSheet + App Store).

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
- In-app upgrade: PaymentSheet with test card `4242 4242 4242 4242`; tier updates via `/api/mobile/profile`.
- Manage Subscription: header account menu and Saved tab → Stripe Customer Portal.

## App Store Connect (manual)

- Register bundle ID `com.meetmehalfway.mobile` in Apple Developer + App Store Connect before first TestFlight submit.

## Optional Native/Xcode Path

If needed for native debugging:

```bash
cd MeetMeHalfwayMobile
npx expo prebuild --platform ios
```

Then commit native changes only if your team decides to adopt the Xcode-first workflow.
