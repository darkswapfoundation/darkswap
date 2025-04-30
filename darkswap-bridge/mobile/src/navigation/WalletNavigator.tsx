import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import WalletHomeScreen from '../screens/WalletHomeScreen';
import CreateWalletScreen from '../screens/CreateWalletScreen';
import OpenWalletScreen from '../screens/OpenWalletScreen';
import WalletDetailsScreen from '../screens/WalletDetailsScreen';
import SendTransactionScreen from '../screens/SendTransactionScreen';
import ReceiveTransactionScreen from '../screens/ReceiveTransactionScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import TransactionDetailsScreen from '../screens/TransactionDetailsScreen';

// Import types
import { WalletStackParamList } from './types';

// Create stack navigator
const Stack = createStackNavigator<WalletStackParamList>();

// Wallet navigator component
const WalletNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="WalletHome"
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="WalletHome"
        component={WalletHomeScreen}
        options={{ title: 'Wallet' }}
      />
      <Stack.Screen
        name="CreateWallet"
        component={CreateWalletScreen}
        options={{ title: 'Create Wallet' }}
      />
      <Stack.Screen
        name="OpenWallet"
        component={OpenWalletScreen}
        options={{ title: 'Open Wallet' }}
      />
      <Stack.Screen
        name="WalletDetails"
        component={WalletDetailsScreen}
        options={{ title: 'Wallet Details' }}
      />
      <Stack.Screen
        name="SendTransaction"
        component={SendTransactionScreen}
        options={{ title: 'Send' }}
      />
      <Stack.Screen
        name="ReceiveTransaction"
        component={ReceiveTransactionScreen}
        options={{ title: 'Receive' }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{ title: 'Transaction History' }}
      />
      <Stack.Screen
        name="TransactionDetails"
        component={TransactionDetailsScreen}
        options={{ title: 'Transaction Details' }}
      />
    </Stack.Navigator>
  );
};

export default WalletNavigator;