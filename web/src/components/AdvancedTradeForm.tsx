import React, { useState, useEffect, useMemo } from 'react';
import { useOrderbook } from '../contexts/OrderbookContext';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatPrice, formatAmount } from '../utils/formatters';

interface AdvancedTradeFormProps {
  baseAsset?: string;
  quoteAsset?: string;
  className?: string;
}

type OrderType = 'limit' | 'market' | 'stop-limit' | 'stop-market';
type OrderSide = 'buy' | 'sell';
type TimeInForce = 'gtc' | 'ioc' | 'fok';

const AdvancedTradeForm: React.FC<AdvancedTradeFormProps> = ({
  baseAsset = 'BTC',
  quoteAsset = 'RUNE:0x123',
  className = '',
}) => {
  // Get contexts
  const { 
    buyOrders, 
    sellOrders, 
    createOrder, 
    midPrice, 
    isLoading: isOrderbookLoading 
  } = useOrderbook();
  
  const { 
    isConnected: isWalletConnected, 
    connect: connectWallet,
    balance,
    isConnecting: isWalletConnecting
  } = useWasmWallet();
  
  const { addNotification } = useNotification();
  
  // Form state
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [timeInForce, setTimeInForce] = useState<TimeInForce>('gtc');
  const [amount, setAmount] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stopPrice, setStopPrice] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [expiry, setExpiry] = useState<number>(24 * 60 * 60 * 1000); // 24 hours
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Calculate best price
  const bestBuyPrice = useMemo(() => {
    if (buyOrders.length === 0) return '0';
    return buyOrders
      .filter(order => order.baseAsset === baseAsset && order.quoteAsset === quoteAsset)
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))[0]?.price || '0';
  }, [buyOrders, baseAsset, quoteAsset]);
  
  const bestSellPrice = useMemo(() => {
    if (sellOrders.length === 0) return '0';
    return sellOrders
      .filter(order => order.baseAsset === baseAsset && order.quoteAsset === quoteAsset)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0]?.price || '0';
  }, [sellOrders, baseAsset, quoteAsset]);
  
  // Set initial price when midPrice changes
  useEffect(() => {
    if (midPrice && price === '') {
      setPrice(midPrice);
    }
  }, [midPrice]);
  
  // Calculate total when amount or price changes
  useEffect(() => {
    if (amount && price) {
      const calculatedTotal = parseFloat(amount) * parseFloat(price);
      setTotal(calculatedTotal.toFixed(8));
    } else {
      setTotal('');
    }
  }, [amount, price]);
  
  // Update amount when total or price changes
  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotal = e.target.value;
    setTotal(newTotal);
    
    if (newTotal && price && parseFloat(price) > 0) {
      const calculatedAmount = parseFloat(newTotal) / parseFloat(price);
      setAmount(calculatedAmount.toFixed(8));
    } else {
      setAmount('');
    }
  };
  
  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = e.target.value;
    setPrice(newPrice);
    
    if (amount && newPrice) {
      const calculatedTotal = parseFloat(amount) * parseFloat(newPrice);
      setTotal(calculatedTotal.toFixed(8));
    }
  };
  
  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    
    if (newAmount && price) {
      const calculatedTotal = parseFloat(newAmount) * parseFloat(price);
      setTotal(calculatedTotal.toFixed(8));
    }
  };
  
  // Handle order type change
  const handleOrderTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOrderType = e.target.value as OrderType;
    setOrderType(newOrderType);
    
    // Reset stop price when changing order type
    if (newOrderType !== 'stop-limit' && newOrderType !== 'stop-market') {
      setStopPrice('');
    }
    
    // Set price to empty for market orders
    if (newOrderType === 'market' || newOrderType === 'stop-market') {
      setPrice('');
    } else if (price === '' && midPrice) {
      setPrice(midPrice);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!isWalletConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      addNotification('error', 'Please enter a valid amount');
      return;
    }
    
    if ((orderType === 'limit' || orderType === 'stop-limit') && (!price || parseFloat(price) <= 0)) {
      addNotification('error', 'Please enter a valid price');
      return;
    }
    
    if ((orderType === 'stop-limit' || orderType === 'stop-market') && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      addNotification('error', 'Please enter a valid stop price');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create order
      if (orderType === 'limit') {
        await createOrder(
          orderSide,
          baseAsset,
          quoteAsset,
          amount,
          price,
          expiry
        );
        
        addNotification('success', `${orderSide.toUpperCase()} order created successfully`);
        
        // Reset form
        setAmount('');
        setTotal('');
      } else {
        // For now, we only support limit orders
        addNotification('error', `${orderType} orders are not supported yet`);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      addNotification('error', `Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate max amount based on wallet balance
  const calculateMaxAmount = () => {
    if (!balance) return;
    
    if (orderSide === 'buy') {
      // For buy orders, max amount is based on quote asset balance
      // For simplicity, we're assuming the quote asset is BTC for now
      if (balance) {
        const maxTotal = parseFloat(balance.btc);
        if (price && parseFloat(price) > 0) {
          const maxAmount = maxTotal / parseFloat(price);
          setAmount(maxAmount.toFixed(8));
          setTotal(maxTotal.toFixed(8));
        }
      }
    } else {
      // For sell orders, max amount is based on base asset balance
      // For simplicity, we're assuming the base asset is BTC for now
      if (balance) {
        const maxAmount = parseFloat(balance.btc);
        setAmount(maxAmount.toFixed(8));
        if (price) {
          const maxTotal = maxAmount * parseFloat(price);
          setTotal(maxTotal.toFixed(8));
        }
      }
    }
  };
  
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h2 className="text-lg font-display font-medium">Advanced Trade</h2>
      </div>
      
      <div className="card-body">
        {/* Wallet connection status */}
        {!isWalletConnected && (
          <div className="mb-4 p-3 bg-twilight-darker rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Wallet not connected</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={connectWallet}
                disabled={isWalletConnecting}
              >
                {isWalletConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        )}
        
        {/* Order form */}
        <form onSubmit={handleSubmit}>
          {/* Buy/Sell tabs */}
          <div className="flex mb-4">
            <button
              type="button"
              className={`flex-1 py-2 rounded-l-lg ${
                orderSide === 'buy'
                  ? 'bg-ui-success text-white'
                  : 'bg-twilight-darker text-gray-400 hover:bg-twilight-dark'
              }`}
              onClick={() => setOrderSide('buy')}
            >
              Buy
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-r-lg ${
                orderSide === 'sell'
                  ? 'bg-ui-error text-white'
                  : 'bg-twilight-darker text-gray-400 hover:bg-twilight-dark'
              }`}
              onClick={() => setOrderSide('sell')}
            >
              Sell
            </button>
          </div>
          
          {/* Order type */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Order Type</label>
            <select
              className="w-full bg-twilight-darker border border-twilight-dark rounded-lg p-2 text-white"
              value={orderType}
              onChange={handleOrderTypeChange}
            >
              <option value="limit">Limit</option>
              <option value="market">Market</option>
              <option value="stop-limit">Stop Limit</option>
              <option value="stop-market">Stop Market</option>
            </select>
          </div>
          
          {/* Time in force (for limit orders) */}
          {(orderType === 'limit' || orderType === 'stop-limit') && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Time In Force</label>
              <select
                className="w-full bg-twilight-darker border border-twilight-dark rounded-lg p-2 text-white"
                value={timeInForce}
                onChange={(e) => setTimeInForce(e.target.value as TimeInForce)}
              >
                <option value="gtc">Good Till Cancelled</option>
                <option value="ioc">Immediate or Cancel</option>
                <option value="fok">Fill or Kill</option>
              </select>
            </div>
          )}
          
          {/* Stop price (for stop orders) */}
          {(orderType === 'stop-limit' || orderType === 'stop-market') && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Stop Price</label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-twilight-darker border border-twilight-dark rounded-lg p-2 text-white"
                  placeholder="0.00"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  step="any"
                  min="0"
                />
                <span className="absolute right-2 top-2 text-gray-400">{quoteAsset}</span>
              </div>
            </div>
          )}
          
          {/* Price (for limit orders) */}
          {(orderType === 'limit' || orderType === 'stop-limit') && (
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-400">Price</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary-light"
                    onClick={() => setPrice(bestBuyPrice)}
                  >
                    Best Bid
                  </button>
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary-light"
                    onClick={() => setPrice(bestSellPrice)}
                  >
                    Best Ask
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-twilight-darker border border-twilight-dark rounded-lg p-2 text-white"
                  placeholder="0.00"
                  value={price}
                  onChange={handlePriceChange}
                  step="any"
                  min="0"
                />
                <span className="absolute right-2 top-2 text-gray-400">{quoteAsset}</span>
              </div>
            </div>
          )}
          
          {/* Amount */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-400">Amount</label>
              {isWalletConnected && (
                <button
                  type="button"
                  className="text-xs text-primary hover:text-primary-light"
                  onClick={calculateMaxAmount}
                >
                  Max
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                className="w-full bg-twilight-darker border border-twilight-dark rounded-lg p-2 text-white"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                step="any"
                min="0"
              />
              <span className="absolute right-2 top-2 text-gray-400">{baseAsset}</span>
            </div>
          </div>
          
          {/* Total */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Total</label>
            <div className="relative">
              <input
                type="number"
                className="w-full bg-twilight-darker border border-twilight-dark rounded-lg p-2 text-white"
                placeholder="0.00"
                value={total}
                onChange={handleTotalChange}
                step="any"
                min="0"
              />
              <span className="absolute right-2 top-2 text-gray-400">{quoteAsset}</span>
            </div>
          </div>
          
          {/* Submit button */}
          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-medium ${
              orderSide === 'buy'
                ? 'bg-ui-success hover:bg-ui-success-dark'
                : 'bg-ui-error hover:bg-ui-error-dark'
            }`}
            disabled={isSubmitting || isOrderbookLoading || !isWalletConnected}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `${orderSide === 'buy' ? 'Buy' : 'Sell'} ${baseAsset}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdvancedTradeForm;