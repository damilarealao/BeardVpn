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
          s.countryShort.toLowerCase().includes(q) ||
          s.hostName.toLowerCase().includes(q) ||
          s.ip.includes(q) ||
          s.operator.toLowerCase().includes(q)
      );
    }
    return list;
  }, [servers, selectedCountry, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleSelect = (server: VPNServer) => {
    onSelectServer(server);
    onGoBack();
  };

  const freeCount = servers.filter((s) => s.isFree).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f1e', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
        <Pressable
          onPress={onGoBack}
          style={({ pressed }) => ({
            marginRight: 12,
            padding: 8,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ color: '#60a5fa', fontSize: 24 }}>{'\u2039'}</Text>
        </Pressable>
        <Text style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 'bold', flex: 1 }}>
          Servers
        </Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#1e293b',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 12,
        }}>
          <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '700' }}>
            {freeCount} free
          </Text>
          <Text style={{ color: '#4b5563', fontSize: 12 }}>/</Text>
          <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>
            {servers.length}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{
          backgroundColor: '#111827',
          borderWidth: 1,
          borderColor: '#1f2937',
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
        }}>
          <Text style={{ color: '#4b5563', fontSize: 16, marginRight: 8 }}>{'\u{1F50D}'}</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by country, IP, or provider..."
            placeholderTextColor='#4b5563'
            style={{
              flex: 1,
              paddingVertical: 12,
              color: '#f1f5f9',
              fontSize: 14,
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} style={{ padding: 4 }}>
              <Text style={{ color: '#6b7280', fontSize: 16 }}>{'\u2715'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Country chips */}
      {countries.length > 0 && (
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
                    backgroundColor: isSelected ? '#2563eb' : '#111827',
                    borderColor: isSelected ? '#3b82f6' : '#1f2937',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    fontWeight: isSelected ? '700' : '500',
                  }}>
                    {flag ? `${flag} ` : ''}{item || 'All'}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {/* Server list */}
      {isLoading && !refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>Loading servers from VPN Gate...</Text>
          <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 12 }}>This may take a few seconds</Text>
        </View>
      ) : servers.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{'\u{1F310}'}</Text>
          <Text style={{ color: '#f1f5f9', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
            No servers loaded
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
            Check your internet connection and pull to refresh
          </Text>
          <Pressable
            onPress={handleRefresh}
            style={{
              backgroundColor: '#2563eb',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredServers}
          keyExtractor={(item, i) => item.ip + '-' + i}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3b82f6"
            />
          }
          ListHeaderComponent={
            filteredServers.length > 0 && !search && !selectedCountry ? (
              <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <Text style={{ color: '#6b7280', fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
                  SHOWING {filteredServers.length} SERVERS
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>{'\u{1F50E}'}</Text>
              <Text style={{ color: '#f1f5f9', fontSize: 15, fontWeight: '600', marginBottom: 4 }}>
                No servers match "{search}"
              </Text>
              <Text style={{ color: '#6b7280', fontSize: 13 }}>
                Try a different search or clear filters
              </Text>
              <Pressable
                onPress={() => { setSearch(''); setSelectedCountry(null); }}
                style={{ marginTop: 12, backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
              >
                <Text style={{ color: '#60a5fa', fontSize: 13, fontWeight: '600' }}>Clear filters</Text>
              </Pressable>
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
