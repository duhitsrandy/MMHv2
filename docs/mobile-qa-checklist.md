# Mobile QA Checklist

Use this checklist after mobile changes to reduce regressions.

## Startup

- Run backend first:
  - `npm run dev`
- Run mobile app:
  - `npm run --prefix ./MeetMeHalfwayMobile ios`
- Verify app opens without red screen/crash.

## Auth Screens

- Open `/sign-in` and `/sign-up` routes (native Clerk email/password).
- Sign in with a test account; confirm session persists after app reload.
- Sign out from the Saved tab (or account UI) and confirm guest behavior returns.
- If `EXPO_PUBLIC_REQUIRE_AUTH=true`, confirm unauthenticated users are redirected to sign-in.

## Plan / Tier

- Signed in: confirm plan label on Map tab matches `/api/mobile/profile` (not env overrides).
- Starter/Plus: 2-origin search works; 3-origin search shows upgrade alert at **Find Midpoint**.
- Pro/Business: 3+-origin centroid search works; matrix uses HERE (check server logs for `provider: here`).

## Map + Search Flow

- 2-location search:
  - Enter two addresses.
  - Confirm routes and midpoint marker render.
  - Confirm POIs are shown.
- Multi-location search (Pro/Business):
  - Add 3+ locations and search.
  - Confirm centroid-based midpoint and POIs render.
- Multi-location blocked (Starter/Plus):
  - Add 3 locations; tap Find Midpoint.
  - Confirm upgrade alert with link to pricing.
- Repeated taps:
  - Rapidly tap “Find Midpoint” and confirm duplicate requests are avoided.

## POI + External Navigation

- Open POI callout.
- Verify Apple/Google/Waze actions open correctly.
- Verify user-friendly error alert appears if map app launch fails.

## Saved Data

- **Signed out:** run a search; confirm entries appear under Saved tab (local AsyncStorage).
- **Signed in:** run a search; confirm Saved tab shows cloud data only (no duplicate local-only entries).
- Restore flow:
  - Tap “Run Again” from saved searches.
  - Confirm locations repopulate map input fields.
- Delete flow:
  - Remove saved location/search and confirm list refreshes.

## Quick Regression Sweep

- POI tab still receives and displays POI data.
- Saved tab opens with empty-state messaging if storage is cleared (guest).
- Route fallback still works if route API fails.
