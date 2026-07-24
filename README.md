# BeardVpn 🛡️

A high-performance, open-relay VPN application built for Android and web browsers (Chrome + Firefox). Combines a native Android `VpnService` with OpenVPN TCP + TLS 1.2/1.3 encryption, AdMob monetization, real-time speed monitoring, and a sleek dark-mode UI.

---

## 🌟 Key Features

### 📱 Android Application
- **Native OpenVPN Engine**: Real OpenVPN TCP client with TLS handshake (`SSLSocket`), permissive SSL `TrustManager`, and high-throughput TUN interface packet forwarding.
- **Synchronized OS State**: Native teardown (`stopVpn()`) closes the system TUN interface and removes the status bar **Key 🔑 Icon** immediately upon disconnection or handshake timeout.
- **Hero Connect Interface**: 150px circular power button with 100% touch coverage, ambient pulsing aura glow ring, and live status badges (`● CONNECTED` / `● IDLE`).
- **Live Speed Stats**: Monospaced real-time download and upload traffic counters (`MB/s` / `KB/s`).
- **Comprehensive Settings**:
  - **DNS Resolver Selector**: Cloudflare (`1.1.1.1`), Google (`8.8.8.8`), OpenDNS (`208.67.222.222`), Quad9 (`9.9.9.9`).
  - **Protocol Config**: Switch between OpenVPN TCP (Reliable & Encrypted) and UDP (High Speed).
  - **App Preferences**: Auto-connect on launch, show/hide live speed stats, clear server cache.
- **Monetization Model**: Google AdMob Banner Ads + Rewarded Video Ads (`react-native-google-mobile-ads`) to unlock 30-minute premium server access.

### 🌐 Browser Extension (Chrome & Firefox)
- **Proxy-Based Routing**: Fast SOCKS5/HTTP proxy routing using validated open-relay server nodes.
- **Ad-Free Browsing**: One-tap proxy connection directly in Chrome (Manifest V3) and Firefox (Manifest V2).

---

## 🏗️ Architecture

```
BeardVpn/
├── android/                    # Native Android Codebase
│   └── app/src/main/java/com/beardvpn/app/
│       ├── BeardVpnService.kt  # Foreground VPN service managing TUN interface lifecycle
│       ├── OpenVpnClient.kt    # Native OpenVPN TCP client & SSLSocket TLS handshake
│       ├── OvpnConfig.kt       # OpenVPN .ovpn profile parser
│       ├── VPNModule.kt        # React Native bridge & broadcast event receiver
│       └── VPNPackage.kt       # React package registration
├── src/
│   ├── screens/                # HomeScreen, ServerListScreen, SettingsScreen
│   ├── components/             # ConnectButton, AdBanner, RewardedAdFlow, ServerCard
│   ├── hooks/                  # useVpn, useServers
│   ├── services/               # vpnService, adService, serverService, storageService
│   ├── config/                 # adConfig, constants
│   ├── navigation/             # AppNavigator (Bottom Tabs)
│   └── types/                  # TypeScript interfaces
├── browser-extension/          # Chrome + Firefox extension source
└── preview.html                # Standalone interactive browser preview
```

---

## 🛠️ Build Prerequisites

- **Node.js**: `v18+` or `v20+`
- **JDK**: Java 17
- **Android SDK & Build Tools**:
  - `compileSdkVersion`: 35 / `targetSdkVersion`: 35 / `minSdkVersion`: 24
  - **Android NDK**: `27.0.12077973`
  - **Kotlin Gradle Plugin**: `2.3.10`

---

## 🚀 Quick Start & Deployment

### 1. Installation
```bash
git clone git@github.com:damilarealao/BeardVpn.git
cd BeardVpn
npm install
```

### 2. Build Android Release APK
```bash
cd android
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a --no-daemon
```
> **Output Location**: `android/app/build/outputs/apk/release/app-release.apk`

### 3. Build Google Play Store App Bundle (`.aab`)
```bash
cd android
./gradlew bundleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a --no-daemon
```
> **Output Location**: `android/app/build/outputs/bundle/release/app-release.aab`

### 4. Build Browser Extension
```bash
bash scripts/build-extension.sh --all
```

---

## 📄 Privacy & License

- **Privacy Policy**: BeardVpn does not log, store, or sell user network traffic. All connection data is processed locally on-device.
- **License**: MIT
