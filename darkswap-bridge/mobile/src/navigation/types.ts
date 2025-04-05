import { NavigatorScreenParams } from '@react-navigation/native';

// Define the root stack param list
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  AssetDetails: { asset: string };
  TransactionDetails: { id: string };
  Send: { asset?: string; amount?: number; address?: string };
  Receive: { asset?: string };
  Scan: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  CreateWallet: undefined;
  OpenWallet: undefined;
  NotFound: undefined;
  About: undefined;
};

// Define the main tab param list
export type MainTabParamList = {
  Home: undefined;
  Wallet: undefined;
  Trade: undefined;
  Network: undefined;
  Settings: undefined;
};

// Define the wallet stack param list
export type WalletStackParamList = {
  WalletHome: undefined;
  WalletDetails: { id: string };
  TransactionHistory: undefined;
  Send: { asset?: string; amount?: number; address?: string };
  Receive: { asset?: string };
  TransactionDetails: { id: string };
};

// Define the trade stack param list
export type TradeStackParamList = {
  TradeHome: undefined;
  OrderBook: { pair?: string };
  PlaceOrder: { pair: string; type: 'buy' | 'sell' };
  OrderDetails: { id: string };
};

// Define the network stack param list
export type NetworkStackParamList = {
  NetworkHome: undefined;
  PeerDetails: { id: string };
  NetworkStats: undefined;
};

// Define the settings stack param list
export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  Security: undefined;
  Notifications: undefined;
  About: undefined;
};