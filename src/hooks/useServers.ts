import { useState, useEffect, useCallback } from 'react';
import { VPNServer } from '../types';
import { fetchServers } from '../services/serverService';
import { storageService } from '../services/storageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVERS_CACHE_KEY = '@beardvpn_servers_cache';

export function useServers() {
  const [servers, setServers] = useState<VPNServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<VPNServer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectServer = useCallback(async (server: VPNServer) => {
    setSelectedServer(server);
    await storageService.setSelectedServer(server.ip);
  }, []);

  const applyServers = useCallback(async (serverList: VPNServer[]) => {
    setServers(serverList);

    const savedIp = await storageService.getSelectedServer();
    if (savedIp) {
      const found = serverList.find((s) => s.ip === savedIp);
      if (found) {
        setSelectedServer(found);
        return;
      }
    }

    const firstFree = serverList.find((s) => s.isFree);
    if (firstFree) {
      setSelectedServer(firstFree);
      await storageService.setSelectedServer(firstFree.ip);
    }
  }, []);

  const loadServers = useCallback(async () => {
    try {
      if (servers.length === 0) {
        setIsLoading(true);
      }
      setError(null);

      const serverList = await fetchServers();
      setServers(serverList);

      const savedIp = await storageService.getSelectedServer();
      if (savedIp) {
        const found = serverList.find((s) => s.ip === savedIp);
        if (found) {
          setSelectedServer(found);
        }
      }

      if (!selectedServer) {
        const firstFree = serverList.find((s) => s.isFree);
        if (firstFree) {
          setSelectedServer(firstFree);
          await storageService.setSelectedServer(firstFree.ip);
        }
      }
    } catch (err) {
      setError('Failed to load servers. Check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  }, [servers.length, selectedServer]);

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(SERVERS_CACHE_KEY);
        if (cached) {
          const { servers: cachedServers } = JSON.parse(cached);
          if (Array.isArray(cachedServers) && cachedServers.length > 0) {
            setServers(cachedServers);
            const savedIp = await storageService.getSelectedServer();
            const found = savedIp ? cachedServers.find((s: VPNServer) => s.ip === savedIp) : null;
            setSelectedServer(found || cachedServers.find((s: VPNServer) => s.isFree) || null);
            setIsLoading(false);
          }
        }
      } catch {}

      loadServers();
    })();
  }, []);

  return {
    servers,
    selectedServer,
    selectServer,
    isLoading,
    error,
    refresh: loadServers,
  };
}
