import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectButton } from '../components/ConnectButton';
import { COUNTRY_FLAGS } from '../config/constants';
import { VPNConnectionState, VPNServer } from '../types';
import { formatSpeed } from '../services/serverService';

interface HomeScreenProps {
  connection: VPNConnectionState;
  selectedServer: VPNServer | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onServerListPress: () => void;
  premiumUnlocked: boolean;
}

export function HomeScreen({
  connection,
  selectedServer,
  onConnect,
  onDisconnect,
  onServerListPress,
  premiumUnlocked,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const flag = selectedServer ? COUNTRY_FLAGS[selectedServer.countryShort] || '\u{1F310}' : '\u{1F310}';

  const handleConnect = () => {
    if (selectedServer) {
      if (!selectedServer.isFree && !premiumUnlocked) return;
      onConnect();
    }
  };

  return (
    <View className="flex-1 bg-vpn-950" style={{ paddingTop: insets.top }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 items-center justify-between py-8 px-6">
          <View className="items-center">
            <Text className="text-vpn-300 text-sm font-medium tracking-wider uppercase">
              BeardVpn
            </Text>
            <Text className="text-white text-2xl font-bold mt-1">
              {connection.status === 'connected'
                ? 'Protected'
                : 'Tap to Connect'}
            </Text>
          </View>

          <View className="items-center my-8">
            <ConnectButton
              status={connection.status}
              onConnect={handleConnect}
              onDisconnect={onDisconnect}
            />
          </View>

          {connection.status === 'connected' && connection.bytesIn > 0 && (
            <View className="flex-row gap-8 mb-6">
              <View className="items-center">
                <Text className="text-gray-400 text-xs">↓ Download</Text>
                <Text className="text-white font-mono text-sm">
                  {formatSpeed(connection.bytesIn)}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-gray-400 text-xs">↑ Upload</Text>
                <Text className="text-white font-mono text-sm">
                  {formatSpeed(connection.bytesOut)}
                </Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={onServerListPress}
            className="w-full bg-vpn-900/60 border border-vpn-800/50 rounded-2xl p-4 flex-row items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <Text className="text-2xl mr-3">{flag}</Text>
            <View className="flex-1">
              <Text className="text-white font-medium">
                {selectedServer ? selectedServer.countryLong : 'Select Server'}
              </Text>
              <Text className="text-gray-400 text-xs">
                {selectedServer
                  ? `${selectedServer.hostName} • ${formatSpeed(selectedServer.speed)}`
                  : 'Tap to choose a server'}
              </Text>
            </View>
            <Text className="text-vpn-400 text-lg">{'\u203A'}</Text>
          </Pressable>

          {connection.status === 'error' && (
            <View className="w-full bg-red-900/30 border border-red-800/50 rounded-xl p-3 mt-3">
              <Text className="text-red-400 text-sm text-center">
                Connection failed. Try a different server.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
