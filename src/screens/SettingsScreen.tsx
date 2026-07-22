import React from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsScreenProps {
  dns: string;
  onDNSSet: (dns: string) => void;
}

const DNS_OPTIONS = [
  { label: 'Cloudflare', value: '1.1.1.1' },
  { label: 'Google', value: '8.8.8.8' },
  { label: 'OpenDNS', value: '208.67.222.222' },
  { label: 'Quad9', value: '9.9.9.9' },
];

export function SettingsScreen({ dns, onDNSSet }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0a0f1e', paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
    >
      <Text style={{ color: '#f1f5f9', fontSize: 26, fontWeight: 'bold', marginBottom: 24 }}>Settings</Text>

      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          DNS Server
        </Text>
        <View style={{ backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14, overflow: 'hidden' }}>
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
                borderBottomColor: '#334155',
              }}
            >
              <Text style={{ color: '#e2e8f0', fontSize: 15 }}>{option.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>{option.value}</Text>
                {dns === option.value && (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#ffffff', fontSize: 12 }}>{'\u2713'}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </View>



      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          About
        </Text>
        <View style={{ backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14, padding: 16 }}>
          <Text style={{ color: '#f1f5f9', fontSize: 18, fontWeight: '700' }}>BeardVpn</Text>
          <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Version 1.0.0</Text>
          <Text style={{ color: '#475569', fontSize: 12, marginTop: 10, lineHeight: 18 }}>
            Free VPN servers provided by VPN Gate Academic Experiment Project
            (University of Tsukuba, Japan). Servers are community-contributed
            and may be unavailable at times.
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Developer
        </Text>
        <View style={{ backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14, overflow: 'hidden' }}>
          <Pressable
            onPress={() => Linking.openURL('mailto:damilarealao29@gmail.com')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#334155',
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 18 }}>{'\u2709'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#e2e8f0', fontSize: 14 }}>Email</Text>
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
            <Text style={{ fontSize: 18 }}>{'\u{1F4BB}'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#e2e8f0', fontSize: 14 }}>GitHub</Text>
              <Text style={{ color: '#60a5fa', fontSize: 12, marginTop: 1 }}>github.com/damilarealao</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <Text style={{ color: '#475569', fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
        Privacy: We do not log, store, or sell any user data.
        All connection data is processed locally on your device.
      </Text>
    </ScrollView>
  );
}
