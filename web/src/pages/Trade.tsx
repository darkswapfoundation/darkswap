import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Orderbook from '../components/Orderbook';
import TradeForm from '../components/TradeForm';
import PeerStatus from '../components/PeerStatus';
import PriceChart from '../components/PriceChart';
import NotificationTest from '../components/NotificationTest';
import { useNotification } from '../contexts/NotificationContext';

// Icons
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import ApiClient from '../utils/ApiClient';

export interface TradeProps {
  isWalletConnected: boolean;
  isSDKInitialized: boolean;
  apiClient: ApiClient;
  isApiLoading: boolean;
}

const Trade: React.FC<TradeProps> = ({ isWalletConnected, isSDKInitialized, apiClient, isApiLoading }) => {
  const [selectedPair, setSelectedPair] = useState<string>('BTC/RUNE:0x123');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [peerCount, setPeerCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const { addNotification } = useNotification();

  // Simulated data for popular pairs
  const popularPairs = [
    { id: 'BTC/RUNE:0x123', name: 'BTC/RUNE:0x123', volume: '1.2M', change: '+5.2%', changeType: 'positive' },
    { id: 'BTC/ALKANE:0x456', name: 'BTC/ALKANE:0x456', volume: '850K', change: '+3.7%', changeType: 'positive' },
    { id: 'RUNE:0x123/ALKANE:0x456', name: 'RUNE/ALKANE', volume: '420K', change: '-1.2%', changeType: 'negative' },
    { id: 'BTC/RUNE:0x789', name: 'BTC/RUNE:0x789', volume: '320K', change: '+2.1%', changeType: 'positive' },
  ];

  // Fetch market data from API
  useEffect(() => {
    if (isSDKInitialized && !isApiLoading) {
      setIsLoading(true);
      
      const fetchMarketData = async () => {
        try {
          // Parse the pair to get base and quote assets
          const [baseAsset, quoteAsset] = selectedPair.split('/');
          
          // Fetch market data
          const marketResponse = await apiClient.getMarketData(baseAsset, quoteAsset);
          
          if (marketResponse.error) {
            addNotification('error', `Failed to fetch market data: ${marketResponse.error}`);
          } else if (marketResponse.data) {
            // Update peer and order counts
            setPeerCount(Math.floor(Math.random() * 50) + 20); // Still random for demo
            
            // Fetch orders to get order count
            const ordersResponse = await apiClient.getOrders(baseAsset, quoteAsset);
            if (ordersResponse.data) {
              setOrderCount(ordersResponse.data.length);
            }
            
            addNotification('info', 'Market data updated successfully');
          }
        } catch (error) {
          addNotification('error', `Error fetching market data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchMarketData();
    }
  }, [isSDKInitialized, selectedPair, apiClient, isApiLoading, addNotification]);

  const handlePairSelect = async (pairId: string) => {
    setSelectedPair(pairId);
    setIsLoading(true);
    
    try {
      // Parse the pair to get base and quote assets
      const [baseAsset, quoteAsset] = pairId.split('/');
      
      // Fetch market data for the selected pair
      const marketResponse = await apiClient.getMarketData(baseAsset, quoteAsset);
      
      if (marketResponse.error) {
        addNotification('error', `Failed to fetch market data: ${marketResponse.error}`);
      } else {
        addNotification('success', `Selected trading pair: ${pairId}`);
      }
    } catch (error) {
      addNotification('error', `Error selecting pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="text-white">Trade</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Peer-to-peer trading of Bitcoin, runes, and alkanes
          </p>
        </div>
        
        <PeerStatus peerCount={peerCount} orderCount={orderCount} />
      </div>

      {/* Connection Warning */}
      {!isWalletConnected && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-4 border border-ui-warning border-opacity-50"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Connect your wallet to start trading
            </span>
          </div>
        </motion.div>
      )}

      {/* SDK Warning */}
      {isWalletConnected && !isSDKInitialized && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-4 border border-ui-warning border-opacity-50"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Initializing DarkSwap SDK...
            </span>
          </div>
        </motion.div>
      )}

      {/* Notification Test */}
      <NotificationTest />

      {/* Popular Pairs */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Popular Pairs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Pair</th>
                <th>24h Volume</th>
                <th>24h Change</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {popularPairs.map((pair) => (
                <tr 
                  key={pair.id}
                  className={selectedPair === pair.id ? 'bg-twilight-primary bg-opacity-20' : ''}
                >
                  <td>{pair.name}</td>
                  <td>${pair.volume}</td>
                  <td className={pair.changeType === 'positive' ? 'text-green-400' : 'text-red-400'}>
                    {pair.change}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handlePairSelect(pair.id)}
                      className={`btn btn-sm ${selectedPair === pair.id ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {selectedPair === pair.id ? 'Selected' : 'Select'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-twilight-darker p-4 rounded-lg border border-twilight-dark">
        <h2 className="text-lg font-display font-medium mb-4">Price Chart</h2>
        <PriceChart pair={selectedPair} isLoading={isLoading} apiClient={apiClient} />
      </div>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orderbook */}
        <div className="lg:col-span-2">
          <Orderbook
            pair={selectedPair}
            isLoading={isLoading}
            isWalletConnected={isWalletConnected}
            isSDKInitialized={isSDKInitialized}
            apiClient={apiClient}
          />
        </div>

        {/* Trade Form */}
        <div className="lg:col-span-1">
          <TradeForm
            pair={selectedPair}
            isLoading={isLoading}
            isWalletConnected={isWalletConnected}
            isSDKInitialized={isSDKInitialized}
            apiClient={apiClient}
          />
        </div>
      </div>

      {/* Trading Info */}
      <div className="card p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="w-5 h-5 text-twilight-neon-blue mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium text-white">How DarkSwap Trading Works</h3>
            <p className="text-gray-400 text-sm mt-1">
              DarkSwap is a decentralized peer-to-peer trading platform that uses Bitcoin's blockchain for secure transactions.
              All trades are executed using Partially Signed Bitcoin Transactions (PSBTs) for maximum security.
              Your keys, your coins - always.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;