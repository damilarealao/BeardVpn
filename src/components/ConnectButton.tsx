import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { VPNStatus } from '../types';

interface ConnectButtonProps {
  status: VPNStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

const BUTTON_DIAMETER = 150;
const AURA_DIAMETER = 190;

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
          Animated.timing(glowAnim, { toValue: 0.5, duration: 1600, useNativeDriver: true }),
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

  const mainColor = isConnected ? '#22c55e' : isConnecting ? '#eab308' : '#3b82f6';
  const iconColor = isConnected ? '#4ade80' : isConnecting ? '#facc15' : '#60a5fa';
  const bgColor = isConnected ? '#052e16' : isConnecting ? '#1c1917' : '#0b1329';

  return (
    <View style={{ width: AURA_DIAMETER, height: AURA_DIAMETER, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
      {/* Soft Ambient Pulsing Aura (Touch Events Ignored via pointerEvents="none") */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: AURA_DIAMETER,
          height: AURA_DIAMETER,
          borderRadius: AURA_DIAMETER / 2,
          backgroundColor: mainColor,
          opacity: isConnected ? glowAnim : 0.12,
          transform: [{ scale: pulseAnim }],
        }}
      />

      {/* 100% Clickable Circular Button */}
      <Pressable
        onPress={handlePress}
        disabled={isConnecting}
        style={({ pressed }) => ({
          width: BUTTON_DIAMETER,
          height: BUTTON_DIAMETER,
          borderRadius: BUTTON_DIAMETER / 2,
          borderWidth: 4,
          borderColor: mainColor,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.94 : 1 }],
          shadowColor: mainColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 18,
          elevation: 14,
        })}
      >
        {isConnecting ? (
          <View style={{ alignItems: 'center' }}>
            <Animated.View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 3.5,
              borderColor: 'rgba(234, 179, 8, 0.2)',
              borderTopColor: '#facc15',
              borderRightColor: '#facc15',
              transform: [{ rotate: spinRotation }],
              marginBottom: 8,
            }} />
            <Text style={{ color: '#facc15', fontWeight: '800', fontSize: 10, letterSpacing: 1.5 }}>
              {status === 'connecting' ? 'CONNECTING' : 'STOPPING'}
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            {/* Custom Power Icon */}
            <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 3.5,
                borderColor: iconColor,
                borderTopColor: 'transparent',
              }} />
              <View style={{
                position: 'absolute',
                top: 3,
                width: 3.5,
                height: 15,
                backgroundColor: iconColor,
                borderRadius: 2,
              }} />
            </View>

            <Text style={{
              color: iconColor,
              fontWeight: '800',
              fontSize: 12,
              letterSpacing: 2,
            }}>
              {isConnected ? 'DISCONNECT' : 'CONNECT'}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
