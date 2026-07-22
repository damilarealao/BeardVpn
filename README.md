# BeardVpn

Free VPN with premium servers. Browser extension (Chrome + Firefox) and Android APK.

## What's Inside

- **Android APK** — Native VPN via `VpnService` + real OpenVPN TCP client with TLS encryption (`SSLSocket`). Built with Expo SDK 52 + React Native 0.76.7 (React Native 0.86 metadata compatible).
- **Browser Extension** — Proxy-based VPN via SOCKS5/HTTP servers from ProxyScrape API. Chrome (Manifest V3) + Firefox (Manifest V2). Fully ad-free.
- **Server Backend** — VPNGate CSV parser with ranked server selection, country filtering, pull-to-refresh.

## Architecture

```
BeardVpn/
├── android/                    # Native Android (VPNService, OpenVPN client)
│   └── app/src/main/java/com/beardvpn/app/
│       ├── BeardVpnService.kt  # Foreground VPN service with TUN interface
│       ├── OpenVpnClient.kt    # Real OpenVPN TCP + TLS handshake via SSLSocket
│       ├── OvpnConfig.kt       # .ovpn config parser (remote, certs, routes)
│       ├── VPNModule.kt        # React Native bridge (connect/disconnect/events)
│       └── VPNPackage.kt       # React package registration
├── src/
│   ├── screens/                # HomeScreen, ServerListScreen, SettingsScreen
│   ├── components/             # ConnectButton, AdBanner, RewardedAdFlow, ServerCard
│   ├── hooks/                  # useVpn, useServers
│   ├── services/               # vpnService, adService, serverService, storageService
│   ├── config/                 # adConfig, constants
│   ├── navigation/             # AppNavigator (BottomTabs)
│   └── types/                  # TypeScript interfaces
├── browser-extension/          # Chrome + Firefox extension source
└── preview.html                # Interactive UI preview with live ad test
```

## Requirements & Prerequisites

- **Node.js**: `v18+` or `v20+`
- **Package Manager**: `npm`
- **Java Development Kit (JDK)**: Java 17
- **Android SDK & Build Tools**:
  - `compileSdkVersion`: 35 / `targetSdkVersion`: 35 / `minSdkVersion`: 24
  - **Android NDK**: `27.0.12077973`
  - **Kotlin Gradle Plugin**: `2.3.10` (required to resolve `play-services-ads` Kotlin metadata compatibility)

## Quick Start & Installation

### 1. Clone the repository
```bash
git clone git@github.com:damilarealao/BeardVpn.git
cd BeardVpn
```

### 2. Install dependencies
```bash
npm install
```

### 3. Build Android APK

```bash
# Clean & assemble release APK
cd android
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a --no-daemon

# Output location:
# android/app/build/outputs/apk/release/app-release.apk
```

### 4. Build Browser Extension

```bash
# Build for Chrome + Firefox
bash scripts/build-extension.sh --all

# Chrome: chrome://extensions/ → Developer mode → Load unpacked → dist/extension/chrome/
# Firefox: about:debugging → Load Temporary Add-on → dist/extension/firefox/manifest.json
```

## Key Features

### Android APK
- **Real VPN Tunnel**: OpenVPN TCP client with TLS 1.2 handshake via SSLSocket, TUN interface packet forwarding.
- **VPN Consent Handling**: Proper `startActivityForResult` + `ActivityEventListener` for Android VPN permission dialog.
- **Foreground Service**: `startForeground()` called immediately in `onStartCommand()`, notification shows connection status.
- **Google AdMob Integration**: `react-native-google-mobile-ads` (Banner ads on HomeScreen, Rewarded Video ads on VPN connect flow).
- **Freemium Model**: Top servers free, premium servers unlocked via rewarded ads.
- **DNS Selector**: Cloudflare, Google, OpenDNS, Quad9.
- **Kill Switch & Auto-Connect**: User-configurable toggles in Settings.

### Browser Extension
- **Ad-free**: All servers free, SOCKS5/HTTP proxy routing.
- **Proxy Validation**: Background script validates proxy connectivity before routing.

## License

MIT

