import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Root Stack Param List
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Auth Stack Param List
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Param List
export type MainTabParamList = {
  Dashboard: undefined;
  Wallet: undefined;
  Network: undefined;
  OrderBook: undefined;
  Trades: undefined;
  Settings: undefined;
};

// Wallet Stack Param List
export type WalletStackParamList = {
  WalletHome: undefined;
  CreateWallet: undefined;
  OpenWallet: undefined;
  WalletDetails: { walletId: string };
  SendTransaction: undefined;
  ReceiveTransaction: undefined;
  TransactionHistory: undefined;
  TransactionDetails: { txId: string };
};

// Network Stack Param List
export type NetworkStackParamList = {
  NetworkHome: undefined;
  ConnectPeer: undefined;
  PeerDetails: { peerId: string };
  NetworkSettings: undefined;
};

// OrderBook Stack Param List
export type OrderBookStackParamList = {
  OrderBookHome: undefined;
  CreateOrder: undefined;
  OrderDetails: { orderId: string };
  TakeOrder: { orderId: string };
};

// Trades Stack Param List
export type TradesStackParamList = {
  TradesHome: undefined;
  TradeDetails: { tradeId: string };
  AcceptTrade: { tradeId: string };
  ExecuteTrade: { tradeId: string };
  ConfirmTrade: { tradeId: string };
};

// Settings Stack Param List
export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  Security: undefined;
  Appearance: undefined;
  Notifications: undefined;
  About: undefined;
};

// Navigation Types
export type RootNavigationProp = StackNavigationProp<RootStackParamList>;
export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;
export type WalletNavigationProp = StackNavigationProp<WalletStackParamList>;
export type NetworkNavigationProp = StackNavigationProp<NetworkStackParamList>;
export type OrderBookNavigationProp = StackNavigationProp<OrderBookStackParamList>;
export type TradesNavigationProp = StackNavigationProp<TradesStackParamList>;
export type SettingsNavigationProp = StackNavigationProp<SettingsStackParamList>;

// Route Types
export type WalletDetailsRouteProp = RouteProp<WalletStackParamList, 'WalletDetails'>;
export type TransactionDetailsRouteProp = RouteProp<WalletStackParamList, 'TransactionDetails'>;
export type PeerDetailsRouteProp = RouteProp<NetworkStackParamList, 'PeerDetails'>;
export type OrderDetailsRouteProp = RouteProp<OrderBookStackParamList, 'OrderDetails'>;
export type TakeOrderRouteProp = RouteProp<OrderBookStackParamList, 'TakeOrder'>;
export type TradeDetailsRouteProp = RouteProp<TradesStackParamList, 'TradeDetails'>;
export type AcceptTradeRouteProp = RouteProp<TradesStackParamList, 'AcceptTrade'>;
export type ExecuteTradeRouteProp = RouteProp<TradesStackParamList, 'ExecuteTrade'>;
export type ConfirmTradeRouteProp = RouteProp<TradesStackParamList, 'ConfirmTrade'>;