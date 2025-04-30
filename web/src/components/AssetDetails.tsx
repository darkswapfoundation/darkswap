import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { formatAmount, formatNumberWithCommas } from '../utils/formatters';
import CryptoChart from './CryptoChart';
import { motion } from 'framer-motion';

interface AssetDetailsProps {
  assetId: string;
  assetType: 'rune' | 'alkane' | 'btc';
  className?: string;
}

interface AssetData {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  supply: string;
  holders: number;
  creator?: string;
  creationDate?: number;
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
}

const AssetDetails: React.FC<AssetDetailsProps> = ({
  assetId,
  assetType,
  className = '',
}) => {
  // State
  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'trades' | 'holders'>('overview');
  
  // Get API client
  const { client } = useApi();
  
  // Fetch asset data
  const fetchAssetData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with mock data
      
      // Generate mock data
      let mockData: AssetData;
      
      switch (assetType) {
        case 'btc':
          mockData = {
            id: assetId,
            name: 'Bitcoin',
            symbol: 'BTC',
            description: 'Bitcoin is a decentralized digital currency, without a central bank or single administrator, that can be sent from user to user on the peer-to-peer bitcoin network without the need for intermediaries.',
            price: 20000 + Math.random() * 5000,
            priceChange24h: (Math.random() * 10) - 5,
            marketCap: 380000000000 + Math.random() * 20000000000,
            volume24h: 20000000000 + Math.random() * 5000000000,
            supply: '21000000',
            holders: 1000000 + Math.floor(Math.random() * 100000),
            creationDate: new Date('2009-01-03').getTime(),
            website: 'https://bitcoin.org',
            twitter: 'https://twitter.com/bitcoin',
          };
          break;
        case 'rune':
          mockData = {
            id: assetId,
            name: `Rune ${assetId.substring(0, 4)}`,
            symbol: `RUNE${assetId.substring(0, 2)}`,
            description: `A unique Bitcoin rune token with ID ${assetId}. Runes are digital artifacts inscribed on the Bitcoin blockchain.`,
            price: 10 + Math.random() * 90,
            priceChange24h: (Math.random() * 20) - 10,
            marketCap: 10000000 + Math.random() * 90000000,
            volume24h: 1000000 + Math.random() * 9000000,
            supply: (10000000 + Math.floor(Math.random() * 90000000)).toString(),
            holders: 10000 + Math.floor(Math.random() * 90000),
            creator: `bc1q${Math.random().toString(36).substring(2, 15)}`,
            creationDate: Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000),
            website: Math.random() > 0.5 ? `https://${assetId.substring(0, 6)}.io` : undefined,
            twitter: Math.random() > 0.5 ? `https://twitter.com/${assetId.substring(0, 6)}` : undefined,
            discord: Math.random() > 0.5 ? `https://discord.gg/${assetId.substring(0, 6)}` : undefined,
          };
          break;
        case 'alkane':
          mockData = {
            id: assetId,
            name: `Alkane ${assetId.substring(0, 4)}`,
            symbol: `ALK${assetId.substring(0, 2)}`,
            description: `A unique Bitcoin alkane token with ID ${assetId}. Alkanes are a new type of digital asset on the Bitcoin blockchain.`,
            price: 5 + Math.random() * 45,
            priceChange24h: (Math.random() * 30) - 15,
            marketCap: 5000000 + Math.random() * 45000000,
            volume24h: 500000 + Math.random() * 4500000,
            supply: (5000000 + Math.floor(Math.random() * 45000000)).toString(),
            holders: 5000 + Math.floor(Math.random() * 45000),
            creator: `bc1q${Math.random().toString(36).substring(2, 15)}`,
            creationDate: Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000),
            website: Math.random() > 0.5 ? `https://${assetId.substring(0, 6)}.io` : undefined,
            twitter: Math.random() > 0.5 ? `https://twitter.com/${assetId.substring(0, 6)}` : undefined,
            telegram: Math.random() > 0.5 ? `https://t.me/${assetId.substring(0, 6)}` : undefined,
          };
          break;
        default:
          throw new Error(`Unknown asset type: ${assetType}`);
      }
      
      setAssetData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch asset data on mount
  useEffect(() => {
    fetchAssetData();
  }, [assetId, assetType]);
  
  // Generate asset icon
  const generateAssetIcon = () => {
    if (!assetData) return null;
    
    let bgColor: string;
    let textColor = 'text-white';
    
    switch (assetType) {
      case 'btc':
        bgColor = 'bg-orange-500';
        break;
      case 'rune':
        bgColor = 'bg-blue-500';
        break;
      case 'alkane':
        bgColor = 'bg-green-500';
        break;
      default:
        bgColor = 'bg-gray-500';
    }
    
    return (
      <div className={`w-16 h-16 rounded-full ${bgColor} flex items-center justify-center ${textColor} text-2xl font-bold`}>
        {assetData.symbol.substring(0, 2)}
      </div>
    );
  };
  
  // Render loading state
  if (isLoading && !assetData) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Asset Details</h2>
        </div>
        <div className="card-body flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading asset details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && !assetData) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Asset Details</h2>
        </div>
        <div className="card-body flex items-center justify-center h-64">
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={fetchAssetData}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!assetData) {
    return null;
  }
  
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div className="flex items-center">
          {generateAssetIcon()}
          <div className="ml-4">
            <h2 className="text-xl font-display font-medium">{assetData.name}</h2>
            <div className="flex items-center mt-1">
              <span className="text-gray-400">{assetData.symbol}</span>
              <span className="mx-2 text-gray-500">•</span>
              <span className={`${assetData.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {assetData.priceChange24h >= 0 ? '+' : ''}{assetData.priceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        {/* Price and market data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Price</div>
            <div className="text-lg font-medium">${assetData.price.toFixed(2)}</div>
          </div>
          
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Market Cap</div>
            <div className="text-lg font-medium">${formatNumberWithCommas(Math.floor(assetData.marketCap))}</div>
          </div>
          
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Volume (24h)</div>
            <div className="text-lg font-medium">${formatNumberWithCommas(Math.floor(assetData.volume24h))}</div>
          </div>
          
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Holders</div>
            <div className="text-lg font-medium">{formatNumberWithCommas(assetData.holders)}</div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-twilight-dark">
            <button
              className={`py-2 px-4 ${activeTab === 'overview' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`py-2 px-4 ${activeTab === 'chart' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('chart')}
            >
              Chart
            </button>
            <button
              className={`py-2 px-4 ${activeTab === 'trades' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('trades')}
            >
              Trades
            </button>
            <button
              className={`py-2 px-4 ${activeTab === 'holders' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('holders')}
            >
              Holders
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        <div>
          {/* Overview tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Description */}
              {assetData.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <p className="text-gray-300">{assetData.description}</p>
                </div>
              )}
              
              {/* Asset details */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Details</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 p-3 bg-twilight-darker rounded-lg">
                    <div className="text-gray-400">ID</div>
                    <div className="text-right font-mono">{assetData.id}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 p-3 bg-twilight-darker rounded-lg">
                    <div className="text-gray-400">Supply</div>
                    <div className="text-right">{formatAmount(assetData.supply)}</div>
                  </div>
                  
                  {assetData.creator && (
                    <div className="grid grid-cols-2 p-3 bg-twilight-darker rounded-lg">
                      <div className="text-gray-400">Creator</div>
                      <div className="text-right font-mono truncate">{assetData.creator}</div>
                    </div>
                  )}
                  
                  {assetData.creationDate && (
                    <div className="grid grid-cols-2 p-3 bg-twilight-darker rounded-lg">
                      <div className="text-gray-400">Created</div>
                      <div className="text-right">{new Date(assetData.creationDate).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Links */}
              {(assetData.website || assetData.twitter || assetData.discord || assetData.telegram) && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {assetData.website && (
                      <a
                        href={assetData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        Website
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    
                    {assetData.twitter && (
                      <a
                        href={assetData.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        Twitter
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    
                    {assetData.discord && (
                      <a
                        href={assetData.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        Discord
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    
                    {assetData.telegram && (
                      <a
                        href={assetData.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        Telegram
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Chart tab */}
          {activeTab === 'chart' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CryptoChart
                assetId={assetData.id}
                assetType={assetType}
                height={400}
              />
            </motion.div>
          )}
          
          {/* Trades tab */}
          {activeTab === 'trades' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-4 text-gray-400">Recent trades will be displayed here</p>
              <p className="text-gray-500">Coming soon</p>
            </motion.div>
          )}
          
          {/* Holders tab */}
          {activeTab === 'holders' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-4 text-gray-400">Top holders will be displayed here</p>
              <p className="text-gray-500">Coming soon</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetDetails;