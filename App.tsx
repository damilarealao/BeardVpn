import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useServers } from './src/hooks/useServers';
import { useVpn } from './src/hooks/useVpn';
import { storageService } from './src/services/storageService';
import { RewardedAdFlow } from './src/components/RewardedAdFlow';
import { initializeAds } from './src/services/adService';

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
  const pendingConnect = useRef(false);
  const lastAdTime = useRef(0);

  useEffect(() => {
    storageService.getDNS().then(setDns);
    initializeAds().catch(() => {});
  }, []);

  const handleDNSSet = async (newDns: string) => {
    setDns(newDns);
    await storageService.setDNS(newDns);
  };

  const shouldShowAd = () => {
    if (premiumUnlocked) return false;
    const now = Date.now();
    const elapsed = (now - lastAdTime.current) / 1000;
    if (elapsed < 60) return false;
    return true;
  };

  const handleConnect = () => {
    if (!selectedServer) return;

    if (shouldShowAd()) {
      pendingConnect.current = true;
      setShowAd(true);
    } else {
      connect(selectedServer);
    }
  };

  const handleAdClose = useCallback(() => {
    setShowAd(false);
    lastAdTime.current = Date.now();
    if (pendingConnect.current && selectedServer) {
      pendingConnect.current = false;
      connect(selectedServer);
      unlockPremium(30 * 60 * 1000);
    }
  }, [selectedServer, connect, unlockPremium]);

  useEffect(() => {
    if (connection.status === 'connected') {
      pendingConnect.current = false;
    }
  }, [connection.status]);

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
      <RewardedAdFlow visible={showAd} onClose={handleAdClose} />
    </SafeAreaProvider>
  );
}
