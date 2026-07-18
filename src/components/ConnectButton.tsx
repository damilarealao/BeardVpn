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

  useEffect(() => {
    if (isConnected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isConnected]);

  const bgColor = isConnected ? '#22c55e' : isConnecting ? '#eab308' : '#1e40af';
  const glowColor = isConnected ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.3)';

  const handlePress = () => {
    if (isConnected) {
      onDisconnect();
    } else if (!isConnecting) {
      onConnect();
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          onPress={handlePress}
          disabled={isConnecting}
          style={({ pressed }) => ({
            width: 180,
            height: 180,
            borderRadius: 90,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bgColor,
            borderWidth: 4,
            borderColor: isConnected ? '#4ade80' : '#3b82f6',
            shadowColor: isConnected ? '#22c55e' : '#3b82f6',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 24,
            elevation: 12,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isConnecting ? (
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 4,
                borderColor: '#ffffff',
                borderTopColor: 'transparent',
              }} />
            ) : (
              <Text style={{ fontSize: 32, color: '#ffffff' }}>
                {isConnected ? '\u25A0' : '\u25B6'}
              </Text>
            )}
          </View>
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18, marginTop: 12 }}>
            {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Connect'}
          </Text>
        </Pressable>
      </Animated.View>

      {isConnected && (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginBottom: 4 }} />
          <Text style={{ color: '#4ade80', fontSize: 13, fontWeight: '600' }}>Secure connection active</Text>
        </View>
      )}
    </View>
  );
}
