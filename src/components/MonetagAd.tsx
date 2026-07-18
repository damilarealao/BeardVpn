import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { AD_CONFIG } from '../config/adConfig';

interface MonetagAdProps {
  visible: boolean;
  onClose: () => void;
}

const AD_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .ad-container {
      width: 100%;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="ad-container" id="ad-container"></div>
  <script>
    var atOptions = {
      'key': '${AD_CONFIG.monetag.zoneId}',
      'format': 'interstitial',
      'height': 90,
      'width': 728,
      'params': {}
    };
  </script>
  <script src="${AD_CONFIG.monetag.scriptUrl}" async data-cfasync="false"></script>
</body>
</html>`;

const CLOSE_DELAY_SECONDS = 5;

export function MonetagAd({ visible, onClose }: MonetagAdProps) {
  const [canClose, setCanClose] = useState(false);
  const [countdown, setCountdown] = useState(CLOSE_DELAY_SECONDS);

  useEffect(() => {
    if (visible) {
      setCanClose(false);
      setCountdown(CLOSE_DELAY_SECONDS);

      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={() => canClose && onClose()}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.adLabel}>Advertisement</Text>
          {canClose ? (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕ Close</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{countdown}s</Text>
            </View>
          )}
        </View>
        <WebView
          source={{ html: AD_HTML }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="always"
          onShouldStartLoadWithRequest={() => true}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 12,
    backgroundColor: '#1e293b',
  },
  adLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  closeBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  countdownBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countdownText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});
