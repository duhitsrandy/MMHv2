# App Store Submission & Metadata

Use when **P0** and **TestFlight** checklists are complete. Focus: App Store Connect listing, privacy, review notes, and submit for review.

**Hub:** [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md) · **Before:** [P0](mobile-ios-p0-blockers.md) · [TestFlight](mobile-ios-testflight-readiness.md)

---

## Submission gates

- [ ] All [P0 blockers](mobile-ios-p0-blockers.md) checked
- [ ] [TestFlight](mobile-ios-testflight-readiness.md) validated on physical iPhone
- [ ] Production build selected for App Review
- [ ] Demo account and review notes ready (below)

**3-minute reviewer test:** Guest or demo user → two addresses → map, routes, POIs → Apple Maps — no crash, no placeholder primary UI.

---

## App Store Connect — listing

- [ ] App name and subtitle reflect actual function (not generic “maps app”)
- [ ] Description matches **today’s** features only
- [ ] Keywords — no competitor impersonation
- [ ] Category appropriate (Navigation / Lifestyle / Utilities — pick honestly)
- [ ] Support URL works (`support@meetmehalfway.co` / site support page)
- [ ] Marketing URL works if provided
- [ ] Privacy policy URL: `https://meetmehalfway.co/privacy`

**Positioning (metadata):**

> Meet Me Halfway helps users compare fair meeting points between multiple starting locations, view relative travel times, and choose nearby places to meet.

---

## Screenshots and preview

- [ ] Screenshots are **real in-app** captures from the build under review
- [ ] Show core flow (map, midpoint, POIs) — not login-only or marketing mockups
- [ ] iOS billing UI shown accurately (no PaymentSheet if not shipped)
- [ ] No “coming soon” features in screenshots
- [ ] Preview video (if any) is app capture only

---

## App Privacy (Connect)

Complete using the SDK inventory in [P0 doc § App Privacy](mobile-ios-p0-blockers.md).

- [ ] Every integrated SDK accounted for (Clerk, Supabase, Stripe, maps, server-side APIs)
- [ ] Contact Info, Location, Identifiers, Purchases answered accurately
- [ ] Usage Data / Diagnostics only if analytics or crash SDKs are in the **mobile** build
- [ ] User Content / saved data classified per Apple definitions
- [ ] “Tracking” and “linked to user” answered honestly
- [ ] Re-verify labels after adding PostHog or Sentry to mobile

---

## Age rating & compliance

- [ ] Age rating questionnaire completed (location + accounts)
- [ ] **Export compliance** / encryption questionnaire answered (consistent with prior uploads)
- [ ] EU **trader status** / DSA if distributing in EU
- [ ] Map/data **attribution** visible in app (OSM/HERE terms reference in-app credits)

---

## App Review Information

### Demo account (required)

- [ ] Dedicated review email/password
- [ ] **Pro** tier (for 3+ origins / matrix)
- [ ] No MFA, no pending email verification

### Review notes template

Paste into App Store Connect → **App Review Information**. Adjust bracketed fields.

```
Meet Me Halfway helps users find fair meeting points between two or more starting locations.

Core review flow:
1. Open the app (guest mode is sufficient for the free 2-location flow).
2. Optional: sign in with the demo account below to test 3+ locations and saved data.
3. Enter two test addresses:
   - 1 Apple Park Way, Cupertino, CA
   - San Francisco Ferry Building, San Francisco, CA
4. Tap Find Midpoint.
5. View map, routes, travel times, and nearby POIs.
6. Tap a POI to open navigation in Apple Maps or Google Maps.

Demo account (Pro — for 3+ locations and premium features):
Email: [review-demo@example.com]
Password: [password]

Notes:
- Location permission is optional; users can enter addresses manually if denied.
- Network access is required for geocoding, routing, and POIs.
- Saved locations and searches sync when signed in.

iOS billing:
Meet Me Halfway supports multiplatform accounts. Some users may have subscriptions purchased outside the iOS app. For review, we provided a Pro demo account so paid features can be tested without purchase. The iOS app does not process new Stripe payments for digital subscriptions.

Account deletion:
Account menu (user icon, Map tab) → **Delete Account**, or About (info icon) → **Delete Account**. Confirmation screen; type DELETE to confirm. Removes profile, saved locations, saved searches, and Clerk account.

Technical:
No executable code is downloaded after review to change app functionality.
```

- [ ] Review notes do **not** include aggressive off-app upgrade URLs unless your UI uses a compliant external-purchase flow verified against current Guideline 3.1.1
- [ ] Delete Account path updated in notes when shipped

---

## Submit for review

```bash
cd MeetMeHalfwayMobile
# Build already uploaded via eas submit — select build in Connect
```

- [ ] Build selected in App Store Connect
- [ ] Version/release notes for users (if required)
- [ ] Export compliance answered for this build
- [ ] Submitted for App Review
- [ ] Contact email for review team is monitored

---

## Why Apple might reject (quick reference)

| Area | MMH risk |
|------|----------|
| 5.1.1(v) | No in-app account deletion |
| 3.1.1 | Misleading purchase UI or non-compliant external purchase messaging |
| 4.2 | Thin or template-like app |
| 2.3 | Screenshots/metadata ≠ shipped app |
| 2.1 | Crashes, broken APIs during review |
| 2.5.2 | Remote code changing features post-review |

Not a rejection category: “vibe-coded.” Focus on deletion, billing wording, privacy accuracy, production stability, reviewer access.

---

## Optional: Apple In-App Purchase (future)

Not required for first submit if conservative multiplatform path + Pro demo is documented.

| Scope | Effort (one dev) |
|-------|------------------|
| RevenueCat + Plus/Pro monthly only | ~3–5 days |
| Plus/Pro monthly + yearly | ~1–1.5 weeks |
| Full Stripe parity (all cadences/tiers) | ~2–3 weeks |

Requires: App Store subscription products, DB fields for Apple transactions, Server Notifications webhook, entitlement merge with Stripe, Restore Purchases, updated privacy labels.

**Recommendation:** Ship with multiplatform + P0 fixes first; add RevenueCat later if iOS conversion warrants it.

---

## Post-submit

- [ ] Monitor review status and respond within 24h if Apple asks questions
- [ ] Keep production API and demo account healthy during review
- [ ] If rejected, map feedback to [P0](mobile-ios-p0-blockers.md) / [QA](mobile-qa-checklist.md) and resubmit

---

*App Store submission checklist — use after TestFlight sign-off.*
