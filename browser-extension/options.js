// BeardVpn Options Page Script
// Handles settings and configuration

const api = typeof browser !== 'undefined' ? browser : chrome;

// DOM Elements
const premiumBadge = document.getElementById('premiumBadge');
const premiumExpiry = document.getElementById('premiumExpiry');
const activatePremiumBtn = document.getElementById('activatePremiumBtn');
const autoReconnect = document.getElementById('autoReconnect');
const protocol = document.getElementById('protocol');
const editBypassBtn = document.getElementById('editBypassBtn');
const showDataCounter = document.getElementById('showDataCounter');
const resetDataBtn = document.getElementById('resetDataBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const adHtml = document.getElementById('adHtml');
const adScripts = document.getElementById('adScripts');
const saveAdBtn = document.getElementById('saveAdBtn');
const previewAdBtn = document.getElementById('previewAdBtn');
const clearAdBtn = document.getElementById('clearAdBtn');
const adPreview = document.getElementById('adPreview');
const adStatus = document.getElementById('adStatus');

// Load settings
async function loadSettings() {
  const settings = await api.storage.local.get([
    'premium', 'premiumExpiry', 'autoReconnect', 'protocol',
    'showDataCounter', 'bypassList'
  ]);

  // Update premium status
  if (settings.premium) {
    premiumBadge.classList.add('active');
    premiumBadge.classList.remove('inactive');
    premiumBadge.textContent = 'PREMIUM';

    if (settings.premiumExpiry) {
      const remaining = settings.premiumExpiry - Date.now();
      if (remaining > 0) {
        const minutes = Math.floor(remaining / 60000);
        premiumExpiry.textContent = `Expires in ${minutes} minutes`;
      } else {
        premiumBadge.classList.remove('active');
        premiumBadge.classList.add('inactive');
        premiumBadge.textContent = 'EXPIRED';
        premiumExpiry.textContent = '';
      }
    }
  } else {
    premiumBadge.classList.add('inactive');
    premiumBadge.classList.remove('active');
    premiumBadge.textContent = 'FREE';
    premiumExpiry.textContent = '';
  }

  // Update toggles
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

  // Update protocol
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

// Activate premium
activatePremiumBtn.addEventListener('click', async () => {
  await api.runtime.sendMessage({ action: 'activatePremium' });
  loadSettings();
});

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

// Load ad config
async function loadAdConfig() {
  const result = await api.storage.local.get('adConfig');
  if (result.adConfig) {
    adHtml.value = result.adConfig.html || '';
    adScripts.value = result.adConfig.scripts || '';
    if (result.adConfig.enabled) {
      adStatus.textContent = 'Ad is active';
      adStatus.style.color = '#22c55e';
    }
  }
}

// Save ad config
saveAdBtn.addEventListener('click', async () => {
  const html = adHtml.value.trim();
  const scripts = adScripts.value.trim();
  const enabled = html.length > 0;

  await api.storage.local.set({
    adConfig: { html, scripts, enabled }
  });

  adStatus.textContent = enabled ? 'Ad saved and enabled' : 'Ad cleared';
  adStatus.style.color = enabled ? '#22c55e' : '#64748b';
});

// Preview ad
previewAdBtn.addEventListener('click', () => {
  const html = adHtml.value.trim();
  if (!html) {
    adStatus.textContent = 'Nothing to preview';
    adStatus.style.color = '#f59e0b';
    return;
  }

  adPreview.style.display = 'block';
  adPreview.innerHTML = html;

  // Execute scripts in preview
  const scripts = adScripts.value.trim();
  if (scripts) {
    const scriptEl = document.createElement('script');
    scriptEl.textContent = scripts;
    adPreview.appendChild(scriptEl);
  }
});

// Clear ad
clearAdBtn.addEventListener('click', async () => {
  adHtml.value = '';
  adScripts.value = '';
  adPreview.style.display = 'none';
  adPreview.innerHTML = '';
  await api.storage.local.set({
    adConfig: { html: '', scripts: '', enabled: false }
  });
  adStatus.textContent = 'Ad cleared';
  adStatus.style.color = '#64748b';
});

// Initialize
loadSettings();
loadAdConfig();
