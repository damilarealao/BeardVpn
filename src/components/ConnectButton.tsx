import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { VPNStatus } from '../types';

interface ConnectButtonProps {
  status: VPNStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

const CONTAINER_SIZE = 200;

export function ConnectButton({ status, onConnect, onDisconnect }: ConnectButtonProps) {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || status === 'disconnecting';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.2)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.2, duration: 1500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.2);
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnecting) {
      const spin = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      );
      spin.start();
      return () => { spin.stop(); spinAnim.setValue(0); };
    } else {
      spinAnim.setValue(0);
    }
  }, [isConnecting]);

  const handlePress = () => {
    if (isConnected) {
      onDisconnect();
    } else if (!isConnecting) {
      onConnect();
    }
  };

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const PowerIcon = ({ color }: { color: string }) => (
    <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 4,
        borderColor: color,
        borderTopColor: 'transparent',
      }} />
      <View style={{
        position: 'absolute',
        top: 2,
        width: 4,
        height: 18,
        backgroundColor: color,
        borderRadius: 2,
      }} />
    </View>
  );

  return (
    <View style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer Pulse Glow Background */}
      <Animated.View style={{
        position: 'absolute',
        width: CONTAINER_SIZE,
        height: CONTAINER_SIZE,
        borderRadius: CONTAINER_SIZE / 2,
        backgroundColor: isConnected ? '#22c55e' : isConnecting ? '#eab308' : '#3b82f6',
        opacity: isConnected ? glowAnim : 0.15,
        transform: [{ scale: pulseAnim }],
      }} />

      {/* 100% Clickable Full Outer Ring Pressable */}
      <Pressable
        onPress={handlePress}
        disabled={isConnecting}
        style={({ pressed }) => ({
          width: CONTAINER_SIZE,
          height: CONTAINER_SIZE,
          borderRadius: CONTAINER_SIZE / 2,
          borderWidth: 4,
          borderColor: isConnected ? '#22c55e' : isConnecting ? '#eab308' : '#3b82f6',
          backgroundColor: isConnected ? '#052e16' : isConnecting ? '#1c1917' : '#0f172a',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        {isConnecting ? (
          <>
            <Animated.View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              borderWidth: 4,
              borderColor: 'rgba(234, 179, 8, 0.2)',
              borderTopColor: '#facc15',
              borderRightColor: '#facc15',
              transform: [{ rotate: spinRotation }],
              marginBottom: 10,
            }} />
            <Text style={{
              color: '#facc15',
              fontWeight: '800',
              fontSize: 11,
              letterSpacing: 2,
            }}>
              {status === 'connecting' ? 'CONNECTING' : 'DISCONNECTING'}
            </Text>
          </>
        ) : isConnected ? (
          <>
            <PowerIcon color="#4ade80" />
            <Text style={{
              color: '#4ade80',
              fontWeight: '800',
              fontSize: 13,
              letterSpacing: 2.5,
              marginTop: 8,
            }}>
              DISCONNECT
            </Text>
          </>
        ) : (
          <>
            <PowerIcon color="#60a5fa" />
            <Text style={{
              color: '#60a5fa',
              fontWeight: '800',
              fontSize: 14,
              letterSpacing: 2.5,
              marginTop: 8,
            }}>
              CONNECT
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
