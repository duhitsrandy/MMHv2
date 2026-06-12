# Capture TestFlight JS errors (Console.app)

TestFlight `.ips` files for this app often **do not** include the JavaScript error text. Use a USB connection and Console.app:

1. Connect iPhone to Mac (cable).
2. Open **Console.app** → select the iPhone in the sidebar → **Start Streaming**.
3. In the search box, use **one** of these (not all at once):

| Goal | Search filter |
|------|----------------|
| JS fatal / crash | `process:MeetMeHalfway RCTFatal` |
| React Native JS logs | `process:MeetMeHalfway ReactNativeJS` |
| Our app only (less noise) | `process:MeetMeHalfway` then exclude `CFNetwork`, `quic`, `backboard` |
| Hang / repeat errors | `process:MeetMeHalfway error` — look for the **same message repeating** |

4. **Actions** (toolbar) → enable **Errors and Faults**; disable Info/Debug if the stream is overwhelming.
5. Swipe-kill the app, then cold-launch from TestFlight.
6. Copy lines containing:
   - `RCTFatalException`
   - `Unhandled JS Exception`
   - `ReactNativeJS` + `Error`
   - `*** Terminating app due to uncaught exception`

Paste the full reason + JS stack into chat or save under `crash-logs/`.

### Splash / “initial screen” hang (build 22)

If the app **does not crash** but stays on the splash/loading image, that is often **not** a fatal — iOS launch-safe mode was waiting on `InteractionManager` while the React tree rendered nothing. Build 23+ disables launch-safe by default and replaces those waits. In Console, you may still see noisy **non-fatal** warnings; focus on repeating `ReactNativeJS` errors, not system network logs.

Build 18 summary (no JS message in `.ips`): [crash-logs/MeetMeHalfway-2026-06-11-101016-build18-summary.md](../crash-logs/MeetMeHalfway-2026-06-11-101016-build18-summary.md)
