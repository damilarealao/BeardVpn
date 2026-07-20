import React from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectButton } from '../components/ConnectButton';
import { ServerCard } from '../components/ServerCard';
import { AdBanner } from '../components/AdBanner';
import { COUNTRY_FLAGS } from '../config/constants';
import { VPNConnectionState, VPNServer } from '../types';
import { formatSpeed } from '../services/serverService';
const logoAsset = require('../../assets/icon.png');

interface HomeScreenProps {
  connection: VPNConnectionState;
  selectedServer: VPNServer | null;
  servers: VPNServer[];
  onConnect: () => void;
  onDisconnect: () => void;
  onServerListPress: () => void;
  onSelectServer: (server: VPNServer) => void;
  isLoading: boolean;
}

export function HomeScreen({
  connection,
  selectedServer,
  servers,
  onConnect,
  onDisconnect,
  onServerListPress,
  onSelectServer,
  isLoading,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const isConnected = connection.status === 'connected';
  const isConnecting = connection.status === 'connecting' || connection.status === 'disconnecting';
  const isError = connection.status === 'error';

  const statusColor = isConnected ? '#4ade80' : isConnecting ? '#facc15' : isError ? '#f87171' : '#64748b';
  const statusLabel = isConnected ? 'PROTECTED' : isConnecting ? 'CONNECTING...' : isError ? 'FAILED' : 'NOT CONNECTED';

  const totalCount = servers.length;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f1e' }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: insets.top + 8,
          paddingBottom: 8,
        }}>
          <Text style={{ color: '#f1f5f9', fontSize: 22, fontWeight: '800', letterSpacing: 0.3 }}>
            BeardVpn
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#1e293b',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
            <Text style={{ color: statusColor, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 8 }}>
          <Image
            source={logoAsset}
            style={{ width: 96, height: 96, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text style={{ color: statusColor, fontSize: 13, fontWeight: '700', letterSpacing: 2 }}>
            {statusLabel}
          </Text>
          {isConnected && (
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
              Your traffic is encrypted
            </Text>
          )}
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ConnectButton
            status={connection.status}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </View>

        {isConnected && (
          <View style={{
            flexDirection: 'row',
            marginHorizontal: 20,
            marginBottom: 12,
            gap: 10,
          }}>
            <View style={{
              flex: 1,
              backgroundColor: '#111827',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: '#1f2937',
            }}>
              <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>DOWNLOAD</Text>
              <Text style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '700', fontFamily: 'monospace', marginTop: 4 }}>
                {formatSpeed(connection.bytesIn)}
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: '#111827',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: '#1f2937',
            }}>
              <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>UPLOAD</Text>
              <Text style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '700', fontFamily: 'monospace', marginTop: 4 }}>
                {formatSpeed(connection.bytesOut)}
              </Text>
            </View>
          </View>
        )}

        {selectedServer && (
          <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                Current Server
              </Text>
              <Pressable onPress={onServerListPress}>
                <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '600' }}>
                  Change
                </Text>
              </Pressable>
            </View>
            <ServerCard
              server={selectedServer}
              isSelected={true}
              onSelect={() => onServerListPress()}
            />
          </View>
        )}

        {!selectedServer && (
          <Pressable
            onPress={onServerListPress}
            style={({ pressed }) => ({
              marginHorizontal: 16,
              marginBottom: 12,
              backgroundColor: '#1e293b',
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: '#334155',
              borderRadius: 14,
              paddingVertical: 20,
              paddingHorizontal: 16,
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>{'\u{1F310}'}</Text>
            <Text style={{ color: '#f1f5f9', fontSize: 15, fontWeight: '600' }}>
              Select a Server
            </Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
              {totalCount > 0 ? `${totalCount} servers available` : 'Tap to browse servers'}
            </Text>
          </Pressable>
        )}

        {servers.length > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                Top Servers
              </Text>
              <Pressable onPress={onServerListPress}>
                <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '600' }}>
                  View All ({totalCount})
                </Text>
              </Pressable>
            </View>
            {servers.slice(0, 4).map((server) => (
              <ServerCard
                key={server.ip}
                server={server}
                isSelected={selectedServer?.ip === server.ip}
                onSelect={() => onSelectServer(server)}
              />
            ))}
          </View>
        )}

        {isError && (
          <View style={{
            marginHorizontal: 16,
            backgroundColor: 'rgba(127,29,29,0.2)',
            borderWidth: 1,
            borderColor: 'rgba(185,28,28,0.4)',
            borderRadius: 12,
            padding: 12,
          }}>
            <Text style={{ color: '#f87171', fontSize: 13, textAlign: 'center', fontWeight: '600' }}>
              Connection failed. Try a different server.
            </Text>
          </View>
        )}

        {isLoading && servers.length === 0 && (
          <View style={{ marginHorizontal: 20, alignItems: 'center', paddingVertical: 16 }}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>Loading servers...</Text>
          </View>
        )}

        <View style={{ marginTop: 12 }}>
          <AdBanner size="BANNER" />
        </View>
      </ScrollView>
    </View>
  );
}
