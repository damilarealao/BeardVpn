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
  servers: VPNServer[];
  onConnect: () => void;
  onDisconnect: () => void;
  onServerListPress: () => void;
}

export function HomeScreen({
  connection,
  selectedServer,
  servers,
  onConnect,
  onDisconnect,
  onServerListPress,
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

  const freeCount = servers.filter(s => s.isFree).length;
  const totalCount = servers.length;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f1e' }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: insets.top + 8,
          paddingBottom: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#1e40af',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <View style={{
                width: 18,
                height: 18,
                borderWidth: 2.5,
                borderColor: '#60a5fa',
                borderRadius: 9,
                borderBottomColor: 'transparent',
                alignItems: 'center',
              }}>
                <View style={{ width: 2.5, height: 8, backgroundColor: '#60a5fa', borderRadius: 1, marginTop: -1 }} />
              </View>
            </View>
            <Text style={{ color: '#f1f5f9', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 }}>
              BeardVpn
            </Text>
          </View>
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

        {/* Shield + Status */}
        <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 8 }}>
          {/* Shield icon */}
          <View style={{
            width: 100,
            height: 116,
            marginBottom: 16,
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}>
            <View style={{
              width: 90,
              height: 90,
              borderTopLeftRadius: 45,
              borderTopRightRadius: 45,
              borderBottomLeftRadius: 45,
              borderBottomRightRadius: 45,
              borderBottomWidth: 0,
              borderWidth: 2.5,
              borderColor: isConnected ? '#22c55e' : '#1e3a5f',
              backgroundColor: isConnected ? 'rgba(34,197,94,0.08)' : 'rgba(30,58,95,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <Text style={{ fontSize: 36 }}>
                {isConnected ? '\u{1F6E1}\uFE0F' : isConnecting ? '\u{1F504}' : '\u{1F512}'}
              </Text>
            </View>
            {/* Shield point */}
            <View style={{
              width: 0,
              height: 0,
              borderLeftWidth: 45,
              borderRightWidth: 45,
              borderTopWidth: 28,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: isConnected ? '#22c55e' : '#1e3a5f',
              marginTop: -1,
            }} />
            <View style={{
              width: 85,
              height: 26,
              backgroundColor: isConnected ? 'rgba(34,197,94,0.08)' : 'rgba(30,58,95,0.15)',
              position: 'absolute',
              top: 62,
              borderBottomLeftRadius: 45,
              borderBottomRightRadius: 45,
            }} />
          </View>

          <Text style={{ color: statusColor, fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>
            {statusLabel}
          </Text>
          {isConnected && (
            <Text style={{ color: '#64748b', fontSize: 12 }}>
              Your traffic is encrypted
            </Text>
          )}
        </View>

        {/* Connect Button */}
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ConnectButton
            status={connection.status}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </View>

        {/* Connection Stats (when connected) */}
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

        {/* Server Card */}
        <Pressable
          onPress={onServerListPress}
          style={({ pressed }) => ({
            marginHorizontal: 20,
            marginBottom: 12,
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
                  {selectedServer.ping > 0 ? `${selectedServer.ping}ms` : '—'}
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

        {/* Quick Server Previews */}
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
                      {server.ping > 0 ? `${server.ping}ms` : '—'}
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

        {/* Error message */}
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
      </ScrollView>
    </View>
  );
}
