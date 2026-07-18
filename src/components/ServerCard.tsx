import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { VPNServer } from '../types';
import { formatSpeed, formatPing } from '../services/serverService';
import { COUNTRY_FLAGS } from '../config/constants';

interface ServerCardProps {
  server: VPNServer;
  isSelected: boolean;
  onSelect: (server: VPNServer) => void;
}

export function ServerCard({ server, isSelected, onSelect }: ServerCardProps) {
  const flag = COUNTRY_FLAGS[server.countryShort] || '\u{1F310}';
  const speedMbps = (server.speed * 8) / (1024 * 1024);

  const speedColor =
    speedMbps >= 100 ? 'text-connected' : speedMbps >= 10 ? 'text-yellow-400' : 'text-red-400';

  const pingColor =
    server.ping < 50 ? 'text-connected' : server.ping < 150 ? 'text-yellow-400' : 'text-red-400';

  return (
    <Pressable
      onPress={() => onSelect(server)}
      className={`flex-row items-center p-4 mx-4 mb-2 rounded-xl border ${
        isSelected
          ? 'bg-vpn-800/80 border-vpn-500'
          : 'bg-vpn-900/50 border-vpn-800/50'
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <Text className="text-2xl mr-3">{flag}</Text>

      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-white font-semibold text-base">{server.countryLong}</Text>
          {server.isFree && (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-connected/20">
              <Text className="text-connected text-xs font-bold">FREE</Text>
            </View>
          )}
          {!server.isFree && (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-vpn-500/20">
              <Text className="text-vpn-300 text-xs font-bold">PRO</Text>
            </View>
          )}
        </View>
        <Text className="text-gray-400 text-xs mt-1">
          {server.hostName} &bull; {server.operator || 'Unknown'}
        </Text>
      </View>

      <View className="items-end">
        <Text className={`text-sm font-mono ${speedColor}`}>
          {formatSpeed(server.speed)}
        </Text>
        <Text className={`text-xs font-mono ${pingColor}`}>
          {formatPing(server.ping)}
        </Text>
      </View>

      {isSelected && (
        <View className="ml-3 w-3 h-3 rounded-full bg-vpn-500" />
      )}
    </Pressable>
  );
}
