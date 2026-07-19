# BeardVpn

Free VPN with premium servers. Browser extension (Chrome + Firefox) and Android APK.

## What's Inside

- **Android APK** — Native VPN via `VpnService` + real OpenVPN TCP client with TLS encryption (SSLSocket). Built with Expo SDK 57 + React Native 0.86
- **Browser Extension** — Proxy-based VPN via SOCKS5/HTTP servers from ProxyScrape API. Chrome (Manifest V3) + Firefox (Manifest V2). Fully ad-free (serves as funnel to APK)
- **Server Backend** — VPNGate CSV parser with ranked server selection, country filtering, pull-to-refresh

## Architecture

```
BeardVpn/
├── android/                    # Native Android (VPNService, OpenVPN client)
│   └── app/src/main/java/com/beardvpn/app/
│       ├── BeardVpnService.kt  # Foreground VPN service with TUN interface
│       ├── OpenVpnClient.kt    # Real OpenVPN TCP + TLS handshake via SSLSocket
│       ├── OvpnConfig.kt       # .ovpn config parser (remote, certs, routes)
│       ├── VPNModule.kt        # React Native bridge (connect/disconnect/events)
│       ├── VPNPackage.kt       # React package registration
│       ├── MainApplication.kt  # App entry, registers native modules
│       └── MainActivity.kt     # Activity with expo-splash-screen
├── src/
│   ├── screens/                # HomeScreen, ServerListScreen, SettingsScreen
│   ├── components/             # ConnectButton, MonetagAd, ServerCard
│   ├── hooks/                  # useVpn, useServers
│   ├── services/               # vpnService, serverService, storageService
│   ├── config/                 # adConfig, constants
│   ├── navigation/             # AppNavigator (BottomTabs)
│   └── types/                  # TypeScript interfaces
├── browser-extension/          # Chrome + Firefox extension source
├── scripts/                    # test-and-build.sh (143 checks + APK build)
├── preview.html                # Interactive UI preview with live ad test
└── assets/                     # Viking shield logo, splash screen
```

## Quick Start

### Browser Extension

```bash
# Build for Chrome + Firefox
bash scripts/build-extension.sh --all

# Chrome: chrome://extensions/ → Developer mode → Load unpacked → dist/extension/chrome/
# Firefox: about:debugging → Load Temporary Add-on → dist/extension/firefox/manifest.json
```

### Android APK

```bash
npm install
npx expo prebuild

# Full test suite (143 checks) + build
bash scripts/test-and-build.sh

# Or just build
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a --no-daemon
# Output: android/app/build/outputs/apk/release/app-release.apk (~26MB)
```

## Features

### Android APK
- **Real VPN tunnel** — OpenVPN TCP client with TLS 1.2 handshake via SSLSocket, TUN interface packet forwarding
- **VPN consent** — Proper `startActivityForResult` + `ActivityEventListener` for Android VPN permission dialog
- **Foreground service** — `startForeground()` called immediately in `onStartCommand()`, notification shows connection status
- **Rewarded ads** — Monetag interstitial (zone `260947`) shows before connect, 5s countdown, auto-closes, 60s cooldown
- **Freemium model** — Top 5 servers free, rest behind ad unlock (30 min premium)
- **DNS selector** — Cloudflare, Google, OpenDNS, Quad9
- **Kill Switch / Auto-Connect** — User-configurable toggles in Settings

### Browser Extension
- **Ad-free** — No Monetag, no premium dialog, no ad injection. All servers free
- **SOCKS5/HTTP proxy** — Filters ad-injecting proxies, SOCKS5 prioritized
- **Proxy validation** — Background script validates proxy connectivity before routing

### UI
- **Dark theme** — Consistent dark navy (`#0a0f1e`) across all screens
- **Viking shield logo** — Your actual logo, no fake shields or padlocks
- **Animated connect button** — Power icon with glow ring, pulse animation (native driver), spinning loader
- **SafeArea** — Proper insets on all screens, dynamic tab bar padding
- **Pull-to-refresh** — Server list refreshes from VPNGate API

## Tech Stack

- Expo SDK 57 + React Native 0.86
- NativeWind v4.2.6 (Tailwind CSS for RN)
- React Navigation 7 (Bottom Tabs)
- TypeScript (strict mode, 0 errors)
- Chrome Extensions Manifest V3 / Firefox Manifest V2
- Kotlin (Android native modules)
- OpenVPN TCP + TLS via SSLSocket
- Monetag (PropellerAds) interstitial ads

## Audit & Testing

```bash
# Full test suite: 143 checks across 15 categories
bash scripts/test-and-build.sh

# Tests cover:
# T1:  System Dependencies (node, java, adb, NDK)
# T2:  NDK Health (valid source.properties)
# T3:  npm Dependencies (all packages present)
# T4:  NativeWind v4 Setup (CSS, metro, babel)
# T5:  SafeArea Setup (all screens use insets)
# T6:  Source Files (all TS/TSX exist)
# T7:  Android Native Files (Kotlin sources)
# T8:  AndroidManifest (permissions, services, network config)
# T9:  VPN Module Integration (bridge, events, methods)
# T10: Ad Integration (Monetag zones, WebView)
# T11: UI Design Validation (dark theme, no white backgrounds)
# T12: TypeScript (zero errors)
# T13: Gradle Properties (arch, new arch, Hermes)
# T14: Network Security (cleartext for vpngate.net)
# T15: Browser Extension (ad-free validation)
```

## Privacy

We do not log, store, or sell any user data. All connection data is processed locally on your device.

## License

MIT
