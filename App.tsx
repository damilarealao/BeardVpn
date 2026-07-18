import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useServers } from './src/hooks/useServers';
import { useVpn } from './src/hooks/useVpn';
import { storageService } from './src/services/storageService';
import { MonetagAd } from './src/components/MonetagAd';
import { AD_CONFIG } from './src/config/adConfig';

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
  const [showAd, setShowAd] = useState(false);
  const lastAdTime = useRef(0);

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

  const shouldShowAd = () => {
    if (!AD_CONFIG.monetag.showAfterConnect) return false;
    const now = Date.now();
    const elapsed = (now - lastAdTime.current) / 1000;
    if (elapsed < AD_CONFIG.monetag.cooldownSeconds) return false;
    lastAdTime.current = now;
    return true;
  };

  useEffect(() => {
    if (connection.status === 'connected' && shouldShowAd()) {
      const timer = setTimeout(() => setShowAd(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [connection.status]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#0a0f1e', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ color: '#94a3b8', marginTop: 16, fontSize: 15 }}>Loading servers...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
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
      <MonetagAd visible={showAd} onClose={() => setShowAd(false)} />
    </SafeAreaProvider>
  );
}
