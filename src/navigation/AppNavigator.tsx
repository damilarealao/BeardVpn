import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '\u2302',
    Servers: '\u2630',
    Settings: '\u2699',
  };
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, color, opacity: focused ? 1 : 0.6 }}>
        {icons[name] || '\u25CF'}
      </Text>
    </View>
  );
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
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#1e293b',
            borderTopWidth: 1,
            paddingBottom: bottomPad,
            paddingTop: 8,
            height: 60 + bottomPad,
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
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="Home" color={color} focused={focused} />
            ),
          }}
        >
          {({ navigation }) => (
            <HomeScreen
              connection={connection}
              selectedServer={selectedServer}
              servers={servers}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              onServerListPress={() => navigation.navigate('Servers' as never)}
              onSelectServer={onSelectServer}
              isLoading={isLoading}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Servers"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="Servers" color={color} focused={focused} />
            ),
          }}
        >
          {({ navigation }) => (
            <ServerListScreen
              servers={servers}
              selectedServer={selectedServer}
              onSelectServer={onSelectServer}
              isLoading={isLoading}
              onRefresh={onRefresh}
              premiumUnlocked={premiumUnlocked}
              onGoBack={() => navigation.navigate('Home' as never)}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Settings"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="Settings" color={color} focused={focused} />
            ),
          }}
        >
          {() => <SettingsScreen dns={dns} onDNSSet={onDNSSet} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
