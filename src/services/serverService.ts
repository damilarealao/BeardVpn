import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, APP } from '../config/constants';
import { VPNServer } from '../types';

const SERVERS_CACHE_KEY = '@beardvpn_servers_cache';
const CACHE_MAX_AGE_MS = 30 * 60 * 1000;

const BUNDLED_SERVERS: VPNServer[] = [
  { hostName: 'VPN1.Japan', ip: '173.254.203.25', score: 100000, ping: 120, speed: 50000000, countryLong: 'Japan', countryShort: 'JP', numSessions: 45, uptime: 99, totalUsers: 100, totalTraffic: 0, logType: '', operator: 'VPNGate', message: '', ovpnConfig: 'remote 173.254.203.25 443\nproto tcp\ndev tun\nca ca.crt\ncert client.crt\nkey client.key\ncipher AES-256-CBC\nauth SHA256\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nverb 3', isFree: true },
  { hostName: 'VPN2.US', ip: '51.79.173.22', score: 90000, ping: 180, speed: 40000000, countryLong: 'United States', countryShort: 'US', numSessions: 30, uptime: 98, totalUsers: 80, totalTraffic: 0, logType: '', operator: 'VPNGate', message: '', ovpnConfig: 'remote 51.79.173.22 443\nproto tcp\ndev tun\nca ca.crt\ncert client.crt\nkey client.key\ncipher AES-256-CBC\nauth SHA256\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nverb 3', isFree: true },
  { hostName: 'VPN3.Germany', ip: '185.235.241.65', score: 80000, ping: 150, speed: 35000000, countryLong: 'Germany', countryShort: 'DE', numSessions: 25, uptime: 97, totalUsers: 60, totalTraffic: 0, logType: '', operator: 'VPNGate', message: '', ovpnConfig: 'remote 185.235.241.65 443\nproto tcp\ndev tun\nca ca.crt\ncert client.crt\nkey client.key\ncipher AES-256-CBC\nauth SHA256\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nverb 3', isFree: true },
  { hostName: 'VPN4.UK', ip: '89.238.150.100', score: 70000, ping: 160, speed: 30000000, countryLong: 'United Kingdom', countryShort: 'GB', numSessions: 20, uptime: 96, totalUsers: 50, totalTraffic: 0, logType: '', operator: 'VPNGate', message: '', ovpnConfig: 'remote 89.238.150.100 443\nproto tcp\ndev tun\nca ca.crt\ncert client.crt\nkey client.key\ncipher AES-256-CBC\nauth SHA256\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nverb 3', isFree: true },
  { hostName: 'VPN5.Netherlands', ip: '45.137.190.81', score: 60000, ping: 140, speed: 25000000, countryLong: 'Netherlands', countryShort: 'NL', numSessions: 18, uptime: 95, totalUsers: 40, totalTraffic: 0, logType: '', operator: 'VPNGate', message: '', ovpnConfig: 'remote 45.137.190.81 443\nproto tcp\ndev tun\nca ca.crt\ncert client.crt\nkey client.key\ncipher AES-256-CBC\nauth SHA256\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nverb 3', isFree: true },
  { hostName: 'VPN6.France', ip: '51.161.10.242', score: 55000, ping: 155, speed: 22000000, countryLong: 'France', countryShort: 'FR', numSessions: 15, uptime: 94, totalUsers: 35, totalTraffic: 0, logType: '', operator: 'VPNGate', message: '', ovpnConfig: 'remote 51.161.10.242 443\nproto tcp\ndev tun\nca ca.crt\ncert client.crt\nkey client.key\ncipher AES-256-CBC\nauth SHA256\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nverb 3', isFree: false },
  { hostName: 'VPN7.Canada', ip: '154.16.199.12', score: 50000, ping: 200, speed: 20000000, countryLong: 'Canada', countryShort: 'CA', numSessions: 12, uptime: 93, totalUsers: 30, totalTraffic: 0, logType: '', operator: 'VPNGate', message: '', ovpnConfig: 'remote 154.16.199.12 443\nproto tcp\ndev tun\nca ca.crt\ncert client.crt\nkey client.key\ncipher AES-256-CBC\nauth SHA256\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nverb 3', isFree: false },
  { hostName: 'VPN8.Korea', ip: '121.254.169.100', score: 45000, ping: 100, speed: 45000000, countryLong: 'South Korea', countryShort: 'KR', numSessions: 35, uptime: 99, totalUsers: 70, totalTraffic: 0, logType: '', operator: 'VPNGate', message: '', ovpnConfig: 'remote 121.254.169.100 443\nproto tcp\ndev tun\nca ca.crt\ncert client.crt\nkey client.key\ncipher AES-256-CBC\nauth SHA256\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nverb 3', isFree: false },
  { hostName: 'VPN9.Singapore', ip: '219.100.37.101', score: 40000, ping: 90, speed: 42000000, countryLong: 'Singapore', countryShort: 'SG', numSessions: 28, uptime: 98, totalUsers: 55, totalTraffic: 0, logType: '', operator: 'VPNGate', message: '', ovpnConfig: 'remote 219.100.37.101 443\nproto tcp\ndev tun\nca ca.crt\ncert client.crt\nkey client.key\ncipher AES-256-CBC\nauth SHA256\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nverb 3', isFree: false },
  { hostName: 'VPN10.Australia', ip: '45.32.105.200', score: 35000, ping: 220, speed: 18000000, countryLong: 'Australia', countryShort: 'AU', numSessions: 10, uptime: 92, totalUsers: 25, totalTraffic: 0, logType: '', operator: 'VPNGate', message: '', ovpnConfig: 'remote 45.32.105.200 443\nproto tcp\ndev tun\nca ca.crt\ncert client.crt\nkey client.key\ncipher AES-256-CBC\nauth SHA256\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nverb 3', isFree: false },
];

function parseVPNGateCSV(raw: string): VPNServer[] {
  const lines = raw.split('\n');
  const servers: VPNServer[] = [];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('*') || line.startsWith('#')) continue;

    const cols = line.split(',');
    if (cols.length < 15) continue;

    const ovpnConfig = cols[14]
      ? atob(cols[14].trim().replace(/"/g, ''))
      : '';

    if (!ovpnConfig || ovpnConfig.length < 10) continue;

    servers.push({
      hostName: cols[0],
      ip: cols[1],
      score: parseInt(cols[2], 10) || 0,
      ping: parseInt(cols[3], 10) || 0,
      speed: parseInt(cols[4], 10) || 0,
      countryLong: cols[5],
      countryShort: cols[6],
      numSessions: parseInt(cols[7], 10) || 0,
      uptime: parseInt(cols[8], 10) || 0,
      totalUsers: parseInt(cols[9], 10) || 0,
      totalTraffic: parseInt(cols[10], 10) || 0,
      logType: cols[11] || '',
      operator: cols[12] || '',
      message: cols[13] || '',
      ovpnConfig,
      isFree: false,
    });
  }

  return servers;
}

function rankServers(servers: VPNServer[]): VPNServer[] {
  return servers
    .sort((a, b) => {
      const scoreA = a.speed > 0 && a.ping > 0 ? a.speed / (a.ping + 1) : a.score;
      const scoreB = b.speed > 0 && b.ping > 0 ? b.speed / (b.ping + 1) : b.score;
      return scoreB - scoreA;
    });
}

const ALTERNATIVE_URLS = [
  'https://www.vpngate.net/api/iphone/',
  'http://www.vpngate.net/api/iphone/',
  'https://vpntest.net/api/iphone/',
];

async function fetchFromNetwork(): Promise<VPNServer[]> {
  let lastError: Error | null = null;

  for (const url of ALTERNATIVE_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();

      if (!text || text.length < 100) {
        throw new Error('Response too short');
      }

      const all = parseVPNGateCSV(text);

      if (all.length === 0) {
        throw new Error('No servers parsed from response');
      }

      return all;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Failed to fetch from ${url}:`, lastError.message);
      continue;
    }
  }

  throw lastError || new Error('Failed to fetch servers from all sources');
}

export async function fetchServers(): Promise<VPNServer[]> {
  try {
    const all = await fetchFromNetwork();
    const ranked = rankServers(all);
    const freeCount = Math.min(APP.MAX_FREE_SERVERS, ranked.length);
    const result = ranked.map((server, index) => ({
      ...server,
      isFree: index < freeCount,
    }));

    try {
      await AsyncStorage.setItem(SERVERS_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        servers: result,
      }));
    } catch {}

    return result;
  } catch {
    try {
      const cached = await AsyncStorage.getItem(SERVERS_CACHE_KEY);
      if (cached) {
        const { servers } = JSON.parse(cached);
        if (Array.isArray(servers) && servers.length > 0) {
          return servers;
        }
      }
    } catch {}

    const freeCount = Math.min(APP.MAX_FREE_SERVERS, BUNDLED_SERVERS.length);
    return BUNDLED_SERVERS.map((server, index) => ({
      ...server,
      isFree: index < freeCount,
    }));
  }
}

export function formatSpeed(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatPing(ping: number): string {
  if (ping <= 0) return '\u2014';
  return `${ping} ms`;
}

export function getUniqueCountries(servers: VPNServer[]): string[] {
  const countries = new Set(servers.map((s) => s.countryLong));
  return Array.from(countries).sort();
}

export function filterServersByCountry(servers: VPNServer[], country: string): VPNServer[] {
  return servers.filter((s) => s.countryLong === country);
}
