#!/bin/bash
# ============================================================
# BeardVpn - Pre-Build Audit Script (Browser Extension)
# Run this before any extension release
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
EXT_DIR="$(cd "$(dirname "$0")/.." && pwd)/browser-extension"

log_pass() { PASS=$((PASS+1)); echo -e "  ${GREEN}PASS${NC}  $1"; }
log_warn() { WARN=$((WARN+1)); echo -e "  ${YELLOW}WARN${NC}  $1"; }
log_fail() { FAIL=$((FAIL+1)); echo -e "  ${RED}FAIL${NC}  $1"; }
log_info() { echo -e "  ${CYAN}INFO${NC}  $1"; }

echo ""
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  BeardVpn - Extension Pre-Build Audit${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# ── 1. FILE EXISTENCE ──────────────────────────────────────
echo -e "${BOLD}[1/8] Checking required files...${NC}"

required_files=(
  "manifest.json"
  "manifest.firefox.json"
  "background.js"
  "popup.html"
  "popup.css"
  "popup.js"
  "options.html"
  "options.js"
)

for f in "${required_files[@]}"; do
  if [ -f "$EXT_DIR/$f" ]; then
    log_pass "$f exists"
  else
    log_fail "$f MISSING"
  fi
done

for size in 16 32 48 128; do
  if [ -f "$EXT_DIR/icons/icon${size}.png" ]; then
    size_bytes=$(stat -f%z "$EXT_DIR/icons/icon${size}.png" 2>/dev/null || stat -c%s "$EXT_DIR/icons/icon${size}.png" 2>/dev/null)
    if [ "$size_bytes" -gt 10 ]; then
      log_pass "icon${size}.png exists (${size_bytes} bytes)"
    else
      log_warn "icon${size}.png is too small (${size_bytes} bytes) - may be placeholder"
    fi
  else
    log_fail "icon${size}.png MISSING"
  fi
done

echo ""

# ── 2. MANIFEST VALIDATION ─────────────────────────────────
echo -e "${BOLD}[2/8] Validating Chrome manifest (Manifest V3)...${NC}"

if command -v node &>/dev/null; then
  node -e "
    const fs = require('fs');
    const m = JSON.parse(fs.readFileSync('$EXT_DIR/manifest.json', 'utf8'));
    const checks = [
      [m.manifest_version === 3, 'manifest_version is 3'],
      [m.name && m.name.length > 0, 'name is set'],
      [m.version && /^\d+\.\d+\.\d+$/.test(m.version), 'version format valid (x.y.z)'],
      [m.description && m.description.length > 10, 'description is meaningful'],
      [m.background && m.background.service_worker, 'service_worker declared'],
      [m.action && m.action.default_popup, 'default_popup declared'],
      [m.permissions && m.permissions.includes('proxy'), 'proxy permission present'],
      [m.permissions && m.permissions.includes('storage'), 'storage permission present'],
      [m.permissions && m.permissions.includes('tabs'), 'tabs permission present'],
      [m.host_permissions && m.host_permissions.includes('<all_urls>'), 'host_permissions <all_urls>'],
    ];
    checks.forEach(([ok, msg]) => console.log(ok ? 'PASS' : 'FAIL', msg));
  " 2>&1 | while read -r status msg; do
    if [ "$status" = "PASS" ]; then log_pass "$msg"; else log_fail "$msg"; fi
  done
else
  log_warn "Node.js not found, skipping manifest JSON validation"
fi

echo ""
echo -e "${BOLD}Validating Firefox manifest (Manifest V2)...${NC}"

if command -v node &>/dev/null; then
  node -e "
    const fs = require('fs');
    const m = JSON.parse(fs.readFileSync('$EXT_DIR/manifest.firefox.json', 'utf8'));
    const checks = [
      [m.manifest_version === 2, 'manifest_version is 2'],
      [m.name && m.name.length > 0, 'name is set'],
      [m.version && /^\d+\.\d+\.\d+$/.test(m.version), 'version format valid'],
      [m.background && m.background.scripts, 'background scripts declared'],
      [m.browser_action && m.browser_action.default_popup, 'browser_action popup declared'],
      [m.permissions && m.permissions.includes('proxy'), 'proxy permission present'],
      [m.permissions && m.permissions.includes('storage'), 'storage permission present'],
      [m.permissions && m.permissions.includes('<all_urls>'), 'host_permissions <all_urls>'],
    ];
    checks.forEach(([ok, msg]) => console.log(ok ? 'PASS' : 'FAIL', msg));
  " 2>&1 | while read -r status msg; do
    if [ "$status" = "PASS" ]; then log_pass "$msg"; else log_fail "$msg"; fi
  done
fi

echo ""

# ── 3. BACKGROUND SERVICE WORKER ────────────────────────────
echo -e "${BOLD}[3/8] Auditing background.js...${NC}"

# Check for setInterval (doesn't work in MV3 service workers) - skip comments
if grep -v '//' "$EXT_DIR/background.js" | grep -q "setInterval"; then
  log_warn "setInterval used in MV3 service worker - may stop when SW terminates. Use chrome.alarms API instead."
else
  log_pass "No setInterval in service worker (using chrome.alarms)"
fi

# Check for chrome.proxy API usage
if grep -q "proxy.settings.set" "$EXT_DIR/background.js"; then
  log_pass "chrome.proxy.settings.set() used for proxy connection"
else
  log_fail "chrome.proxy.settings.set() not found - proxy won't work"
fi

# Check for proxy.settings.clear
if grep -q "proxy.settings.clear" "$EXT_DIR/background.js"; then
  log_pass "chrome.proxy.settings.clear() used for disconnect"
else
  log_fail "chrome.proxy.settings.clear() not found - can't disconnect"
fi

# Check for storage usage
if grep -q "storage.local" "$EXT_DIR/background.js"; then
  log_pass "chrome.storage.local used for state persistence"
else
  log_warn "No storage.local usage - state won't persist across SW restarts"
fi

# Check for runtime.onMessage
if grep -q "runtime.onMessage" "$EXT_DIR/background.js"; then
  log_pass "runtime.onMessage listener present"
else
  log_fail "No runtime.onMessage listener - popup won't communicate with background"
fi

# Check for error handling
if grep -q "catch" "$EXT_DIR/background.js"; then
  log_pass "Error handling (try/catch) present"
else
  log_warn "No try/catch blocks found - errors may crash the service worker"
fi

# Check for API compatibility (browser vs chrome)
if grep -q "typeof browser" "$EXT_DIR/background.js"; then
  log_pass "Browser/Chrome API compatibility check present"
else
  log_warn "No browser/chrome compatibility check - may not work in Firefox"
fi

# Check for proxy bypass list
if grep -q "bypassList" "$EXT_DIR/background.js"; then
  log_pass "Proxy bypass list configured"
else
  log_info "No proxy bypass list - localhost may route through proxy"
fi

echo ""

# ── 4. POPUP UI AUDIT ──────────────────────────────────────
echo -e "${BOLD}[4/8] Auditing popup.html / popup.js / popup.css...${NC}"

# Check popup.js sends messages to background
if grep -q "sendMessage" "$EXT_DIR/popup.js"; then
  log_pass "popup.js communicates with background via messages"
else
  log_fail "popup.js doesn't send messages to background"
fi

# Check for all DOM elements referenced
for element in connectBtn statusText serverFlag serverName serverList premiumBadge; do
  if grep -q "'$element'" "$EXT_DIR/popup.js" || grep -q "\"$element\"" "$EXT_DIR/popup.js"; then
    log_pass "Element '$element' referenced in popup.js"
  else
    log_warn "Element '$element' not found in popup.js"
  fi
done

# Check popup.css dimensions
width=$(grep -oP 'width:\s*\K[0-9]+' "$EXT_DIR/popup.css" | head -1)
if [ -n "$width" ] && [ "$width" -ge 300 ] && [ "$width" -le 400 ]; then
  log_pass "Popup width is ${width}px (within 300-400 range)"
else
  log_warn "Popup width may be unusual: ${width:-unknown}px"
fi

# Check for innerHTML with user data (innerHTML = '' is safe, innerHTML with content is risky)
innerHTML_count=$(grep -c "innerHTML" "$EXT_DIR/popup.js" || true)
innerHTML_empty=$(grep -c "innerHTML = ''" "$EXT_DIR/popup.js" || true)
innerHTML_dynamic=$((innerHTML_count - innerHTML_empty))
if [ "$innerHTML_dynamic" -gt 0 ]; then
  log_warn "innerHTML used with dynamic content - potential XSS risk"
else
  log_pass "No innerHTML with dynamic content (safe DOM manipulation)"
fi

# Check for input sanitization
if grep -q "textContent" "$EXT_DIR/popup.js"; then
  log_pass "textContent used for safe text insertion"
fi

echo ""

# ── 5. OPTIONS PAGE AUDIT ──────────────────────────────────
echo -e "${BOLD}[5/8] Auditing options page...${NC}"

if grep -q "storage.local" "$EXT_DIR/options.js"; then
  log_pass "Options page reads/writes to storage"
else
  log_warn "Options page doesn't use storage"
fi

if grep -q "confirm(" "$EXT_DIR/options.js"; then
  log_pass "Destructive actions require user confirmation"
else
  log_warn "Destructive actions may not have confirmation dialogs"
fi

if grep -q "runtime.sendMessage" "$EXT_DIR/options.js"; then
  log_pass "Options page communicates with background"
else
  log_info "Options page doesn't send messages to background (may be OK)"
fi

echo ""

# ── 6. PROXY API COMPATIBILITY ─────────────────────────────
echo -e "${BOLD}[6/8] Checking proxy API compatibility...${NC}"

# Check Chrome MV3 proxy API format
if grep -q "singleProxy" "$EXT_DIR/background.js"; then
  log_pass "Chrome proxy config uses correct singleProxy format"
else
  log_fail "Chrome proxy config doesn't use singleProxy format"
fi

# Check for socks/http scheme
if grep -q "scheme:" "$EXT_DIR/background.js"; then
  log_pass "Proxy scheme (socks5/http) specified in config"
else
  log_fail "No proxy scheme specified"
fi

# Check for scope: regular
if grep -q "scope.*regular" "$EXT_DIR/background.js"; then
  log_pass "Proxy scope set to 'regular' (affects all tabs)"
else
  log_warn "Proxy scope may not be set to 'regular'"
fi

echo ""

# ── 7. SECURITY AUDIT ──────────────────────────────────────
echo -e "${BOLD}[7/8] Security audit...${NC}"

# Check for eval usage
if grep -q "eval(" "$EXT_DIR/background.js" || grep -q "eval(" "$EXT_DIR/popup.js" || grep -q "eval(" "$EXT_DIR/options.js"; then
  log_fail "eval() detected - security risk"
else
  log_pass "No eval() usage"
fi

# Check for innerHTML with user data
if grep -qP 'innerHTML.*\$\{' "$EXT_DIR/popup.js"; then
  log_warn "innerHTML with template literals - check for XSS"
else
  log_pass "No innerHTML with template interpolation detected"
fi

# Check for remote code loading
if grep -q "importScripts\|src=.*http" "$EXT_DIR/background.js" "$EXT_DIR/popup.js" "$EXT_DIR/popup.html"; then
  log_warn "Remote code loading detected - security risk"
else
  log_pass "No remote code loading"
fi

# Check CSP (if present in manifest)
if grep -q "content_security_policy" "$EXT_DIR/manifest.json"; then
  log_pass "content_security_policy declared in manifest"
else
  log_info "No custom CSP in manifest (uses default)"
fi

# Check permissions are minimal
perm_count=$(node -e "const m=JSON.parse(require('fs').readFileSync('$EXT_DIR/manifest.json','utf8')); console.log((m.permissions||[]).length + (m.host_permissions||[]).length)" 2>/dev/null || echo "?")
if [ "$perm_count" != "?" ]; then
  if [ "$perm_count" -le 6 ]; then
    log_pass "Permission count is minimal (${perm_count} total)"
  else
    log_warn "Permission count is high (${perm_count} total) - review if all needed"
  fi
fi

echo ""

# ── 8. CROSS-BROWSER COMPATIBILITY ─────────────────────────
echo -e "${BOLD}[8/8] Cross-browser compatibility...${NC}"

# Check both manifests exist and have same version
chrome_ver=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$EXT_DIR/manifest.json','utf8')).version)" 2>/dev/null || echo "?")
firefox_ver=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$EXT_DIR/manifest.firefox.json','utf8')).version)" 2>/dev/null || echo "?")

if [ "$chrome_ver" = "$firefox_ver" ]; then
  log_pass "Versions match: Chrome=${chrome_ver}, Firefox=${firefox_ver}"
else
  log_warn "Version mismatch: Chrome=${chrome_ver}, Firefox=${firefox_ver}"
fi

# Check browser compat in JS
if grep -q "typeof browser" "$EXT_DIR/popup.js" && grep -q "typeof browser" "$EXT_DIR/options.js"; then
  log_pass "browser/chrome compat check in all JS files"
else
  log_warn "Missing browser/chrome compat check in some JS files"
fi

echo ""

# ── SUMMARY ────────────────────────────────────────────────
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  Extension Audit Summary${NC}"
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
  echo -e "${GREEN}${BOLD}ALL CLEAR: Ready to build extension.${NC}"
  exit 0
fi
