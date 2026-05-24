# Start mobile Metro only (no iOS auto-launch)

Use when `mobile:dev` fails on simctl/Xcode but you still want the bundler.

1. Use the Shell tool to run: `npm run mobile:start`
2. Run it **in the background** (`block_until_ms: 0`).
3. Request permissions `full_network` and `all` if needed.
4. Report when Metro is waiting on `http://localhost:8081` and how to open the app (Expo Go, or press `i` in the terminal after fixing Xcode).

Do not edit files unless required to fix a bundler error.
