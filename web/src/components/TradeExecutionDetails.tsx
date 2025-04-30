import React, { useState } from 'react';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatAmount, formatPrice, formatAddress } from '../utils/formatters';

interface TradeExecutionDetailsProps {
  orderId: string;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  amount: string;
  side: 'buy' | 'sell';
  maker: string;
  onClose: () => void;
  onExecute: () => void;
  className?: string;
}

const TradeExecutionDetails: React.FC<TradeExecutionDetailsProps> = ({
  orderId,
  baseAsset,
  quoteAsset,
  price,
  amount,
  side,
  maker,
  onClose,
  onExecute,
  className = '',
}) => {
  // State
  const [executionAmount, setExecutionAmount] = useState<string>(amount);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<string>('0.5');
  
  // Get wallet context
  const { isConnected, address } = useWasmWallet();
  
  // Get notification context
  const { addNotification } = useNotification();
  
  // Calculate total
  const total = parseFloat(executionAmount) * parseFloat(price);
  
  // Calculate slippage price
  const slippagePrice = side === 'buy'
    ? parseFloat(price) * (1 + parseFloat(slippage) / 100)
    : parseFloat(price) * (1 - parseFloat(slippage) / 100);
  
  // Calculate slippage total
  const slippageTotal = parseFloat(executionAmount) * slippagePrice;
  
  // Handle execution amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    
    // Validate amount
    if (newAmount === '' || parseFloat(newAmount) <= 0) {
      setExecutionAmount('');
      return;
    }
    
    // Ensure amount is not greater than available
    if (parseFloat(newAmount) > parseFloat(amount)) {
      setExecutionAmount(amount);
      return;
    }
    
    setExecutionAmount(newAmount);
  };
  
  // Handle max amount
  const handleMaxAmount = () => {
    setExecutionAmount(amount);
  };
  
  // Handle slippage change
  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlippage = e.target.value;
    
    // Validate slippage
    if (newSlippage === '' || parseFloat(newSlippage) < 0) {
      setSlippage('0');
      return;
    }
    
    // Ensure slippage is not greater than 10%
    if (parseFloat(newSlippage) > 10) {
      setSlippage('10');
      return;
    }
    
    setSlippage(newSlippage);
  };
  
  // Handle execute
  const handleExecute = async () => {
    if (!isConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }
    
    if (!executionAmount || parseFloat(executionAmount) <= 0) {
      addNotification('error', 'Please enter a valid amount');
      return;
    }
    
    setIsExecuting(true);
    
    try {
      // In a real implementation, this would call the API to execute the trade
      // For now, we'll simulate it with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addNotification('success', `Trade executed successfully: ${executionAmount} ${baseAsset} at ${formatPrice(price)} ${quoteAsset}`);
      
      // Close the modal
      onExecute();
    } catch (error) {
      addNotification('error', `Failed to execute trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 ${className}`}>
      <div className="card w-full max-w-md">
        <div className="card-header flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Execute {side === 'buy' ? 'Buy' : 'Sell'} Order
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
          {/* Order details */}
          <div className="mb-6 p-4 bg-twilight-darker rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Order ID:</span>
              <span className="font-mono">{formatAddress(orderId, 8, 8)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Maker:</span>
              <span className="font-mono">{formatAddress(maker, 8, 8)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Price:</span>
              <span>{formatPrice(price)} {quoteAsset}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Available:</span>
              <span>{formatAmount(amount)} {baseAsset}</span>
            </div>
          </div>
          
          {/* Execution amount */}
          <div className="mb-4">
            <label className="form-label">Amount to {side === 'buy' ? 'Buy' : 'Sell'}</label>
            <div className="relative">
              <input
                type="number"
                value={executionAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="form-input pr-16"
                step="any"
                min="0"
                max={amount}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="px-2 py-1 text-xs bg-twilight-primary text-white rounded mr-2"
                >
                  MAX
                </button>
                <span className="pr-3 text-gray-400">{baseAsset}</span>
              </div>
            </div>
          </div>
          
          {/* Total */}
          <div className="mb-6">
            <label className="form-label">Total</label>
            <div className="relative">
              <input
                type="text"
                value={total ? formatPrice(total.toString()) : ''}
                readOnly
                className="form-input pr-16 bg-twilight-darker"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-400">{quoteAsset}</span>
              </div>
            </div>
          </div>
          
          {/* Advanced options toggle */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-primary hover:text-primary-light flex items-center"
            >
              <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ml-1 transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Advanced options */}
          {showAdvanced && (
            <div className="mb-6 p-4 bg-twilight-darker rounded-lg">
              <div className="mb-4">
                <label className="form-label">Slippage Tolerance</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={slippage}
                    onChange={handleSlippageChange}
                    className="form-input w-20"
                    step="0.1"
                    min="0"
                    max="10"
                  />
                  <span className="ml-2">%</span>
                  
                  <div className="ml-4 space-x-2">
                    <button
                      type="button"
                      onClick={() => setSlippage('0.1')}
                      className={`px-2 py-1 text-xs rounded ${slippage === '0.1' ? 'bg-twilight-primary text-white' : 'bg-twilight-dark text-gray-400'}`}
                    >
                      0.1%
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlippage('0.5')}
                      className={`px-2 py-1 text-xs rounded ${slippage === '0.5' ? 'bg-twilight-primary text-white' : 'bg-twilight-dark text-gray-400'}`}
                    >
                      0.5%
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlippage('1.0')}
                      className={`px-2 py-1 text-xs rounded ${slippage === '1.0' ? 'bg-twilight-primary text-white' : 'bg-twilight-dark text-gray-400'}`}
                    >
                      1.0%
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Price:</span>
                  <span>{formatPrice(slippagePrice.toString())} {quoteAsset}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Total:</span>
                  <span>{formatPrice(slippageTotal.toString())} {quoteAsset}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isExecuting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={!executionAmount || parseFloat(executionAmount) <= 0 || isExecuting}
              className={`btn ${side === 'buy' ? 'btn-success' : 'btn-error'}`}
            >
              {isExecuting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                `${side === 'buy' ? 'Buy' : 'Sell'} ${baseAsset}`
              )}
            </button>
          </div>
          
          {/* Warning */}
          <div className="mt-4 text-xs text-gray-400">
            <p>
              By executing this trade, you agree to the terms and conditions of the DarkSwap platform.
              All trades are final and cannot be reversed once executed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeExecutionDetails;