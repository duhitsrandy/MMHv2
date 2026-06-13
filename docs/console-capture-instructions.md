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

If the app **does not crash** but stays on the splash/loading image, that is often **not** a fatal — iOS launch-safe mode was waiting on `InteractionManager` while the React tree rendered nothing. Build 23+ disables launch-safe by default and replaces those waits.

### Why `ReactNativeJS` / `MMH_DEBUG` may be empty (TestFlight)

**This is normal for production/release builds.** Hermes release binaries often **do not forward** `console.log` to macOS Console.app. You will still see native UIKit `default` lines for `MeetMeHalfway`; that does **not** mean you are in the wrong app or wrong filter.

**What works instead:**

1. **On-screen boot diag** — loading screens show gray `build=… branch=…` text at the bottom (build 24+). Screenshot that line.
2. **iOS Simulator + Metro** — run locally; JS logs appear in the Metro terminal.
3. **Development build** (`expo-dev-client`) — JS logs visible while attached to Metro.
4. Console.app is still useful for **native crashes** (`RCTFatal`, `fault`) — not for routine JS `console.log` in release.

**Console.app checklist (when you do use it):**

1. Sidebar → your **iPhone** under Devices (not “This Mac”).
2. Click **Start** to stream live logs.
3. Toolbar → **Errors and Faults** for crashes; enable **Include Info Messages** if searching subsystems.
4. Search: `process:MeetMeHalfway` — expect mostly native lifecycle lines on TestFlight.

Build 18 summary (no JS message in `.ips`): [crash-logs/MeetMeHalfway-2026-06-11-101016-build18-summary.md](../crash-logs/MeetMeHalfway-2026-06-11-101016-build18-summary.md)
