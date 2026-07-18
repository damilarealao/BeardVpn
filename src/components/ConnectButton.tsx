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
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: false }),
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

  const ringColor = isConnected ? '#22c55e' : isConnecting ? '#eab308' : '#2563eb';
  const bgColor = isConnected ? '#052e16' : isConnecting ? '#1c1917' : '#0c1a3d';
  const iconColor = isConnected ? '#4ade80' : isConnecting ? '#facc15' : '#60a5fa';

  const handlePress = () => {
    if (isConnected) {
      onDisconnect();
    } else if (!isConnecting) {
      onConnect();
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow ring */}
      <Animated.View style={{
        position: 'absolute',
        width: 210,
        height: 210,
        borderRadius: 105,
        backgroundColor: ringColor,
        opacity: glowOpacity,
        transform: [{ scale: pulseAnim }],
      }} />

      {/* Outer ring border */}
      <Animated.View style={{
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 3,
        borderColor: ringColor,
        transform: [{ scale: pulseAnim }],
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        shadowColor: ringColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 16,
      }}>
        {/* Inner circle */}
        <Pressable
          onPress={handlePress}
          disabled={isConnecting}
          style={({ pressed }) => ({
            width: 160,
            height: 160,
            borderRadius: 80,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {isConnecting ? (
            <View style={{ alignItems: 'center', gap: 8 }}>
              {/* Spinning loader */}
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                borderWidth: 4,
                borderColor: 'rgba(250,204,21,0.2)',
                borderTopColor: '#facc15',
              }} />
              <Text style={{ color: '#facc15', fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>
                CONNECTING
              </Text>
            </View>
          ) : (
            <>
              {/* Power icon SVG */}
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: isConnected ? 'rgba(74,222,128,0.15)' : 'rgba(96,165,250,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <View style={{ marginTop: -2 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderWidth: 3.5,
                    borderColor: iconColor,
                    borderRadius: 18,
                    borderBottomColor: 'transparent',
                    alignItems: 'center',
                  }}>
                    <View style={{
                      width: 3.5,
                      height: 16,
                      backgroundColor: iconColor,
                      borderRadius: 2,
                      marginTop: -1,
                    }} />
                  </View>
                </View>
              </View>
              <Text style={{
                color: iconColor,
                fontWeight: '800',
                fontSize: 14,
                marginTop: 10,
                letterSpacing: 1.5,
              }}>
                {isConnected ? 'CONNECTED' : 'CONNECT'}
              </Text>
            </>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}
