import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { AD_CONFIG } from '../config/adConfig';

const adUnitId = __DEV__
  ? TestIds.BANNER
  : AD_CONFIG.admob.bannerAdUnitId;

interface AdBannerProps {
  size?: 'BANNER' | 'LARGE_BANNER' | 'FULL_BANNER' | 'MEDIUM_RECTANGLE';
}

export function AdBanner({ size = 'BANNER' }: AdBannerProps) {
  const adSize = {
    BANNER: BannerAdSize.BANNER,
    LARGE_BANNER: BannerAdSize.LARGE_BANNER,
    FULL_BANNER: BannerAdSize.FULL_BANNER,
    MEDIUM_RECTANGLE: BannerAdSize.MEDIUM_RECTANGLE,
  }[size];

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={adSize}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdLoaded={() => {}}
        onAdFailedToLoad={(error) => {
          console.warn('Banner ad failed:', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 4,
  },
});
