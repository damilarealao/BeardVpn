export const AD_CONFIG = {
  // Monetag OnClick (Popunder) zone
  monetag: {
    zoneId: '260947',
    scriptUrl: 'https://quge5.com/88/tag.min.js',
    // Show ad after these events
    showAfterConnect: true,
    showAfterDisconnect: false,
    // Minimum seconds between ads
    cooldownSeconds: 60,
  },
  // PlayaYield (Chrome extension - set when you get production key)
  playayield: {
    apiKey: 'pk_test_c118a7e6ea6747528803a4eb9365c731',
    enabled: false, // Set to true with production key
  },
};
