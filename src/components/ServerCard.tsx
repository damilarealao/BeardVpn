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
        paddingHorizontal: 12,
        paddingVertical: 14,
        marginBottom: 6,
        borderRadius: 14,
        borderWidth: 1,
        backgroundColor: isSelected ? 'rgba(30,64,175,0.4)' : '#1e293b',
        borderColor: isSelected ? '#3b82f6' : '#334155',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ fontSize: 28, marginRight: 12 }}>{flag}</Text>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#f1f5f9', fontSize: 16, fontWeight: '600' }}>{server.countryLong}</Text>
          {server.isFree ? (
            <View style={{ marginLeft: 8, backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '700' }}>FREE</Text>
            </View>
          ) : (
            <View style={{ marginLeft: 8, backgroundColor: 'rgba(139,92,246,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ color: '#a78bfa', fontSize: 11, fontWeight: '700' }}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>
          {server.hostName} \u2022 {server.operator || 'Unknown'}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: speedColor, fontFamily: 'monospace' }}>
          {formatSpeed(server.speed)}
        </Text>
        <Text style={{ fontSize: 11, color: pingColor, fontFamily: 'monospace', marginTop: 2 }}>
          {formatPing(server.ping)}
        </Text>
      </View>

      {isSelected && (
        <View style={{ marginLeft: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' }} />
      )}
    </Pressable>
  );
}
