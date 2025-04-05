import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import SettingsHomeScreen from '../screens/SettingsHomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SecurityScreen from '../screens/SecurityScreen';
import AppearanceScreen from '../screens/AppearanceScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AboutScreen from '../screens/AboutScreen';

// Import types
import { SettingsStackParamList } from './types';

// Create stack navigator
const Stack = createStackNavigator<SettingsStackParamList>();

// Settings navigator component
const SettingsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="SettingsHome"
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Security"
        component={SecurityScreen}
        options={{ title: 'Security' }}
      />
      <Stack.Screen
        name="Appearance"
        component={AppearanceScreen}
        options={{ title: 'Appearance' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'About' }}
      />
    </Stack.Navigator>
  );
};

export default SettingsNavigator;