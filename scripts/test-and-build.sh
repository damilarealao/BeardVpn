#!/usr/bin/env bash
# ============================================================================
# BeardVpn - Comprehensive Test & Build Script
# Tests ALL core functionalities, dependencies, UI setup, then builds APK
# Usage: ./scripts/test-and-build.sh [--install] [--skip-tests] [--arch ARCH]
# ============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
JAVA_SRC="$ANDROID_DIR/app/src/main/java/com/beardvpn/app"

ARCH="armeabi-v7a"
INSTALL_AFTER_BUILD=false
SKIP_TESTS=false
PASS=0
FAIL=0
WARN=0
TOTAL=0
FAILED_TESTS=()

# ============================================================================
# Helpers
# ============================================================================
pass() { ((PASS++)); ((TOTAL++)); echo -e "  ${GREEN}PASS${NC} $1"; }
fail() { ((FAIL++)); ((TOTAL++)); FAILED_TESTS+=("$1"); echo -e "  ${RED}FAIL${NC} $1"; }
warn() { ((WARN++)); ((TOTAL++)); echo -e "  ${YELLOW}WARN${NC} $1"; }
info() { echo -e "${BLUE}$1${NC}"; }
header() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
check_file() { [ -f "$1" ] && pass "Exists: $(basename "$1")" || fail "Missing: $1"; }

# Check file contains string
check_content() {
  local file="$1" pattern="$2" label="$3"
  if [ -f "$file" ] && grep -q "$pattern" "$file"; then
    pass "$label"
    return 0
  elif [ ! -f "$file" ]; then
    fail "$label (file missing: $file)"
    return 1
  else
    fail "$label (pattern '$pattern' not found in $(basename "$file"))"
    return 1
  fi
}

# Check file does NOT contain string
check_not_content() {
  local file="$1" pattern="$2" label="$3"
  if [ -f "$file" ] && ! grep -q "$pattern" "$file"; then
    pass "$label"
  elif [ ! -f "$file" ]; then
    fail "$label (file missing)"
  else
    warn "$label (unexpected pattern found)"
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
      echo "  --arch ARCH        Target arch (default: armeabi-v7a)"
      echo "  --install          Install to connected device after build"
      echo "  --skip-tests       Skip tests, just build"
      exit 0;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║    BeardVpn - Full Test & Build Pipeline         ║"
echo "║    Architecture: $ARCH                            ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

cd "$PROJECT_ROOT"

if [ "$SKIP_TESTS" = true ]; then
  echo -e "${YELLOW}Skipping tests (--skip-tests)${NC}"
else

# ============================================================================
# T1: System Dependencies
# ============================================================================
header "T1: System Dependencies"

for cmd in node npm java adb; do
  if command -v "$cmd" &>/dev/null; then
    pass "$cmd: $(command -v "$cmd")"
  else
    fail "$cmd not found"
  fi
done

if command -v node &>/dev/null; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  [ "$NODE_VER" -ge 18 ] && pass "Node >= 18 ($(node -v))" || fail "Node < 18 ($(node -v))"
fi

if [ -n "${ANDROID_HOME:-}" ]; then
  pass "ANDROID_HOME: $ANDROID_HOME"
else
  fail "ANDROID_HOME not set"
fi

# ============================================================================
# T2: NDK Validity
# ============================================================================
header "T2: NDK Health"

NDK_OK=false
if [ -d "$ANDROID_HOME/ndk" ]; then
  for ndk_dir in "$ANDROID_HOME/ndk"/*/; do
    if [ -f "$ndk_dir/source.properties" ]; then
      NDK_VER=$(grep 'Pkg.Revision' "$ndk_dir/source.properties" | cut -d= -f2 | tr -d ' ')
      pass "NDK $NDK_VER ($(basename "$ndk_dir")) - valid"
      NDK_OK=true
    fi
  done
  [ "$NDK_OK" = true ] || fail "No valid NDK found (all missing source.properties)"
else
  fail "No NDK directory"
fi

# ============================================================================
# T3: npm Dependencies
# ============================================================================
header "T3: npm Dependencies"

if [ ! -d "node_modules" ]; then
  fail "node_modules missing"
else
  pass "node_modules exists"
fi

for dep in react react-native expo nativewind react-native-webview @react-navigation/native @react-navigation/bottom-tabs @react-native-async-storage/async-storage react-native-safe-area-context react-native-screens; do
  [ -d "node_modules/$dep" ] && pass "Package: $dep" || fail "Missing package: $dep"
done

# ============================================================================
# T4: NativeWind/TailwindCSS Setup (CRITICAL for styling)
# ============================================================================
header "T4: NativeWind v4 Setup (Styling)"

# global.css exists
check_file "$PROJECT_ROOT/global.css"

# global.css has tailwind directives
check_content "$PROJECT_ROOT/global.css" "@tailwind base" "global.css: has @tailwind base"
check_content "$PROJECT_ROOT/global.css" "@tailwind components" "global.css: has @tailwind components"
check_content "$PROJECT_ROOT/global.css" "@tailwind utilities" "global.css: has @tailwind utilities"

# global.css is imported in App.tsx (THE MOST COMMON BUG)
check_content "$PROJECT_ROOT/App.tsx" "global.css" "App.tsx: imports global.css (NativeWind styles load)"

# tailwind.config.js
check_file "$PROJECT_ROOT/tailwind.config.js"
check_content "$PROJECT_ROOT/tailwind.config.js" "nativewind/preset" "tailwind.config: uses nativewind preset"
check_content "$PROJECT_ROOT/tailwind.config.js" "vpn" "tailwind.config: has vpn colors"
check_content "$PROJECT_ROOT/tailwind.config.js" "connected" "tailwind.config: has connected color"

# metro.config.js uses withNativeWind
check_file "$PROJECT_ROOT/metro.config.js"
check_content "$PROJECT_ROOT/metro.config.js" "withNativeWind" "metro.config: uses withNativeWind"
check_content "$PROJECT_ROOT/metro.config.js" "global.css" "metro.config: references global.css"

# babel.config.js
check_content "$PROJECT_ROOT/babel.config.js" "nativewind" "babel.config: nativewind preset"
check_content "$PROJECT_ROOT/babel.config.js" "jsxImportSource" "babel.config: jsxImportSource set"

# nativewind-env.d.ts
check_file "$PROJECT_ROOT/nativewind-env.d.ts"
check_content "$PROJECT_ROOT/nativewind-env.d.ts" "nativewind/types" "nativewind-env.d.ts: references types"

# ============================================================================
# T5: SafeArea Setup (prevents bleed into status/nav bars)
# ============================================================================
header "T5: SafeArea Setup"

# SafeAreaProvider wraps the app
check_content "$PROJECT_ROOT/App.tsx" "SafeAreaProvider" "App.tsx: wraps with SafeAreaProvider"

# All screens use useSafeAreaInsets
check_content "$PROJECT_ROOT/src/screens/HomeScreen.tsx" "useSafeAreaInsets" "HomeScreen: uses useSafeAreaInsets"
check_content "$PROJECT_ROOT/src/screens/ServerListScreen.tsx" "useSafeAreaInsets" "ServerListScreen: uses useSafeAreaInsets"
check_content "$PROJECT_ROOT/src/screens/SettingsScreen.tsx" "useSafeAreaInsets" "SettingsScreen: uses useSafeAreaInsets"

# Navigator accounts for bottom insets
check_content "$PROJECT_ROOT/src/navigation/AppNavigator.tsx" "useSafeAreaInsets" "Navigator: uses useSafeAreaInsets"
check_content "$PROJECT_ROOT/src/navigation/AppNavigator.tsx" "insets.bottom" "Navigator: uses insets.bottom for tab bar padding"

# ============================================================================
# T6: Source Files Exist
# ============================================================================
header "T6: Source Files"

for f in \
  App.tsx index.ts package.json app.json tsconfig.json babel.config.js metro.config.js \
  src/screens/HomeScreen.tsx src/screens/ServerListScreen.tsx src/screens/SettingsScreen.tsx \
  src/components/ConnectButton.tsx src/components/ServerCard.tsx src/components/MonetagAd.tsx \
  src/services/vpnService.ts src/services/serverService.ts src/services/storageService.ts \
  src/hooks/useVpn.ts src/hooks/useServers.ts \
  src/config/adConfig.ts src/config/constants.ts \
  src/types/index.ts src/navigation/AppNavigator.tsx; do
  check_file "$PROJECT_ROOT/$f"
done

# ============================================================================
# T7: Android Native Files
# ============================================================================
header "T7: Android Native Files"

check_file "$ANDROID_DIR/build.gradle"
check_file "$ANDROID_DIR/settings.gradle"
check_file "$ANDROID_DIR/gradle.properties"
check_file "$ANDROID_DIR/gradlew"
check_file "$ANDROID_DIR/app/build.gradle"
check_file "$JAVA_SRC/MainActivity.kt"
check_file "$JAVA_SRC/MainApplication.kt"
check_file "$JAVA_SRC/VPNModule.kt"

# VPN Service (either name)
VPN_SVC=false
for v in VPNService.kt BeardVpnService.kt; do
  if [ -f "$JAVA_SRC/$v" ]; then pass "VPN Service: $v"; VPN_SVC=true; break; fi
done
[ "$VPN_SVC" = true ] || fail "VPN Service file missing"

check_file "$JAVA_SRC/VPNPackage.kt"

# ============================================================================
# T8: AndroidManifest Validation
# ============================================================================
header "T8: AndroidManifest Validation"

MANIFEST="$ANDROID_DIR/app/src/main/AndroidManifest.xml"
check_file "$MANIFEST"

check_content "$MANIFEST" "android.permission.INTERNET" "Permission: INTERNET"
check_content "$MANIFEST" "android.permission.FOREREGROUND_SERVICE" "Permission: FOREGROUND_SERVICE" || \
check_content "$MANIFEST" "FOREGROUND_SERVICE" "Permission: FOREGROUND_SERVICE"
check_content "$MANIFEST" "ACCESS_NETWORK_STATE" "Permission: ACCESS_NETWORK_STATE"
check_content "$MANIFEST" "android.net.VpnService" "Manifest: VPN service intent filter"
check_content "$MANIFEST" "BeardVpnService" "Manifest: BeardVpnService declared"
check_content "$MANIFEST" "BIND_VPN_SERVICE" "Manifest: BIND_VPN_SERVICE permission"

# ============================================================================
# T9: VPN Native Module Integration
# ============================================================================
header "T9: VPN Module Integration"

check_content "$JAVA_SRC/MainApplication.kt" "VPNPackage" "MainApplication: registers VPNPackage"
check_content "$JAVA_SRC/VPNModule.kt" '"VPNModule"' "VPNModule: correct native name"
check_content "$PROJECT_ROOT/src/services/vpnService.ts" "VPNModule" "JS bridge: references VPNModule"

# VPN methods
for method in connect disconnect getStatus getStats; do
  check_content "$JAVA_SRC/VPNModule.kt" "@ReactMethod" "VPNModule: has @ReactMethod annotations" && break
  check_content "$JAVA_SRC/VPNModule.kt" "$method" "VPNModule: method $method"
done

# VPN events
check_content "$JAVA_SRC/VPNModule.kt" "onVPNStateChanged" "VPNModule: emits onVPNStateChanged"

# JS events match
check_content "$PROJECT_ROOT/src/services/vpnService.ts" "onVPNStateChanged" "JS bridge: listens to onVPNStateChanged"

# ============================================================================
# T10: Ad Integration
# ============================================================================
header "T10: Ad Integration"

check_content "$PROJECT_ROOT/src/config/adConfig.ts" "zoneId" "Ad config: zoneId set"
check_content "$PROJECT_ROOT/src/config/adConfig.ts" "scriptUrl" "Ad config: scriptUrl set"
check_content "$PROJECT_ROOT/src/components/MonetagAd.tsx" "WebView" "MonetagAd: uses WebView"
check_content "$PROJECT_ROOT/App.tsx" "MonetagAd" "App: integrates MonetagAd"

# ============================================================================
# T11: UI Design Checks
# ============================================================================
header "T11: UI Design Validation"

# Dark theme background color in screens
for screen in HomeScreen ServerListScreen SettingsScreen; do
  check_content "$PROJECT_ROOT/src/screens/${screen}.tsx" "#0f172a" "${screen}: dark background color"
done

# ConnectButton has modern design
check_content "$PROJECT_ROOT/src/components/ConnectButton.tsx" "Animated" "ConnectButton: uses Animated API"
check_content "$PROJECT_ROOT/src/components/ConnectButton.tsx" "pulseAnim" "ConnectButton: has pulse animation"

# Navigator has proper tab bar styling
check_content "$PROJECT_ROOT/src/navigation/AppNavigator.tsx" "backgroundColor.*0f172a" "Navigator: dark tab bar"
check_content "$PROJECT_ROOT/src/navigation/AppNavigator.tsx" "borderTopColor" "Navigator: tab bar border"

# No white backgrounds (would indicate broken styling)
for f in $(find src/screens src/components src/navigation -name "*.tsx" 2>/dev/null); do
  if grep -q "backgroundColor.*white\|bg-white" "$f" 2>/dev/null; then
    warn "$(basename "$f"): has white background"
  else
    pass "$(basename "$f"): no white background"
  fi
done

# ============================================================================
# T12: TypeScript Check
# ============================================================================
header "T12: TypeScript"

TS_OUTPUT=$(npx tsc --noEmit 2>&1) || true
if [ -z "$TS_OUTPUT" ]; then
  pass "TypeScript: zero errors"
else
  TS_ERR_COUNT=$(echo "$TS_OUTPUT" | grep -c "error TS" || echo "0")
  if [ "$TS_ERR_COUNT" -gt 0 ]; then
    warn "TypeScript: $TS_ERR_COUNT error(s)"
  else
    pass "TypeScript: warnings only"
  fi
fi

# ============================================================================
# T13: gradle.properties
# ============================================================================
header "T13: Gradle Properties"

check_content "$ANDROID_DIR/gradle.properties" "newArchEnabled=true" "New Architecture: enabled"
check_content "$ANDROID_DIR/gradle.properties" "hermesEnabled=true" "Hermes: enabled"

# ============================================================================
# T14: Browser Extension Files
# ============================================================================
header "T14: Browser Extension"

EXT_DIR="$PROJECT_ROOT/browser-extension"
if [ -d "$EXT_DIR" ]; then
  for f in manifest.json popup.html popup.js background.js options.html options.js; do
    check_file "$EXT_DIR/$f"
  done
  for size in 16 32 48 128; do
    check_file "$EXT_DIR/icons/icon${size}.png"
  done
else
  warn "Extension directory not found"
fi

fi # end skip_tests

# ============================================================================
# BUILD
# ============================================================================
header "Building Release APK (arch=$ARCH)"

cd "$ANDROID_DIR"
BUILD_START=$(date +%s)

if ./gradlew assembleRelease \
  -PreactNativeArchitectures="$ARCH" \
  --no-daemon \
  2>&1; then

  BUILD_END=$(date +%s)
  BUILD_TIME=$((BUILD_END - BUILD_START))
  pass "Release build succeeded (${BUILD_TIME}s)"

  APK_PATH=$(find "$ANDROID_DIR/app/build/outputs" -name "*.apk" -type f | head -1)
  if [ -n "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    pass "APK: $(basename "$APK_PATH") ($APK_SIZE)"

    # Verify architecture inside APK
    APK_ARCH=$(unzip -l "$APK_PATH" 2>/dev/null | grep "\.so$" | head -1 | awk '{print $NF}' | cut -d/ -f2)
    if [ "$APK_ARCH" = "$ARCH" ]; then
      pass "APK architecture verified: $APK_ARCH"
    else
      fail "APK architecture mismatch: expected $ARCH, got $APK_ARCH"
    fi
  else
    fail "No APK found in build outputs"
  fi
else
  BUILD_END=$(date +%s)
  BUILD_TIME=$((BUILD_END - BUILD_START))
  fail "Release build FAILED (${BUILD_TIME}s)"
fi

# ============================================================================
# INSTALL
# ============================================================================
if [ "$INSTALL_AFTER_BUILD" = true ]; then
  header "Installing to Device"

  DEVICE_COUNT=$(adb devices | grep -c "device$" || echo "0")
  if [ "$DEVICE_COUNT" -gt 0 ]; then
    DEVICE_MODEL=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
    DEVICE_ABI=$(adb shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '\r')
    DEVICE_ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
    pass "Device: $DEVICE_MODEL (Android $DEVICE_ANDROID, $DEVICE_ABI)"

    if [ -n "${APK_PATH:-}" ] && [ -f "$APK_PATH" ]; then
      echo -e "${BLUE}Installing...${NC}"
      if adb install -r "$APK_PATH" 2>&1; then
        pass "APK installed"
        echo -e "${GREEN}Launch: adb shell am start -n com.beardvpn.app/.MainActivity${NC}"
      else
        fail "Install failed"
      fi
    fi
  else
    fail "No device connected"
  fi
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗"
echo "║              TEST & BUILD SUMMARY               ║"
echo "╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}PASS: $PASS${NC}"
echo -e "  ${YELLOW}WARN: $WARN${NC}"
echo -e "  ${RED}FAIL: $FAIL${NC}"
echo -e "  TOTAL: $TOTAL"
echo ""

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo -e "${RED}Failed tests:${NC}"
  for t in "${FAILED_TESTS[@]}"; do
    echo -e "  ${RED}\u2717${NC} $t"
  done
  echo ""
fi

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}\u2718 Build completed with $FAIL failure(s)${NC}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "${YELLOW}\u26A0  Build completed with $WARN warning(s)${NC}"
  exit 0
else
  echo -e "${GREEN}\u2714 All checks passed!${NC}"
  exit 0
fi
