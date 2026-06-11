# Build 18 crash summary (TestFlight)

Source: `MeetMeHalfway-2026-06-11-101016.ips` (user device, 2026-06-11).

| Field | Value |
|-------|--------|
| `build_version` | **18** |
| `slice_uuid` | `2bf4ead5-a97c-3235-96b3-5ca5750156e8` |
| Load address (main binary) | `4296130560` |
| Launch → crash | ~0.42s |
| OS | iPhone OS 26.5 (23F77) |

## Diagnosis

- **Faulting thread:** `com.facebook.react.ExceptionsManagerQueue`
- **Pattern:** `objc_exception_throw` → `objc_exception_rethrow` → `abort()` / `SIGABRT`
- **Meaning:** Fatal **unhandled JavaScript exception** reported via React Native's `RCTFatal` / ExceptionsManager — not a native-module init bug.
- **Offsets** `1561240` / `2025384` / `2028004` (build 18) are RN-core reporter frames; identical role to builds 9–15.
- **`.ips` does not include the JS error message** (`asi` = "abort() called" only). Capture via **Console.app** while reproducing: look for `RCTFatalException` / `Unhandled JS Exception`.

## Lazy-Clerk fix result

Build 18 shipped new UUID but **still crashed** — defer/lazy auth did not change the failure mode.
