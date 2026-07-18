import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useServers } from './src/hooks/useServers';
import { useVpn } from './src/hooks/useVpn';
import { storageService } from './src/services/storageService';

export default function App() {
  const {
    servers,
    selectedServer,
    selectServer,
    isLoading,
    refresh,
  } = useServers();

  const {
    connection,
    connect,
    disconnect,
    premiumUnlocked,
    unlockPremium,
  } = useVpn();

  const [dns, setDns] = useState('1.1.1.1');

  useEffect(() => {
    storageService.getDNS().then(setDns);
  }, []);

  const handleDNSSet = async (newDns: string) => {
    setDns(newDns);
    await storageService.setDNS(newDns);
  };

  const handleConnect = () => {
    if (selectedServer) {
      connect(selectedServer);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-vpn-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-4">Loading servers...</Text>
      </View>
    );
  }

  return (
    <AppNavigator
      connection={connection}
      servers={servers}
      selectedServer={selectedServer}
      onSelectServer={selectServer}
      onConnect={handleConnect}
      onDisconnect={disconnect}
      isLoading={isLoading}
      onRefresh={refresh}
      premiumUnlocked={premiumUnlocked}
      dns={dns}
      onDNSSet={handleDNSSet}
    />
  );
}
