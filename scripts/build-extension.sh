#!/bin/bash
# ============================================================
# BeardVpn - Build browser extension for Chrome/Firefox
# Usage: ./scripts/build-extension.sh [--chrome|--firefox|--all]
# ============================================================

set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/browser-extension"
DIST="$ROOT/dist/extension"
MODE="${1:---all}"

mkdir -p "$DIST/chrome" "$DIST/firefox"

build_chrome() {
  echo -e "${BOLD}Building Chrome extension...${NC}"
  rm -rf "$DIST/chrome"
  cp -r "$SRC" "$DIST/chrome"
  # Chrome uses manifest.json as-is (MV3)
  echo -e "  ${GREEN}Chrome extension ready at:${NC}"
  echo -e "  $DIST/chrome/"
  echo ""
  echo -e "  ${YELLOW}To install:${NC}"
  echo -e "  1. Open chrome://extensions/"
  echo -e "  2. Enable Developer mode"
  echo -e "  3. Click Load unpacked"
  echo -e "  4. Select: $DIST/chrome/"
}

build_firefox() {
  echo -e "${BOLD}Building Firefox extension...${NC}"
  rm -rf "$DIST/firefox"
  cp -r "$SRC" "$DIST/firefox"
  # Firefox needs manifest.firefox.json renamed to manifest.json (MV2)
  if [ -f "$DIST/firefox/manifest.firefox.json" ]; then
    cp "$DIST/firefox/manifest.firefox.json" "$DIST/firefox/manifest.json"
    rm "$DIST/firefox/manifest.firefox.json"
  fi
  # Firefox also needs manifest.json to be MV2
  echo -e "  ${GREEN}Firefox extension ready at:${NC}"
  echo -e "  $DIST/firefox/"
  echo ""
  echo -e "  ${YELLOW}To install:${NC}"
  echo -e "  1. Open about:debugging#/runtime/this-firefox"
  echo -e "  2. Click Load Temporary Add-on"
  echo -e "  3. Select: $DIST/firefox/manifest.json"
}

echo ""
echo -e "${BOLD}BeardVpn - Extension Builder${NC}"
echo ""

if [ "$MODE" = "--chrome" ] || [ "$MODE" = "--all" ]; then
  build_chrome
  echo ""
fi

if [ "$MODE" = "--firefox" ] || [ "$MODE" = "--all" ]; then
  build_firefox
  echo ""
fi

echo -e "${GREEN}${BOLD}Build complete!${NC}"
