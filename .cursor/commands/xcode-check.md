# Check Xcode / iOS simulator CLI

Diagnose why `npm run mobile:dev` may fail with `xcrun simctl` errors.

1. Run: `npm run xcode:check`
2. Also run: `xcode-select -p` and `xcrun --version` if helpful.
3. Summarize results in plain language.

**Do not run `sudo` commands.** If Xcode needs reset, tell the user to run this themselves in their terminal (requires password):

```bash
sudo xcode-select --reset
```

Then open Xcode once, accept the license, and retry `/mobile-dev`.
