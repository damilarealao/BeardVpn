import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { VPNStatus } from '../types';

interface ConnectButtonProps {
  status: VPNStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

const BUTTON_SIZE = 170;
const GLOW_SIZE = 196;

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
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.6, duration: 1400, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.2, duration: 1400, useNativeDriver: true }),
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
    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
      {/* Outer circle with top gap */}
      <View style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 3.5,
        borderColor: color,
        borderTopColor: 'transparent',
      }} />
      {/* Vertical power line passing through top gap */}
      <View style={{
        position: 'absolute',
        top: 2,
        width: 3.5,
        height: 16,
        backgroundColor: color,
        borderRadius: 2,
      }} />
    </View>
  );

  if (isConnecting) {
    return (
      <View style={{ width: GLOW_SIZE, height: GLOW_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: BUTTON_SIZE / 2,
          borderWidth: 3,
          borderColor: '#eab308',
          backgroundColor: '#1c1917',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Animated.View style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 3.5,
            borderColor: 'rgba(234, 179, 8, 0.2)',
            borderTopColor: '#facc15',
            borderRightColor: '#facc15',
            transform: [{ rotate: spinRotation }],
            marginBottom: 10,
          }} />
          <Text style={{
            color: '#facc15',
            fontWeight: '800',
            fontSize: 12,
            letterSpacing: 1.5,
          }}>
            {status === 'connecting' ? 'CONNECTING' : 'DISCONNECTING'}
          </Text>
        </View>
      </View>
    );
  }

  if (isConnected) {
    return (
      <View style={{ width: GLOW_SIZE, height: GLOW_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{
          position: 'absolute',
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          borderRadius: GLOW_SIZE / 2,
          backgroundColor: '#22c55e',
          opacity: glowAnim,
          transform: [{ scale: pulseAnim }],
        }} />
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => ({
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: BUTTON_SIZE / 2,
            borderWidth: 3.5,
            borderColor: '#22c55e',
            backgroundColor: '#064e3b',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <PowerIcon color="#4ade80" />
          <Text style={{
            color: '#4ade80',
            fontWeight: '800',
            fontSize: 13,
            letterSpacing: 2,
          }}>
            DISCONNECT
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ width: GLOW_SIZE, height: GLOW_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        borderRadius: GLOW_SIZE / 2,
        backgroundColor: '#3b82f6',
        opacity: 0.15,
      }} />
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: BUTTON_SIZE / 2,
          borderWidth: 3.5,
          borderColor: '#3b82f6',
          backgroundColor: '#0c1e45',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        <PowerIcon color="#60a5fa" />
        <Text style={{
          color: '#60a5fa',
          fontWeight: '800',
          fontSize: 14,
          letterSpacing: 2,
        }}>
          CONNECT
        </Text>
      </Pressable>
    </View>
  );
}
