import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { formatAmount, formatAddress } from '../utils/formatters';
import { RuneInfo, AlkaneInfo } from '../utils/ApiClient';

interface AssetInfoProps {
  assetType: 'rune' | 'alkane';
  assetId: string;
  className?: string;
}

const AssetInfo: React.FC<AssetInfoProps> = ({
  assetType,
  assetId,
  className = '',
}) => {
  // State
  const [assetInfo, setAssetInfo] = useState<RuneInfo | AlkaneInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get API client
  const { client } = useApi();
  
  // Fetch asset info
  const fetchAssetInfo = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (assetType === 'rune') {
        response = await client.getRune(assetId);
      } else {
        response = await client.getAlkane(assetId);
      }
      
      if (response.error) {
        setError(response.error);
      } else {
        setAssetInfo(response.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to fetch ${assetType} info`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch asset info on mount and when asset changes
  useEffect(() => {
    fetchAssetInfo();
  }, [assetType, assetId]);
  
  // Render loading state
  if (isLoading && !assetInfo) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">{assetType === 'rune' ? 'Rune' : 'Alkane'} Info</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading {assetType} info...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && !assetInfo) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">{assetType === 'rune' ? 'Rune' : 'Alkane'} Info</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={fetchAssetInfo}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Generate asset icon based on ticker
  const generateAssetIcon = (ticker: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-red-500', 'bg-purple-500', 'bg-pink-500'
    ];
    
    // Use the first character of the ticker to determine the color
    const colorIndex = ticker.charCodeAt(0) % colors.length;
    const color = colors[colorIndex];
    
    return (
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white font-bold text-xl`}>
        {ticker.substring(0, 2).toUpperCase()}
      </div>
    );
  };
  
  if (!assetInfo) {
    return null;
  }
  
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium">
          {assetType === 'rune' ? 'Rune' : 'Alkane'} Info
        </h2>
        <button 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          onClick={fetchAssetInfo}
          title={`Refresh ${assetType} info`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="card-body">
        <div className="flex items-center mb-6">
          {generateAssetIcon(assetInfo.ticker)}
          <div className="ml-4">
            <h3 className="text-xl font-medium">{assetInfo.name}</h3>
            <p className="text-gray-400">{assetInfo.ticker}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">ID</div>
            <div className="text-sm font-medium truncate">{assetInfo.id}</div>
          </div>
          
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Supply</div>
            <div className="text-sm font-medium">{formatAmount(assetInfo.supply)}</div>
          </div>
          
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Holders</div>
            <div className="text-sm font-medium">{assetInfo.holders.toLocaleString()}</div>
          </div>
        </div>
        
        {assetInfo.description && (
          <div className="mt-4 p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Description</div>
            <div className="text-sm">{assetInfo.description}</div>
          </div>
        )}
        
        {/* Asset Explorer Link */}
        <div className="mt-6 text-center">
          <a
            href={`https://explorer.darkswap.xyz/${assetType}/${assetInfo.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            View in Explorer
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AssetInfo;