import { useState, useEffect, useCallback } from 'react';
import { VPNServer } from '../types';
import { fetchServers } from '../services/serverService';
import { storageService } from '../services/storageService';

export function useServers() {
  const [servers, setServers] = useState<VPNServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<VPNServer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const serverList = await fetchServers();
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
    } catch (err) {
      setError('Failed to load servers. Check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectServer = useCallback(async (server: VPNServer) => {
    setSelectedServer(server);
    await storageService.setSelectedServer(server.ip);
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  return {
    servers,
    selectedServer,
    selectServer,
    isLoading,
    error,
    refresh: loadServers,
  };
}
