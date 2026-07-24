import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { VPNStatus, VPNConnectionState, VPNServer } from '../types';
import { vpnService, onVPNStateChanged, onVPNSError } from '../services/vpnService';
import { storageService } from '../services/storageService';

const initialState: VPNConnectionState = {
  status: 'disconnected',
  connectedServer: null,
  connectedAt: null,
  bytesIn: 0,
  bytesOut: 0,
};

export function useVpn() {
  const [connection, setConnection] = useState<VPNConnectionState>(initialState);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<number | null>(null);
  const statsInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedServerRef = useRef<VPNServer | null>(null);

  const clearStatsInterval = useCallback(() => {
    if (statsInterval.current) {
      clearInterval(statsInterval.current);
      statsInterval.current = null;
    }
  }, []);

  const syncStatus = useCallback(async () => {
    try {
      const { status } = await vpnService.getStatus();
      const s = status as VPNStatus;
      setConnection((prev) => {
        if (s === 'disconnected') {
          clearStatsInterval();
          if (prev.status === 'disconnected') return prev;
          connectedServerRef.current = null;
          return { ...initialState };
        }
        if (s === 'connected') {
          if (prev.status !== 'connected') {
            return {
              ...prev,
              status: s,
              connectedAt: Date.now(),
              connectedServer: connectedServerRef.current,
            };
          }
          return { ...prev, status: s };
        }
        return { ...prev, status: s };
      });
    } catch {}
  }, [clearStatsInterval]);

  useEffect(() => {
    vpnService.getStatus().then(({ status }) => {
      const s = status as VPNStatus;
      if (s !== 'disconnected') {
        setConnection((prev) => ({
          ...prev,
          status: s,
          connectedAt: Date.now(),
          connectedServer: connectedServerRef.current,
        }));
      }
    }).catch(() => {});

    const unsubState = onVPNStateChanged((status: VPNStatus) => {
      setConnection((prev) => {
        if (status === 'disconnected') {
          clearStatsInterval();
          connectedServerRef.current = null;
          return { ...initialState };
        }
        if (status === 'connected') {
          return {
            ...prev,
            status,
            connectedAt: Date.now(),
            connectedServer: connectedServerRef.current,
          };
        }
        return { ...prev, status };
      });
    });

    const unsubError = onVPNSError(() => {
      clearStatsInterval();
      connectedServerRef.current = null;
      setConnection({
        ...initialState,
        status: 'error',
      });
    });

    const appSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        syncStatus();
      }
    });

    storageService.getPremiumStatus().then(({ unlocked, expiresAt }) => {
      if (unlocked && expiresAt && expiresAt > Date.now()) {
        setPremiumUnlocked(true);
        setPremiumExpiresAt(expiresAt);
      }
    });

    return () => {
      unsubState();
      unsubError();
      appSub.remove();
      clearStatsInterval();
    };
  }, [syncStatus, clearStatsInterval]);

  const connect = useCallback(
    async (server: VPNServer, options?: { forcePremium?: boolean }) => {
      if (!server.isFree && !premiumUnlocked && !options?.forcePremium) {
        return false;
      }

      try {
        connectedServerRef.current = server;
        setConnection((prev) => ({
          ...prev,
          status: 'connecting',
          connectedServer: server,
        }));

        const dns = await storageService.getDNS();

        await vpnService.connect({
          serverIp: server.ip,
          ovpnConfig: server.ovpnConfig,
          dns,
        });

        clearStatsInterval();
        statsInterval.current = setInterval(async () => {
          try {
            const stats = await vpnService.getStats();
            setConnection((prev) => ({
              ...prev,
              bytesIn: stats.bytesIn,
              bytesOut: stats.bytesOut,
            }));
          } catch {}
        }, 2000);

        return true;
      } catch (error) {
        connectedServerRef.current = null;
        clearStatsInterval();
        setConnection((prev) => ({
          ...prev,
          status: 'error',
          connectedServer: null,
          connectedAt: null,
        }));
        return false;
      }
    },
    [premiumUnlocked, clearStatsInterval]
  );

  const disconnect = useCallback(async () => {
    clearStatsInterval();
    setConnection((prev) => ({
      ...prev,
      status: 'disconnecting',
      bytesIn: 0,
      bytesOut: 0,
    }));

    try {
      await vpnService.disconnect();
    } catch {}

    connectedServerRef.current = null;
    setConnection({ ...initialState });
  }, [clearStatsInterval]);

  const unlockPremium = useCallback(async (durationMs: number) => {
    const expiresAt = Date.now() + durationMs;
    setPremiumUnlocked(true);
    setPremiumExpiresAt(expiresAt);
    await storageService.setPremiumStatus(true, expiresAt);
  }, []);

  return {
    connection,
    connect,
    disconnect,
    premiumUnlocked,
    premiumExpiresAt,
    unlockPremium,
  };
}
