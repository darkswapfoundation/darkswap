import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../contexts/ApiContext';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { useNotification } from '../contexts/NotificationContext';
import PeerStatus from '../components/PeerStatus';
import PriceChart from '../components/PriceChart';
import AdvancedOrderForm from '../components/AdvancedOrderForm';
import OrderbookVisualization from '../components/OrderbookVisualization';
import MarketDataVisualization from '../components/MarketDataVisualization';
import RecentTrades from '../components/RecentTrades';
import AssetDetails from '../components/AssetDetails';
import TradingPairSelector from '../components/TradingPairSelector';
import CryptoChart from '../components/CryptoChart';

// Icons
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

// Trading pair mapping
const tradingPairMap: Record<string, { baseAsset: string, quoteAsset: string, baseAssetType: 'btc' | 'rune' | 'alkane', quoteAssetType: 'btc' | 'rune' | 'alkane' }> = {
  'btc-rune1': { baseAsset: 'RUNE1', quoteAsset: 'BTC', baseAssetType: 'rune', quoteAssetType: 'btc' },
  'btc-rune2': { baseAsset: 'RUNE2', quoteAsset: 'BTC', baseAssetType: 'rune', quoteAssetType: 'btc' },
  'btc-rune3': { baseAsset: 'RUNE3', quoteAsset: 'BTC', baseAssetType: 'rune', quoteAssetType: 'btc' },
  'btc-alk1': { baseAsset: 'ALK1', quoteAsset: 'BTC', baseAssetType: 'alkane', quoteAssetType: 'btc' },
  'btc-alk2': { baseAsset: 'ALK2', quoteAsset: 'BTC', baseAssetType: 'alkane', quoteAssetType: 'btc' },
  'rune1-alk1': { baseAsset: 'ALK1', quoteAsset: 'RUNE1', baseAssetType: 'alkane', quoteAssetType: 'rune' },
  'rune2-alk2': { baseAsset: 'ALK2', quoteAsset: 'RUNE2', baseAssetType: 'alkane', quoteAssetType: 'rune' },
};

const Trade: React.FC = () => {
  // Get contexts
  const { client, isLoading: isApiLoading } = useApi();
  const { isConnected: isWalletConnected, isInitialized: isSDKInitialized } = useWasmWallet();
  const { addNotification } = useNotification();
  
  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [peerCount, setPeerCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [selectedPairId, setSelectedPairId] = useState<string>('btc-rune1');
  const [chartType, setChartType] = useState<'price' | 'depth'>('price');
  
  // Get selected pair details
  const selectedPair = tradingPairMap[selectedPairId];
  
  // Fetch market data from API
  useEffect(() => {
    if (isSDKInitialized && !isApiLoading && selectedPair) {
      setIsLoading(true);
      
      const fetchMarketData = async () => {
        try {
          // Fetch market data
          const marketResponse = await client.getMarketData(
            selectedPair.baseAsset, 
            selectedPair.quoteAsset
          );
          
          if (marketResponse.error) {
            addNotification('error', `Failed to fetch market data: ${marketResponse.error}`);
          } else if (marketResponse.data) {
            // Update peer and order counts
            setPeerCount(Math.floor(Math.random() * 50) + 20); // Still random for demo
            
            // Fetch orders to get order count
            const ordersResponse = await client.getOrders(
              selectedPair.baseAsset, 
              selectedPair.quoteAsset
            );
            
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
  }, [isSDKInitialized, selectedPair, client, isApiLoading, addNotification]);
  
  // Handle pair selection
  const handlePairSelect = (pairId: string) => {
    setSelectedPairId(pairId);
    addNotification('success', `Selected trading pair: ${pairId}`);
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
      
      {/* Trading Pair Selector */}
      <div className="card p-4">
        <div className="mb-2">
          <h2 className="text-lg font-display font-medium">Select Trading Pair</h2>
        </div>
        <TradingPairSelector
          selectedPair={selectedPairId}
          onSelectPair={handlePairSelect}
        />
      </div>
      
      {/* Main Trading Interface */}
      {selectedPair && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Chart and Market Data */}
          <div className="lg:col-span-8 space-y-6">
            {/* Chart Type Selector */}
            <div className="card p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-display font-medium">
                  {selectedPair.baseAsset}/{selectedPair.quoteAsset} Chart
                </h2>
                <div className="flex rounded-lg overflow-hidden border border-twilight-dark">
                  <button
                    onClick={() => setChartType('price')}
                    className={`px-3 py-1 text-sm ${chartType === 'price' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
                  >
                    Price Chart
                  </button>
                  <button
                    onClick={() => setChartType('depth')}
                    className={`px-3 py-1 text-sm ${chartType === 'depth' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
                  >
                    Depth Chart
                  </button>
                </div>
              </div>
              
              {chartType === 'price' ? (
                <CryptoChart
                  assetId={selectedPair.baseAsset}
                  assetType={selectedPair.baseAssetType}
                  height={400}
                  showControls={true}
                />
              ) : (
                <PriceChart
                  pair={`${selectedPair.baseAsset}/${selectedPair.quoteAsset}`}
                  isLoading={isLoading}
                  apiClient={client}
                />
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MarketDataVisualization
                baseAsset={selectedPair.baseAsset}
                quoteAsset={selectedPair.quoteAsset}
              />
              
              <RecentTrades
                baseAsset={selectedPair.baseAsset}
                quoteAsset={selectedPair.quoteAsset}
                limit={10}
              />
            </div>
            
            {/* Asset Info */}
            <AssetDetails
              assetId={selectedPair.baseAsset}
              assetType={selectedPair.baseAssetType}
            />
          </div>
          
          {/* Right column: Trade Form and Orderbook */}
          <div className="lg:col-span-4 space-y-6">
            <AdvancedOrderForm
              baseAsset={selectedPair.baseAsset}
              quoteAsset={selectedPair.quoteAsset}
            />
            
            <OrderbookVisualization
              baseAsset={selectedPair.baseAsset}
              quoteAsset={selectedPair.quoteAsset}
            />
          </div>
        </div>
      )}
      
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