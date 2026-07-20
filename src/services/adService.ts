import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  MobileAds,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { AD_CONFIG } from '../config/adConfig';

let initialized = false;

export async function initializeAds(): Promise<boolean> {
  if (initialized) return true;

  try {
    await MobileAds().initialize();

    await MobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.G,
      testDeviceIdentifiers: __DEV__
        ? ['EMULATOR']
        : ['c0f89e7f-e292-4738-a2b8-a84fa27d0657'],
    });

    initialized = true;
    return true;
  } catch (e) {
    console.warn('AdMob init failed:', e);
    return false;
  }
}

let rewardedInstance: RewardedAd | null = null;
let onRewardedLoaded: (() => void) | null = null;
let onRewardedEarned: (() => void) | null = null;
let onRewardedClosed: (() => void) | null = null;
let onRewardedError: ((error: any) => void) | null = null;

export function loadRewardedAd(callbacks: {
  onLoaded?: () => void;
  onEarned?: () => void;
  onClosed?: () => void;
  onError?: (error: any) => void;
}): () => void {
  onRewardedLoaded = callbacks.onLoaded || null;
  onRewardedEarned = callbacks.onEarned || null;
  onRewardedClosed = callbacks.onClosed || null;
  onRewardedError = callbacks.onError || null;

  const adUnitId = __DEV__
    ? TestIds.REWARDED
    : AD_CONFIG.admob.rewardedAdUnitId;

  rewardedInstance = RewardedAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly: false,
  });

  const unsubLoaded = rewardedInstance.addAdEventListener(
    RewardedAdEventType.LOADED,
    () => {
      onRewardedLoaded?.();
    }
  );

  const unsubEarned = rewardedInstance.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    () => {
      onRewardedEarned?.();
    }
  );

  const unsubClosed = rewardedInstance.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      onRewardedClosed?.();
      loadRewardedAd(callbacks);
    }
  );

  const unsubError = rewardedInstance.addAdEventListener(
    AdEventType.ERROR,
    (error) => {
      onRewardedError?.(error);
    }
  );

  rewardedInstance.load();

  return () => {
    unsubLoaded();
    unsubEarned();
    unsubClosed();
    unsubError();
  };
}

export function showRewardedAd(): boolean {
  if (!rewardedInstance) return false;
  rewardedInstance.show();
  return true;
}

export function isRewardedLoaded(): boolean {
  return rewardedInstance != null;
}

let interstitialInstance: InterstitialAd | null = null;

export function loadInterstitialAd(onClosed?: () => void) {
  const adUnitId = __DEV__
    ? TestIds.INTERSTITIAL
    : AD_CONFIG.admob.interstitialAdUnitId;

  interstitialInstance = InterstitialAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly: false,
  });

  interstitialInstance.addAdEventListener(
    AdEventType.LOADED,
    () => {}
  );

  interstitialInstance.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      onClosed?.();
      loadInterstitialAd(onClosed);
    }
  );

  interstitialInstance.load();
}

export function showInterstitialAd(): boolean {
  if (!interstitialInstance) return false;
  interstitialInstance.show();
  return true;
}
