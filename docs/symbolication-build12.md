# iOS launch crash symbolication notes

Crashes on TestFlight builds **9–13** share the same main-binary offsets (build **13** IPS: `MeetMeHalfway-2026-05-28-112246.ips`).

## Build 12 reference

Crash: `MeetMeHalfway-2026-05-25-214834.ips` (TestFlight build **12**).

## Frames to resolve (imageIndex 0, main binary)

| Offset | Load address (from .ips) |
|--------|--------------------------|
| 1546476 | 4377182208 |
| 2010620 | 4377182208 |
| 2013240 | 4377182208 |

## EAS artifact download

```bash
cd MeetMeHalfwayMobile
npx eas-cli build:download --build-id 093634ac-2dfa-4892-b739-4a5c1d10e125 --all-artifacts --non-interactive
```

EAS CLI downloaded the **IPA/app archive** and Xcode logs only; **`MeetMeHalfway.app.dSYM` is not exposed** in the default artifact bundle (see xcode log: `GenerateDSYMFile` → `MeetMeHalfway.app.dSYM` on the build worker).

## atos attempt (stripped archive, no dSYM)

```bash
BIN="<eas-cache>/MeetMeHalfway.app/MeetMeHalfway"
atos -arch arm64 -o "$BIN" -l 4377182208 1546476 2010620 2013240
```

Result: offsets only (no symbols) — binary in store/TestFlight IPA is stripped.

## Next steps for symbols

1. In [EAS build 12](https://expo.dev/accounts/duhitsrandy/projects/meet-me-halfway/builds/093634ac-2dfa-4892-b739-4a5c1d10e125), check **Artifacts** for a dSYM / build artifacts archive (if Expo adds one).
2. Or symbolicate in **Xcode → Organizer → Crashes** after uploading dSYMs from a local `eas build --local` archive.
3. Re-run `atos` with:

```bash
atos -arch arm64 -o MeetMeHalfway.app.dSYM/Contents/Resources/DWARF/MeetMeHalfway -l 4377182208 1546476 2010620 2013240
```

Build **13** confirmed same offsets after dual defer + auth split. Build **15** adds full app-shell gate and removes Reanimated root side-effect import.

**Status:** Symbols unresolved — stripped IPA from EAS download; need `MeetMeHalfway.app.dSYM` from local `eas build --local` or Xcode Organizer after uploading dSYMs.
