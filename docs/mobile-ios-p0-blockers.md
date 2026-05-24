# P0 — App Review Blockers

Execute this checklist **before** App Store submission. Do not submit with sign-up enabled unless **Delete Account** exists.

**Hub:** [mobile-ios-release-checklist.md](mobile-ios-release-checklist.md) · **Next:** [TestFlight readiness](mobile-ios-testflight-readiness.md) · **Then:** [App Store submission](mobile-ios-app-store-submission.md)

**Guidelines reference:** [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — especially **5.1.1(v)** (account deletion), **3.1.1** (payments).

---

## Implementation order (recommended)

1. **Delete Account flow** (ticket below)
2. Privacy / Terms / Support links in app
3. Remove unused Always location permission + clearer When-In-Use copy
4. Confirm Clerk Native API + production EAS env
5. Create Pro demo account
6. Run simulator QA → [mobile-qa-checklist.md](mobile-qa-checklist.md)
7. EAS production build + TestFlight on physical iPhone
8. Record QA evidence → [mobile-qa-results-2026-05-24.md](mobile-qa-results-2026-05-24.md)
9. App Store metadata + review notes → [mobile-ios-app-store-submission.md](mobile-ios-app-store-submission.md)

---

## Ticket #1 — Delete Account (do first)

**P0: Add Delete Account flow to mobile**

| Requirement | Done |
|-------------|------|
| Accessible from Account / Settings (account sheet or About) | ☐ |
| Confirmation screen before delete | ☐ |
| Explains what will be deleted (profile, saved locations, saved searches) | ☐ |
| Calls backend delete endpoint (Clerk user + cascade DB data per privacy policy) | ☐ |
| Signs user out after success | ☐ |
| Success and error states | ☐ |
| Privacy policy text matches actual behavior (no “if available”) | ☐ |

**Do not submit** with sign-up enabled until this ships.

---

## Account / legal

- [ ] In-app **Delete Account** flow exists (see ticket above)
- [ ] Delete Account verified against **production** API + Clerk
- [ ] **Privacy Policy** link visible in app → `https://meetmehalfway.co/privacy`
- [ ] **Terms** link visible in app → `https://meetmehalfway.co/terms`
- [ ] **Support** contact visible in app → `support@meetmehalfway.co`
- [ ] Privacy policy accurately describes saved locations, searches, and account deletion

---

## iOS permissions

- [ ] Only **When In Use** location declared (remove `NSLocationAlwaysAndWhenInUseUsageDescription` if unused)
- [ ] Purpose string is specific, e.g. *“Meet Me Halfway uses your location to fill your starting point and calculate nearby meeting options.”*
- [ ] Manual address entry works when location is **denied**
- [ ] No background location plist strings unless you ship background tracking

**File:** `MeetMeHalfwayMobile/app.config.ts`

---

## Production config

- [ ] EAS production build uses **production** `EXPO_PUBLIC_API_BASE_URL`
- [ ] No `localhost` / staging URL in production build
- [ ] **Clerk Native API** enabled for bundle ID `com.meetmehalfway.mobile` — [mobile-ios-runbook.md](mobile-ios-runbook.md)
- [ ] Supabase production keys on EAS build
- [ ] Production API, geocoding, routing, and POI providers live during review window

---

## Reviewer access gate

Reviewer must complete the app **without buying anything**.

- [ ] Guest can test **2-origin** free flow
- [ ] **Pro demo account** can test **3+ origins** / matrix features
- [ ] Reviewer does **not** need to purchase a subscription
- [ ] Reviewer does **not** need email verification pending
- [ ] Reviewer does **not** need MFA
- [ ] Reviewer does **not** need web-only login to finish core flow
- [ ] Review notes include demo credentials + test addresses (see [submission doc](mobile-ios-app-store-submission.md))

---

## Billing (conservative iOS path)

Re-check **Guideline 3.1.1** at submission time. Lowest-friction approach for MMH today:

| Rule | Done |
|------|------|
| No Stripe **PaymentSheet** on iOS for new subscriptions | ☐ |
| No in-app checkout for new digital subscriptions on iOS | ☐ |
| No tappable external pricing URL unless using a **clearly compliant** external-purchase flow (verify current Apple policy first) | ☐ |
| No misleading **Buy** / **View Plans** CTAs on iOS | ☐ |
| Upgrade copy is informational only — avoid steering reviewers to off-app purchase | ☐ |
| **Pro demo account** so reviewer never needs to test payment | ☐ |
| Existing subscriber **Manage Subscription** behavior documented in review notes; portal only if compliant for your setup | ☐ |

**In-app copy (safer than naming a URL):**

> Upgrade limitations are explained without aggressive purchase CTAs. Multiplatform accounts may already have access from outside the iOS app.

**Code:** `MeetMeHalfwayMobile/src/lib/billingPolicy.ts` — `canShowUpgradeUI` is `false` on iOS.

---

## Core app flow (P0 smoke)

- [ ] Guest **2-address** search works
- [ ] Signed-in **2-address** search works
- [ ] **Pro demo**: **3+ address** search works
- [ ] Map renders
- [ ] Routes / ETAs render
- [ ] POIs render
- [ ] Open in **Apple Maps** works
- [ ] No placeholder **primary** tabs
- [ ] No launch crash or persistent blank white screen

Full QA: [mobile-qa-checklist.md](mobile-qa-checklist.md)

---

## App Privacy — SDK inventory (P0/P1)

Apple requires accurate App Privacy answers for **your code and integrated third-party SDKs**. Complete this inventory before filling Connect labels.

| SDK / service | Data collected | Linked to user? | Tracking? | Analytics? | App functionality? | Third-party sharing? | Notes |
|---------------|----------------|---------------|-----------|------------|----------------------|----------------------|-------|
| Clerk | Email, auth identifiers | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Supabase | Saved locations/searches, profile | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Stripe RN | Payment metadata if portal used | ☐ | ☐ | ☐ | ☐ | ☐ | Bundled on iOS; no new checkout UI |
| `react-native-maps` | Map display | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Geocoding/routing APIs (server) | Addresses, coordinates | ☐ | ☐ | ☐ | ☐ | ☐ | Via your API |
| POI APIs (server) | Location queries | ☐ | ☐ | ☐ | ☐ | ☐ | |
| PostHog | — | ☐ | ☐ | ☐ | ☐ | ☐ | **Not on mobile yet** |
| Sentry | — | ☐ | ☐ | ☐ | ☐ | ☐ | **Not on mobile yet** |
| Expo modules | Device/OS as applicable | ☐ | ☐ | ☐ | ☐ | ☐ | |

**Likely label categories for MMH:**

| Data type | Relevance |
|-----------|-----------|
| Contact Info | Email / name via Clerk |
| Location | Current location, entered places, route queries |
| Identifiers | User ID, session/device IDs |
| Purchases | Subscription status |
| Usage Data | Only if analytics enabled |
| Diagnostics | Only if crash reporting enabled |
| User Content | Saved locations / searches (classify per Apple definitions) |

- [ ] Inventory completed
- [ ] App Store Connect **App Privacy** labels match inventory
- [ ] Labels updated if you add PostHog/Sentry to mobile later

---

## Vibe-coded risk audit

Catches low-quality signals reviewers and users notice. Not a separate Apple rule — reduces 4.2 / template risk.

### UI / UX polish

- [ ] No default Expo starter copy in primary flows
- [ ] No generic placeholder empty states (“No data”)
- [ ] Consistent button styles and spacing
- [ ] No dead tabs
- [ ] No hidden debug screens reachable by users
- [ ] No console/debug text visible in UI
- [ ] Loading states are intentional
- [ ] Errors explain what to do next

### Code hygiene

- [ ] No unused starter files in user paths (`EditScreenInfo`, etc.)
- [ ] No test API keys in production bundle
- [ ] No hardcoded personal emails except support/demo
- [ ] No TODO/FIXME in user-facing copy
- [ ] Feature flags do not hide major unreviewed features
- [ ] No remote code / downloaded JS altering core behavior post-review
- [ ] No secrets in `EXPO_PUBLIC_*` variables

### Product clarity

- [ ] Purpose clear within 30 seconds
- [ ] First search completable without docs
- [ ] Upgrade limitations explained clearly (without aggressive off-app CTAs)
- [ ] Does not look like a generic maps clone
- [ ] Does not overclaim AI, booking, live tracking, or “optimal” routing

---

## P0 — App Store Connect (minimum)

- [ ] App record created
- [ ] Bundle ID `com.meetmehalfway.mobile` registered
- [ ] Privacy policy URL added in Connect
- [ ] App Privacy labels completed (from SDK inventory)
- [ ] Age rating completed
- [ ] Export compliance answered
- [ ] Screenshots match **shipped** app (no unreleased features)
- [ ] Metadata does not claim unreleased features

Detail: [mobile-ios-app-store-submission.md](mobile-ios-app-store-submission.md)

---

## Red flags — stop submission

| Stop if… | Guideline / risk |
|----------|------------------|
| Sign-up enabled, no Delete Account | 5.1.1(v) |
| Privacy/Terms only on web | Accuracy / trust |
| `NSLocationAlways` without feature | Permission scrutiny |
| Demo needs MFA or purchase | Broken review |
| `localhost` in TestFlight/production build | Broken review |
| Clerk Native API off | Auth fails |
| Aggressive off-app upgrade CTA on iOS | 3.1.1 delay/rejection |

---

## Key files

| Area | Path |
|------|------|
| Auth / sign-up | `MeetMeHalfwayMobile/app/sign-in.tsx`, `sign-up.tsx` |
| Account menu | `MeetMeHalfwayMobile/app/(tabs)/_layout.tsx` |
| About | `MeetMeHalfwayMobile/app/modal.tsx` |
| Billing gate | `MeetMeHalfwayMobile/src/lib/billingPolicy.ts` |
| Expo permissions | `MeetMeHalfwayMobile/app.config.ts` |

---

*P0 checklist — execute before TestFlight public beta or App Store submit.*
