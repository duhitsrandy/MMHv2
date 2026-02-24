# Mobile iOS Release Checklist

This checklist reflects the current repository state: Expo managed mobile app with no committed native `ios/` directory.

## Workflow Decision

- Current strategy: **Expo managed workflow** (`MeetMeHalfwayMobile`).
- Native `ios/` artifacts are not committed in this repository.
- If you switch to committed native artifacts, do it in an isolated PR with explicit simulator/build verification.

## Pre-Release Config

Update these values before TestFlight/App Store submission:

- `MeetMeHalfwayMobile/app.json`
  - `expo.ios.bundleIdentifier`
  - `expo.plugins[@stripe/stripe-react-native].merchantIdentifier`
  - `expo.extra.eas.projectId` (if using EAS builds)

## Environment Validation

Run:

```bash
npm run mobile:check-env
```

## Local Validation

```bash
npm run dev
npm run --prefix ./MeetMeHalfwayMobile ios
```

Validate:

- Multi-location input on map tab.
- Route and midpoint rendering for 2-origin search.
- POI enrichment and list rendering.
- Saved locations/search history in Saved tab.

## Optional Native/Xcode Path

If needed for native debugging:

```bash
cd MeetMeHalfwayMobile
npx expo prebuild --platform ios
```

Then commit native changes only if your team decides to adopt the Xcode-first workflow.
