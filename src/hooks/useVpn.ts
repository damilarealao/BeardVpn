import { useState, useEffect, useCallback, useRef } from 'react';
import { VPNStatus, VPNConnectionState, VPNServer } from '../types';
import { vpnService, onVPNStateChanged } from '../services/vpnService';
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

  useEffect(() => {
    const unsub = onVPNStateChanged((status: VPNStatus) => {
      setConnection((prev) => {
        if (status === 'disconnected') {
          if (statsInterval.current) {
            clearInterval(statsInterval.current);
            statsInterval.current = null;
          }
          return { ...initialState };
        }
        if (status === 'connected') {
          return { ...prev, status, connectedAt: Date.now() };
        }
        return { ...prev, status };
      });
    });

    storageService.getPremiumStatus().then(({ unlocked, expiresAt }) => {
      if (unlocked && expiresAt && expiresAt > Date.now()) {
        setPremiumUnlocked(true);
        setPremiumExpiresAt(expiresAt);
      }
    });

    return () => {
      unsub();
      if (statsInterval.current) clearInterval(statsInterval.current);
    };
  }, []);

  const connect = useCallback(
    async (server: VPNServer) => {
      if (!server.isFree && !premiumUnlocked) {
        return false;
      }

      try {
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

        if (statsInterval.current) {
          clearInterval(statsInterval.current);
        }

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
        setConnection((prev) => ({
          ...prev,
          status: 'error',
          connectedServer: null,
          connectedAt: null,
        }));
        return false;
      }
    },
    [premiumUnlocked]
  );

  const disconnect = useCallback(async () => {
    try {
      setConnection((prev) => ({ ...prev, status: 'disconnecting' }));
      if (statsInterval.current) {
        clearInterval(statsInterval.current);
        statsInterval.current = null;
      }
      await vpnService.disconnect();
      setConnection({ ...initialState });
    } catch {
      setConnection((prev) => ({ ...prev, status: 'error' }));
    }
  }, []);

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
