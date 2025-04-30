import React, { useState, useEffect } from 'react';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatAmount, formatPrice } from '../utils/formatters';

interface AdvancedOrderFormProps {
  baseAsset: string;
  quoteAsset: string;
  className?: string;
  onOrderSubmit?: (order: any) => void;
}

type OrderType = 'limit' | 'market' | 'stop-limit' | 'stop-market';
type OrderSide = 'buy' | 'sell';
type TimeInForce = 'GTC' | 'IOC' | 'FOK';

const AdvancedOrderForm: React.FC<AdvancedOrderFormProps> = ({
  baseAsset,
  quoteAsset,
  className = '',
  onOrderSubmit,
}) => {
  // State
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [price, setPrice] = useState<string>('');
  const [stopPrice, setStopPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [timeInForce, setTimeInForce] = useState<TimeInForce>('GTC');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [baseBalance, setBaseBalance] = useState<string>('0');
  const [quoteBalance, setQuoteBalance] = useState<string>('0');
  const [slippageTolerance, setSlippageTolerance] = useState<number>(1); // 1%
  const [expiryTime, setExpiryTime] = useState<number>(0); // 0 = no expiry
  
  // Get wallet context
  const { isConnected } = useWasmWallet();
  
  // Get API client
  const { client } = useApi();
  
  // Get notification context
  const { addNotification } = useNotification();
  
  // Fetch balances when component mounts or assets change
  useEffect(() => {
    if (isConnected) {
      fetchBalances();
    }
  }, [isConnected, baseAsset, quoteAsset]);
  
  // Calculate total when price or amount changes
  useEffect(() => {
    if (price && amount && orderType !== 'market') {
      const calculatedTotal = (parseFloat(price) * parseFloat(amount)).toFixed(8);
      setTotal(calculatedTotal);
    } else if (orderType === 'market' && total && amount) {
      // For market orders, estimate price based on total and amount
      const estimatedPrice = (parseFloat(total) / parseFloat(amount)).toFixed(8);
      setPrice(estimatedPrice);
    }
  }, [price, amount, orderType]);
  
  // Calculate amount when total and price changes
  useEffect(() => {
    if (total && price && orderType !== 'market' && parseFloat(price) > 0) {
      const calculatedAmount = (parseFloat(total) / parseFloat(price)).toFixed(8);
      setAmount(calculatedAmount);
    }
  }, [total, price, orderType]);
  
  // Fetch balances
  const fetchBalances = async () => {
    try {
      // In a real implementation, this would use the wallet API
      // For now, we'll simulate it with mock data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock balances
      const mockBaseBalance = (Math.random() * 10).toFixed(8);
      const mockQuoteBalance = (Math.random() * 10000).toFixed(8);
      
      setBaseBalance(mockBaseBalance);
      setQuoteBalance(mockQuoteBalance);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to fetch balances');
    }
  };
  
  // Handle order submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would use the SDK API
      // For now, we'll simulate it with a delay
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create order object
      const order = {
        baseAsset,
        quoteAsset,
        side: orderSide,
        type: orderType,
        price: orderType === 'market' ? '0' : price,
        stopPrice: (orderType === 'stop-limit' || orderType === 'stop-market') ? stopPrice : '0',
        amount,
        total,
        timeInForce,
        slippageTolerance,
        expiryTime: expiryTime > 0 ? Date.now() + expiryTime * 60 * 60 * 1000 : 0,
        timestamp: Date.now(),
      };
      
      // Call onOrderSubmit callback if provided
      if (onOrderSubmit) {
        onOrderSubmit(order);
      }
      
      // Show success notification
      addNotification('success', `${orderSide.toUpperCase()} order placed successfully`);
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error('Error submitting order:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit order');
      addNotification('error', `Failed to place order: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    // Check if amount is valid
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    // Check if price is valid for limit orders
    if (orderType !== 'market' && (!price || parseFloat(price) <= 0)) {
      setError('Please enter a valid price');
      return false;
    }
    
    // Check if stop price is valid for stop orders
    if ((orderType === 'stop-limit' || orderType === 'stop-market') && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      setError('Please enter a valid stop price');
      return false;
    }
    
    // Check if user has enough balance
    if (orderSide === 'buy') {
      if (parseFloat(total) > parseFloat(quoteBalance)) {
        setError(`Insufficient ${quoteAsset} balance`);
        return false;
      }
    } else {
      if (parseFloat(amount) > parseFloat(baseBalance)) {
        setError(`Insufficient ${baseAsset} balance`);
        return false;
      }
    }
    
    return true;
  };
  
  // Reset form
  const resetForm = () => {
    setPrice('');
    setStopPrice('');
    setAmount('');
    setTotal('');
    setTimeInForce('GTC');
    setSlippageTolerance(1);
    setExpiryTime(0);
    setError(null);
  };
  
  // Handle percentage of balance
  const handlePercentageClick = (percentage: number) => {
    if (orderSide === 'buy') {
      // Calculate amount based on percentage of quote balance
      const maxTotal = parseFloat(quoteBalance) * (percentage / 100);
      setTotal(maxTotal.toFixed(8));
      
      if (orderType !== 'market' && parseFloat(price) > 0) {
        const calculatedAmount = (maxTotal / parseFloat(price)).toFixed(8);
        setAmount(calculatedAmount);
      }
    } else {
      // Calculate amount based on percentage of base balance
      const maxAmount = parseFloat(baseBalance) * (percentage / 100);
      setAmount(maxAmount.toFixed(8));
      
      if (orderType !== 'market' && parseFloat(price) > 0) {
        const calculatedTotal = (maxAmount * parseFloat(price)).toFixed(8);
        setTotal(calculatedTotal);
      }
    }
  };
  
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h2 className="text-lg font-display font-medium">Advanced Order</h2>
      </div>
      
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* Order Type Selection */}
          <div className="mb-4">
            <label className="form-label">Order Type</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex rounded-lg overflow-hidden border border-twilight-dark">
                <button
                  type="button"
                  onClick={() => setOrderType('limit')}
                  className={`flex-1 px-3 py-2 text-sm ${orderType === 'limit' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
                >
                  Limit
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('market')}
                  className={`flex-1 px-3 py-2 text-sm ${orderType === 'market' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
                >
                  Market
                </button>
              </div>
              
              <div className="flex rounded-lg overflow-hidden border border-twilight-dark">
                <button
                  type="button"
                  onClick={() => setOrderType('stop-limit')}
                  className={`flex-1 px-3 py-2 text-sm ${orderType === 'stop-limit' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
                >
                  Stop-Limit
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('stop-market')}
                  className={`flex-1 px-3 py-2 text-sm ${orderType === 'stop-market' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
                >
                  Stop-Market
                </button>
              </div>
            </div>
          </div>
          
          {/* Buy/Sell Selection */}
          <div className="mb-4">
            <label className="form-label">Side</label>
            <div className="flex rounded-lg overflow-hidden border border-twilight-dark">
              <button
                type="button"
                onClick={() => setOrderSide('buy')}
                className={`flex-1 px-3 py-2 ${orderSide === 'buy' ? 'bg-green-500 text-white' : 'bg-twilight-darker text-gray-400'}`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setOrderSide('sell')}
                className={`flex-1 px-3 py-2 ${orderSide === 'sell' ? 'bg-red-500 text-white' : 'bg-twilight-darker text-gray-400'}`}
              >
                Sell
              </button>
            </div>
          </div>
          
          {/* Stop Price (for stop orders) */}
          {(orderType === 'stop-limit' || orderType === 'stop-market') && (
            <div className="mb-4">
              <label className="form-label">Stop Price</label>
              <div className="relative">
                <input
                  type="number"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  placeholder="0.00"
                  className="form-input pr-16"
                  step="any"
                  min="0"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400">{quoteAsset}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Price (for limit orders) */}
          {orderType !== 'market' && (
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
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400">{quoteAsset}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Amount */}
          <div className="mb-4">
            <div className="flex justify-between">
              <label className="form-label">Amount</label>
              <span className="text-xs text-gray-400">
                Available: {formatAmount(baseBalance)} {baseAsset}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="form-input pr-16"
                step="any"
                min="0"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400">{baseAsset}</span>
              </div>
            </div>
            
            {/* Percentage buttons */}
            {orderSide === 'sell' && (
              <div className="flex justify-between mt-2">
                <button
                  type="button"
                  onClick={() => handlePercentageClick(25)}
                  className="px-2 py-1 text-xs bg-twilight-darker rounded-lg hover:bg-twilight-dark"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handlePercentageClick(50)}
                  className="px-2 py-1 text-xs bg-twilight-darker rounded-lg hover:bg-twilight-dark"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handlePercentageClick(75)}
                  className="px-2 py-1 text-xs bg-twilight-darker rounded-lg hover:bg-twilight-dark"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => handlePercentageClick(100)}
                  className="px-2 py-1 text-xs bg-twilight-darker rounded-lg hover:bg-twilight-dark"
                >
                  100%
                </button>
              </div>
            )}
          </div>
          
          {/* Total */}
          <div className="mb-4">
            <div className="flex justify-between">
              <label className="form-label">Total</label>
              <span className="text-xs text-gray-400">
                Available: {formatAmount(quoteBalance)} {quoteAsset}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0.00"
                className="form-input pr-16"
                step="any"
                min="0"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400">{quoteAsset}</span>
              </div>
            </div>
            
            {/* Percentage buttons */}
            {orderSide === 'buy' && (
              <div className="flex justify-between mt-2">
                <button
                  type="button"
                  onClick={() => handlePercentageClick(25)}
                  className="px-2 py-1 text-xs bg-twilight-darker rounded-lg hover:bg-twilight-dark"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handlePercentageClick(50)}
                  className="px-2 py-1 text-xs bg-twilight-darker rounded-lg hover:bg-twilight-dark"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handlePercentageClick(75)}
                  className="px-2 py-1 text-xs bg-twilight-darker rounded-lg hover:bg-twilight-dark"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => handlePercentageClick(100)}
                  className="px-2 py-1 text-xs bg-twilight-darker rounded-lg hover:bg-twilight-dark"
                >
                  100%
                </button>
              </div>
            )}
          </div>
          
          {/* Advanced Options */}
          <div className="mb-4">
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-gray-300 mb-2">Advanced Options</summary>
              
              {/* Time in Force */}
              <div className="mb-4">
                <label className="form-label">Time in Force</label>
                <select
                  value={timeInForce}
                  onChange={(e) => setTimeInForce(e.target.value as TimeInForce)}
                  className="form-select"
                >
                  <option value="GTC">Good Till Canceled (GTC)</option>
                  <option value="IOC">Immediate or Cancel (IOC)</option>
                  <option value="FOK">Fill or Kill (FOK)</option>
                </select>
                <div className="text-xs text-gray-400 mt-1">
                  {timeInForce === 'GTC' && 'Order will remain active until canceled'}
                  {timeInForce === 'IOC' && 'Order will be canceled if not filled immediately'}
                  {timeInForce === 'FOK' && 'Order must be filled completely or canceled'}
                </div>
              </div>
              
              {/* Expiry Time */}
              <div className="mb-4">
                <label className="form-label">Expiry Time (hours)</label>
                <input
                  type="number"
                  value={expiryTime}
                  onChange={(e) => setExpiryTime(parseInt(e.target.value))}
                  className="form-input"
                  min="0"
                  step="1"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {expiryTime === 0 ? 'Order will not expire' : `Order will expire in ${expiryTime} hours`}
                </div>
              </div>
              
              {/* Slippage Tolerance */}
              <div className="mb-4">
                <label className="form-label">Slippage Tolerance (%)</label>
                <input
                  type="number"
                  value={slippageTolerance}
                  onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
                  className="form-input"
                  min="0.1"
                  max="10"
                  step="0.1"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Maximum price movement allowed before order is rejected
                </div>
              </div>
            </details>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isConnected}
            className={`w-full py-3 rounded-lg font-medium ${
              orderSide === 'buy'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
            } text-white transition-colors duration-200`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <span>{orderSide === 'buy' ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdvancedOrderForm;