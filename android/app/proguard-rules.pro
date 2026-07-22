# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:
-keep class com.beardvpn.app.VPNModule { *; }
-keep class com.beardvpn.app.VPNPackage { *; }
-keep class com.beardvpn.app.BeardVpnService { *; }
-keep class com.beardvpn.app.OpenVpnClient { *; }
-keep class com.beardvpn.app.OvpnConfig { *; }
-keep class com.google.android.gms.ads.** { *; }
-keep class com.facebook.react.bridge.** { *; }
