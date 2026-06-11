#!/usr/bin/env bash
# Symbolicate main-binary offsets from a TestFlight .ips crash report.
#
# Usage:
#   ./scripts/symbolicate-ios-crash.sh <dSYM-or-DWARF> <load-address> <offset> [offset...]
#
# Example (TestFlight build 15):
#   ./scripts/symbolicate-ios-crash.sh \
#     path/to/MeetMeHalfway.app.dSYM/Contents/Resources/DWARF/MeetMeHalfway \
#     4342218752 1546476 2010620 2013240
#
# Verify dSYM UUID matches the crash log slice_uuid:
#   dwarfdump --uuid path/to/MeetMeHalfway.app.dSYM

set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <dwarf-binary> <load-address-decimal> <offset> [offset...]" >&2
  exit 1
fi

DWARF="$1"
LOAD="$2"
shift 2

if [[ ! -f "$DWARF" ]]; then
  echo "DWARF binary not found: $DWARF" >&2
  exit 1
fi

DSYM_DIR="$(dirname "$DWARF")/../../.."
if [[ -d "$DSYM_DIR" && "$(basename "$DSYM_DIR")" == *.dSYM ]]; then
  echo "dSYM UUID(s):"
  dwarfdump --uuid "$DSYM_DIR" 2>/dev/null || true
  echo ""
fi

echo "atos -arch arm64 -o \"$DWARF\" -l $LOAD $*"
echo "---"
atos -arch arm64 -o "$DWARF" -l "$LOAD" "$@"
