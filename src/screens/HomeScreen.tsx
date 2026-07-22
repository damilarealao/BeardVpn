import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectButton } from '../components/ConnectButton';
import { ServerCard } from '../components/ServerCard';
import { AdBanner } from '../components/AdBanner';
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
  onRefresh?: () => void;
}

function getTopServersByCountry(servers: VPNServer[], count: number): VPNServer[] {
  const seen = new Set<string>();
  const result: VPNServer[] = [];
  for (const s of servers) {
    if (!seen.has(s.countryLong)) {
      seen.add(s.countryLong);
      result.push(s);
      if (result.length >= count) break;
    }
  }
  return result;
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
  onRefresh,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const isConnected = connection.status === 'connected';
  const isConnecting = connection.status === 'connecting' || connection.status === 'disconnecting';
  const isError = connection.status === 'error';
  const isKillSwitch = isError && !!connection.killSwitchMessage;

  const statusColor = isConnected ? '#4ade80' : isConnecting ? '#facc15' : isKillSwitch ? '#f97316' : isError ? '#f87171' : '#64748b';
  const statusLabel = isConnected ? 'PROTECTED' : isConnecting ? 'CONNECTING...' : isKillSwitch ? 'KILL SWITCH' : isError ? 'FAILED' : 'NOT CONNECTED';

  const totalCount = servers.length;

  const handleRefresh = useCallback(() => {
    if (!onRefresh) return;
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1500);
  }, [onRefresh]);

  const handleDisconnectPress = useCallback(() => {
    Alert.alert(
      'Disconnect VPN',
      'Are you sure you want to disconnect?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: onDisconnect },
      ]
    );
  }, [onDisconnect]);

  const handleServerTap = useCallback((server: VPNServer) => {
    onSelectServer(server);
  }, [onSelectServer]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f1e' }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
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
            style={{ width: 96, height: 96 }}
            resizeMode="contain"
          />
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ConnectButton
            status={connection.status}
            onConnect={onConnect}
            onDisconnect={handleDisconnectPress}
          />
          <Text style={{
            color: statusColor,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 1.5,
            marginTop: 16,
          }}>
            {statusLabel}
          </Text>
          {isConnected && selectedServer && (
            <Text style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
              {selectedServer.countryLong} • {selectedServer.ip}
            </Text>
          )}
          {isConnected && (
            <Text style={{ color: '#4b5563', fontSize: 11, marginTop: 2 }}>
              Your traffic is encrypted
            </Text>
          )}
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
              onSelect={() => handleServerTap(selectedServer)}
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
            {getTopServersByCountry(servers, 5).map((server) => (
              <ServerCard
                key={server.ip}
                server={server}
                isSelected={selectedServer?.ip === server.ip}
                onSelect={() => handleServerTap(server)}
              />
            ))}
          </View>
        )}

        {isKillSwitch && (
          <View style={{
            marginHorizontal: 16,
            backgroundColor: 'rgba(154,52,18,0.25)',
            borderWidth: 1,
            borderColor: 'rgba(249,115,22,0.5)',
            borderRadius: 12,
            padding: 14,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>{'\u{1F6E1}'}</Text>
              <Text style={{ color: '#f97316', fontSize: 14, fontWeight: '700' }}>
                Kill Switch Active
              </Text>
            </View>
            <Text style={{ color: '#fb923c', fontSize: 12, lineHeight: 18 }}>
              VPN tunnel dropped. All internet traffic is blocked to protect your IP.
            </Text>
            <Text style={{ color: '#7c2d12', fontSize: 11, marginTop: 6 }}>
              {connection.killSwitchMessage}
            </Text>
            <Pressable
              onPress={onDisconnect}
              style={({ pressed }) => ({
                marginTop: 10,
                backgroundColor: 'rgba(249,115,22,0.2)',
                borderWidth: 1,
                borderColor: '#f97316',
                borderRadius: 8,
                paddingVertical: 8,
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: '#f97316', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
                DISMISS {'&'} RECONNECT
              </Text>
            </Pressable>
          </View>
        )}

        {isError && !isKillSwitch && (
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
          <View style={{ marginHorizontal: 20, alignItems: 'center', paddingVertical: 24 }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ color: '#e5e7eb', fontSize: 14, marginTop: 12, fontWeight: '600' }}>
              Loading servers...
            </Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
              Fetching VPN servers from the network
            </Text>
          </View>
        )}

        {!isLoading && servers.length === 0 && (
          <View style={{ marginHorizontal: 20, alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ color: '#f87171', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
              No servers loaded
            </Text>
            <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center' }}>
              Pull down to refresh and try again
            </Text>
          </View>
        )}

        <View style={{ marginTop: 12 }}>
          <AdBanner size="BANNER" />
        </View>
      </ScrollView>
    </View>
  );
}
