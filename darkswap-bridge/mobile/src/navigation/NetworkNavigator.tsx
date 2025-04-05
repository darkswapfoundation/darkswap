import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import NetworkHomeScreen from '../screens/NetworkHomeScreen';
import ConnectPeerScreen from '../screens/ConnectPeerScreen';
import PeerDetailsScreen from '../screens/PeerDetailsScreen';
import NetworkSettingsScreen from '../screens/NetworkSettingsScreen';

// Import types
import { NetworkStackParamList } from './types';

// Create stack navigator
const Stack = createStackNavigator<NetworkStackParamList>();

// Network navigator component
const NetworkNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="NetworkHome"
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="NetworkHome"
        component={NetworkHomeScreen}
        options={{ title: 'Network' }}
      />
      <Stack.Screen
        name="ConnectPeer"
        component={ConnectPeerScreen}
        options={{ title: 'Connect to Peer' }}
      />
      <Stack.Screen
        name="PeerDetails"
        component={PeerDetailsScreen}
        options={{ title: 'Peer Details' }}
      />
      <Stack.Screen
        name="NetworkSettings"
        component={NetworkSettingsScreen}
        options={{ title: 'Network Settings' }}
      />
    </Stack.Navigator>
  );
};

export default NetworkNavigator;