import { API, APP } from '../config/constants';
import { VPNServer } from '../types';

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
    .filter((s) => s.ping > 0 && s.speed > 0)
    .sort((a, b) => {
      const scoreA = a.speed / (a.ping + 1);
      const scoreB = b.speed / (b.ping + 1);
      return scoreB - scoreA;
    });
}

export async function fetchServers(): Promise<VPNServer[]> {
  try {
    const response = await fetch(API.VPNGATE_CSV);
    const text = await response.text();
    const all = parseVPNGateCSV(text);
    const ranked = rankServers(all);

    const freeCount = Math.min(APP.MAX_FREE_SERVERS, ranked.length);
    return ranked.map((server, index) => ({
      ...server,
      isFree: index < freeCount,
    }));
  } catch (error) {
    console.error('Failed to fetch VPN servers:', error);
    throw error;
  }
}

export function formatSpeed(bytesPerSec: number): string {
  const mbps = (bytesPerSec * 8) / (1024 * 1024);
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
  if (mbps >= 1) return `${mbps.toFixed(1)} Mbps`;
  return `${(mbps * 1000).toFixed(0)} Kbps`;
}

export function formatPing(ping: number): string {
  if (ping < 50) return `${ping}ms`;
  if (ping < 150) return `${ping}ms`;
  return `${ping}ms`;
}

export function getUniqueCountries(servers: VPNServer[]): string[] {
  const countries = new Set(servers.map((s) => s.countryLong));
  return Array.from(countries).sort();
}

export function filterServersByCountry(servers: VPNServer[], country: string): VPNServer[] {
  return servers.filter((s) => s.countryLong === country);
}
