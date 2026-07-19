import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
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
  const [countdown, setCountdown] = useState(CLOSE_DELAY_SECONDS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      setCountdown(CLOSE_DELAY_SECONDS);
      setIsLoading(true);
      setLoadError(null);

      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 8000);

      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => onCloseRef.current(), 200);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.adLabel}>Advertisement</Text>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{countdown}s</Text>
          </View>
        </View>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading ad...</Text>
          </View>
        )}
        <WebView
          source={{ html: AD_HTML, baseUrl: 'https://quge5.com' }}
          style={[styles.webview, { opacity: isLoading ? 0 : 1 }]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          startInLoadingState={false}
          mixedContentMode="always"
          userAgent="Mozilla/5.0 (Linux; Android 14; Infinix X6525D) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          onLoadStart={() => {
            setIsLoading(true);
            setLoadError(null);
          }}
          onLoadEnd={() => {
            setIsLoading(false);
          }}
          onError={(event) => {
            setLoadError('Ad failed to load');
            setIsLoading(false);
            console.warn('MonetagAd load error:', event.nativeEvent.description);
          }}
          onShouldStartLoadWithRequest={() => true}
        />
        {loadError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        )}
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    zIndex: 1,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(127,29,29,0.9)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
});
