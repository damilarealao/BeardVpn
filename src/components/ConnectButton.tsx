import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { VPNStatus } from '../types';

interface ConnectButtonProps {
  status: VPNStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectButton({ status, onConnect, onDisconnect }: ConnectButtonProps) {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || status === 'disconnecting';
  const isTransitioning = status === 'disconnecting';

  const bgColor = isConnected
    ? 'bg-connected'
    : isConnecting
    ? 'bg-yellow-500'
    : 'bg-vpn-800';

  const borderColor = isConnected
    ? 'border-connected/50'
    : isConnecting
    ? 'border-yellow-500/50'
    : 'border-vpn-600/50';

  const label = isConnected
    ? 'Connected'
    : isTransitioning
    ? 'Disconnecting...'
    : isConnecting
    ? 'Connecting...'
    : 'Connect';

  const handlePress = () => {
    if (isConnected || isTransitioning) {
      onDisconnect();
    } else if (!isConnecting) {
      onConnect();
    }
  };

  return (
    <View className="items-center justify-center">
      <Pressable
        onPress={handlePress}
        disabled={isConnecting}
        className={`w-44 h-44 rounded-full items-center justify-center border-4 ${bgColor} ${borderColor}`}
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          shadowColor: isConnected ? '#22c55e' : '#3b82f6',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isConnected ? 0.4 : 0.2,
          shadowRadius: 20,
          elevation: 10,
        })}
      >
        <View className="items-center">
          {isConnecting && (
            <View
              className="w-16 h-16 rounded-full border-4 border-yellow-300 border-t-transparent mb-2"
              style={{
                transform: [{ rotate: '0deg' }],
              }}
            />
          )}
          {!isConnecting && (
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${
                isConnected ? 'bg-white/20' : 'bg-white/10'
              }`}
            >
              <Text className="text-3xl">{isConnected ? '\u{25A0}' : '\u{25B6}'}</Text>
            </View>
          )}
          <Text className="text-white font-bold text-lg">{label}</Text>
        </View>
      </Pressable>

      {isConnected && (
        <View className="mt-4 items-center">
          <View className="w-2 h-2 rounded-full bg-connected mb-1" />
          <Text className="text-connected text-sm font-medium">Secure connection active</Text>
        </View>
      )}
    </View>
  );
}
