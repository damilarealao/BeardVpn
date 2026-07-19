import React from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectButton } from '../components/ConnectButton';
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
  isLoading: boolean;
}

export function HomeScreen({
  connection,
  selectedServer,
  servers,
  onConnect,
  onDisconnect,
  onServerListPress,
  isLoading,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const isConnected = connection.status === 'connected';
  const isConnecting = connection.status === 'connecting' || connection.status === 'disconnecting';
  const isError = connection.status === 'error';

  const statusColor = isConnected ? '#4ade80' : isConnecting ? '#facc15' : isError ? '#f87171' : '#64748b';
  const statusLabel = isConnected ? 'PROTECTED' : isConnecting ? 'CONNECTING...' : isError ? 'FAILED' : 'NOT CONNECTED';

  const flag = selectedServer ? COUNTRY_FLAGS[selectedServer.countryShort] || '\u{1F310}' : '\u{1F310}';
  const countryName = selectedServer
    ? (selectedServer.countryLong || selectedServer.countryShort || 'Unknown')
    : 'No server selected';

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

        <Pressable
          onPress={onServerListPress}
          style={({ pressed }) => ({
            marginHorizontal: 20,
            marginBottom: 16,
            backgroundColor: '#111827',
            borderWidth: 1,
            borderColor: '#1f2937',
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: '#1e293b',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}>
            <Text style={{ fontSize: 26 }}>{flag}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#f9fafb', fontSize: 15, fontWeight: '700' }}>
              {countryName}
            </Text>
            <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
              {selectedServer
                ? `${selectedServer.ip}:${selectedServer.hostName}`
                : 'Tap to choose a server'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
            {selectedServer && (
              <>
                <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '600', fontFamily: 'monospace' }}>
                  {formatSpeed(selectedServer.speed)}
                </Text>
                <Text style={{ color: '#6b7280', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
                  {selectedServer.ping > 0 ? `${selectedServer.ping}ms` : '\u2014'}
                </Text>
              </>
            )}
          </View>
          <View style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#1e293b',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: '#60a5fa', fontSize: 16 }}>{'\u203A'}</Text>
          </View>
        </Pressable>

        {servers.length > 0 && (
          <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                Top Servers
              </Text>
              <Pressable onPress={onServerListPress}>
                <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '600' }}>
                  View All ({totalCount})
                </Text>
              </Pressable>
            </View>
            {servers.slice(0, 4).map((server, i) => {
              const sf = COUNTRY_FLAGS[server.countryShort] || '\u{1F310}';
              const isSelected = selectedServer?.ip === server.ip;
              return (
                <Pressable
                  key={server.ip + i}
                  onPress={onServerListPress}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isSelected ? 'rgba(37,99,235,0.12)' : '#111827',
                    borderWidth: 1,
                    borderColor: isSelected ? '#3b82f6' : '#1f2937',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 6,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ fontSize: 20, marginRight: 10 }}>{sf}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#e5e7eb', fontSize: 13, fontWeight: '600' }}>
                      {server.countryLong || server.countryShort}
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 1 }}>
                      {server.operator || server.hostName}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: server.speed > 10000000 ? '#4ade80' : '#94a3b8', fontSize: 11, fontWeight: '600', fontFamily: 'monospace' }}>
                      {formatSpeed(server.speed)}
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: 10, fontFamily: 'monospace', marginTop: 1 }}>
                      {server.ping > 0 ? `${server.ping}ms` : '\u2014'}
                    </Text>
                  </View>
                  {server.isFree && (
                    <View style={{ marginLeft: 8, backgroundColor: 'rgba(74,222,128,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: '#4ade80', fontSize: 9, fontWeight: '700' }}>FREE</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {isError && (
          <View style={{
            marginHorizontal: 20,
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
      </ScrollView>
    </View>
  );
}
