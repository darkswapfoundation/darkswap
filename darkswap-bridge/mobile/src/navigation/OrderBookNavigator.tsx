import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import OrderBookHomeScreen from '../screens/OrderBookHomeScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import TakeOrderScreen from '../screens/TakeOrderScreen';

// Import types
import { OrderBookStackParamList } from './types';

// Create stack navigator
const Stack = createStackNavigator<OrderBookStackParamList>();

// OrderBook navigator component
const OrderBookNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="OrderBookHome"
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="OrderBookHome"
        component={OrderBookHomeScreen}
        options={{ title: 'Order Book' }}
      />
      <Stack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        options={{ title: 'Create Order' }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen
        name="TakeOrder"
        component={TakeOrderScreen}
        options={{ title: 'Take Order' }}
      />
    </Stack.Navigator>
  );
};

export default OrderBookNavigator;