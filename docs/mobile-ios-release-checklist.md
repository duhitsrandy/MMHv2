# Mobile iOS Release — Hub

Entry point for shipping **Meet Me Halfway** on iOS. The work is split into **three checklists** so you can execute one phase at a time.

**Repo context:** Expo managed app in `MeetMeHalfwayMobile/` · bundle ID `com.meetmehalfway.mobile` · no committed native `ios/`.

---

## Three checklists (use in order)

| Phase | Doc | When |
|-------|-----|------|
| **1. P0 App Review blockers** | [mobile-ios-p0-blockers.md](mobile-ios-p0-blockers.md) | Before any App Store submit — account deletion, legal links, permissions, billing conservatism, SDK privacy inventory, core smoke, vibe-coded audit |
| **2. TestFlight readiness** | [mobile-ios-testflight-readiness.md](mobile-ios-testflight-readiness.md) | EAS production build + physical iPhone validation |
| **3. App Store submission** | [mobile-ios-app-store-submission.md](mobile-ios-app-store-submission.md) | Metadata, App Privacy labels, screenshots, review notes, submit |

**Supporting docs:** [mobile-ios-runbook.md](mobile-ios-runbook.md) · [mobile-qa-checklist.md](mobile-qa-checklist.md) · [mobile-qa-results-2026-05-24.md](mobile-qa-results-2026-05-24.md) · [mobile-gap-audit.md](mobile-gap-audit.md)

---

## Recommended implementation order

1. **Delete Account** flow — see [P0 ticket #1](mobile-ios-p0-blockers.md#ticket-1--delete-account-do-first)
2. Privacy / Terms / Support links in app
3. Remove unused **Always** location permission; tighten When-In-Use copy
4. Clerk Native API + production EAS env
5. **Pro demo account** (no MFA, no pending verification)
6. Simulator QA → [mobile-qa-checklist.md](mobile-qa-checklist.md)
7. EAS production build → TestFlight on physical iPhone
8. Record QA evidence
9. App Store metadata, SDK privacy labels, review notes → submit

---

## Ship readiness (one glance)

| Gate | Checklist |
|------|-----------|
| P0 policy + core smoke | [mobile-ios-p0-blockers.md](mobile-ios-p0-blockers.md) |
| Production build on device | [mobile-ios-testflight-readiness.md](mobile-ios-testflight-readiness.md) |
| Connect + review | [mobile-ios-app-store-submission.md](mobile-ios-app-store-submission.md) |

**Biggest risks (not “vibe coding”):** account deletion · iOS billing wording · privacy label accuracy · production config · reviewer access without purchase.

---

## iOS billing (summary)

**Current approach:** conservative multiplatform — no Stripe PaymentSheet for **new** subscriptions on iOS; Pro demo for review; avoid aggressive off-app purchase CTAs. Re-verify [Guideline 3.1.1](https://developer.apple.com/app-store/review/guidelines/) at submit time.

**Code:** `MeetMeHalfwayMobile/src/lib/billingPolicy.ts`

Detail: [P0 § Billing](mobile-ios-p0-blockers.md#billing-conservative-ios-path) · Review notes: [submission doc](mobile-ios-app-store-submission.md#review-notes-template)

---

## Local dev (quick)

```bash
npm run mobile:check-env
npm run dev
npm run --prefix ./MeetMeHalfwayMobile ios
```

---

## Key files

| Area | Path |
|------|------|
| Expo config | `MeetMeHalfwayMobile/app.config.ts`, `eas.json` |
| iOS billing | `MeetMeHalfwayMobile/src/lib/billingPolicy.ts` |
| Auth | `MeetMeHalfwayMobile/app/sign-in.tsx`, `sign-up.tsx` |
| Account UI | `MeetMeHalfwayMobile/app/(tabs)/_layout.tsx` |

---

*Hub updated 2026-05-24 — split into P0 / TestFlight / App Store submission checklists.*
