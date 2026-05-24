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
- `/MeetMeHalfwayMobile/.env` (Expo public keys; **not committed** — copy from `.env.example`)

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

Mobile calls tier-aware endpoints under `/api/mobile/*`. Send `Authorization: Bearer <clerk_jwt>` when signed in for authenticated rate limits and Pro-tier features.

| Endpoint | Auth | Notes |
|----------|------|-------|
| `POST /api/mobile/route` | Optional Bearer | 2-origin routing; anon allowed (stricter rate limit) |
| `POST /api/mobile/geocode` | Optional Bearer | LocationIQ → Nominatim (web parity) |
| `POST /api/mobile/matrix` | Optional Bearer | Pro/Business → HERE traffic matrix; else ORS |
| `GET /api/mobile/profile` | Optional Bearer | Returns `tier`; starter if unsigned |
| `/api/mobile/saved/*` | Bearer required | Cloud saved locations & searches |
| `GET /api/pois/search` | Public | POI list (unchanged this session) |

**Tier rules:** Searching with **more than 2 origins** requires signed-in **Pro or Business**. HERE matrix requires Pro/Business.

Legacy public proxies (`/api/ors/geocode`, `/api/ors/matrix`) remain for backward compatibility; the mobile app uses `/api/mobile/*` instead.

## Release Readiness Notes

- This repository currently uses Expo managed workflow for mobile.
- No committed native `ios/` project exists at this time.
- If native iOS artifacts are generated, do so in a dedicated change with explicit verification.
