import React from 'react';
import { View, Text, Switch, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsScreenProps {
  dns: string;
  onDNSSet: (dns: string) => void;
}

const DNS_OPTIONS = [
  { label: 'Cloudflare', value: '1.1.1.1' },
  { label: 'Google', value: '8.8.8.8' },
  { label: 'OpenDNS', value: '208.67.222.222' },
  { label: 'Quad9', value: '9.9.9.9' },
];

export function SettingsScreen({ dns, onDNSSet }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-vpn-950"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text className="text-white text-2xl font-bold mb-6">Settings</Text>

      <View className="mb-6">
        <Text className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3">
          DNS Server
        </Text>
        <View className="bg-vpn-900/60 border border-vpn-800/50 rounded-xl overflow-hidden">
          {DNS_OPTIONS.map((option, i) => (
            <Pressable
              key={option.value}
              onPress={() => onDNSSet(option.value)}
              className={`flex-row items-center justify-between px-4 py-3.5 ${
                i < DNS_OPTIONS.length - 1 ? 'border-b border-vpn-800/30' : ''
              }`}
            >
              <Text className="text-white">{option.label}</Text>
              <Text className="text-gray-400 text-sm font-mono">{option.value}</Text>
              {dns === option.value && (
                <View className="w-5 h-5 rounded-full bg-vpn-500 items-center justify-center">
                  <Text className="text-white text-xs">{'\u2713'}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3">
          Features
        </Text>
        <View className="bg-vpn-900/60 border border-vpn-800/50 rounded-xl">
          <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-vpn-800/30">
            <View>
              <Text className="text-white">Kill Switch</Text>
              <Text className="text-gray-500 text-xs">Block traffic if VPN drops</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: '#374151', true: '#1d4ed8' }}
              thumbColor={true ? '#60a5fa' : '#9ca3af'}
            />
          </View>
          <View className="flex-row items-center justify-between px-4 py-3.5">
            <View>
              <Text className="text-white">Auto-Connect</Text>
              <Text className="text-gray-500 text-xs">Connect on app launch</Text>
            </View>
            <Switch
              value={false}
              trackColor={{ false: '#374151', true: '#1d4ed8' }}
              thumbColor={false ? '#60a5fa' : '#9ca3af'}
            />
          </View>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3">
          About
        </Text>
        <View className="bg-vpn-900/60 border border-vpn-800/50 rounded-xl p-4">
          <Text className="text-white font-semibold text-lg">BeardVpn</Text>
          <Text className="text-gray-400 text-sm mt-1">Version 1.0.0</Text>
          <Text className="text-gray-500 text-xs mt-3">
            Free VPN servers provided by VPN Gate Academic Experiment Project
            (University of Tsukuba, Japan). Servers are community-contributed
            and may be unavailable at times.
          </Text>
        </View>
      </View>

      <Text className="text-gray-600 text-xs text-center">
        Privacy: We do not log, store, or sell any user data.
        All connection data is processed locally on your device.
      </Text>
    </ScrollView>
  );
}
