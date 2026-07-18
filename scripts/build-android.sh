#!/usr/bin/env bash
# ============================================================================
# BeardVpn Build & Test Script
# Tests all dependencies, compatibility, core functions, and builds release APK
# Usage: ./scripts/build-android.sh [--arch ARCH] [--install] [--skip-tests]
# Default arch: arm64-v8a
# ============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
APK_DIR="$ANDROID_DIR/app/build/outputs/apk"

# Defaults
ARCH="armeabi-v7a"
INSTALL_AFTER_BUILD=false
SKIP_TESTS=false
PASS=0
FAIL=0
WARN=0
TOTAL=0

# ============================================================================
# Helpers
# ============================================================================
pass() { ((PASS++)); ((TOTAL++)); echo -e "  ${GREEN}PASS${NC} $1"; }
fail() { ((FAIL++)); ((TOTAL++)); echo -e "  ${RED}FAIL${NC} $1"; }
warn() { ((WARN++)); ((TOTAL++)); echo -e "  ${YELLOW}WARN${NC} $1"; }
info() { echo -e "${BLUE}$1${NC}"; }
header() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

check_cmd() {
  if command -v "$1" &>/dev/null; then
    pass "$1 installed: $(command -v "$1")"
    return 0
  else
    fail "$1 not found"
    return 1
  fi
}

check_file() {
  if [ -f "$1" ]; then
    pass "File exists: $(basename "$1")"
    return 0
  else
    fail "File missing: $1"
    return 1
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    pass "Dir exists: $(basename "$1")"
    return 0
  else
    fail "Dir missing: $1"
    return 1
  fi
}

# ============================================================================
# Parse args
# ============================================================================
while [[ $# -gt 0 ]]; do
  case $1 in
    --arch) ARCH="$2"; shift 2;;
    --install) INSTALL_AFTER_BUILD=true; shift;;
    --skip-tests) SKIP_TESTS=true; shift;;
    -h|--help)
      echo "Usage: $0 [--arch ARCH] [--install] [--skip-tests]"
      echo "  --arch ARCH        Target architecture (default: arm64-v8a)"
      echo "  --install          Install APK to connected device after build"
      echo "  --skip-tests       Skip dependency/compatibility checks, just build"
      exit 0
      ;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║        BeardVpn Build & Test Script      ║"
echo "║        Architecture: $ARCH               ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# Phase 1: System Dependencies
# ============================================================================
header "Phase 1: System Dependencies"

# Node.js
if check_cmd node; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -ge 18 ]; then
    pass "Node.js >= 18 (found $(node -v))"
  else
    fail "Node.js >= 18 required (found $(node -v))"
  fi
fi

# npm
check_cmd npm && pass "npm $(npm -v)"

# Java / JDK
if check_cmd java; then
  JAVA_VER=$(java -version 2>&1 | head -1 | grep -oP '\d+' | head -1)
  if [ "$JAVA_VER" -ge 17 ]; then
    pass "Java >= 17 (found $JAVA_VER)"
  else
    warn "Java >= 17 recommended (found $JAVA_VER)"
  fi
fi

# JAVA_HOME
if [ -n "${JAVA_HOME:-}" ]; then
  if [ -d "$JAVA_HOME" ]; then
    pass "JAVA_HOME set: $JAVA_HOME"
  else
    fail "JAVA_HOME points to nonexistent dir: $JAVA_HOME"
  fi
else
  warn "JAVA_HOME not set (may still work)"
fi

# Android SDK
if [ -n "${ANDROID_HOME:-}" ] || [ -n "${ANDROID_SDK_ROOT:-}" ]; then
  SDK_DIR="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
  pass "ANDROID_HOME: $SDK_DIR"
else
  fail "ANDROID_HOME not set"
fi

# Android build tools
if [ -d "$SDK_DIR/build-tools" ]; then
  BT_VER=$(ls "$SDK_DIR/build-tools" | sort -V | tail -1)
  pass "Build tools: $BT_VER"
else
  fail "No build-tools found in $SDK_DIR"
fi

# Android platform
if [ -d "$SDK_DIR/platforms" ]; then
  PLAT_VER=$(ls "$SDK_DIR/platforms" | sort -V | tail -1)
  pass "Platform: $PLAT_VER"
else
  fail "No platforms found in $SDK_DIR"
fi

# NDK
NDK_OK=false
if [ -d "$SDK_DIR/ndk" ]; then
  for ndk_dir in "$SDK_DIR/ndk"/*/; do
    if [ -f "$ndk_dir/source.properties" ]; then
      NDK_VER=$(grep 'Pkg.Revision' "$ndk_dir/source.properties" | cut -d= -f2 | tr -d ' ')
      pass "NDK: $NDK_VER ($(basename "$ndk_dir"))"
      NDK_OK=true
      break
    fi
  done
  if [ "$NDK_OK" = false ]; then
    fail "No valid NDK found (missing source.properties)"
  fi
else
  fail "No NDK directory in $SDK_DIR"
fi

# ADB
if check_cmd adb; then
  ADB_VER=$(adb version | head -1)
  pass "$ADB_VER"
fi

# ============================================================================
# Phase 2: Project Dependencies
# ============================================================================
header "Phase 2: Project Dependencies"

cd "$PROJECT_ROOT"

# node_modules
if [ -d "node_modules" ]; then
  NM_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
  pass "node_modules exists ($NM_COUNT packages)"
else
  warn "node_modules missing - running npm install..."
  npm install --legacy-peer-deps 2>/dev/null && pass "npm install succeeded" || fail "npm install failed"
fi

# Key dependencies
DEPS=(
  "react"
  "react-native"
  "expo"
  "nativewind"
  "react-native-webview"
  "@react-navigation/native"
  "@react-navigation/bottom-tabs"
  "@react-native-async-storage/async-storage"
  "react-native-safe-area-context"
  "react-native-screens"
)

for dep in "${DEPS[@]}"; do
  if [ -d "node_modules/$dep" ]; then
    pass "Installed: $dep"
  else
    fail "Missing: $dep"
  fi
done

# ============================================================================
# Phase 3: Core Source Files
# ============================================================================
header "Phase 3: Core Source Files"

# App entry
check_file "$PROJECT_ROOT/App.tsx"
check_file "$PROJECT_ROOT/index.ts"
check_file "$PROJECT_ROOT/package.json"
check_file "$PROJECT_ROOT/app.json"
check_file "$PROJECT_ROOT/tsconfig.json"
check_file "$PROJECT_ROOT/babel.config.js"

# NativeWind config
NW_FOUND=false
for nw in nativewind.config.js tailwind.config.js nativewind.config.ts tailwind.config.ts; do
  if [ -f "$PROJECT_ROOT/$nw" ]; then pass "Config: $nw"; NW_FOUND=true; break; fi
done
[ "$NW_FOUND" = true ] || warn "NativeWind/Tailwind config not found (may be inline in package.json)"

# Screens
check_file "$PROJECT_ROOT/src/screens/HomeScreen.tsx"
check_file "$PROJECT_ROOT/src/screens/ServerListScreen.tsx"
check_file "$PROJECT_ROOT/src/screens/SettingsScreen.tsx"

# Components
check_file "$PROJECT_ROOT/src/components/ConnectButton.tsx"
check_file "$PROJECT_ROOT/src/components/ServerCard.tsx"
check_file "$PROJECT_ROOT/src/components/MonetagAd.tsx"

# Services
check_file "$PROJECT_ROOT/src/services/vpnService.ts"
check_file "$PROJECT_ROOT/src/services/serverService.ts"
check_file "$PROJECT_ROOT/src/services/storageService.ts"

# Hooks
check_file "$PROJECT_ROOT/src/hooks/useVpn.ts"
check_file "$PROJECT_ROOT/src/hooks/useServers.ts"

# Config
check_file "$PROJECT_ROOT/src/config/adConfig.ts"
check_file "$PROJECT_ROOT/src/config/constants.ts"

# Types
check_file "$PROJECT_ROOT/src/types/index.ts"

# Navigation
check_file "$PROJECT_ROOT/src/navigation/AppNavigator.tsx"

# ============================================================================
# Phase 4: Android Native Files
# ============================================================================
header "Phase 4: Android Native Files"

check_file "$ANDROID_DIR/build.gradle"
check_file "$ANDROID_DIR/settings.gradle"
check_file "$ANDROID_DIR/gradle.properties"
check_file "$ANDROID_DIR/gradlew"
check_file "$ANDROID_DIR/app/build.gradle"
check_file "$ANDROID_DIR/app/proguard-rules.pro"

# Native Kotlin
JAVA_SRC="$ANDROID_DIR/app/src/main/java/com/beardvpn/app"
check_file "$JAVA_SRC/MainActivity.kt"
check_file "$JAVA_SRC/MainApplication.kt"
check_file "$JAVA_SRC/VPNModule.kt"
VPN_SVC=false
for v in VPNService.kt BeardVpnService.kt; do
  if [ -f "$JAVA_SRC/$v" ]; then pass "VPN Service: $v"; VPN_SVC=true; break; fi
done
[ "$VPN_SVC" = true ] || fail "VPN Service file missing"
check_file "$JAVA_SRC/VPNPackage.kt"

# Manifest
check_file "$ANDROID_DIR/app/src/main/AndroidManifest.xml"

# Resources
RES_DIR="$ANDROID_DIR/app/src/main/res"
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  if [ -d "$RES_DIR/mipmap-$density" ]; then
    check_file "$RES_DIR/mipmap-$density/ic_launcher.webp"
  else
    fail "Missing: mipmap-$density"
  fi
done

# Assets
check_file "$PROJECT_ROOT/assets/icon.png"
check_file "$PROJECT_ROOT/assets/splash-icon.png"
check_file "$PROJECT_ROOT/assets/android-icon-foreground.png"

# ============================================================================
# Phase 5: TypeScript Compilation
# ============================================================================
header "Phase 5: TypeScript Check"

if command -v npx &>/dev/null; then
  TS_OUTPUT=$(cd "$PROJECT_ROOT" && npx tsc --noEmit 2>&1) || true
  if [ -z "$TS_OUTPUT" ]; then
    pass "TypeScript compilation: no errors"
  else
    TS_ERR_COUNT=$(echo "$TS_OUTPUT" | grep -c "error TS" || echo "0")
    if [ "$TS_ERR_COUNT" -gt 0 ]; then
      warn "TypeScript: $TS_ERR_COUNT error(s) found (non-blocking for APK build)"
    else
      pass "TypeScript: warnings only"
    fi
  fi
else
  warn "npx not found, skipping TypeScript check"
fi

# ============================================================================
# Phase 6: Android Manifest Validation
# ============================================================================
header "Phase 6: Manifest Validation"

MANIFEST="$ANDROID_DIR/app/src/main/AndroidManifest.xml"

# Check VPN permissions
for perm in "INTERNET" "FOREGROUND_SERVICE" "ACCESS_NETWORK_STATE" "BIND_VPN_SERVICE" "POST_NOTIFICATIONS"; do
  if grep -q "$perm" "$MANIFEST"; then
    pass "Permission: $perm"
  else
    fail "Missing permission: $perm"
  fi
done

# Check VPN service
if grep -q "BeardVpnService" "$MANIFEST"; then
  pass "VPN Service declared"
else
  fail "BeardVpnService not in manifest"
fi

if grep -q "android.net.VpnService" "$MANIFEST"; then
  pass "VPN intent filter"
else
  fail "VPN intent filter missing"
fi

# Check MainActivity
if grep -q ".MainActivity" "$MANIFEST"; then
  pass "MainActivity declared"
else
  fail "MainActivity not in manifest"
fi

# ============================================================================
# Phase 7: gradle.properties Validation
# ============================================================================
header "Phase 7: Gradle Properties"

PROPS="$ANDROID_DIR/gradle.properties"

if grep -q "newArchEnabled" "$PROPS"; then
  NEW_ARCH=$(grep "newArchEnabled" "$PROPS" | cut -d= -f2)
  pass "New Architecture: $NEW_ARCH"
fi

if grep -q "hermesEnabled" "$PROPS"; then
  HERMES=$(grep "hermesEnabled" "$PROPS" | cut -d= -f2)
  pass "Hermes: $HERMES"
fi

if grep -q "reactNativeArchitectures" "$PROPS"; then
  ARCHS=$(grep "reactNativeArchitectures" "$PROPS" | cut -d= -f2)
  pass "Configured architectures: $ARCHS"
fi

# Check our target arch is in the list
if grep -q "$ARCH" "$PROPS"; then
  pass "Target arch $ARCH available"
else
  warn "Target arch $ARCH not in default list (will override via CLI)"
fi

# ============================================================================
# Phase 8: VPN Module Integration Check
# ============================================================================
header "Phase 8: VPN Module Integration"

# Check VPNModule is registered in MainApplication
if grep -q "VPNPackage" "$JAVA_SRC/MainApplication.kt"; then
  pass "VPNPackage registered in MainApplication"
else
  fail "VPNPackage not registered in MainApplication"
fi

# Check JS bridge references correct module name
if grep -q "VPNModule" "$PROJECT_ROOT/src/services/vpnService.ts"; then
  pass "JS bridge references VPNModule"
else
  fail "JS bridge missing VPNModule reference"
fi

# Check native module name matches
if grep -q '"VPNModule"' "$JAVA_SRC/VPNModule.kt"; then
  pass "Native module name: VPNModule"
else
  fail "Native module name mismatch"
fi

# Check VPN events
for event in "onVPNStateChanged" "connect" "disconnect" "getStatus" "getStats"; do
  if grep -q "$event" "$JAVA_SRC/VPNModule.kt"; then
    pass "VPN method/event: $event"
  else
    fail "Missing VPN method/event: $event"
  fi
done

# ============================================================================
# Phase 9: Ad Integration Check
# ============================================================================
header "Phase 9: Ad Integration"

# Monetag config
if grep -q "zoneId" "$PROJECT_ROOT/src/config/adConfig.ts"; then
  ZONE_ID=$(grep "zoneId" "$PROJECT_ROOT/src/config/adConfig.ts" | grep -oP "'\K[^']+")
  pass "Monetag zone ID: $ZONE_ID"
fi

if grep -q "scriptUrl" "$PROJECT_ROOT/src/config/adConfig.ts"; then
  pass "Monetag script URL configured"
fi

# WebView dependency
if [ -d "node_modules/react-native-webview" ]; then
  WEBVIEW_VER=$(node -e "console.log(require('react-native-webview/package.json').version)" 2>/dev/null || echo "unknown")
  pass "react-native-webview: $WEBVIEW_VER"
else
  fail "react-native-webview not installed"
fi

# MonetagAd component
if grep -q "WebView" "$PROJECT_ROOT/src/components/MonetagAd.tsx"; then
  pass "MonetagAd uses WebView"
fi

# Ad in App.tsx
if grep -q "MonetagAd" "$PROJECT_ROOT/App.tsx"; then
  pass "MonetagAd integrated in App.tsx"
fi

# ============================================================================
# Phase 10: Ad Config (Extension)
# ============================================================================
header "Phase 10: Browser Extension"

EXT_DIR="$PROJECT_ROOT/browser-extension"
if [ -d "$EXT_DIR" ]; then
  pass "Extension directory exists"
  check_file "$EXT_DIR/manifest.json"
  check_file "$EXT_DIR/popup.html"
  check_file "$EXT_DIR/popup.js"
  check_file "$EXT_DIR/background.js"
  check_file "$EXT_DIR/options.html"
  check_file "$EXT_DIR/options.js"

  for size in 16 32 48 128; do
    check_file "$EXT_DIR/icons/icon${size}.png"
  done
else
  warn "Extension directory not found"
fi

# ============================================================================
# Phase 11: Build APK
# ============================================================================
header "Phase 11: Build Release APK (arch=$ARCH)"

cd "$ANDROID_DIR"

# Set architecture
export reactNativeArchitectures="$ARCH"

echo -e "\n${BLUE}Running Gradle assembleRelease for $ARCH...${NC}"
echo ""

BUILD_START=$(date +%s)

if ./gradlew assembleRelease \
  -PreactNativeArchitectures="$ARCH" \
  --no-daemon \
  2>&1; then

  BUILD_END=$(date +%s)
  BUILD_TIME=$((BUILD_END - BUILD_START))
  pass "Release APK build succeeded (${BUILD_TIME}s)"

  # Find the APK
  APK_PATH=$(find "$ANDROID_DIR/app/build/outputs" -name "*.apk" -type f | head -1)
  if [ -n "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    pass "APK: $APK_PATH ($APK_SIZE)"
  else
    fail "APK file not found in build outputs"
  fi
else
  BUILD_END=$(date +%s)
  BUILD_TIME=$((BUILD_END - BUILD_START))
  fail "Release APK build FAILED (${BUILD_TIME}s)"
fi

# ============================================================================
# Phase 12: Install to Device
# ============================================================================
if [ "$INSTALL_AFTER_BUILD" = true ]; then
  header "Phase 12: Install to Device"

  DEVICE_COUNT=$(adb devices | grep -c "device$" || echo "0")
  if [ "$DEVICE_COUNT" -gt 0 ]; then
    DEVICE_MODEL=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
    DEVICE_ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
    pass "Device: $DEVICE_MODEL (Android $DEVICE_ANDROID)"

    if [ -n "${APK_PATH:-}" ] && [ -f "$APK_PATH" ]; then
      echo -e "${BLUE}Installing APK...${NC}"
      if adb install -r "$APK_PATH" 2>&1; then
        pass "APK installed successfully"
        echo -e "${GREEN}Launch with: adb shell am start -n com.beardvpn.app/.MainActivity${NC}"
      else
        fail "APK install failed"
      fi
    else
      fail "No APK to install"
    fi
  else
    fail "No Android device connected via ADB"
  fi
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗"
echo "║              BUILD SUMMARY               ║"
echo "╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}PASS: $PASS${NC}"
echo -e "  ${YELLOW}WARN: $WARN${NC}"
echo -e "  ${RED}FAIL: $FAIL${NC}"
echo -e "  TOTAL: $TOTAL"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}❌ Build completed with $FAIL failure(s)${NC}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Build completed with $WARN warning(s)${NC}"
  exit 0
else
  echo -e "${GREEN}✅ All checks passed!${NC}"
  exit 0
fi
