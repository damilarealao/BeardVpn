#!/bin/bash
# ============================================================
# BeardVpn - Master Pre-Build Audit Script
# Runs all audits before any release build
# Usage: ./scripts/check.sh [--extension|--android|--all]
# ============================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

MODE="${1:---all}"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       BeardVpn - Pre-Build Audit        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "  Mode: $MODE"
echo "  Time: $(date)"
echo "  Dir:  $(dirname "$SCRIPT_DIR")"
echo ""

EXT_RESULT=0
ANDROID_RESULT=0

if [ "$MODE" = "--extension" ] || [ "$MODE" = "--all" ]; then
  echo -e "${BOLD}━━━ BROWSER EXTENSION AUDIT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  bash "$SCRIPT_DIR/check-extension.sh" || EXT_RESULT=$?
  echo ""
fi

if [ "$MODE" = "--android" ] || [ "$MODE" = "--all" ]; then
  echo -e "${BOLD}━━━ ANDROID APK AUDIT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  bash "$SCRIPT_DIR/check-android.sh" || ANDROID_RESULT=$?
  echo ""
fi

# Final summary
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║           FINAL VERDICT                  ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"

ALL_PASS=true

if [ "$MODE" = "--extension" ] || [ "$MODE" = "--all" ]; then
  if [ $EXT_RESULT -ne 0 ]; then
    echo -e "  ${RED}Extension: BLOCKED${NC}"
    ALL_PASS=false
  else
    echo -e "  ${GREEN}Extension: PASSED${NC}"
  fi
fi

if [ "$MODE" = "--android" ] || [ "$MODE" = "--all" ]; then
  if [ $ANDROID_RESULT -ne 0 ]; then
    echo -e "  ${RED}Android:   BLOCKED${NC}"
    ALL_PASS=false
  else
    echo -e "  ${GREEN}Android:   PASSED${NC}"
  fi
fi

echo ""

if [ "$ALL_PASS" = true ]; then
  echo -e "${GREEN}${BOLD}  ALL AUDITS PASSED - Safe to build.${NC}"
  exit 0
else
  echo -e "${RED}${BOLD}  AUDITS FAILED - Fix issues before building.${NC}"
  exit 1
fi
