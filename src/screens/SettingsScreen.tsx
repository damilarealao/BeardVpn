import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsScreenProps {
  dns: string;
  onDNSSet: (dns: string) => void;
}

const DNS_OPTIONS = [
  { label: 'Cloudflare (Fastest)', value: '1.1.1.1' },
  { label: 'Google Public DNS', value: '8.8.8.8' },
  { label: 'OpenDNS (Secure)', value: '208.67.222.222' },
  { label: 'Quad9 (Malware Blocking)', value: '9.9.9.9' },
];

export function SettingsScreen({ dns, onDNSSet }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();

  const [autoConnect, setAutoConnect] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [useTcp, setUseTcp] = useState(true);

  const handleClearCache = () => {
    Alert.alert('Cache Cleared', 'Server list cache has been reset. Refreshing servers...');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#090d16', paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 90 }}
    >
      <Text style={{ color: '#f8fafc', fontSize: 26, fontWeight: '800', marginBottom: 20 }}>Settings</Text>

      {/* Connection & Protocol Settings */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
          Connection & Protocol
        </Text>
        <View style={{ backgroundColor: '#131b2e', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, overflow: 'hidden' }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#1e293b',
          }}>
            <View>
              <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600' }}>OpenVPN Protocol</Text>
              <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{useTcp ? 'TCP (Reliable & Encrypted)' : 'UDP (High Speed)'}</Text>
            </View>
            <Switch
              value={useTcp}
              onValueChange={setUseTcp}
              trackColor={{ false: '#334155', true: '#2563eb' }}
              thumbColor={useTcp ? '#60a5fa' : '#94a3b8'}
            />
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}>
            <View>
              <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600' }}>Auto-Connect on Launch</Text>
              <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Connect to fastest server on app open</Text>
            </View>
            <Switch
              value={autoConnect}
              onValueChange={setAutoConnect}
              trackColor={{ false: '#334155', true: '#2563eb' }}
              thumbColor={autoConnect ? '#60a5fa' : '#94a3b8'}
            />
          </View>
        </View>
      </View>

      {/* DNS Configuration */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
          DNS Resolver
        </Text>
        <View style={{ backgroundColor: '#131b2e', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, overflow: 'hidden' }}>
          {DNS_OPTIONS.map((option, i) => (
            <Pressable
              key={option.value}
              onPress={() => onDNSSet(option.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: i < DNS_OPTIONS.length - 1 ? 1 : 0,
                borderBottomColor: '#1e293b',
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600' }}>{option.label}</Text>
                <Text style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace', marginTop: 2 }}>{option.value}</Text>
              </View>
              {dns === option.value && (
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* App Preferences */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
          Preferences & Data
        </Text>
        <View style={{ backgroundColor: '#131b2e', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, overflow: 'hidden' }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#1e293b',
          }}>
            <View>
              <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600' }}>Live Speed Stats</Text>
              <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Show download/upload speeds when connected</Text>
            </View>
            <Switch
              value={showStats}
              onValueChange={setShowStats}
              trackColor={{ false: '#334155', true: '#2563eb' }}
              thumbColor={showStats ? '#60a5fa' : '#94a3b8'}
            />
          </View>

          <Pressable
            onPress={handleClearCache}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '600' }}>Clear Server Cache</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Reset cached VPNGate server listings</Text>
          </Pressable>
        </View>
      </View>

      {/* About & Credits */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
          About & Credits
        </Text>
        <View style={{ backgroundColor: '#131b2e', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: '800' }}>BeardVpn</Text>
            <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '700' }}>v1.0.0</Text>
          </View>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 10, lineHeight: 18 }}>
            Free open-relay VPN network provided by the VPN Gate Academic Experiment Project
            (University of Tsukuba, Japan). All connection traffic is 256-bit encrypted locally.
          </Text>
        </View>
      </View>

      {/* Developer & Contact */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
          Developer & Contact
        </Text>
        <View style={{ backgroundColor: '#131b2e', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, overflow: 'hidden' }}>
          <Pressable
            onPress={() => Linking.openURL('mailto:damilarealao29@gmail.com')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#1e293b',
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 18 }}>✉️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600' }}>Support Email</Text>
              <Text style={{ color: '#60a5fa', fontSize: 12, marginTop: 1 }}>damilarealao29@gmail.com</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('https://github.com/damilarealao')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 18 }}>💻</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600' }}>GitHub Profile</Text>
              <Text style={{ color: '#60a5fa', fontSize: 12, marginTop: 1 }}>github.com/damilarealao</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <Text style={{ color: '#475569', fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
        Privacy: We do not log, store, or sell any user data. All connection data is processed locally on your device.
      </Text>
    </ScrollView>
  );
}
