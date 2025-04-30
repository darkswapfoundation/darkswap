import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Balance } from '../types';
import '../styles/Portfolio.css';

interface PortfolioProps {
  height?: number;
  showHeader?: boolean;
}

const Portfolio: React.FC<PortfolioProps> = ({
  height = 400,
  showHeader = true,
}) => {
  const { theme } = useTheme();
  const { api } = useApi();
  const { connected, on, send } = useWebSocket();
  
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState<string>('0');
  
  // Format number with appropriate decimal places
  const formatNumber = useCallback((value: string, precision: number = 8): string => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return '0';
    }
    return num.toFixed(precision);
  }, []);
  
  // Fetch balances
  const fetchBalances = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await api.getBalances();
      
      // Filter out zero balances
      const nonZeroBalances = data.filter(balance => 
        parseFloat(balance.total) > 0
      );
      
      setBalances(nonZeroBalances);
      
      // Calculate total value in USD
      const total = nonZeroBalances.reduce((sum, balance) => sum + parseFloat(balance.usdValue), 0);
      setTotalValue(total.toFixed(2));
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setError('Failed to fetch balances. Please try again later.');
      setIsLoading(false);
    }
  }, [api]);
  
  // Handle balance update
  const handleBalanceUpdate = useCallback((data: any) => {
    setBalances(prevBalances => {
      // Create a map of existing balances
      const balanceMap = new Map<string, Balance>();
      prevBalances.forEach(balance => balanceMap.set(balance.symbol, balance));
      
      // Update or add new balances
      data.balances.forEach((balance: Balance) => {
        balanceMap.set(balance.symbol, balance);
      });
      
      // Convert map back to array and filter out zero balances
      const updatedBalances = Array.from(balanceMap.values()).filter(
        balance => parseFloat(balance.total) > 0
      );
      
      // Calculate total value in USD
      const total = updatedBalances.reduce((sum, balance) => sum + parseFloat(balance.usdValue), 0);
      setTotalValue(total.toFixed(2));
      
      return updatedBalances;
    });
  }, []);
  
  // Subscribe to balance updates
  useEffect(() => {
    // Fetch initial data
    fetchBalances();
    
    // Subscribe to balance updates if socket is connected
    if (connected) {
      const unsubscribe = on('balanceUpdate', handleBalanceUpdate);
      
      // Subscribe to balance updates
      send('subscribeBalances', {});
      
      // Clean up
      return () => {
        unsubscribe();
        send('unsubscribeBalances', {});
      };
    }
    
    // Set up polling for updates if socket is not connected
    const intervalId = !connected ? setInterval(fetchBalances, 30000) : null;
    
    // Clean up
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchBalances, connected, on, send, handleBalanceUpdate]);
  
  // Render loading state
  if (isLoading && balances.length === 0) {
    return (
      <div 
        className={`portfolio portfolio-${theme}`}
        style={{ height }}
      >
        {showHeader && (
          <div className="portfolio-header">
            <h3>Portfolio</h3>
          </div>
        )}
        <div className="portfolio-loading">
          <div className="spinner"></div>
          <p>Loading balances...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div 
        className={`portfolio portfolio-${theme}`}
        style={{ height }}
      >
        {showHeader && (
          <div className="portfolio-header">
            <h3>Portfolio</h3>
          </div>
        )}
        <div className="portfolio-error">
          <p>{error}</p>
          <button onClick={fetchBalances}>Retry</button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`portfolio portfolio-${theme}`}
      style={{ height }}
    >
      {showHeader && (
        <div className="portfolio-header">
          <h3>Portfolio</h3>
          <div className="portfolio-total">
            <span>Total Value:</span>
            <span className="portfolio-total-value">${totalValue}</span>
          </div>
        </div>
      )}
      <div className="portfolio-content">
        <div className="portfolio-header-row">
          <div className="portfolio-asset">Asset</div>
          <div className="portfolio-balance">Balance</div>
          <div className="portfolio-value">Value</div>
        </div>
        <div className="portfolio-balances">
          {balances.length === 0 ? (
            <div className="portfolio-empty">No balances found</div>
          ) : (
            balances.map(balance => (
              <div key={balance.symbol} className="portfolio-balance-row">
                <div className="portfolio-asset">
                  <span className="portfolio-asset-symbol">{balance.symbol}</span>
                  <span className="portfolio-asset-name">{balance.name}</span>
                </div>
                <div className="portfolio-balance">
                  <span className="portfolio-balance-total">{formatNumber(balance.total)}</span>
                  <span className="portfolio-balance-available">Available: {formatNumber(balance.available)}</span>
                </div>
                <div className="portfolio-value">
                  ${formatNumber(balance.usdValue, 2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;