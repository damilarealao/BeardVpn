import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { VPNStatus } from '../types';

interface ConnectButtonProps {
  status: VPNStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

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
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.6, duration: 1600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.2, duration: 1600, useNativeDriver: true }),
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

  if (isConnecting) {
    return (
      <View style={{ width: 210, height: 210, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 170,
          height: 170,
          borderRadius: 85,
          borderWidth: 3,
          borderColor: 'rgba(234, 179, 8, 0.5)',
          backgroundColor: '#1c1917',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
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
        </View>
      </View>
    );
  }

  if (isConnected) {
    return (
      <View style={{ width: 210, height: 210, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: '#22c55e',
          opacity: glowAnim,
          transform: [{ scale: pulseAnim }],
        }} />
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => ({
            width: 170,
            height: 170,
            borderRadius: 85,
            borderWidth: 3.5,
            borderColor: '#22c55e',
            backgroundColor: '#052e16',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <PowerIcon color="#4ade80" />
          <Text style={{
            color: '#4ade80',
            fontWeight: '800',
            fontSize: 12,
            letterSpacing: 2,
            marginTop: 6,
          }}>
            DISCONNECT
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ width: 210, height: 210, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: 190,
        height: 190,
        borderRadius: 95,
        borderWidth: 2,
        borderColor: 'rgba(59, 130, 246, 0.25)',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
      }} />
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          width: 165,
          height: 165,
          borderRadius: 82.5,
          borderWidth: 3.5,
          borderColor: '#3b82f6',
          backgroundColor: '#0f172a',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        <PowerIcon color="#60a5fa" />
        <Text style={{
          color: '#60a5fa',
          fontWeight: '800',
          fontSize: 13,
          letterSpacing: 2.5,
          marginTop: 6,
        }}>
          CONNECT
        </Text>
      </Pressable>
    </View>
  );
}
