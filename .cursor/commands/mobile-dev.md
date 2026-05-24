# Start mobile dev (Expo + iOS simulator)

Run the full mobile dev workflow from the repo root.

1. Use the Shell tool to run: `npm run mobile:dev`
2. Run it **in the background** (`block_until_ms: 0`) — this is a long-running dev server.
3. Request permissions `full_network` and `all` if the sandbox blocks Expo or simctl.
4. After starting, read the terminal output and report:
   - Whether Metro started (look for `localhost:8081`)
   - Any errors (especially `xcrun` / `simctl` / Xcode)
5. If iOS simulator fails but Metro started, tell the user to run `/mobile-metro` instead or fix Xcode with `/xcode-check`.

Do not edit files unless the command fails due to a fixable project issue.
