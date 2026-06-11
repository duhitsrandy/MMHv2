# iOS launch crash symbolication notes

Crashes on TestFlight builds **9–18** share the same failure mode: fatal JS exception → `ExceptionsManagerQueue` → `SIGABRT`.

**Corrected diagnosis (build 18, 2026-06-11):** offsets point at React Native's **crash reporter** (`RCTFatal` / ExceptionsManager), not the buggy native module. The JS error message is in **Console.app** at crash time, not in the `.ips` file. See [console-capture-instructions.md](console-capture-instructions.md) and [crash-logs/MeetMeHalfway-2026-06-11-101016-build18-summary.md](../crash-logs/MeetMeHalfway-2026-06-11-101016-build18-summary.md).

## Build 15 reference (TestFlight)

| Field | Value |
|-------|--------|
| IPS | `MeetMeHalfway-2026-05-28-144915.ips` |
| `build_version` | 15 |
| `slice_uuid` | `e5d51b12-ccd0-30e9-bf00-fe91e66fcb34` |
| Load address | `4342218752` |

### Frames to resolve (imageIndex 0, main binary)

| Offset | Role (inferred) |
|--------|------------------|
| 1546476 | Native throw site |
| 2010620 | `NSInvocation` / bridge |
| 2013240 | `NSInvocation` / bridge |

## Local build prerequisites

`eas build --local` needs on your Mac:

- [fastlane](https://fastlane.tools) (`brew install fastlane`)
- CocoaPods (`brew install cocoapods` — `pod --version` must succeed)

Without both, local builds fail before producing a dSYM.

## Symbolicate locally

After `eas build --platform ios --profile production --local`:

```bash
chmod +x scripts/symbolicate-ios-crash.sh

./scripts/symbolicate-ios-crash.sh \
  path/to/MeetMeHalfway.app.dSYM/Contents/Resources/DWARF/MeetMeHalfway \
  4342218752 1546476 2010620 2013240
```

Verify dSYM UUID:

```bash
dwarfdump --uuid path/to/MeetMeHalfway.app.dSYM
```

## EAS cloud artifact download

```bash
cd MeetMeHalfwayMobile
npx eas-cli build:download --build-id <BUILD_ID> --all-artifacts --non-interactive
```

Default artifact bundle is **IPA + logs**; dSYM is produced on the worker (`GenerateDSYMFile`) but is not always exposed in the download bundle. Prefer **local** `eas build --local` for dSYM on your Mac.

## Resolved symbols

| Offset | Symbol | Status |
|--------|--------|--------|
| 1546476 | *(pending local dSYM)* | Run script after local build |
| 2010620 | *(pending)* | |
| 2013240 | *(pending)* | |

Update this table after `./scripts/symbolicate-ios-crash.sh` succeeds.

## History

- Builds **9–13**: load `4377182208`, same offsets — defer bisect did not change crash site.
- Build **15**: load `4342218752`, new UUID, **same offsets** — launch gate + auth split did not move crash site.
- Build **18**: lazy Clerk + defer nav — **still crashes** (~0.42s). Same reporter pattern.
- **Build 19+ fix**: `index.js` entry with global URL polyfill before Clerk; `ErrorUtils` fatal capture + on-screen error UI; Clerk `tokenCache` with `clearToken`; `expo-web-browser` auth session completion at startup.
