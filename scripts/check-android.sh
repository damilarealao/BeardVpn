#!/bin/bash
# ============================================================
# BeardVpn - Pre-Build Audit Script (Android APK)
# Run this before any Android release build
# ============================================================

set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

PASS=0
WARN=0
FAIL=0
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

log_pass() { PASS=$((PASS+1)); echo -e "  ${GREEN}PASS${NC}  $1"; }
log_warn() { WARN=$((WARN+1)); echo -e "  ${YELLOW}WARN${NC}  $1"; }
log_fail() { FAIL=$((FAIL+1)); echo -e "  ${RED}FAIL${NC}  $1"; }
log_info() { echo -e "  ${CYAN}INFO${NC}  $1"; }

echo ""
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  BeardVpn - Android Pre-Build Audit${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# ── 1. EXPO PROJECT STRUCTURE ──────────────────────────────
echo -e "${BOLD}[1/9] Checking Expo project structure...${NC}"

expo_files=(
  "package.json"
  "app.json"
  "App.tsx"
  "tsconfig.json"
  "babel.config.js"
  "metro.config.js"
  "tailwind.config.js"
  "global.css"
)

for f in "${expo_files[@]}"; do
  if [ -f "$ROOT/$f" ]; then
    log_pass "$f exists"
  else
    log_fail "$f MISSING"
  fi
done

echo ""

# ── 2. NODE.JS DEPENDENCIES ────────────────────────────────
echo -e "${BOLD}[2/9] Checking node_modules...${NC}"

if [ -d "$ROOT/node_modules" ]; then
  log_pass "node_modules directory exists"

  required_deps=(
    "expo"
    "react"
    "react-native"
    "@react-navigation/native"
    "@react-navigation/bottom-tabs"
    "@react-navigation/native-stack"
    "@react-native-async-storage/async-storage"
    "nativewind"
    "tailwindcss"
    "babel-preset-expo"
    "react-native-safe-area-context"
    "react-native-screens"
  )

  for dep in "${required_deps[@]}"; do
    if [ -d "$ROOT/node_modules/$dep" ]; then
      log_pass "$dep installed"
    else
      log_fail "$dep NOT installed"
    fi
  done
else
  log_fail "node_modules MISSING - run npm install"
fi

echo ""

# ── 3. TYPESCRIPT CHECK ────────────────────────────────────
echo -e "${BOLD}[3/9] TypeScript audit...${NC}"

if command -v npx &>/dev/null; then
  cd "$ROOT"
  ts_output=$(npx tsc --noEmit 2>&1)
  ts_exit=$?
  if [ $ts_exit -eq 0 ]; then
    log_pass "TypeScript compilation clean (0 errors)"
  else
    error_count=$(echo "$ts_output" | grep -c "error TS" || true)
    log_fail "TypeScript has ${error_count} errors"
    echo "$ts_output" | grep "error TS" | head -10 | while read -r line; do
      log_info "  $line"
    done
  fi
fi

echo ""

# ── 4. SOURCE CODE STRUCTURE ───────────────────────────────
echo -e "${BOLD}[4/9] Checking source code structure...${NC}"

src_dirs=(
  "src/screens"
  "src/components"
  "src/services"
  "src/hooks"
  "src/types"
  "src/config"
)

for d in "${src_dirs[@]}"; do
  if [ -d "$ROOT/$d" ]; then
    file_count=$(find "$ROOT/$d" -name "*.ts" -o -name "*.tsx" | wc -l)
    if [ "$file_count" -gt 0 ]; then
      log_pass "$d/ (${file_count} files)"
    else
      log_warn "$d/ exists but empty"
    fi
  else
    log_fail "$d/ MISSING"
  fi
done

echo ""

# ── 5. ANDROID PROJECT ─────────────────────────────────────
echo -e "${BOLD}[5/9] Checking Android native project...${NC}"

if [ -d "$ROOT/android" ]; then
  log_pass "android/ directory exists"

  # Check AndroidManifest.xml
  manifest="$ROOT/android/app/src/main/AndroidManifest.xml"
  if [ -f "$manifest" ]; then
    log_pass "AndroidManifest.xml exists"

    # Check VPN permissions
    for perm in "INTERNET" "FOREGROUND_SERVICE" "ACCESS_NETWORK_STATE" "POST_NOTIFICATIONS"; do
      if grep -q "$perm" "$manifest"; then
        log_pass "Permission $perm declared"
      else
        log_fail "Permission $perm MISSING"
      fi
    done

    # Check VPN service declaration
    if grep -q "VPNService" "$manifest"; then
      log_pass "VPNService declared in manifest"
    else
      log_fail "VPNService NOT declared in manifest"
    fi

    # Check BIND_VPN_SERVICE permission
    if grep -q "BIND_VPN_SERVICE" "$manifest"; then
      log_pass "BIND_VPN_SERVICE permission set on VPNService"
    else
      log_warn "BIND_VPN_SERVICE permission not found on VPNService"
    fi

    # Check foregroundServiceType (required for Android 14+)
    if grep -q "foregroundServiceType" "$manifest"; then
      log_pass "foregroundServiceType specified (Android 14+ requirement)"
    else
      log_warn "foregroundServiceType not set - may fail on Android 14+"
    fi
  else
    log_fail "AndroidManifest.xml MISSING"
  fi

  # Check build.gradle
  build_gradle="$ROOT/android/app/build.gradle"
  if [ -f "$build_gradle" ]; then
    log_pass "app/build.gradle exists"

    # Check SDK versions
    if grep -q "compileSdk" "$build_gradle" || grep -q "compileSdkVersion" "$build_gradle"; then
      log_pass "compileSdk specified"
    else
      log_warn "compileSdk not found in app/build.gradle"
    fi

    if grep -q "minSdk" "$build_gradle" || grep -q "minSdkVersion" "$build_gradle"; then
      min_sdk=$(grep -oP '(minSdk|minSdkVersion)\s*[=]*\s*\K\d+' "$build_gradle" | head -1)
      if [ -n "$min_sdk" ] && [ "$min_sdk" -ge 24 ]; then
        log_pass "minSdkVersion >= 24 (found: $min_sdk)"
      elif [ -n "$min_sdk" ]; then
        log_fail "minSdkVersion too low ($min_sdk) - VPN requires >= 24"
      else
        log_info "minSdkVersion found but couldn't parse value"
      fi
    fi
  else
    log_fail "app/build.gradle MISSING"
  fi

  # Check native Kotlin files
  native_dir="$ROOT/android/app/src/main/java/com/beardvpn/app"
  if [ -d "$native_dir" ]; then
    for kt in VPNService.kt VPNModule.kt VPNPackage.kt MainApplication.kt MainActivity.kt; do
      if [ -f "$native_dir/$kt" ]; then
        log_pass "$kt exists"
      else
        log_fail "$kt MISSING"
      fi
    done
  else
    log_fail "Native Kotlin directory MISSING"
  fi
else
  log_fail "android/ directory MISSING - run: npx expo prebuild --platform android"
fi

echo ""

# ── 6. NATIVE MODULE AUDIT ─────────────────────────────────
echo -e "${BOLD}[6/9] Auditing native VPN module...${NC}"

native_dir="$ROOT/android/app/src/main/java/com/beardvpn/app"

if [ -f "$native_dir/VPNService.kt" ]; then
  # Check VpnService extends correct class
  if grep -q "extends VpnService\|: VpnService()" "$native_dir/VPNService.kt"; then
    log_pass "VPNService extends android.net.VpnService"
  else
    log_fail "VPNService doesn't extend VpnService"
  fi

  # Check for foreground notification
  if grep -q "startForeground" "$native_dir/VPNService.kt"; then
    log_pass "VPNService starts foreground notification"
  else
    log_fail "VPNService doesn't call startForeground - will crash on Android 8+"
  fi

  # Check for notification channel (Android 8+)
  if grep -q "NotificationChannel" "$native_dir/VPNService.kt"; then
    log_pass "NotificationChannel created (Android 8+ requirement)"
  else
    log_fail "No NotificationChannel - notification will crash on Android 8+"
  fi

  # Check for VPN interface establishment
  if grep -q "Builder()" "$native_dir/VPNService.kt" && grep -q "establish()" "$native_dir/VPNService.kt"; then
    log_pass "VPN TUN interface established via Builder"
  else
    log_fail "VPN TUN interface not established"
  fi

  # Check for event emission to React Native
  if grep -q "RCTDeviceEventEmitter\|emit(" "$native_dir/VPNService.kt"; then
    log_pass "State changes emitted to React Native"
  else
    log_warn "No event emission to React Native"
  fi

  # Check for proper cleanup
  if grep -q "onDestroy\|onRevoke" "$native_dir/VPNService.kt"; then
    log_pass "VPN cleanup handlers present (onDestroy/onRevoke)"
  else
    log_warn "No onDestroy/onRevoke handlers"
  fi
fi

if [ -f "$native_dir/VPNModule.kt" ]; then
  # Check React methods
  for method in "connect" "disconnect" "getStatus" "getStats" "addListener" "removeListeners"; do
    if grep -q "@ReactMethod" "$native_dir/VPNModule.kt" && grep -q "fun $method" "$native_dir/VPNModule.kt"; then
      log_pass "VPNModule.$method() exposed to JS"
    else
      log_warn "VPNModule.$method() may not be exposed"
    fi
  done

  # Check Promise handling
  promise_count=$(grep -c "Promise" "$native_dir/VPNModule.kt" || true)
  if [ "$promise_count" -gt 0 ]; then
    log_pass "VPNModule uses Promise-based async (${promise_count} references)"
  else
    log_warn "VPNModule may not use Promises properly"
  fi
fi

echo ""

# ── 7. MAINAPPLICATION AUDIT ───────────────────────────────
echo -e "${BOLD}[7/9] Auditing MainApplication.kt...${NC}"

if [ -f "$native_dir/MainApplication.kt" ]; then
  if grep -q "VPNPackage" "$native_dir/MainApplication.kt"; then
    log_pass "VPNPackage registered in MainApplication"
  else
    log_fail "VPNPackage NOT registered - VPNModule won't be available in JS"
  fi

  if grep -q "ExpoReactHostFactory\|getDefaultReactHost" "$native_dir/MainApplication.kt"; then
    log_pass "Expo React host configured"
  else
    log_warn "Expo React host may not be configured"
  fi
else
  log_fail "MainApplication.kt MISSING"
fi

echo ""

# ── 8. JS-NATIVE BRIDGE AUDIT ──────────────────────────────
echo -e "${BOLD}[8/9] Auditing JS VPN service bridge...${NC}"

vpn_service="$ROOT/src/services/vpnService.ts"
if [ -f "$vpn_service" ]; then
  if grep -q "NativeModules" "$vpn_service"; then
    log_pass "vpnService.ts imports NativeModules"
  else
    log_fail "vpnService.ts doesn't import NativeModules"
  fi

  if grep -q "VPNModule" "$vpn_service"; then
    log_pass "vpnService.ts references VPNModule"
  else
    log_fail "vpnService.ts doesn't reference VPNModule"
  fi

  if grep -q "NativeEventEmitter" "$vpn_service"; then
    log_pass "vpnService.ts uses NativeEventEmitter for state changes"
  else
    log_warn "vpnService.ts doesn't use NativeEventEmitter"
  fi

  # Check for graceful fallback
  if grep -q "not available\|not available\|Native module not" "$vpn_service"; then
    log_pass "vpnService.ts has graceful fallback when native module unavailable"
  else
    log_warn "vpnService.ts may not handle missing native module gracefully"
  fi
else
  log_fail "src/services/vpnService.ts MISSING"
fi

echo ""

# ── 9. GRADLE BUILD FILES ─────────────────────────────────
echo -e "${BOLD}[9/9] Auditing Gradle configuration...${NC}"

root_gradle="$ROOT/android/build.gradle"
if [ -f "$root_gradle" ]; then
  if grep -q "google()" "$root_gradle"; then
    log_pass "Google Maven repo configured"
  else
    log_fail "Google Maven repo missing"
  fi

  if grep -q "mavenCentral" "$root_gradle"; then
    log_pass "Maven Central repo configured"
  else
    log_warn "Maven Central repo missing"
  fi
fi

gradle_props="$ROOT/android/gradle.properties"
if [ -f "$gradle_props" ]; then
  if grep -q "newArchEnabled" "$gradle_props"; then
    log_pass "New Architecture config found in gradle.properties"
  fi
  if grep -q "hermesEnabled" "$gradle_props"; then
    log_pass "Hermes engine config found"
  fi
fi

echo ""

# ── SUMMARY ────────────────────────────────────────────────
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  Android Audit Summary${NC}"
echo -e "${BOLD}========================================${NC}"
echo -e "  ${GREEN}PASS: ${PASS}${NC}"
echo -e "  ${YELLOW}WARN: ${WARN}${NC}"
echo -e "  ${RED}FAIL: ${FAIL}${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}${BOLD}BLOCKED: Fix all FAIL items before building.${NC}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "${YELLOW}${BOLD}PASSED WITH WARNINGS: Review WARN items before release.${NC}"
  exit 0
else
  echo -e "${GREEN}${BOLD}ALL CLEAR: Ready to build Android APK.${NC}"
  exit 0
fi
