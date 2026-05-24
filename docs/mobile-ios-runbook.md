# Mobile iOS Runbook

This runbook is the stable baseline for local iOS development in this repo.

## Prerequisites

- macOS with Xcode 15+ (iOS Simulator)
- Node.js 18+
- Apple Developer account (for device builds and App Store; see release checklist)
- Expo managed workflow in `MeetMeHalfwayMobile/` (not a greenfield React Native CLI scaffold)

## Related docs

- [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md) — TestFlight / App Store prep
- [mobile-qa-checklist.md](mobile-qa-checklist.md) — manual QA before release

## Project Layout

- Web app root: `mmhv2/`
- Mobile app root: `mmhv2/MeetMeHalfwayMobile/`

## Preflight

Run env validation before starting mobile:

```bash
npm run mobile:check-env
```

Required files:

- `/.env.local` (web/server-side keys)
- `/MeetMeHalfwayMobile/.env` (Expo public keys)

## Local Startup

Start web API/backend first:

```bash
npm run dev
```

Then start iOS client:

```bash
npm run --prefix ./MeetMeHalfwayMobile ios
```

Or single command:

```bash
npm run mobile:dev
```

## Simulator Recovery

If Metro or simulator state is corrupted:

```bash
npm run mobile:ios:reset
npm run --prefix ./MeetMeHalfwayMobile ios
```

## API Contract Baseline

Mobile should call stable server endpoints under `/api/` and avoid hard-coding experimental/test paths directly in UI components.

Current baseline endpoints:

- `/api/mobile/route`
- `/api/ors/geocode`
- `/api/ors/matrix`
- `/api/pois/search`

## Release Readiness Notes

- This repository currently uses Expo managed workflow for mobile.
- No committed native `ios/` project exists at this time.
- If native iOS artifacts are generated, do so in a dedicated change with explicit verification.
