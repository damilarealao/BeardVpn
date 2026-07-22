# BeardVpn Build Audit - July 22, 2026

## GitHub Repo: https://github.com/damilarealao/BeardVpn
## Local Project: /home/xoodrey/Desktop/BeardVpn

---

## 1. ENVIRONMENT

- **React Native**: 0.86.0 (Expo SDK 57)
- **Node.js**: >= 18 required
- **Gradle**: 9.3.1
- **Kotlin**: 2.1.20 (from RN version catalog) — **CONFLICTS with play-services-ads:25.4.0**
- **NDK**: 27.0.12077973 (working), 28.2.13676358 (available)
- **Broken NDK**: 27.1.12297006 was EMPTY (.installer dir only) — DELETED
- **ANDROID_HOME**: /home/xoodrey/Android/Sdk
- **JAVA_HOME**: /usr/lib/jvm/java-21-openjdk-amd64

---

## 2. CRITICAL BUILD BLOCKER

### Kotlin Version Mismatch
- RN 0.86 version catalog sets `kotlin = "2.1.20"`
- `react-native-google-mobile-ads@16.4.0` depends on `play-services-ads:25.4.0`
- `play-services-ads:25.4.0` compiled with Kotlin 2.3.0 metadata
- Kotlin 2.1.20 compiler CANNOT read 2.3.0 metadata → **BUILD FAILS**

### Error:
```
Module was compiled with an incompatible version of Kotlin.
The binary version of its metadata is 2.3.0, expected version is 2.1.0.
```

### Solution
- We sed'd `node_modules/react-native/gradle/libs.versions.toml` to `kotlin = "2.3.10"`
- But Gradle cached the old resolution → must clean `.gradle/` cache
- The TOML file gets overwritten on `npm install` — not persistent

---

## 3. GITHUB vs LOCAL FILE DIFFERENCES

### CRITICAL BUGS (build-breaking)

| File | Issue | Fix |
|------|-------|-----|
| MainApplication.kt:25 | Local: `VpnPackage()` (wrong case) | Must be `VPNPackage()` |
| gradle.properties | Missing `workers.max=1`, has `parallel=true` | Match GitHub |
| libs.versions.toml | kotlin=2.1.20 (old cache) | Must be 2.3.10 |

### GRADLE CONFIG (GitHub baseline)

**android/build.gradle** (GitHub):
- NO ext block, NO ndkVersion override
- Expo-root-project plugin handles everything via version catalog

**android/gradle.properties** (GitHub):
```
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=false
org.gradle.workers.max=1
reactNativeArchitectures=armeabi-v7a
newArchEnabled=true
hermesEnabled=true
```

**android/app/build.gradle** (GitHub):
- Release uses `signingConfigs.debug` (not release keystore)
- NO abiFilters override
- NO localbroadcastmanager dependency
- NO proguard-rules.pro custom rules (just reanimated + empty section)

**android/settings.gradle**: IDENTICAL to GitHub

### LOCAL IMPROVEMENTS (keep these)

| File | Change | Reason |
|------|--------|--------|
| app/build.gradle | Release signing with release.keystore | Production signing |
| app/build.gradle | abiFilters armeabi-v7a + arm64-v8a | Target arch |
| app/build.gradle | localbroadcastmanager dep | VPN event broadcasts |
| proguard-rules.pro | VPN class keep rules + AdMob | Prevent stripping |
| AndroidManifest.xml | allowBackup=false | Security |
| AndroidManifest.xml | com.google.android.gms.ads.APPLICATION_ID | AdMob init |
| app.json | expo-build-properties plugin | SDK 36 |
| build.gradle | ext { ndkVersion = "27.0.12077973" } | Fix NDK mismatch |

### LOCAL CODE IMPROVEMENTS (keep these)

All TypeScript source changes are improvements over GitHub:
- Kill switch always-on (hardcoded in native)
- Ad flow: timeout, error handling, reward tracking
- Server switch via ad
- Pull-to-refresh
- Better UI states
- Race condition fix in useServers.ts
- Dead code removal

---

## 4. GITHUB FILE CONTENTS (Reference)

### package.json dependencies
```json
{
  "react": "19.2.3",
  "react-native": "0.86.0",
  "expo": "~57.0.6",
  "react-native-google-mobile-ads": "^16.4.0",
  "nativewind": "^4.2.6",
  "react-native-safe-area-context": "~5.7.0",
  "react-native-screens": "4.25.2",
  "@react-navigation/native": "^7.3.7",
  "@react-navigation/bottom-tabs": "^7.18.7",
  "@react-navigation/native-stack": "^7.17.9",
  "@react-native-async-storage/async-storage": "2.2.0",
  "react-native-web": "^0.21.2",
  "react-native-webview": "^14.0.1",
  "tailwindcss": "^3.4.19"
}
```

### app.json plugins (GitHub)
```json
"plugins": [
  ["react-native-google-mobile-ads", {"androidAppId": "ca-app-pub-8194810458712293~2696147769"}]
]
```

### Network Security Config (identical in both)
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">vpngate.net</domain>
        <domain includeSubdomains="true">www.vpngate.net</domain>
    </domain-config>
</network-security-config>
```

---

## 5. BUILD SCRIPT

**Script**: `scripts/test-and-build.sh --skip-tests --arch armeabi-v7a`

The script:
1. Checks system deps, NDK, node_modules (skipped with --skip-tests)
2. Runs `./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a --no-daemon`
3. Finds APK in `android/app/build/outputs/apk/`
4. Logs to `build-errors.log`

---

## 6. SIGNING

- **Keystore**: `android/app/release.keystore`
- **Alias**: beardvpn
- **Password**: beardvpn123
- **NOT on GitHub** — local only

---

## 7. AdMob IDs

| Type | ID |
|------|-----|
| App ID | ca-app-pub-8194810458712293~2696147769 |
| Banner | ca-app-pub-8194810458712293/8251726779 |
| Rewarded | ca-app-pub-8194810458712293/7114170853 |
| Interstitial | ca-app-pub-8194810458712293/3494490040 |

---

## 8. FIX PLAN (in order)

1. Fix MainApplication.kt: `VpnPackage()` → `VPNPackage()`
2. Restore gradle.properties to match GitHub + keep SDK overrides
3. Clean Gradle cache: `rm -rf android/.gradle && ./gradlew --stop`
4. Clean Kotlin cache: `rm -rf android/build/ android/app/build/`
5. Verify kotlin=2.3.10 in libs.versions.toml
6. Run build: `bash scripts/test-and-build.sh --skip-tests --arch armeabi-v7a`

---

## 9. FILES NOT ON GITHUB (local additions)

| File | Purpose |
|------|---------|
| android/app/release.keystore | Release signing key |
| android/app/proguard-rules.pro | VPN + AdMob keep rules |
| android/app/src/main/res/xml/network_security_config.xml | vpngate HTTP |
| plugins/ | Empty dir |
| src/utils/ | Empty dir |

All Kotlin native files (VPNModule.kt, BeardVpnService.kt, OpenVpnClient.kt, OvpnConfig.kt, VPNPackage.kt) are IDENTICAL between GitHub and local.
