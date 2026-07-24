import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useServers } from './src/hooks/useServers';
import { useVpn } from './src/hooks/useVpn';
import { storageService } from './src/services/storageService';
import { RewardedAdFlow } from './src/components/RewardedAdFlow';
import { initializeAds } from './src/services/adService';
import { VPNServer } from './src/types';

type PendingAction =
  | { type: 'connect'; server: VPNServer }
  | { type: 'switch'; server: VPNServer }
  | null;

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
  const pendingAction = useRef<PendingAction>(null);

  useEffect(() => {
    storageService.getDNS().then(setDns);
    initializeAds().catch(() => {});
  }, []);

  const handleDNSSet = async (newDns: string) => {
    setDns(newDns);
    await storageService.setDNS(newDns);
  };

  const showAdFor = useCallback((action: PendingAction) => {
    pendingAction.current = action;
    setShowAd(true);
  }, []);

  const handleConnect = useCallback(() => {
    let server = selectedServer;
    if (!server && servers.length > 0) {
      server = servers.find((s) => s.isFree) || servers[0];
    }
    if (!server) return;

    const isConnected = connection.status === 'connected';
    showAdFor({ type: isConnected ? 'switch' : 'connect', server });
  }, [selectedServer, servers, connection.status, showAdFor]);

  const handleServerSelect = useCallback((server: VPNServer) => {
    const isConnected = connection.status === 'connected';
    const isConnecting = connection.status === 'connecting';
    if (isConnected || isConnecting) {
      showAdFor({ type: 'switch', server });
    } else {
      showAdFor({ type: 'connect', server });
    }
  }, [connection.status, showAdFor]);

  const handleAdClose = useCallback((rewardGranted: boolean) => {
    setShowAd(false);

    const action = pendingAction.current;
    pendingAction.current = null;

    if (!action) return;

    const doConnect = () => {
      selectServer(action.server);
      if (rewardGranted) {
        unlockPremium(30 * 60 * 1000);
      }
      connect(action.server, { forcePremium: rewardGranted });
    };

    if (action.type === 'switch') {
      const wasConnected = connection.status === 'connected';
      const wasConnecting = connection.status === 'connecting';
      if (wasConnected || wasConnecting) {
        disconnect();
        setTimeout(doConnect, 600);
      } else {
        doConnect();
      }
    } else {
      doConnect();
    }
  }, [connection.status, connect, disconnect, selectServer, unlockPremium]);

  useEffect(() => {
    if (connection.status === 'connected') {
      pendingAction.current = null;
    }
  }, [connection.status]);

  return (
    <SafeAreaProvider>
      <AppNavigator
        connection={connection}
        servers={servers}
        selectedServer={selectedServer}
        onSelectServer={handleServerSelect}
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
