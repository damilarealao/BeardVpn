import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
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
  const isConnected = connection.status === 'connected';
  const isConnecting = connection.status === 'connecting' || connection.status === 'disconnecting';

  const handleConnect = () => {
    if (selectedServer) {
      if (!selectedServer.isFree && !premiumUnlocked) return;
      onConnect();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 32, paddingHorizontal: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#60a5fa', fontSize: 13, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' }}>
              BeardVpn
            </Text>
            <Text style={{ color: '#f1f5f9', fontSize: 26, fontWeight: 'bold', marginTop: 6 }}>
              {isConnected ? 'Protected' : isConnecting ? 'Connecting...' : 'Tap to Connect'}
            </Text>
          </View>

          <View style={{ alignItems: 'center', marginVertical: 32 }}>
            <ConnectButton
              status={connection.status}
              onConnect={handleConnect}
              onDisconnect={onDisconnect}
            />
          </View>

          {isConnected && connection.bytesIn > 0 && (
            <View style={{ flexDirection: 'row', gap: 48, marginBottom: 24 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '500' }}>{'\u2193'} Download</Text>
                <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600', fontFamily: 'monospace', marginTop: 2 }}>
                  {formatSpeed(connection.bytesIn)}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '500' }}>{'\u2191'} Upload</Text>
                <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600', fontFamily: 'monospace', marginTop: 2 }}>
                  {formatSpeed(connection.bytesOut)}
                </Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={onServerListPress}
            style={({ pressed }) => ({
              width: '100%',
              backgroundColor: '#1e293b',
              borderWidth: 1,
              borderColor: '#334155',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontSize: 28, marginRight: 12 }}>{flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f1f5f9', fontSize: 16, fontWeight: '600' }}>
                {selectedServer ? selectedServer.countryLong : 'Select Server'}
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                {selectedServer
                  ? `${selectedServer.hostName} \u2022 ${formatSpeed(selectedServer.speed)}`
                  : 'Tap to choose a server'}
              </Text>
            </View>
            <Text style={{ color: '#60a5fa', fontSize: 20 }}>{'\u203A'}</Text>
          </Pressable>

          {connection.status === 'error' && (
            <View style={{
              width: '100%',
              backgroundColor: 'rgba(127,29,29,0.3)',
              borderWidth: 1,
              borderColor: 'rgba(185,28,28,0.5)',
              borderRadius: 12,
              padding: 12,
              marginTop: 12,
            }}>
              <Text style={{ color: '#f87171', fontSize: 14, textAlign: 'center' }}>
                Connection failed. Try a different server.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
