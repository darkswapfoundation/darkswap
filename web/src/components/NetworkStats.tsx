import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { formatNumberWithCommas } from '../utils/formatters';

interface NetworkStatsProps {
  className?: string;
  refreshInterval?: number;
}

interface Stats {
  peerCount: number;
  orderCount: number;
  tradeCount: number;
  totalVolume24h: number;
  activeRelays: number;
  connectedNodes: number;
  networkLatency: number;
  uptime: number;
}

const NetworkStats: React.FC<NetworkStatsProps> = ({
  className = '',
  refreshInterval = 60000, // 1 minute
}) => {
  // State
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get API client
  const { client } = useApi();
  
  // Fetch network stats
  const fetchNetworkStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with mock data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock stats
      const mockStats: Stats = {
        peerCount: Math.floor(Math.random() * 100) + 50,
        orderCount: Math.floor(Math.random() * 1000) + 500,
        tradeCount: Math.floor(Math.random() * 500) + 100,
        totalVolume24h: Math.random() * 100 + 50,
        activeRelays: Math.floor(Math.random() * 10) + 5,
        connectedNodes: Math.floor(Math.random() * 200) + 100,
        networkLatency: Math.random() * 100 + 50,
        uptime: Math.floor(Math.random() * 100) + 90,
      };
      
      setStats(mockStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch network stats');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch network stats on mount and at regular intervals
  useEffect(() => {
    fetchNetworkStats();
    
    // Set up interval to refresh network stats
    const interval = setInterval(fetchNetworkStats, refreshInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval]);
  
  // Format uptime
  const formatUptime = (uptime: number): string => {
    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  // Render loading state
  if (isLoading && !stats) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Network Statistics</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading network statistics...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && !stats) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Network Statistics</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={fetchNetworkStats}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!stats) {
    return null;
  }
  
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium">Network Statistics</h2>
        <button 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          onClick={fetchNetworkStats}
          title="Refresh network statistics"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="card-body">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Peer Count */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Peers</div>
            <div className="text-lg font-medium">{formatNumberWithCommas(stats.peerCount)}</div>
          </div>
          
          {/* Order Count */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Orders</div>
            <div className="text-lg font-medium">{formatNumberWithCommas(stats.orderCount)}</div>
          </div>
          
          {/* Trade Count */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Trades (24h)</div>
            <div className="text-lg font-medium">{formatNumberWithCommas(stats.tradeCount)}</div>
          </div>
          
          {/* Total Volume */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Volume (24h)</div>
            <div className="text-lg font-medium">${formatNumberWithCommas(Number(stats.totalVolume24h.toFixed(2)))}</div>
          </div>
          
          {/* Active Relays */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Active Relays</div>
            <div className="text-lg font-medium">{stats.activeRelays}</div>
          </div>
          
          {/* Connected Nodes */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Connected Nodes</div>
            <div className="text-lg font-medium">{formatNumberWithCommas(stats.connectedNodes)}</div>
          </div>
          
          {/* Network Latency */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Network Latency</div>
            <div className="text-lg font-medium">{stats.networkLatency.toFixed(0)} ms</div>
          </div>
          
          {/* Uptime */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Uptime</div>
            <div className="text-lg font-medium">{stats.uptime.toFixed(2)}%</div>
          </div>
        </div>
        
        {/* Network Map Placeholder */}
        <div className="mt-4 p-4 bg-twilight-darker rounded-lg h-48 flex items-center justify-center">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-gray-400">Network map coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStats;