// BeardVpn Popup Script
// Handles UI interactions and communicates with background service worker

const api = typeof browser !== 'undefined' ? browser : chrome;

// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const connectLabel = document.getElementById('connectLabel');
const statusText = document.getElementById('statusText');
const connectionTime = document.getElementById('connectionTime');
const serverFlag = document.getElementById('serverFlag');
const serverName = document.getElementById('serverName');
const changeServerBtn = document.getElementById('changeServerBtn');
const dataUp = document.getElementById('dataUp');
const dataDown = document.getElementById('dataDown');
const serverListSection = document.getElementById('serverListSection');
const serverList = document.getElementById('serverList');
const refreshBtn = document.getElementById('refreshBtn');
const premiumBadge = document.getElementById('premiumBadge');
const premiumText = document.getElementById('premiumText');
const premiumDialog = document.getElementById('premiumDialog');
const premiumTimer = document.getElementById('premiumTimer');
const timerProgress = document.getElementById('timerProgress');
const timerText = document.getElementById('timerText');
const watchAdBtn = document.getElementById('watchAdBtn');
const cancelPremiumBtn = document.getElementById('cancelPremiumBtn');

// State
let currentState = {
  connected: false,
  currentServer: null,
  servers: [],
  premium: false,
  premiumExpiry: 0
};

let connectionStartTime = null;
let timeInterval = null;
let selectedServerForPremium = null;

// Initialize popup
async function init() {
  await loadState();
  updateUI();
  startDataTracking();
  loadAdBanner();

  // Event listeners
  connectBtn.addEventListener('click', toggleConnection);
  changeServerBtn.addEventListener('click', toggleServerList);
  refreshBtn.addEventListener('click', refreshServers);
  watchAdBtn.addEventListener('click', watchAd);
  cancelPremiumBtn.addEventListener('click', closePremiumDialog);

  // Load servers if empty
  if (currentState.servers.length === 0) {
    await refreshServers();
  }
}

// Load state from background
async function loadState() {
  try {
    const response = await sendMessage({ action: 'getState' });
    if (response) {
      currentState = { ...currentState, ...response };
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
}

// Send message to background
function sendMessage(message) {
  return new Promise((resolve) => {
    api.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
}

// Update UI based on current state
function updateUI() {
  // Update connection status
  if (currentState.connected) {
    statusText.textContent = 'Connected';
    statusText.className = 'status-text connected';
    connectBtn.classList.add('connected');
    connectLabel.textContent = 'Disconnect';
  } else {
    statusText.textContent = 'Disconnected';
    statusText.className = 'status-text';
    connectBtn.classList.remove('connected');
    connectLabel.textContent = 'Connect';
  }

  // Update current server
  if (currentState.currentServer) {
    serverFlag.textContent = currentState.currentServer.flag;
    const displayName = currentState.currentServer.countryName || currentState.currentServer.country;
    serverName.textContent = displayName + ' - ' + currentState.currentServer.ip;
  } else {
    serverFlag.textContent = '🌍';
    serverName.textContent = 'Select a server';
  }

  // Update premium badge
  if (currentState.premium) {
    premiumBadge.classList.add('active');
    premiumText.textContent = 'PREMIUM';
  } else {
    premiumBadge.classList.remove('active');
    premiumText.textContent = 'FREE';
  }

  // Update data stats
  dataUp.textContent = formatBytes(currentState.dataUp);
  dataDown.textContent = formatBytes(currentState.dataDown);

  // Update server list
  renderServerList();
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Toggle connection
async function toggleConnection() {
  if (currentState.connected) {
    // Disconnect
    statusText.textContent = 'Disconnecting...';
    connectBtn.style.pointerEvents = 'none';

    await sendMessage({ action: 'disconnect' });
    currentState.connected = false;
    currentState.currentServer = null;
    connectionStartTime = null;

    if (timeInterval) {
      clearInterval(timeInterval);
      timeInterval = null;
    }

    updateUI();
    connectBtn.style.pointerEvents = 'auto';
  } else {
    // Connect
    if (!currentState.currentServer) {
      // Select first available server
      if (currentState.servers.length > 0) {
        const firstServer = currentState.servers[0];
        if (firstServer.free || currentState.premium) {
          currentState.currentServer = firstServer;
        } else {
          selectedServerForPremium = firstServer;
          showPremiumDialog();
          return;
        }
      } else {
        alert('No servers available. Please refresh.');
        return;
      }
    }

    statusText.textContent = 'Connecting...';
    statusText.className = 'status-text connecting';
    connectBtn.style.pointerEvents = 'none';

    const result = await sendMessage({
      action: 'connect',
      server: currentState.currentServer
    });

    if (result && result.success) {
      currentState.connected = true;
      connectionStartTime = Date.now();
      startTimeTracking();
    } else {
      statusText.textContent = 'Connection failed';
      statusText.className = 'status-text';
    }

    updateUI();
    connectBtn.style.pointerEvents = 'auto';
  }
}

// Toggle server list visibility
function toggleServerList() {
  if (serverListSection.style.display === 'none') {
    serverListSection.style.display = 'block';
    serverListSection.classList.add('slide-up');
  } else {
    serverListSection.style.display = 'none';
  }
}

// Render server list
function renderServerList() {
  serverList.innerHTML = '';

  if (currentState.servers.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'server-item';
    const span = document.createElement('span');
    span.style.color = '#64748b';
    span.textContent = 'No servers available';
    empty.appendChild(span);
    serverList.appendChild(empty);
    return;
  }

  // Group servers by country name
  const grouped = {};
  currentState.servers.forEach(server => {
    const name = server.countryName || server.country || 'Unknown';
    if (!grouped[name]) {
      grouped[name] = [];
    }
    grouped[name].push(server);
  });

  // Sort countries by number of servers
  const sortedCountries = Object.keys(grouped).sort(
    (a, b) => grouped[b].length - grouped[a].length
  );

  sortedCountries.forEach(countryName => {
    grouped[countryName].forEach(server => {
      const item = document.createElement('div');
      item.className = 'server-item';
      if (currentState.currentServer && currentState.currentServer.id === server.id) {
        item.classList.add('selected');
      }

      const latencyClass = server.latency < 100 ? 'latency-good' :
                          server.latency < 200 ? 'latency-medium' : 'latency-bad';

      const flagSpan = document.createElement('span');
      flagSpan.className = 'server-item-flag';
      flagSpan.textContent = server.flag;

      const info = document.createElement('div');
      info.className = 'server-item-info';

      const name = document.createElement('div');
      name.className = 'server-item-name';
      name.textContent = countryName;

      const details = document.createElement('div');
      details.className = 'server-item-details';
      details.textContent = server.ip + ':' + server.port + ' \u2022 ' + server.type.toUpperCase();

      info.appendChild(name);
      info.appendChild(details);

      const badge = document.createElement('span');
      badge.className = 'server-item-badge ' + (server.free ? 'badge-free' : 'badge-pro');
      badge.textContent = server.free ? 'FREE' : 'PRO';

      const cleanIndicator = document.createElement('span');
      cleanIndicator.className = 'server-item-clean';
      if (server.clean) {
        cleanIndicator.textContent = '\u2705'; // Checkmark for clean
        cleanIndicator.title = 'Ad-free verified';
      } else if (server.type === 'socks5') {
        cleanIndicator.textContent = '\uD83D\uDD12'; // Lock for SOCKS5
        cleanIndicator.title = 'SOCKS5 (harder to inject ads)';
      } else {
        cleanIndicator.textContent = '\u26A0\uFE0F'; // Warning for HTTP
        cleanIndicator.title = 'HTTP proxy (may have ads)';
      }

      const latency = document.createElement('span');
      latency.className = 'server-item-latency ' + latencyClass;
      latency.textContent = server.latency + 'ms';

      item.appendChild(flagSpan);
      item.appendChild(info);
      item.appendChild(badge);
      item.appendChild(cleanIndicator);
      item.appendChild(latency);

      item.addEventListener('click', () => selectServer(server));
      serverList.appendChild(item);
    });
  });
}

// Select a server
function selectServer(server) {
  // Check if premium required
  if (!server.free && !currentState.premium) {
    selectedServerForPremium = server;
    showPremiumDialog();
    return;
  }

  currentState.currentServer = server;
  updateUI();

  // If connected, reconnect to new server
  if (currentState.connected) {
    reconnectToServer(server);
  }
}

// Reconnect to a different server
async function reconnectToServer(server) {
  statusText.textContent = 'Switching...';
  connectBtn.style.pointerEvents = 'none';

  await sendMessage({ action: 'disconnect' });
  const result = await sendMessage({ action: 'connect', server });

  if (result && result.success) {
    currentState.connected = true;
    connectionStartTime = Date.now();
  } else {
    currentState.connected = false;
    currentState.currentServer = null;
  }

  updateUI();
  connectBtn.style.pointerEvents = 'auto';
}

// Refresh servers
async function refreshServers() {
  refreshBtn.classList.add('loading');
  serverList.textContent = '';
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'server-item';
  const loadingSpan = document.createElement('span');
  loadingSpan.style.color = '#64748b';
  loadingSpan.textContent = 'Loading servers...';
  loadingDiv.appendChild(loadingSpan);
  serverList.appendChild(loadingDiv);

  const response = await sendMessage({ action: 'fetchServers' });
  if (response && response.servers) {
    currentState.servers = response.servers;
  }

  refreshBtn.classList.remove('loading');
  renderServerList();
}

// Show premium dialog
function showPremiumDialog() {
  premiumDialog.style.display = 'flex';
  premiumTimer.style.display = 'none';
  watchAdBtn.style.display = 'block';
}

// Close premium dialog
function closePremiumDialog() {
  premiumDialog.style.display = 'none';
  premiumTimer.style.display = 'none';
  watchAdBtn.style.display = 'block';
  selectedServerForPremium = null;
}

// Watch ad simulation
function watchAd() {
  watchAdBtn.style.display = 'none';
  premiumTimer.style.display = 'block';

  let countdown = 5;
  timerText.textContent = countdown;
  timerProgress.style.strokeDashoffset = 283;

  const interval = setInterval(() => {
    countdown--;
    timerText.textContent = countdown;
    timerProgress.style.strokeDashoffset = 283 - ((5 - countdown) / 5) * 283;

    if (countdown <= 0) {
      clearInterval(interval);
      activatePremium();
    }
  }, 1000);
}

// Activate premium
async function activatePremium() {
  await sendMessage({ action: 'activatePremium' });
  currentState.premium = true;
  closePremiumDialog();

  // Connect to the selected premium server
  if (selectedServerForPremium) {
    currentState.currentServer = selectedServerForPremium;
    await reconnectToServer(selectedServerForPremium);
  }

  updateUI();
}

// Start connection time tracking
function startTimeTracking() {
  if (timeInterval) clearInterval(timeInterval);

  timeInterval = setInterval(() => {
    if (connectionStartTime) {
      const elapsed = Math.floor((Date.now() - connectionStartTime) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;

      connectionTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

// Start data tracking (simulated)
function startDataTracking() {
  setInterval(async () => {
    if (currentState.connected) {
      // Simulate data transfer
      const upDelta = Math.floor(Math.random() * 1000);
      const downDelta = Math.floor(Math.random() * 5000);
      currentState.dataUp += upDelta;
      currentState.dataDown += downDelta;

      dataUp.textContent = formatBytes(currentState.dataUp);
      dataDown.textContent = formatBytes(currentState.dataDown);
    }
  }, 1000);
}

// Load and render ad banner via iframe (CSP-safe)
async function loadAdBanner() {
  const adBanner = document.getElementById('adBanner');
  if (!adBanner) return;

  try {
    const result = await new Promise(resolve => {
      api.storage.local.get('adConfig', resolve);
    });

    // If user has custom ad HTML, use that directly
    if (result.adConfig && result.adConfig.enabled && result.adConfig.html) {
      adBanner.innerHTML = result.adConfig.html;
      adBanner.classList.add('has-ad');
      if (result.adConfig.scripts) {
        const scriptEl = document.createElement('script');
        scriptEl.textContent = result.adConfig.scripts;
        adBanner.appendChild(scriptEl);
      }
      return;
    }
  } catch (e) {
    console.log('No custom ad config, using default');
  }

  // Default: load Monetag ad via iframe (CSP-safe)
  const iframe = document.createElement('iframe');
  iframe.src = 'https://damilarealao.github.io/ad.html';
  iframe.style.width = '100%';
  iframe.style.height = '80px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '10px';
  iframe.style.overflow = 'hidden';
  adBanner.appendChild(iframe);
  adBanner.classList.add('has-ad');
}

// Initialize on load
init();
