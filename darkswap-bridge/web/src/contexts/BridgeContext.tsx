import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Define types for the bridge messages
interface WalletMessage {
  type: 'wallet';
  action: string;
  payload: any;
}

interface NetworkMessage {
  type: 'network';
  action: string;
  payload: any;
}

interface SystemMessage {
  type: 'system';
  action: string;
  payload: any;
}

type BridgeMessage = WalletMessage | NetworkMessage | SystemMessage;

interface BridgeContextType {
  isConnected: boolean;
  walletStatus: string;
  networkStatus: string;
  sendWalletMessage: (action: string, payload: any) => Promise<any>;
  sendNetworkMessage: (action: string, payload: any) => Promise<any>;
  sendSystemMessage: (action: string, payload: any) => Promise<any>;
  walletBalance: { confirmed: number; unconfirmed: number };
  connectedPeers: string[];
  orders: any[];
  trades: any[];
}

const BridgeContext = createContext<BridgeContextType | undefined>(undefined);

export const useBridge = () => {
  const context = useContext(BridgeContext);
  if (context === undefined) {
    throw new Error('useBridge must be used within a BridgeProvider');
  }
  return context;
};

export const BridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletStatus, setWalletStatus] = useState<string>('disconnected');
  const [networkStatus, setNetworkStatus] = useState<string>('disconnected');
  const [walletBalance, setWalletBalance] = useState<{ confirmed: number; unconfirmed: number }>({
    confirmed: 0,
    unconfirmed: 0,
  });
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    // Connect to the WebSocket server
    const newSocket = io('http://localhost:3001');

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to bridge server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from bridge server');
    });

    newSocket.on('wallet_status', (status: string) => {
      setWalletStatus(status);
    });

    newSocket.on('network_status', (status: string) => {
      setNetworkStatus(status);
    });

    newSocket.on('wallet_balance', (balance: { confirmed: number; unconfirmed: number }) => {
      setWalletBalance(balance);
    });

    newSocket.on('connected_peers', (peers: string[]) => {
      setConnectedPeers(peers);
    });

    newSocket.on('orders', (orderList: any[]) => {
      setOrders(orderList);
    });

    newSocket.on('trades', (tradeList: any[]) => {
      setTrades(tradeList);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const sendWalletMessage = async (action: string, payload: any): Promise<any> => {
    try {
      const response = await axios.post('/api/bridge/wallet', { action, payload });
      return response.data;
    } catch (error) {
      console.error('Error sending wallet message:', error);
      throw error;
    }
  };

  const sendNetworkMessage = async (action: string, payload: any): Promise<any> => {
    try {
      const response = await axios.post('/api/bridge/network', { action, payload });
      return response.data;
    } catch (error) {
      console.error('Error sending network message:', error);
      throw error;
    }
  };

  const sendSystemMessage = async (action: string, payload: any): Promise<any> => {
    try {
      const response = await axios.post('/api/bridge/system', { action, payload });
      return response.data;
    } catch (error) {
      console.error('Error sending system message:', error);
      throw error;
    }
  };

  const value = {
    isConnected,
    walletStatus,
    networkStatus,
    sendWalletMessage,
    sendNetworkMessage,
    sendSystemMessage,
    walletBalance,
    connectedPeers,
    orders,
    trades,
  };

  return <BridgeContext.Provider value={value}>{children}</BridgeContext.Provider>;
};