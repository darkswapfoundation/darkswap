import React, { useState, useEffect } from 'react';
import { useTradeExecution } from '../contexts/TradeExecutionContext';
import { useNotification } from '../contexts/NotificationContext';
import { TradeExecutionState } from '../services/TradeExecutionService';

// Icons
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export interface TradeExecutionProps {
  orderId: string;
  baseAsset: string;
  quoteAsset: string;
  side: 'buy' | 'sell';
  price: number;
  maxAmount: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

const TradeExecution: React.FC<TradeExecutionProps> = ({
  orderId,
  baseAsset,
  quoteAsset,
  side,
  price,
  maxAmount,
  onComplete,
  onCancel,
}) => {
  // Contexts
  const {
    state,
    error,
    isExecuting,
    executeTrade,
    cancelTrade,
    reset,
  } = useTradeExecution();
  const { addNotification } = useNotification();
  
  // State
  const [amount, setAmount] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [txid, setTxid] = useState<string | undefined>(undefined);
  
  // Calculate total when amount or price changes
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const calculatedTotal = parseFloat(amount) * price;
      setTotal(calculatedTotal.toFixed(calculatedTotal < 1 ? 8 : 2));
    } else {
      setTotal('');
    }
  }, [amount, price]);
  
  // Update amount when total changes
  const handleTotalChange = (value: string) => {
    setTotal(value);
    if (value && !isNaN(parseFloat(value)) && price > 0) {
      const calculatedAmount = parseFloat(value) / price;
      setAmount(calculatedAmount.toFixed(calculatedAmount < 1 ? 8 : 4));
    } else {
      setAmount('');
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      addNotification('error', 'Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > maxAmount) {
      addNotification('error', `Amount exceeds maximum available (${maxAmount})`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await executeTrade(orderId, amount);
      
      if (result.success) {
        if (result.txid) {
          setTxid(result.txid);
          addNotification('success', `Trade executed successfully. Transaction ID: ${result.txid}`);
          if (onComplete) {
            onComplete();
          }
        }
      } else {
        addNotification('error', `Trade execution failed: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      addNotification('error', `Error executing trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel
  const handleCancel = async () => {
    try {
      const result = await cancelTrade();
      
      if (result) {
        addNotification('info', 'Trade cancelled');
        if (onCancel) {
          onCancel();
        }
      } else {
        addNotification('error', 'Failed to cancel trade');
      }
    } catch (error) {
      console.error('Error cancelling trade:', error);
      addNotification('error', `Error cancelling trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle reset
  const handleReset = () => {
    reset();
    setAmount('');
    setTotal('');
    setTxid(undefined);
  };
  
  // Get state icon
  const getStateIcon = () => {
    switch (state) {
      case TradeExecutionState.COMPLETED:
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case TradeExecutionState.FAILED:
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case TradeExecutionState.CANCELLED:
        return <XCircleIcon className="w-6 h-6 text-yellow-500" />;
      case TradeExecutionState.WAITING_FOR_COUNTERPARTY:
        return <ClockIcon className="w-6 h-6 text-blue-500" />;
      default:
        return isExecuting ? <ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin" /> : null;
    }
  };
  
  // Get state text
  const getStateText = () => {
    switch (state) {
      case TradeExecutionState.INITIALIZED:
        return 'Ready to execute trade';
      case TradeExecutionState.CREATING_PSBT:
        return 'Creating transaction...';
      case TradeExecutionState.PSBT_CREATED:
        return 'Transaction created';
      case TradeExecutionState.SIGNING_PSBT:
        return 'Signing transaction...';
      case TradeExecutionState.PSBT_SIGNED:
        return 'Transaction signed';
      case TradeExecutionState.SENDING_TO_COUNTERPARTY:
        return 'Sending to counterparty...';
      case TradeExecutionState.WAITING_FOR_COUNTERPARTY:
        return 'Waiting for counterparty...';
      case TradeExecutionState.COUNTERPARTY_SIGNED:
        return 'Counterparty signed';
      case TradeExecutionState.BROADCASTING:
        return 'Broadcasting transaction...';
      case TradeExecutionState.COMPLETED:
        return 'Trade completed successfully';
      case TradeExecutionState.FAILED:
        return 'Trade failed';
      case TradeExecutionState.CANCELLED:
        return 'Trade cancelled';
      default:
        return 'Unknown state';
    }
  };
  
  // Format asset name
  const formatAssetName = (asset: string) => {
    if (asset.includes(':')) {
      const [type, id] = asset.split(':');
      return `${type}${id ? ` (${id.substring(0, 6)}...)` : ''}`;
    }
    return asset;
  };
  
  return (
    <div className="card h-full">
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium">
          {side === 'buy' ? 'Buy' : 'Sell'} {formatAssetName(baseAsset)}
        </h2>
        <div className="flex items-center space-x-2">
          {getStateIcon()}
        </div>
      </div>
      
      <div className="card-body">
        {/* Order Details */}
        <div className="mb-6 p-4 bg-twilight-darker rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400 text-sm">Order</span>
              <div className="text-white font-medium">
                {side === 'buy' ? 'Buy' : 'Sell'} {formatAssetName(baseAsset)}
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Price</span>
              <div className="text-white font-medium">
                {price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8
                })} {formatAssetName(quoteAsset)}
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Max Amount</span>
              <div className="text-white font-medium">
                {maxAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8
                })} {formatAssetName(baseAsset)}
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Order ID</span>
              <div className="text-white font-medium text-sm truncate">
                {orderId}
              </div>
            </div>
          </div>
        </div>
        
        {/* State */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <span className="text-gray-400 text-sm mr-2">Status:</span>
            <span className="text-white font-medium">{getStateText()}</span>
          </div>
          
          {/* Progress Steps */}
          <div className="relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-twilight-dark"></div>
            <div className="relative flex justify-between">
              <div className={`flex flex-col items-center ${state !== TradeExecutionState.INITIALIZED ? 'text-twilight-neon-blue' : 'text-gray-400'}`}>
                <div className={`w-4 h-4 rounded-full ${state !== TradeExecutionState.INITIALIZED ? 'bg-twilight-neon-blue' : 'bg-twilight-dark'}`}></div>
                <span className="text-xs mt-1">Initialize</span>
              </div>
              <div className={`flex flex-col items-center ${state === TradeExecutionState.PSBT_CREATED || state === TradeExecutionState.PSBT_SIGNED || state === TradeExecutionState.SENDING_TO_COUNTERPARTY || state === TradeExecutionState.WAITING_FOR_COUNTERPARTY || state === TradeExecutionState.COUNTERPARTY_SIGNED || state === TradeExecutionState.BROADCASTING || state === TradeExecutionState.COMPLETED ? 'text-twilight-neon-blue' : 'text-gray-400'}`}>
                <div className={`w-4 h-4 rounded-full ${state === TradeExecutionState.PSBT_CREATED || state === TradeExecutionState.PSBT_SIGNED || state === TradeExecutionState.SENDING_TO_COUNTERPARTY || state === TradeExecutionState.WAITING_FOR_COUNTERPARTY || state === TradeExecutionState.COUNTERPARTY_SIGNED || state === TradeExecutionState.BROADCASTING || state === TradeExecutionState.COMPLETED ? 'bg-twilight-neon-blue' : 'bg-twilight-dark'}`}></div>
                <span className="text-xs mt-1">Create</span>
              </div>
              <div className={`flex flex-col items-center ${state === TradeExecutionState.PSBT_SIGNED || state === TradeExecutionState.SENDING_TO_COUNTERPARTY || state === TradeExecutionState.WAITING_FOR_COUNTERPARTY || state === TradeExecutionState.COUNTERPARTY_SIGNED || state === TradeExecutionState.BROADCASTING || state === TradeExecutionState.COMPLETED ? 'text-twilight-neon-blue' : 'text-gray-400'}`}>
                <div className={`w-4 h-4 rounded-full ${state === TradeExecutionState.PSBT_SIGNED || state === TradeExecutionState.SENDING_TO_COUNTERPARTY || state === TradeExecutionState.WAITING_FOR_COUNTERPARTY || state === TradeExecutionState.COUNTERPARTY_SIGNED || state === TradeExecutionState.BROADCASTING || state === TradeExecutionState.COMPLETED ? 'bg-twilight-neon-blue' : 'bg-twilight-dark'}`}></div>
                <span className="text-xs mt-1">Sign</span>
              </div>
              <div className={`flex flex-col items-center ${state === TradeExecutionState.WAITING_FOR_COUNTERPARTY || state === TradeExecutionState.COUNTERPARTY_SIGNED || state === TradeExecutionState.BROADCASTING || state === TradeExecutionState.COMPLETED ? 'text-twilight-neon-blue' : 'text-gray-400'}`}>
                <div className={`w-4 h-4 rounded-full ${state === TradeExecutionState.WAITING_FOR_COUNTERPARTY || state === TradeExecutionState.COUNTERPARTY_SIGNED || state === TradeExecutionState.BROADCASTING || state === TradeExecutionState.COMPLETED ? 'bg-twilight-neon-blue' : 'bg-twilight-dark'}`}></div>
                <span className="text-xs mt-1">Exchange</span>
              </div>
              <div className={`flex flex-col items-center ${state === TradeExecutionState.COMPLETED ? 'text-twilight-neon-blue' : 'text-gray-400'}`}>
                <div className={`w-4 h-4 rounded-full ${state === TradeExecutionState.COMPLETED ? 'bg-twilight-neon-blue' : 'bg-twilight-dark'}`}></div>
                <span className="text-xs mt-1">Complete</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-20 border border-red-500 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <h3 className="text-red-500 font-medium">Error</h3>
                <p className="text-red-400 text-sm">{error.message}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Transaction ID */}
        {txid && (
          <div className="mb-6 p-4 bg-green-900 bg-opacity-20 border border-green-500 rounded-lg">
            <div className="flex items-start">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <h3 className="text-green-500 font-medium">Transaction Successful</h3>
                <p className="text-green-400 text-sm">Transaction ID: {txid}</p>
                <a
                  href={`https://mempool.space/tx/${txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-twilight-neon-blue text-sm hover:underline"
                >
                  View on Block Explorer
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Trade Form */}
        {!isExecuting && state === TradeExecutionState.INITIALIZED && (
          <form onSubmit={handleSubmit}>
            {/* Amount Input */}
            <div className="mb-4">
              <label className="form-label">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="form-input pr-16"
                  step="any"
                  min="0"
                  max={maxAmount.toString()}
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400">{formatAssetName(baseAsset)}</span>
                </div>
              </div>
            </div>
            
            {/* Total Input */}
            <div className="mb-6">
              <label className="form-label">Total</label>
              <div className="relative">
                <input
                  type="number"
                  value={total}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  placeholder="0.00"
                  className="form-input pr-16"
                  step="any"
                  min="0"
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400">{formatAssetName(quoteAsset)}</span>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              className={`btn w-full ${side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
            >
              {isSubmitting ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              {side === 'buy' ? 'Buy' : 'Sell'} {formatAssetName(baseAsset)}
            </button>
          </form>
        )}
        
        {/* Action Buttons */}
        {(state === TradeExecutionState.COMPLETED || state === TradeExecutionState.FAILED || state === TradeExecutionState.CANCELLED) && (
          <button
            onClick={handleReset}
            className="btn w-full bg-twilight-dark hover:bg-twilight-secondary text-white"
          >
            Start New Trade
          </button>
        )}
        
        {isExecuting && state !== TradeExecutionState.COMPLETED && state !== TradeExecutionState.FAILED && state !== TradeExecutionState.CANCELLED && (
          <button
            onClick={handleCancel}
            className="btn w-full bg-red-600 hover:bg-red-700 text-white"
            disabled={state === TradeExecutionState.BROADCASTING}
          >
            Cancel Trade
          </button>
        )}
      </div>
      
      {/* Quick Actions */}
      {!isExecuting && state === TradeExecutionState.INITIALIZED && (
        <div className="card-footer">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setAmount((maxAmount * 0.25).toFixed(8))}
              className="btn btn-sm btn-secondary"
              disabled={isSubmitting}
            >
              25%
            </button>
            <button
              onClick={() => setAmount((maxAmount * 0.5).toFixed(8))}
              className="btn btn-sm btn-secondary"
              disabled={isSubmitting}
            >
              50%
            </button>
            <button
              onClick={() => setAmount((maxAmount * 0.75).toFixed(8))}
              className="btn btn-sm btn-secondary"
              disabled={isSubmitting}
            >
              75%
            </button>
            <button
              onClick={() => setAmount(maxAmount.toFixed(8))}
              className="btn btn-sm btn-secondary"
              disabled={isSubmitting}
            >
              Max
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeExecution;