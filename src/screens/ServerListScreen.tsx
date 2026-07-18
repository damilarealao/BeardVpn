import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServerCard } from '../components/ServerCard';
import { VPNServer } from '../types';
import { getUniqueCountries } from '../services/serverService';
import { COUNTRY_FLAGS } from '../config/constants';

interface ServerListScreenProps {
  servers: VPNServer[];
  selectedServer: VPNServer | null;
  onSelectServer: (server: VPNServer) => void;
  isLoading: boolean;
  onRefresh: () => void;
  premiumUnlocked: boolean;
  onGoBack: () => void;
}

export function ServerListScreen({
  servers,
  selectedServer,
  onSelectServer,
  isLoading,
  onRefresh,
  premiumUnlocked,
  onGoBack,
}: ServerListScreenProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const countries = useMemo(() => getUniqueCountries(servers), [servers]);

  const filteredServers = useMemo(() => {
    let list = servers;
    if (selectedCountry) {
      list = list.filter((s) => s.countryLong === selectedCountry);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.countryLong.toLowerCase().includes(q) ||
          s.hostName.toLowerCase().includes(q) ||
          s.operator.toLowerCase().includes(q)
      );
    }
    return list;
  }, [servers, selectedCountry, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSelect = (server: VPNServer) => {
    onSelectServer(server);
    onGoBack();
  };

  const freeCount = servers.filter((s) => s.isFree).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={onGoBack} style={{ marginRight: 12, padding: 8 }}>
          <Text style={{ color: '#60a5fa', fontSize: 24 }}>{'\u2039'}</Text>
        </Pressable>
        <Text style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 'bold', flex: 1 }}>Servers</Text>
        <View style={{ backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ color: '#4ade80', fontSize: 13, fontWeight: '600' }}>{freeCount} free</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search servers..."
          placeholderTextColor='#475569'
          style={{
            backgroundColor: '#1e293b',
            borderWidth: 1,
            borderColor: '#334155',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#f1f5f9',
            fontSize: 15,
          }}
        />
      </View>

      <View style={{ marginBottom: 8 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...countries]}
          keyExtractor={(item) => item || 'all'}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isSelected = selectedCountry === item;
            const flag = item ? COUNTRY_FLAGS[item] || '' : '';
            return (
              <Pressable
                onPress={() => setSelectedCountry(item)}
                style={{
                  marginRight: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  backgroundColor: isSelected ? '#2563eb' : '#1e293b',
                  borderColor: isSelected ? '#3b82f6' : '#334155',
                }}
              >
                <Text style={{ fontSize: 13, color: isSelected ? '#ffffff' : '#94a3b8', fontWeight: isSelected ? '600' : '400' }}>
                  {flag ? `${flag} ` : ''}{item || 'All'}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading && !refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading servers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredServers}
          keyExtractor={(item) => item.ip}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Text style={{ color: '#64748b', fontSize: 15 }}>No servers found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ServerCard
              server={item}
              isSelected={selectedServer?.ip === item.ip}
              onSelect={handleSelect}
            />
          )}
        />
      )}
    </View>
  );
}
