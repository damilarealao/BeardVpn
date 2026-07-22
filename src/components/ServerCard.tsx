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

  const speedColor = speedMbps >= 100 ? '#4ade80' : speedMbps >= 10 ? '#facc15' : '#f87171';
  const pingColor = server.ping < 50 ? '#4ade80' : server.ping < 150 ? '#facc15' : '#f87171';

  return (
    <Pressable
      onPress={() => onSelect(server)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 8,
        borderRadius: 14,
        borderWidth: 1,
        backgroundColor: isSelected ? 'rgba(30,58,138,0.45)' : '#162032',
        borderColor: isSelected ? '#3b82f6' : '#26334d',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {/* Country Flag */}
      <Text style={{ fontSize: 24, width: 32, textAlign: 'center', marginRight: 10 }}>
        {flag}
      </Text>

      {/* Country Name & Info */}
      <View style={{ flex: 1, justifyContent: 'center', paddingRight: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            numberOfLines={1}
            style={{ color: '#f1f5f9', fontSize: 15, fontWeight: '600', flexShrink: 1 }}
          >
            {server.countryLong}
          </Text>
          {server.isFree ? (
            <View style={{ marginLeft: 6, backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ color: '#4ade80', fontSize: 10, fontWeight: '700' }}>FREE</Text>
            </View>
          ) : (
            <View style={{ marginLeft: 6, backgroundColor: 'rgba(139,92,246,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ color: '#a78bfa', fontSize: 10, fontWeight: '700' }}>PRO</Text>
            </View>
          )}
        </View>
        <Text
          numberOfLines={1}
          style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}
        >
          {server.hostName} • {server.operator || 'VPNGate'}
        </Text>
      </View>

      {/* Speed & Ping Stats */}
      <View style={{ alignItems: 'flex-end', justifyContent: 'center', minWidth: 64 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: speedColor, fontFamily: 'monospace' }}>
          {formatSpeed(server.speed)}
        </Text>
        <Text style={{ fontSize: 11, color: pingColor, fontFamily: 'monospace', marginTop: 2 }}>
          {formatPing(server.ping)}
        </Text>
      </View>

      {/* Selected Indicator */}
      {isSelected && (
        <View style={{ marginLeft: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' }} />
      )}
    </Pressable>
  );
}
