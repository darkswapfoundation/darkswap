import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import TradesHomeScreen from '../screens/TradesHomeScreen';
import TradeDetailsScreen from '../screens/TradeDetailsScreen';
import AcceptTradeScreen from '../screens/AcceptTradeScreen';
import ExecuteTradeScreen from '../screens/ExecuteTradeScreen';
import ConfirmTradeScreen from '../screens/ConfirmTradeScreen';

// Import types
import { TradesStackParamList } from './types';

// Create stack navigator
const Stack = createStackNavigator<TradesStackParamList>();

// Trades navigator component
const TradesNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="TradesHome"
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="TradesHome"
        component={TradesHomeScreen}
        options={{ title: 'Trades' }}
      />
      <Stack.Screen
        name="TradeDetails"
        component={TradeDetailsScreen}
        options={{ title: 'Trade Details' }}
      />
      <Stack.Screen
        name="AcceptTrade"
        component={AcceptTradeScreen}
        options={{ title: 'Accept Trade' }}
      />
      <Stack.Screen
        name="ExecuteTrade"
        component={ExecuteTradeScreen}
        options={{ title: 'Execute Trade' }}
      />
      <Stack.Screen
        name="ConfirmTrade"
        component={ConfirmTradeScreen}
        options={{ title: 'Confirm Trade' }}
      />
    </Stack.Navigator>
  );
};

export default TradesNavigator;