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

// State
let currentState = {
  connected: false,
  currentServer: null,
  servers: [],
  dataUp: 0,
  dataDown: 0
};

let connectionStartTime = null;
let timeInterval = null;

// Initialize popup
async function init() {
  await loadState();
  updateUI();
  startDataTracking();

  connectBtn.addEventListener('click', toggleConnection);
  changeServerBtn.addEventListener('click', toggleServerList);
  refreshBtn.addEventListener('click', refreshServers);

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

  if (currentState.currentServer) {
    serverFlag.textContent = currentState.currentServer.flag;
    const displayName = currentState.currentServer.countryName || currentState.currentServer.country;
    serverName.textContent = displayName + ' - ' + currentState.currentServer.ip;
  } else {
    serverFlag.textContent = '\uD83C\uDF0D';
    serverName.textContent = 'Select a server';
  }

  dataUp.textContent = formatBytes(currentState.dataUp);
  dataDown.textContent = formatBytes(currentState.dataDown);

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
    if (!currentState.currentServer) {
      if (currentState.servers.length > 0) {
        currentState.currentServer = currentState.servers[0];
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

  const grouped = {};
  currentState.servers.forEach(server => {
    const name = server.countryName || server.country || 'Unknown';
    if (!grouped[name]) {
      grouped[name] = [];
    }
    grouped[name].push(server);
  });

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

      const cleanIndicator = document.createElement('span');
      cleanIndicator.className = 'server-item-clean';
      if (server.clean) {
        cleanIndicator.textContent = '\u2705';
        cleanIndicator.title = 'Ad-free verified';
      } else if (server.type === 'socks5') {
        cleanIndicator.textContent = '\uD83D\uDD12';
        cleanIndicator.title = 'SOCKS5 (harder to inject ads)';
      } else {
        cleanIndicator.textContent = '\u26A0\uFE0F';
        cleanIndicator.title = 'HTTP proxy (may have ads)';
      }

      const latency = document.createElement('span');
      latency.className = 'server-item-latency ' + latencyClass;
      latency.textContent = server.latency + 'ms';

      item.appendChild(flagSpan);
      item.appendChild(info);
      item.appendChild(cleanIndicator);
      item.appendChild(latency);

      item.addEventListener('click', () => selectServer(server));
      serverList.appendChild(item);
    });
  });
}

// Select a server
function selectServer(server) {
  currentState.currentServer = server;
  updateUI();

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
      const upDelta = Math.floor(Math.random() * 1000);
      const downDelta = Math.floor(Math.random() * 5000);
      currentState.dataUp += upDelta;
      currentState.dataDown += downDelta;

      dataUp.textContent = formatBytes(currentState.dataUp);
      dataDown.textContent = formatBytes(currentState.dataDown);
    }
  }, 1000);
}

// Initialize on load
init();
