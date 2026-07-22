import { useState, useEffect, useCallback, useRef } from 'react';
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
  const loadedRef = useRef(false);

  const selectServer = useCallback(async (server: VPNServer) => {
    setSelectedServer(server);
    await storageService.setSelectedServer(server.ip);
  }, []);

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
            loadedRef.current = true;
          }
        }
      } catch {}

      if (!loadedRef.current) {
        setIsLoading(false);
      }

      try {
        const fresh = await fetchServers();
        setServers(fresh);
        const savedIp = await storageService.getSelectedServer();
        let foundSaved = false;
        if (savedIp) {
          const found = fresh.find((s) => s.ip === savedIp);
          if (found) {
            setSelectedServer(found);
            foundSaved = true;
          }
        }
        if (!foundSaved) {
          const firstFree = fresh.find((s) => s.isFree);
          if (firstFree) {
            setSelectedServer(firstFree);
            await storageService.setSelectedServer(firstFree.ip);
          }
        }
      } catch {
        if (servers.length === 0) {
          setError('Failed to load servers. Check your internet connection.');
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return {
    servers,
    selectedServer,
    selectServer,
    isLoading,
    error,
    refresh: useCallback(async () => {
      setIsLoading(true);
      try {
        const fresh = await fetchServers();
        setServers(fresh);
        setError(null);
      } catch {
        setError('Failed to refresh. Pull to try again.');
      } finally {
        setIsLoading(false);
      }
    }, []),
  };
}
