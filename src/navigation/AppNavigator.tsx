import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ServerListScreen } from '../screens/ServerListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VPNConnectionState, VPNServer } from '../types';

const Tab = createBottomTabNavigator();

interface AppNavigatorProps {
  connection: VPNConnectionState;
  servers: VPNServer[];
  selectedServer: VPNServer | null;
  onSelectServer: (server: VPNServer) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading: boolean;
  onRefresh: () => void;
  premiumUnlocked: boolean;
  dns: string;
  onDNSSet: (dns: string) => void;
}

export function AppNavigator({
  connection,
  servers,
  selectedServer,
  onSelectServer,
  onConnect,
  onDisconnect,
  isLoading,
  onRefresh,
  premiumUnlocked,
  dns,
  onDNSSet,
}: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#1e293b',
            paddingBottom: 8,
            paddingTop: 8,
            height: 65,
          },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 22, color }}>{'\u{25B2}'}</Text>
            ),
          }}
        >
          {() => (
            <HomeScreen
              connection={connection}
              selectedServer={selectedServer}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              onServerListPress={() => {}}
              premiumUnlocked={premiumUnlocked}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Servers"
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 22, color }}>{'\u{25A0}'}</Text>
            ),
          }}
        >
          {() => (
            <ServerListScreen
              servers={servers}
              selectedServer={selectedServer}
              onSelectServer={onSelectServer}
              isLoading={isLoading}
              onRefresh={onRefresh}
              premiumUnlocked={premiumUnlocked}
              onGoBack={() => {}}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Settings"
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 22, color }}>{'\u{2699}'}</Text>
            ),
          }}
        >
          {() => <SettingsScreen dns={dns} onDNSSet={onDNSSet} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
