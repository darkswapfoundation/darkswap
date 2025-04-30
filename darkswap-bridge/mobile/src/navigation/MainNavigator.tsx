import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import WalletNavigator from './WalletNavigator';
import NetworkNavigator from './NetworkNavigator';
import OrderBookNavigator from './OrderBookNavigator';
import TradesNavigator from './TradesNavigator';
import SettingsNavigator from './SettingsNavigator';

// Import types
import { MainTabParamList } from './types';

// Create bottom tab navigator
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main navigator component
const MainNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="wallet" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Network"
        component={NetworkNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="access-point-network" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="OrderBook"
        component={OrderBookNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="book-open" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Trades"
        component={TradesNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="swap-horizontal" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;