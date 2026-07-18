# BeardVpn

Free VPN with premium servers. Browser extension (Chrome + Firefox) and Android APK.

## What's Inside

- **Browser Extension** — Proxy-based VPN via SOCKS5/HTTP servers. Chrome (Manifest V3) + Firefox (Manifest V2)
- **Android APK** — Native VPN via `VpnService` + OpenVPN. Built with Expo SDK 57
- **Server Backend** — VPNGate CSV parser, ProxyScrape API, ip-api.com geolocation

## Project Structure

```
BeardVpn/
├── browser-extension/    # Chrome + Firefox extension source
├── src/                  # React Native app (Expo)
├── android/              # Native Android (VPNService, VPNModule)
├── scripts/              # Audit + build scripts
├── dist/                 # Built extension output
└── assets/               # App icons
```

## Quick Start

### Browser Extension

```bash
# Build for Chrome + Firefox
bash scripts/build-extension.sh --all

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select: dist/extension/chrome/

# Load in Firefox
# 1. Go to about:debugging#/runtime/this-firefox
# 2. Click "Load Temporary Add-on"
# 3. Select: dist/extension/firefox/manifest.json
```

### Android APK

```bash
# Install dependencies
npm install

# Generate native Android project
npx expo prebuild

# Build APK
cd android && ./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Audit Scripts

```bash
# Run all checks
bash scripts/check.sh

# Extension audit only (42 checks)
bash scripts/check-extension.sh

# Android audit only (67 checks)
bash scripts/check-android.sh
```

## Features

- **Freemium model** — 3 servers free, premium behind ad unlock (30 min)
- **Country detection** — Real country names via ip-api.com batch API
- **Proxy validation** — Filters ad-injecting proxies, SOCKS5 prioritized
- **Your own ads** — Custom ad banner slots (paste your HTML in Settings)
- **Dark theme** — Full dark UI across all screens

## Ad Monetization

- **Chrome Extension** — PlayaYield SDK (Chrome Web Store compliant)
- **Firefox Extension** — Custom ad slots (Settings → Ad Configuration)
- **Android APK** — Monetag/PropellerAds interstitials

## Tech Stack

- Expo SDK 57 + React Native 0.86
- NativeWind (Tailwind CSS for RN)
- React Navigation
- TypeScript
- Chrome Extensions Manifest V3
- Firefox Extensions Manifest V2
- Kotlin (Android native modules)

## License

MIT
