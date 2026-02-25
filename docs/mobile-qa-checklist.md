# Mobile QA Checklist

Use this checklist after mobile changes to reduce regressions.

## Startup

- Run backend first:
  - `npm run dev`
- Run mobile app:
  - `npm run --prefix ./MeetMeHalfwayMobile ios`
- Verify app opens without red screen/crash.

## Auth Screens

- Open `/sign-in` and `/sign-up` routes.
- Verify “Sign In on Web” / “Sign Up on Web” buttons open browser correctly when `EXPO_PUBLIC_API_BASE_URL` is set.
- Verify “Continue to App” navigation returns to tabs.

## Map + Search Flow

- 2-location search:
  - Enter two addresses.
  - Confirm routes and midpoint marker render.
  - Confirm POIs are shown.
- Multi-location search:
  - Add locations until plan max.
  - Confirm upgrade alert appears when exceeding `EXPO_PUBLIC_MOBILE_PLAN_TIER` limit.
  - Confirm centroid-based search still returns POIs.
- Repeated taps:
  - Rapidly tap “Find Midpoint” and confirm duplicate requests are avoided.

## POI + External Navigation

- Open POI callout.
- Verify Apple/Google/Waze actions open correctly.
- Verify user-friendly error alert appears if map app launch fails.

## Saved Data

- Save flow:
  - Run a search and confirm entries appear under `Saved` tab.
- Restore flow:
  - Tap “Run Again” from saved searches.
  - Confirm locations repopulate map input fields.
- Delete flow:
  - Remove saved location/search and confirm list refreshes.

## Quick Regression Sweep

- POI tab still receives and displays POI data.
- Saved tab opens with empty-state messaging if storage is cleared.
- Route fallback still works if route API fails.
