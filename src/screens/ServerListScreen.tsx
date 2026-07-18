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

  return (
    <View className="flex-1 bg-vpn-950" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={onGoBack} className="mr-3 p-2">
          <Text className="text-vpn-400 text-xl">{'\u2039'}</Text>
        </Pressable>
        <Text className="text-white text-xl font-bold flex-1">Servers</Text>
        <Text className="text-gray-400 text-sm">
          {servers.filter((s) => s.isFree).length} free
        </Text>
      </View>

      <View className="px-4 mb-3">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search servers..."
          placeholderTextColor="#64748b"
          className="bg-vpn-900/60 border border-vpn-800/50 rounded-xl px-4 py-3 text-white"
        />
      </View>

      <View className="mb-3">
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
                className={`mr-2 px-3 py-1.5 rounded-full border ${
                  isSelected
                    ? 'bg-vpn-600 border-vpn-500'
                    : 'bg-vpn-900/40 border-vpn-800/30'
                }`}
              >
                <Text className={`text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                  {flag ? `${flag} ` : ''}{item || 'All'}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-400 mt-3">Loading servers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredServers}
          keyExtractor={(item) => item.ip}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-gray-400">No servers found</Text>
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
