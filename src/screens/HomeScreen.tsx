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

  const statusColor = isConnected ? '#4ade80' : isConnecting ? '#facc15' : isError ? '#f87171' : '#64748b';
  const statusTitle = isConnected ? 'Protected & Encrypted' : isConnecting ? 'Establishing Connection...' : isError ? 'Connection Failed' : 'Not Connected';
  const statusSubtitle = isConnected ? 'Your network traffic is secured' : isConnecting ? 'Routing tunnel through OpenVPN' : isError ? 'Tap to retry or pick another server' : 'Tap button to secure your device';

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
    <View style={{ flex: 1, backgroundColor: '#090d16' }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 90 }}
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
        {/* Header Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: insets.top + 10,
          paddingBottom: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image
              source={logoAsset}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
            <Text style={{ color: '#f8fafc', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 }}>
              BeardVpn
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: isConnected ? 'rgba(34,197,94,0.12)' : '#131b2e',
            borderWidth: 1,
            borderColor: isConnected ? 'rgba(34,197,94,0.3)' : '#1e293b',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: statusColor }} />
            <Text style={{ color: statusColor, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
              {isConnected ? 'CONNECTED' : isConnecting ? 'CONNECTING' : 'IDLE'}
            </Text>
          </View>
        </View>

        {/* Hero Section: Button & Status */}
        <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 20 }}>
          <ConnectButton
            status={connection.status}
            onConnect={onConnect}
            onDisconnect={handleDisconnectPress}
          />

          <View style={{ alignItems: 'center', marginTop: 20, paddingHorizontal: 32 }}>
            <Text style={{
              color: '#f8fafc',
              fontSize: 18,
              fontWeight: '700',
              textAlign: 'center',
            }}>
              {statusTitle}
            </Text>

            <Text style={{
              color: statusColor,
              fontSize: 12,
              fontWeight: '600',
              marginTop: 4,
              textAlign: 'center',
            }}>
              {statusSubtitle}
            </Text>

            {isConnected && selectedServer && (
              <Text style={{ color: '#64748b', fontSize: 11, marginTop: 4, fontFamily: 'monospace' }}>
                {selectedServer.countryLong} • {selectedServer.ip}
              </Text>
            )}
          </View>
        </View>

        {/* Traffic Stats (Shown when Connected) */}
        {isConnected && (
          <View style={{
            flexDirection: 'row',
            marginHorizontal: 20,
            marginBottom: 20,
            gap: 12,
          }}>
            <View style={{
              flex: 1,
              backgroundColor: '#131b2e',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: '#1e293b',
            }}>
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>DOWNLOAD</Text>
              <Text style={{ color: '#4ade80', fontSize: 18, fontWeight: '700', fontFamily: 'monospace', marginTop: 4 }}>
                {formatSpeed(connection.bytesIn)}
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: '#131b2e',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: '#1e293b',
            }}>
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>UPLOAD</Text>
              <Text style={{ color: '#60a5fa', fontSize: 18, fontWeight: '700', fontFamily: 'monospace', marginTop: 4 }}>
                {formatSpeed(connection.bytesOut)}
              </Text>
            </View>
          </View>
        )}

        {/* Selected Server Card */}
        {selectedServer ? (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 4 }}>
              <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Selected Server
              </Text>
              <Pressable onPress={onServerListPress}>
                <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '600' }}>
                  Change Server ›
                </Text>
              </Pressable>
            </View>
            <ServerCard
              server={selectedServer}
              isSelected={true}
              onSelect={() => handleServerTap(selectedServer)}
            />
          </View>
        ) : (
          <Pressable
            onPress={onServerListPress}
            style={({ pressed }) => ({
              marginHorizontal: 20,
              marginBottom: 20,
              backgroundColor: '#131b2e',
              borderWidth: 1,
              borderColor: '#1e293b',
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Text style={{ fontSize: 28 }}>🌐</Text>
              <View>
                <Text style={{ color: '#f8fafc', fontSize: 15, fontWeight: '700' }}>
                  Select a VPN Server
                </Text>
                <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                  {totalCount > 0 ? `${totalCount} servers ready worldwide` : 'Tap to browse available servers'}
                </Text>
              </View>
            </View>
            <Text style={{ color: '#60a5fa', fontSize: 20, fontWeight: 'bold' }}>›</Text>
          </Pressable>
        )}

        {/* Top Fast Servers */}
        {servers.length > 0 && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 4 }}>
              <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Recommended Fast Servers
              </Text>
              <Pressable onPress={onServerListPress}>
                <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '600' }}>
                  View All ({totalCount}) ›
                </Text>
              </Pressable>
            </View>
            {getTopServersByCountry(servers, 4).map((server) => (
              <ServerCard
                key={server.ip}
                server={server}
                isSelected={selectedServer?.ip === server.ip}
                onSelect={() => handleServerTap(server)}
              />
            ))}
          </View>
        )}

        {/* Connection Error Message */}
        {isError && (
          <View style={{
            marginHorizontal: 20,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.3)',
            borderRadius: 14,
            padding: 14,
            alignItems: 'center',
          }}>
            <Text style={{ color: '#f87171', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
              Connection failed. Try selecting another server.
            </Text>
          </View>
        )}

        {/* Loading Spinner for Empty List */}
        {isLoading && servers.length === 0 && (
          <View style={{ marginHorizontal: 20, alignItems: 'center', paddingVertical: 32 }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 12, fontWeight: '600' }}>
              Loading fast servers from network...
            </Text>
          </View>
        )}

        {/* Ad Banner */}
        <View style={{ marginTop: 8 }}>
          <AdBanner size="BANNER" />
        </View>
      </ScrollView>
    </View>
  );
}
