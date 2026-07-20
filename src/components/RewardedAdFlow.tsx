import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { loadRewardedAd, showRewardedAd } from '../services/adService';
import { AD_CONFIG } from '../config/adConfig';

interface RewardedAdFlowProps {
  visible: boolean;
  onClose: () => void;
}

export function RewardedAdFlow({ visible, onClose }: RewardedAdFlowProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [countdown, setCountdown] = useState(AD_CONFIG.closeDelaySeconds);
  const [rewardEarned, setRewardEarned] = useState(false);
  const onCloseRef = useRef(onClose);
  const closedRef = useRef(false);
  onCloseRef.current = onClose;

  useEffect(() => {
    closedRef.current = false;
  }, [visible]);

  const safeClose = useRef(() => {
    if (!closedRef.current) {
      closedRef.current = true;
      onCloseRef.current();
    }
  });

  useEffect(() => {
    if (!visible) {
      setAdLoaded(false);
      setCountdown(AD_CONFIG.closeDelaySeconds);
      setRewardEarned(false);
      closedRef.current = false;
      return;
    }

    setCountdown(AD_CONFIG.closeDelaySeconds);
    setRewardEarned(false);

    const unsub = loadRewardedAd({
      onLoaded: () => setAdLoaded(true),
      onEarned: () => setRewardEarned(true),
      onClosed: () => safeClose.current(),
      onError: () => safeClose.current(),
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || !adLoaded) return;

    showRewardedAd();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, adLoaded]);

  useEffect(() => {
    if (countdown === 0 && rewardEarned) {
      const timer = setTimeout(() => safeClose.current(), 500);
      return () => clearTimeout(timer);
    }
  }, [countdown, rewardEarned]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {!adLoaded ? (
          <View style={styles.loadingBox}>
            <View style={styles.spinner} />
            <Text style={styles.loadingText}>Loading ad...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {rewardEarned ? (
              <>
                <Text style={styles.checkmark}>{'\u2713'}</Text>
                <Text style={styles.earnedText}>Premium unlocked!</Text>
                <Text style={styles.subText}>Connecting to VPN...</Text>
              </>
            ) : (
              <>
                <View style={styles.timerCircle}>
                  <Text style={styles.timerText}>{countdown}</Text>
                </View>
                <Text style={styles.watchText}>Watch the ad to connect</Text>
                <Text style={styles.subText}>Premium access for 30 minutes</Text>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  container: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  loadingBox: {
    alignItems: 'center',
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(59,130,246,0.2)',
    borderTopColor: '#3b82f6',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#facc15',
    backgroundColor: 'rgba(250,204,21,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: '#facc15',
    fontSize: 32,
    fontWeight: '800',
  },
  watchText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  subText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  checkmark: {
    fontSize: 48,
    color: '#4ade80',
  },
  earnedText: {
    color: '#4ade80',
    fontSize: 18,
    fontWeight: '700',
  },
});
