import React, { useState, useEffect } from 'react';

// Icons
import {
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export interface TradeFormProps {
  pair: string;
  isLoading: boolean;
  isWalletConnected: boolean;
  isSDKInitialized: boolean;
}

const TradeForm: React.FC<TradeFormProps> = ({
  pair,
  isLoading,
  isWalletConnected,
  isSDKInitialized
}) => {
  // Parse pair
  const [baseAsset, quoteAsset] = pair.split('/');
  
  // Form state
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Mock balances
  const [balances, setBalances] = useState<{[key: string]: number}>({
    BTC: 0.5,
    'RUNE:0x123': 1000,
    'ALKANE:0x456': 500,
    'RUNE:0x789': 750
  });

  // Update price when pair changes
  useEffect(() => {
    if (isSDKInitialized && !isLoading) {
      // Set a default price based on the pair
      if (pair.includes('BTC')) {
        setPrice(pair.includes('RUNE') ? '20000' : '200');
      } else {
        setPrice('10');
      }
    }
  }, [pair, isSDKInitialized, isLoading]);

  // Calculate total when amount or price changes
  useEffect(() => {
    if (amount && price && orderType === 'limit') {
      const calculatedTotal = parseFloat(amount) * parseFloat(price);
      setTotal(calculatedTotal.toFixed(calculatedTotal < 1 ? 8 : 2));
    }
  }, [amount, price, orderType]);

  // Update amount when total or price changes
  const handleTotalChange = (value: string) => {
    setTotal(value);
    if (value && price && parseFloat(price) > 0) {
      const calculatedAmount = parseFloat(value) / parseFloat(price);
      setAmount(calculatedAmount.toFixed(calculatedAmount < 1 ? 8 : 4));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isWalletConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!isSDKInitialized) {
      setError('SDK is not initialized');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      setError('Please enter a valid price');
      return;
    }
    
    // Check balance
    const assetToCheck = side === 'buy' ? quoteAsset : baseAsset;
    const amountToCheck = side === 'buy' ? parseFloat(total) : parseFloat(amount);
    
    if (!balances[assetToCheck] || balances[assetToCheck] < amountToCheck) {
      setError(`Insufficient ${assetToCheck} balance`);
      return;
    }
    
    // Clear previous messages
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update balances (mock)
      const newBalances = { ...balances };
      
      if (side === 'buy') {
        newBalances[quoteAsset] -= parseFloat(total);
        newBalances[baseAsset] = (newBalances[baseAsset] || 0) + parseFloat(amount);
      } else {
        newBalances[baseAsset] -= parseFloat(amount);
        newBalances[quoteAsset] = (newBalances[quoteAsset] || 0) + parseFloat(total);
      }
      
      setBalances(newBalances);
      setSuccess(`Order ${side === 'buy' ? 'bought' : 'sold'} successfully`);
      setIsSubmitting(false);
      
      // Reset form after success
      setAmount('');
      setTotal('');
    }, 1500);
  };

  // Toggle between buy and sell
  const toggleSide = () => {
    setSide(side === 'buy' ? 'sell' : 'buy');
    setError(null);
    setSuccess(null);
  };

  // Format asset name for display
  const formatAssetName = (asset: string) => {
    if (asset.includes(':')) {
      const [type] = asset.split(':');
      return `${type}`;
    }
    return asset;
  };

  return (
    <div className="card h-full">
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium">
          {side === 'buy' ? 'Buy' : 'Sell'} {formatAssetName(baseAsset)}
        </h2>
        <button
          onClick={toggleSide}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          disabled={isSubmitting}
        >
          <ArrowsRightLeftIcon className="w-5 h-5" />
        </button>
      </div>
      
      <div className="card-body">
        {/* Order Type Selector */}
        <div className="flex rounded-lg overflow-hidden border border-twilight-dark mb-6">
          <button
            onClick={() => setOrderType('limit')}
            className={`flex-1 py-2 text-sm ${orderType === 'limit' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
          >
            Limit
          </button>
          <button
            onClick={() => setOrderType('market')}
            className={`flex-1 py-2 text-sm ${orderType === 'market' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
          >
            Market
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Price Input (only for limit orders) */}
          {orderType === 'limit' && (
            <div className="mb-4">
              <label className="form-label">Price</label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="form-input pr-16"
                  step="any"
                  min="0"
                  disabled={isSubmitting || !isSDKInitialized}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400">{formatAssetName(quoteAsset)}</span>
                </div>
              </div>
            </div>
          )}
          
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
                disabled={isSubmitting || !isSDKInitialized}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400">{formatAssetName(baseAsset)}</span>
              </div>
            </div>
          </div>
          
          {/* Total Input (only for limit orders) */}
          {orderType === 'limit' && (
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
                  disabled={isSubmitting || !isSDKInitialized}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400">{formatAssetName(quoteAsset)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Balance Display */}
          <div className="flex justify-between text-sm mb-6">
            <span className="text-gray-400">
              {side === 'buy' ? `${formatAssetName(quoteAsset)} Balance` : `${formatAssetName(baseAsset)} Balance`}
            </span>
            <span className="text-white">
              {side === 'buy' 
                ? `${balances[quoteAsset]?.toFixed(quoteAsset === 'BTC' ? 8 : 2) || '0.00'} ${formatAssetName(quoteAsset)}`
                : `${balances[baseAsset]?.toFixed(baseAsset === 'BTC' ? 8 : 2) || '0.00'} ${formatAssetName(baseAsset)}`
              }
            </span>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-2 bg-ui-error bg-opacity-10 border border-ui-error border-opacity-50 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 text-ui-error mr-2" />
                <span className="text-ui-error text-sm">{error}</span>
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-2 bg-ui-success bg-opacity-10 border border-ui-success border-opacity-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 text-ui-success mr-2" />
                <span className="text-ui-success text-sm">{success}</span>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <button
            type="submit"
            className={`btn w-full ${side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
            disabled={isSubmitting || !isWalletConnected || !isSDKInitialized}
          >
            {isSubmitting ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {side === 'buy' ? 'Buy' : 'Sell'} {formatAssetName(baseAsset)}
          </button>
        </form>
      </div>
      
      {/* Quick Actions */}
      <div className="card-footer">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => {
              const bal = side === 'buy' ? balances[quoteAsset] / parseFloat(price) * 0.25 : balances[baseAsset] * 0.25;
              setAmount(bal.toFixed(8));
            }}
            className="btn btn-sm btn-secondary"
            disabled={isSubmitting || !isSDKInitialized}
          >
            25%
          </button>
          <button
            onClick={() => {
              const bal = side === 'buy' ? balances[quoteAsset] / parseFloat(price) * 0.5 : balances[baseAsset] * 0.5;
              setAmount(bal.toFixed(8));
            }}
            className="btn btn-sm btn-secondary"
            disabled={isSubmitting || !isSDKInitialized}
          >
            50%
          </button>
          <button
            onClick={() => {
              const bal = side === 'buy' ? balances[quoteAsset] / parseFloat(price) * 0.75 : balances[baseAsset] * 0.75;
              setAmount(bal.toFixed(8));
            }}
            className="btn btn-sm btn-secondary"
            disabled={isSubmitting || !isSDKInitialized}
          >
            75%
          </button>
          <button
            onClick={() => {
              const bal = side === 'buy' ? balances[quoteAsset] / parseFloat(price) : balances[baseAsset];
              setAmount(bal.toFixed(8));
            }}
            className="btn btn-sm btn-secondary"
            disabled={isSubmitting || !isSDKInitialized}
          >
            Max
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeForm;