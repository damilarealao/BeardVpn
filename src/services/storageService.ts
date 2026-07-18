import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SELECTED_SERVER: '@beardvpn/selected_server',
  PREMIUM_UNLOCKED: '@beardvpn/premium_unlocked',
  PREMIUM_EXPIRES: '@beardvpn/premium_expires',
  CONNECTION_HISTORY: '@beardvpn/connection_history',
  SETTINGS_DNS: '@beardvpn/settings_dns',
};

export const storageService = {
  async getSelectedServer(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.SELECTED_SERVER);
  },

  async setSelectedServer(ip: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SELECTED_SERVER, ip);
  },

  async getPremiumStatus(): Promise<{ unlocked: boolean; expiresAt: number | null }> {
    const unlocked = await AsyncStorage.getItem(KEYS.PREMIUM_UNLOCKED);
    const expires = await AsyncStorage.getItem(KEYS.PREMIUM_EXPIRES);
    return {
      unlocked: unlocked === 'true',
      expiresAt: expires ? parseInt(expires, 10) : null,
    };
  },

  async setPremiumStatus(unlocked: boolean, expiresAt: number | null): Promise<void> {
    await AsyncStorage.setItem(KEYS.PREMIUM_UNLOCKED, unlocked.toString());
    if (expiresAt) {
      await AsyncStorage.setItem(KEYS.PREMIUM_EXPIRES, expiresAt.toString());
    }
  },

  async getDNS(): Promise<string> {
    return (await AsyncStorage.getItem(KEYS.SETTINGS_DNS)) || '1.1.1.1';
  },

  async setDNS(dns: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SETTINGS_DNS, dns);
  },
};
