import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { VPNStatus } from '../types';

interface ConnectButtonProps {
  status: VPNStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

const OUTER = 200;
const RING = 10;
const INNER = OUTER - RING * 2;

export function ConnectButton({ status, onConnect, onDisconnect }: ConnectButtonProps) {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || status === 'disconnecting';
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const idleGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnected) {
      idleGlowAnim.setValue(0);
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected && !isConnecting) {
      const idle = Animated.loop(
        Animated.sequence([
          Animated.timing(idleGlowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
          Animated.timing(idleGlowAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
        ])
      );
      idle.start();
      return () => idle.stop();
    } else {
      idleGlowAnim.setValue(0);
    }
  }, [isConnected, isConnecting]);

  useEffect(() => {
    if (isConnecting) {
      const spin = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
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

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.45],
  });

  const idleGlowOpacity = idleGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  const activeGlowOpacity = isConnected ? glowOpacity : idleGlowOpacity;

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const PowerIcon = ({ color }: { color: string }) => (
    <View style={{ marginTop: -2 }}>
      <View style={{
        width: 36,
        height: 36,
        borderWidth: 3.5,
        borderColor: color,
        borderRadius: 18,
        borderBottomColor: 'transparent',
        alignItems: 'center',
      }}>
        <View style={{
          width: 3.5,
          height: 16,
          backgroundColor: color,
          borderRadius: 2,
          marginTop: -1,
        }} />
      </View>
    </View>
  );

  if (isConnecting) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: OUTER,
          height: OUTER,
          borderRadius: OUTER / 2,
          borderWidth: 3,
          borderColor: '#b45309',
          backgroundColor: '#1c1917',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Animated.View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            borderWidth: 4,
            borderColor: 'rgba(250,204,21,0.2)',
            borderTopColor: '#facc15',
            borderRightColor: '#facc15',
            transform: [{ rotate: spinRotation }],
            marginBottom: 10,
          }} />
          <Text style={{
            color: '#facc15',
            fontWeight: '800',
            fontSize: 13,
            letterSpacing: 2,
          }}>
            {status === 'connecting' ? 'CONNECTING' : 'DISCONNECTING'}
          </Text>
        </View>
      </View>
    );
  }

  if (isConnected) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{
          position: 'absolute',
          width: OUTER + 20,
          height: OUTER + 20,
          borderRadius: (OUTER + 20) / 2,
          backgroundColor: '#22c55e',
          opacity: activeGlowOpacity,
          transform: [{ scale: pulseAnim }],
        }} />
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => ({
            width: OUTER,
            height: OUTER,
            borderRadius: OUTER / 2,
            borderWidth: 3,
            borderColor: '#22c55e',
            backgroundColor: '#052e16',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.95 : 1 }],
            shadowColor: '#22c55e',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 24,
            elevation: 20,
          })}
        >
          <PowerIcon color="#4ade80" />
          <Text style={{
            color: '#4ade80',
            fontWeight: '800',
            fontSize: 14,
            marginTop: 10,
            letterSpacing: 2,
          }}>
            CONNECTED
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: OUTER + 20,
        height: OUTER + 20,
        borderRadius: (OUTER + 20) / 2,
        backgroundColor: '#2563eb',
        opacity: activeGlowOpacity,
      }} />
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          width: OUTER,
          height: OUTER,
          borderRadius: OUTER / 2,
          borderWidth: 3,
          borderColor: '#3b82f6',
          backgroundColor: '#0c1a3d',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.95 : 1 }],
          shadowColor: '#3b82f6',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 12,
        })}
      >
        <PowerIcon color="#60a5fa" />
        <Text style={{
          color: '#60a5fa',
          fontWeight: '800',
          fontSize: 14,
          marginTop: 10,
          letterSpacing: 2,
        }}>
          CONNECT
        </Text>
      </Pressable>
    </View>
  );
}
