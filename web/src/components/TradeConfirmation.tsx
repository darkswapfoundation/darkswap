import React, { useState, useEffect } from 'react';
import { formatAmount, formatPrice, formatAddress } from '../utils/formatters';

interface TradeConfirmationProps {
  tradeId: string;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  amount: string;
  total: string;
  side: 'buy' | 'sell';
  maker: string;
  taker: string;
  timestamp: number;
  txid?: string;
  status: 'pending' | 'completed' | 'failed';
  onClose: () => void;
  className?: string;
}

const TradeConfirmation: React.FC<TradeConfirmationProps> = ({
  tradeId,
  baseAsset,
  quoteAsset,
  price,
  amount,
  total,
  side,
  maker,
  taker,
  timestamp,
  txid,
  status,
  onClose,
  className = '',
}) => {
  // State
  const [countdown, setCountdown] = useState<number>(10);
  
  // Countdown effect
  useEffect(() => {
    if (status === 'pending') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [status]);
  
  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-16 h-16 rounded-full bg-yellow-500 bg-opacity-20 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      case 'completed':
        return (
          <div className="w-16 h-16 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-16 h-16 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };
  
  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Trade in Progress';
      case 'completed':
        return 'Trade Completed';
      case 'failed':
        return 'Trade Failed';
    }
  };
  
  // Get status description
  const getStatusDescription = () => {
    switch (status) {
      case 'pending':
        return 'Your trade is being processed. This may take a few minutes.';
      case 'completed':
        return 'Your trade has been successfully executed and confirmed on the blockchain.';
      case 'failed':
        return 'Your trade could not be completed. Please try again or contact support.';
    }
  };
  
  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 ${className}`}>
      <div className="card w-full max-w-md">
        <div className="card-header flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Trade Confirmation
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="card-body">
          {/* Status */}
          <div className="flex flex-col items-center mb-6">
            {getStatusIcon()}
            <h4 className="text-xl font-medium mt-4">{getStatusText()}</h4>
            <p className="text-gray-400 text-center mt-2">{getStatusDescription()}</p>
            
            {status === 'pending' && (
              <div className="mt-4 w-full bg-twilight-darker rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${(10 - countdown) * 10}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {/* Trade details */}
          <div className="mb-6 p-4 bg-twilight-darker rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Trade ID:</span>
              <span className="font-mono">{formatAddress(tradeId, 8, 8)}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Type:</span>
              <span className={side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                {side === 'buy' ? 'Buy' : 'Sell'}
              </span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Amount:</span>
              <span>{formatAmount(amount)} {baseAsset}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Price:</span>
              <span>{formatPrice(price)} {quoteAsset}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Total:</span>
              <span>{formatPrice(total)} {quoteAsset}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Maker:</span>
              <span className="font-mono">{formatAddress(maker, 8, 8)}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Taker:</span>
              <span className="font-mono">{formatAddress(taker, 8, 8)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Time:</span>
              <span>{new Date(timestamp).toLocaleString()}</span>
            </div>
          </div>
          
          {/* Transaction ID */}
          {txid && (
            <div className="mb-6">
              <label className="form-label">Transaction ID</label>
              <div className="flex">
                <input
                  type="text"
                  value={txid}
                  readOnly
                  className="form-input flex-grow bg-twilight-darker font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(txid);
                    // Show a notification or tooltip here
                  }}
                  className="ml-2 p-2 bg-twilight-darker rounded-lg hover:bg-twilight-dark"
                  title="Copy to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <a
                  href={`https://mempool.space/tx/${txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 p-2 bg-twilight-darker rounded-lg hover:bg-twilight-dark"
                  title="View on explorer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-2">
            {status === 'completed' && (
              <button
                type="button"
                onClick={() => {
                  // Handle view receipt
                }}
                className="btn btn-secondary"
              >
                View Receipt
              </button>
            )}
            
            {status === 'failed' && (
              <button
                type="button"
                onClick={() => {
                  // Handle try again
                }}
                className="btn btn-primary"
              >
                Try Again
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
            >
              {status === 'pending' ? 'Close' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeConfirmation;