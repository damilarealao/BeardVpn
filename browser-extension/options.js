// BeardVpn Options Page Script
// Handles settings and configuration

const api = typeof browser !== 'undefined' ? browser : chrome;

// DOM Elements
const autoReconnect = document.getElementById('autoReconnect');
const protocol = document.getElementById('protocol');
const editBypassBtn = document.getElementById('editBypassBtn');
const showDataCounter = document.getElementById('showDataCounter');
const resetDataBtn = document.getElementById('resetDataBtn');
const clearDataBtn = document.getElementById('clearDataBtn');

// Load settings
async function loadSettings() {
  const settings = await api.storage.local.get([
    'autoReconnect', 'protocol', 'showDataCounter', 'bypassList'
  ]);

  if (settings.autoReconnect !== false) {
    autoReconnect.classList.add('active');
  } else {
    autoReconnect.classList.remove('active');
  }

  if (settings.showDataCounter !== false) {
    showDataCounter.classList.add('active');
  } else {
    showDataCounter.classList.remove('active');
  }

  if (settings.protocol) {
    protocol.value = settings.protocol;
  }
}

// Save settings
async function saveSettings() {
  await api.storage.local.set({
    autoReconnect: autoReconnect.classList.contains('active'),
    showDataCounter: showDataCounter.classList.contains('active'),
    protocol: protocol.value
  });
}

// Toggle handlers
autoReconnect.addEventListener('click', () => {
  autoReconnect.classList.toggle('active');
  saveSettings();
});

showDataCounter.addEventListener('click', () => {
  showDataCounter.classList.toggle('active');
  saveSettings();
});

protocol.addEventListener('change', saveSettings);

// Edit bypass list
editBypassBtn.addEventListener('click', () => {
  const bypassList = prompt('Enter domains to bypass (comma-separated):', 'localhost,127.0.0.1');
  if (bypassList !== null) {
    api.storage.local.set({
      bypassList: bypassList.split(',').map(d => d.trim()).filter(d => d)
    });
  }
});

// Reset data counter
resetDataBtn.addEventListener('click', async () => {
  if (confirm('Reset all data statistics?')) {
    await api.storage.local.set({ dataUp: 0, dataDown: 0 });
    await api.runtime.sendMessage({ action: 'updateData', up: 0, down: 0 });
    alert('Data counter reset.');
  }
});

// Clear all data
clearDataBtn.addEventListener('click', async () => {
  if (confirm('This will clear all settings and disconnect from any active proxy. Continue?')) {
    await api.runtime.sendMessage({ action: 'disconnect' });
    await api.storage.local.clear();
    alert('All data cleared. Please reload the extension.');
    loadSettings();
  }
});

// Initialize
loadSettings();
