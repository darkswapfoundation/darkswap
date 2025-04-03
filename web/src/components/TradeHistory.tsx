import React, { useState, useEffect } from 'react';
import { AssetType } from '../hooks/useDarkSwap';

interface TradeHistoryProps {
  className?: string;
}

interface TradeHistoryItem {
  id: string;
  timestamp: number;
  type: 'buy' | 'sell';
  assetType: AssetType;
  amount: number;
  price: number;
  status: 'completed' | 'pending' | 'failed';
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ className }) => {
  // Trade history (mock data)
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Fetch trade history
  useEffect(() => {
    // In a real implementation, we would fetch this from the DarkSwap instance
    const fetchTradeHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock data
        const mockHistory: TradeHistoryItem[] = [
          {
            id: '1',
            timestamp: Date.now() - 3600000, // 1 hour ago
            type: 'buy',
            assetType: { type: 'bitcoin' },
            amount: 0.01,
            price: 65000,
            status: 'completed',
          },
          {
            id: '2',
            timestamp: Date.now() - 7200000, // 2 hours ago
            type: 'sell',
            assetType: { type: 'rune', id: 'rune1' },
            amount: 100,
            price: 0.0001,
            status: 'completed',
          },
          {
            id: '3',
            timestamp: Date.now() - 86400000, // 1 day ago
            type: 'buy',
            assetType: { type: 'alkane', id: 'alkane1' },
            amount: 50,
            price: 0.0002,
            status: 'completed',
          },
          {
            id: '4',
            timestamp: Date.now() - 172800000, // 2 days ago
            type: 'sell',
            assetType: { type: 'bitcoin' },
            amount: 0.005,
            price: 64000,
            status: 'completed',
          },
          {
            id: '5',
            timestamp: Date.now() - 259200000, // 3 days ago
            type: 'buy',
            assetType: { type: 'rune', id: 'rune2' },
            amount: 200,
            price: 0.00015,
            status: 'completed',
          },
        ];
        
        setTradeHistory(mockHistory);
      } catch (err) {
        console.error('Failed to fetch trade history:', err);
        setError('Failed to fetch trade history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTradeHistory();
  }, []);
  
  // Format asset type
  const formatAssetType = (assetType: AssetType): string => {
    switch (assetType.type) {
      case 'bitcoin':
        return 'BTC';
      case 'rune':
        return `RUNE (${assetType.id})`;
      case 'alkane':
        return `ALKANE (${assetType.id})`;
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Format amount
  const formatAmount = (amount: number, assetType: AssetType): string => {
    switch (assetType.type) {
      case 'bitcoin':
        return `${amount.toFixed(8)} BTC`;
      case 'rune':
        return `${amount} RUNE`;
      case 'alkane':
        return `${amount} ALKANE`;
    }
  };
  
  // Format price
  const formatPrice = (price: number, assetType: AssetType): string => {
    switch (assetType.type) {
      case 'bitcoin':
        return `$${price.toLocaleString()}`;
      case 'rune':
      case 'alkane':
        return `${price.toFixed(8)} BTC`;
    }
  };
  
  // Format total
  const formatTotal = (amount: number, price: number, assetType: AssetType): string => {
    switch (assetType.type) {
      case 'bitcoin':
        return `$${(amount * price).toLocaleString()}`;
      case 'rune':
      case 'alkane':
        return `${(amount * price).toFixed(8)} BTC`;
    }
  };
  
  return (
    <div className={`trade-history ${className || ''}`}>
      <h2>Trade History</h2>
      
      {isLoading ? (
        <div className="loading">Loading trade history...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : tradeHistory.length === 0 ? (
        <div className="no-history">No trade history available</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Asset</th>
              <th>Amount</th>
              <th>Price</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tradeHistory.map(trade => (
              <tr key={trade.id} className={trade.type}>
                <td>{formatTimestamp(trade.timestamp)}</td>
                <td className={`type ${trade.type}`}>
                  {trade.type === 'buy' ? 'Buy' : 'Sell'}
                </td>
                <td>{formatAssetType(trade.assetType)}</td>
                <td>{formatAmount(trade.amount, trade.assetType)}</td>
                <td>{formatPrice(trade.price, trade.assetType)}</td>
                <td>{formatTotal(trade.amount, trade.price, trade.assetType)}</td>
                <td className={`status ${trade.status}`}>
                  {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <style>
        {`
          .trade-history {
            background-color: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            margin-top: 30px;
          }
          
          .trade-history h2 {
            margin-top: 0;
            margin-bottom: 20px;
            color: #333;
            font-size: 1.5rem;
          }
          
          .loading {
            color: #6c757d;
            text-align: center;
            padding: 20px;
          }
          
          .error {
            color: #dc3545;
            text-align: center;
            padding: 20px;
          }
          
          .no-history {
            color: #6c757d;
            text-align: center;
            padding: 20px;
            font-style: italic;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          
          th {
            font-weight: 600;
            color: #555;
          }
          
          tr:last-child td {
            border-bottom: none;
          }
          
          .type {
            font-weight: 600;
          }
          
          .type.buy {
            color: #28a745;
          }
          
          .type.sell {
            color: #dc3545;
          }
          
          .status {
            font-weight: 500;
          }
          
          .status.completed {
            color: #28a745;
          }
          
          .status.pending {
            color: #ffc107;
          }
          
          .status.failed {
            color: #dc3545;
          }
        `}
      </style>
    </div>
  );
};