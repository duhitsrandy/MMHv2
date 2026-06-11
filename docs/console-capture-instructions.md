# Capture TestFlight JS crash message (Console.app)

TestFlight `.ips` files for this app often **do not** include the JavaScript error text. Use a USB connection and Console.app:

1. Connect iPhone to Mac (cable).
2. Open **Console.app** → select the iPhone in the sidebar → **Start Streaming**.
3. Filter: `MeetMeHalfway` or `RCTFatal`.
4. Swipe-kill the app, then cold-launch from TestFlight.
5. Copy lines containing:
   - `RCTFatalException`
   - `Unhandled JS Exception`
   - `*** Terminating app due to uncaught exception`

Paste the full reason + JS stack into chat or save under `crash-logs/`.

Build 18 summary (no JS message in `.ips`): [crash-logs/MeetMeHalfway-2026-06-11-101016-build18-summary.md](../crash-logs/MeetMeHalfway-2026-06-11-101016-build18-summary.md)
