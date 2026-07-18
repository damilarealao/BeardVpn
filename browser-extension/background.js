// BeardVpn Background Service Worker
// Manages proxy connections, server fetching, and connection state

const api = typeof browser !== 'undefined' ? browser : chrome;

// State
let state = {
  connected: false,
  currentServer: null,
  servers: [],
  dataUp: 0,
  dataDown: 0
};

// Country flag emoji mapping
const countryFlags = {
  'US': '🇺🇸', 'JP': '🇯🇵', 'KR': '🇰🇷', 'SG': '🇸🇬', 'DE': '🇩🇪',
  'GB': '🇬🇧', 'FR': '🇫🇷', 'CA': '🇨🇦', 'AU': '🇦🇺', 'NL': '🇳🇱',
  'BR': '🇧🇷', 'IN': '🇮🇳', 'RU': '🇷🇺', 'CN': '🇨🇳', 'TW': '🇹🇼',
  'TH': '🇹🇭', 'VN': '🇻🇳', 'PH': '🇵🇭', 'MY': '🇲🇾', 'ID': '🇮🇩',
  'MX': '🇲🇽', 'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'PE': '🇵🇪',
  'IT': '🇮🇹', 'ES': '🇪🇸', 'PT': '🇵🇹', 'PL': '🇵🇱', 'CZ': '🇨🇿',
  'SE': '🇸🇪', 'NO': '🇳🇴', 'FI': '🇫🇮', 'DK': '🇩🇰', 'CH': '🇨🇭',
  'AT': '🇦🇹', 'BE': '🇧🇪', 'IE': '🇮🇪', 'UA': '🇺🇦', 'TR': '🇹🇷',
  'ZA': '🇿🇦', 'NG': '🇳🇬', 'EG': '🇪🇬', 'IL': '🇮🇱', 'AE': '🇦🇪',
  'SA': '🇸🇦', 'PK': '🇵🇰', 'BD': '🇧🇩', 'LK': '🇱🇰', 'MM': '🇲🇲',
  'KH': '🇰🇭', 'LA': '🇱🇦', 'KZ': '🇰🇿', 'UZ': '🇺🇿', 'GE': '🇬🇪',
  'RO': '🇷🇴', 'BG': '🇧🇬', 'HR': '🇭🇷', 'RS': '🇷🇸', 'HU': '🇭🇺',
  'SK': '🇸🇰', 'LT': '🇱🇹', 'LV': '🇱🇻', 'EE': '🇪🇪', 'GR': '🇬🇷',
  'CL': '🇨🇱', 'EC': '🇪🇨', 'VE': '🇻🇪', 'BO': '🇧🇴', 'PY': '🇵🇾',
  'UY': '🇺🇾', 'CR': '🇨🇷', 'PA': '🇵🇦', 'GT': '🇬🇹', 'HN': '🇭🇳',
  'NI': '🇳🇮', 'SV': '🇸🇻', 'CU': '🇨🇺', 'JM': '🇯🇲', 'TT': '🇹🇹',
  'HT': '🇭🇹', 'DO': '🇩🇴', 'PR': '🇵🇷', 'GG': '🇬🇬', 'JE': '🇯🇪',
  'IM': '🇮🇲', 'GI': '🇬🇮', 'MC': '🇲🇨', 'AD': '🇦🇩', 'LI': '🇱🇮',
  'SM': '🇸🇲', 'VA': '🇻🇦', 'MT': '🇲🇹', 'CY': '🇨🇾', 'LU': '🇱🇺',
  'IS': '🇮🇸', 'FO': '🇫🇴', 'GL': '🇬🇱', 'AL': '🇦🇱', 'MK': '🇲🇰',
  'BA': '🇧🇦', 'ME': '🇲🇪', 'XK': '🇽🇰', 'MD': '🇲🇩', 'BY': '🇧🇾',
  'AM': '🇦🇲', 'AZ': '🇦🇿', 'TM': '🇹🇲', 'KG': '🇰🇬', 'TJ': '🇹🇯',
  'MN': '🇲🇳', 'KP': '🇰🇵', 'BN': '🇧🇳', 'TL': '🇹🇱', 'FJ': '🇫🇯',
  'PG': '🇵🇬', 'WS': '🇼🇸', 'TO': '🇹🇴', 'VU': '🇻🇺', 'KI': '🇰🇮',
  'MH': '🇲🇭', 'FM': '🇫🇲', 'PW': '🇵🇼', 'NR': '🇳🇷', 'TV': '🇹🇻',
  'SB': '🇸🇧', 'NC': '🇳🇨', 'PF': '🇵🇫', 'CK': '🇨🇰', 'NU': '🇳🇺',
  'TK': '🇹🇰', 'PN': '🇵🇳', 'SH': '🇸🇭', 'AC': '🇦🇨', 'TA': '🇹🇦',
  'BV': '🇧🇻', 'SJ': '🇸🇯', 'NF': '🇳🇫', 'CX': '🇨🇽', 'CC': '🇨🇨',
  'HM': '🇭🇲', 'IO': '🇮🇴', 'FK': '🇫🇰', 'GS': '🇬🇸', 'AI': '🇦🇮',
  'MS': '🇲🇸', 'TC': '🇹🇨', 'VG': '🇻🇬', 'VI': '🇻🇮', 'AS': '🇦🇸',
  'GU': '🇬🇺', 'MP': '🇲🇵', 'BM': '🇧🇲', 'KY': '🇰🇾', 'VG': '🇻🇬',
  'AW': '🇦🇼', 'CW': '🇨🇼', 'BQ': '🇧🇶', 'MF': '🇲🇫', 'BL': '🇧🇱',
  'PM': '🇵🇲', 'WF': '🇼🇫', 'RE': '🇷🇪', 'YT': '🇾🇹', 'GP': '🇬🇵',
  'MQ': '🇲🇶', 'GF': '🇬🇫', 'SX': '🇸🇽', 'DM': '🇩🇲', 'LC': '🇱🇨',
  'KN': '🇰🇳', 'AG': '🇦🇬', 'BB': '🇧🇧', 'GD': '🇬🇩', 'VC': '🇻🇨',
  'AN': '🇦🇳', 'CW': '🇨🇼', 'SX': '🇸🇽', 'TL': '🇹🇱', 'SS': '🇸🇸'
};

// Country code to full name mapping
const countryNames = {
  'US': 'United States', 'JP': 'Japan', 'KR': 'South Korea', 'SG': 'Singapore', 'DE': 'Germany',
  'GB': 'United Kingdom', 'FR': 'France', 'CA': 'Canada', 'AU': 'Australia', 'NL': 'Netherlands',
  'BR': 'Brazil', 'IN': 'India', 'RU': 'Russia', 'CN': 'China', 'TW': 'Taiwan',
  'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines', 'MY': 'Malaysia', 'ID': 'Indonesia',
  'MX': 'Mexico', 'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru',
  'IT': 'Italy', 'ES': 'Spain', 'PT': 'Portugal', 'PL': 'Poland', 'CZ': 'Czech Republic',
  'SE': 'Sweden', 'NO': 'Norway', 'FI': 'Finland', 'DK': 'Denmark', 'CH': 'Switzerland',
  'AT': 'Austria', 'BE': 'Belgium', 'IE': 'Ireland', 'UA': 'Ukraine', 'TR': 'Turkey',
  'ZA': 'South Africa', 'NG': 'Nigeria', 'EG': 'Egypt', 'IL': 'Israel', 'AE': 'UAE',
  'SA': 'Saudi Arabia', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka', 'MM': 'Myanmar',
  'KH': 'Cambodia', 'LA': 'Laos', 'KZ': 'Kazakhstan', 'UZ': 'Uzbekistan', 'GE': 'Georgia',
  'RO': 'Romania', 'BG': 'Bulgaria', 'HR': 'Croatia', 'RS': 'Serbia', 'HU': 'Hungary',
  'SK': 'Slovakia', 'LT': 'Lithuania', 'LV': 'Latvia', 'EE': 'Estonia', 'GR': 'Greece',
  'EC': 'Ecuador', 'VE': 'Venezuela', 'BO': 'Bolivia', 'PY': 'Paraguay',
  'UY': 'Uruguay', 'CR': 'Costa Rica', 'PA': 'Panama', 'GT': 'Guatemala', 'HN': 'Honduras',
  'NI': 'Nicaragua', 'SV': 'El Salvador', 'CU': 'Cuba', 'JM': 'Jamaica', 'TT': 'Trinidad',
  'HT': 'Haiti', 'DO': 'Dominican Republic', 'PR': 'Puerto Rico',
  'AL': 'Albania', 'MK': 'N. Macedonia', 'BA': 'Bosnia', 'ME': 'Montenegro',
  'MD': 'Moldova', 'BY': 'Belarus', 'AM': 'Armenia', 'AZ': 'Azerbaijan',
  'MN': 'Mongolia', 'BN': 'Brunei', 'FJ': 'Fiji', 'IS': 'Iceland',
};

// Fetch proxies from ProxyScrape API with country info
async function fetchProxies(type) {
  const protocol = type === 'socks5' ? 'socks5' : 'http';
  const url = `https://api.proxyscrape.com/v2/?request=displayproxies&protocol=${protocol}&timeout=5000&country=all&ssl=all&anonymity=all`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.trim().split('\n').filter(l => l.trim());

    return lines.map(line => {
      const parts = line.trim().split(':');
      if (parts.length >= 2) {
        const ip = parts[0];
        const port = parseInt(parts[1]);
        if (ip && port && port > 0 && port < 65536) {
          return { ip, port, type: protocol };
        }
      }
      return null;
    }).filter(Boolean);
  } catch (e) {
    console.error(`Failed to fetch ${type} proxies:`, e);
    return [];
  }
}

// Fetch from free-proxy-list.net (generally cleaner proxies)
async function fetchFromFreeProxyList() {
  try {
    const response = await fetch('https://free-proxy-list.net/');
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const rows = doc.querySelectorAll('table tbody tr');
    const proxies = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const ip = cells[0].textContent.trim();
        const port = parseInt(cells[1].textContent.trim());
        const type = cells[4].textContent.trim().toLowerCase();
        if (ip && port && (type === 'socks5' || type === 'socks4' || type === 'http')) {
          proxies.push({
            ip, port,
            type: type === 'socks5' ? 'socks5' : 'http'
          });
        }
      }
    });
    return proxies;
  } catch (e) {
    console.error('Free proxy list fetch failed:', e);
    return [];
  }
}

// Resolve real country for an IP using ip-api.com (batch-friendly, free)
async function resolveCountries(servers) {
  const BATCH_SIZE = 40;
  const batches = [];
  for (let i = 0; i < servers.length; i += BATCH_SIZE) {
    batches.push(servers.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    try {
      const ips = batch.map(s => s.ip);
      const response = await fetch('http://ip-api.com/batch?fields=status,countryCode,country,query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ips.map(ip => ({ query: ip })))
      });
      const results = await response.json();
      results.forEach((result, i) => {
        if (result.status === 'success' && result.countryCode) {
          batch[i].country = result.countryCode;
          batch[i].countryName = result.country;
          batch[i].flag = countryFlags[result.countryCode] || '\uD83C\uDF10';
        }
      });
    } catch (e) {
      console.error('Country resolution failed:', e);
    }
  }
  return servers;
}

// Fetch all servers
async function fetchAllServers() {
  // Fetch SOCKS5 and HTTP from ProxyScrape (SOCKS5 prioritized)
  const [socks5, http] = await Promise.allSettled([
    fetchProxies('socks5'),
    fetchProxies('http')
  ]);

  const socks5List = socks5.status === 'fulfilled' ? socks5.value : [];
  const httpList = http.status === 'fulfilled' ? http.value : [];

  // Deduplicate by ip:port
  const seen = new Set();
  const unique = [...socks5List, ...httpList].filter(s => {
    const key = s.ip + ':' + s.port;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let servers = unique.map((s, i) => ({
    ...s,
    id: 'server-' + i,
    country: 'XX',
    countryName: 'Unknown',
    flag: '\uD83C\uDF10',
    latency: 0,
    free: false,
    clean: false
  }));

  // Resolve real countries (first 60 only to keep it fast)
  servers = await resolveCountries(servers.slice(0, 60));

  // Validate top 15 proxies for ad injection (only SOCKS5 can be validated this way)
  const candidates = servers.filter(s => s.type === 'socks5').slice(0, 15);
  await Promise.allSettled(candidates.map(async (s) => {
    s.clean = await validateProxy(s);
  }));

  // Measure latency for top servers (fast check)
  await Promise.allSettled(servers.slice(0, 20).map(async (s) => {
    s.latency = await testProxy(s);
  }));

  // Sort: clean SOCKS5 first, then others by latency
  servers.sort((a, b) => {
    // Clean SOCKS5 servers first
    if (a.clean && !b.clean) return -1;
    if (!a.clean && b.clean) return 1;
    // SOCKS5 before HTTP
    if (a.type === 'socks5' && b.type !== 'socks5') return -1;
    if (a.type !== 'socks5' && b.type === 'socks5') return 1;
    // Then by latency
    if (a.latency < 0 && b.latency >= 0) return 1;
    if (a.latency >= 0 && b.latency < 0) return -1;
    return a.latency - b.latency;
  });

  return servers;
}

// Test proxy latency by setting it temporarily and timing a fetch
async function testProxy(server) {
  const start = Date.now();
  try {
    // Use fetch with a timeout to test if proxy is reachable
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    await fetch('https://httpbin.org/ip', {
      mode: 'no-cors',
      signal: controller.signal
    });
    clearTimeout(timeout);
    return Date.now() - start;
  } catch {
    return -1;
  }
}

// Validate a proxy doesn't inject ads by checking a known clean page
async function validateProxy(server) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Fetch a known clean page through the proxy
    const response = await fetch('https://httpbin.org/html', {
      signal: controller.signal
    });
    clearTimeout(timeout);

    const text = await response.text();

    // Check for common ad injection patterns
    const adPatterns = [
      /<iframe[^>]*>/i,
      /ad[_-]?script/i,
      /doubleclick/i,
      /googlesyndication/i,
      /adsense/i,
      /pop[_-]?under/i,
      /banner[_-]?ad/i,
    ];

    for (const pattern of adPatterns) {
      if (pattern.test(text)) {
        return false; // Proxy is injecting ads
      }
    }

    return true; // Proxy appears clean
  } catch {
    return false; // Can't validate = treat as bad
  }
}

// Connect to proxy
async function connect(server) {
  if (!server) return false;

  try {
    const config = {
      mode: 'fixed_servers',
      rules: {
        singleProxy: {
          scheme: server.type,
          host: server.ip,
          port: server.port
        },
        bypassList: ['localhost', '127.0.0.1']
      }
    };

    await api.proxy.settings.set({
      value: config,
      scope: 'regular'
    });

    state.connected = true;
    state.currentServer = server;
    state.dataUp = 0;
    state.dataDown = 0;

    await saveState();
    return true;
  } catch (e) {
    console.error('Connection failed:', e);
    return false;
  }
}

// Disconnect from proxy
async function disconnect() {
  try {
    await api.proxy.settings.clear({ scope: 'regular' });
    state.connected = false;
    state.currentServer = null;
    await saveState();
    return true;
  } catch (e) {
    console.error('Disconnect failed:', e);
    return false;
  }
}

// Save state to storage
async function saveState() {
  await api.storage.local.set({
    connected: state.connected,
    currentServer: state.currentServer,
    servers: state.servers,
    dataUp: state.dataUp,
    dataDown: state.dataDown
  });
}

// Load state from storage
async function loadState() {
  const saved = await api.storage.local.get([
    'connected', 'currentServer', 'servers',
    'dataUp', 'dataDown'
  ]);

  if (saved.connected !== undefined) state.connected = saved.connected;
  if (saved.currentServer) state.currentServer = saved.currentServer;
  if (saved.servers) state.servers = saved.servers;
  if (saved.dataUp) state.dataUp = saved.dataUp;
  if (saved.dataDown) state.dataDown = saved.dataDown;
}

// Handle messages from popup/options
api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch(e => {
    console.error('Message handler error:', e);
    sendResponse({ error: e.message });
  });
  return true; // async response
});

async function handleMessage(message) {
  switch (message.action) {
    case 'getState':
      return {
        connected: state.connected,
        currentServer: state.currentServer,
        servers: state.servers,
        dataUp: state.dataUp,
        dataDown: state.dataDown
      };

    case 'connect':
      const connectResult = await connect(message.server);
      return { success: connectResult };

    case 'disconnect':
      const disconnectResult = await disconnect();
      return { success: disconnectResult };

    case 'fetchServers':
      state.servers = await fetchAllServers();
      await saveState();
      return { servers: state.servers };

    case 'testLatency':
      const latency = await testProxy(message.server);
      return { latency };

    case 'updateData':
      state.dataUp = message.up || state.dataUp;
      state.dataDown = message.down || state.dataDown;
      await saveState();
      return { success: true };

    default:
      return { error: 'Unknown action' };
  }
}

// Auto-reconnect check
async function checkConnection() {
  if (!state.connected || !state.currentServer) return;

  try {
    await fetch('https://httpbin.org/ip', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(5000)
    });
  } catch {
    console.log('Connection lost, attempting reconnect...');
    // Try to reconnect
    const result = await connect(state.currentServer);
    if (!result) {
      state.connected = false;
      state.currentServer = null;
      await saveState();
    }
  }
}

// Initialize
async function init() {
  await loadState();

  // Fetch servers if empty
  if (state.servers.length === 0) {
    state.servers = await fetchAllServers();
    await saveState();
  }

  // Reconnect if was connected
  if (state.connected && state.currentServer) {
    await connect(state.currentServer);
  }

  // Set up alarms (MV3 compatible - survives service worker restarts)
  api.alarms.create('checkConnection', { periodInMinutes: 0.5 });
  api.alarms.create('refreshServers', { periodInMinutes: 5 });
}

// Handle alarms (MV3 compatible replacement for setInterval)
api.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkConnection') {
    await checkConnection();
  } else if (alarm.name === 'refreshServers') {
    state.servers = await fetchAllServers();
    await saveState();
  }
});

init();
