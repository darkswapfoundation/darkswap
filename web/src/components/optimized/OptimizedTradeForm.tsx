import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useApi } from '../../contexts/ApiContext';
import { useNotification } from '../../contexts/NotificationContext';
import { OrderType, TradeFormValues } from '../../utils/types';
import { formatPrice, formatNumber } from '../../utils/formatters';
import { validatePositiveNumber, validateNumber } from '../../utils/validators';
import { useDebounce, useStableCallback } from '../../utils/memoization';

interface OptimizedTradeFormProps {
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  price?: number | string;
  onPriceChange?: (price: number | string) => void;
  onOrderSubmit?: (order: any) => void;
  className?: string;
}

const OptimizedTradeForm: React.FC<OptimizedTradeFormProps> = ({
  pair,
  baseAsset,
  quoteAsset,
  price: externalPrice,
  onPriceChange,
  onOrderSubmit,
  className = ''
}) => {
  // Hooks
  const { wallet, balance } = useWallet();
  const { theme, isDark } = useTheme();
  const { api } = useApi();
  const { addNotification } = useNotification();
  
  // State
  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [formType, setFormType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState<string>(externalPrice?.toString() || '0');
  const [amount, setAmount] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [sliderValue, setSliderValue] = useState<number>(0);
  
  // Debounced values for calculations
  const debouncedPrice = useDebounce(price, 300);
  const debouncedAmount = useDebounce(amount, 300);
  const debouncedTotal = useDebounce(total, 300);
  
  // Get balances
  const baseBalance = useMemo(() => balance[baseAsset] || 0, [balance, baseAsset]);
  const quoteBalance = useMemo(() => balance[quoteAsset] || 0, [balance, quoteAsset]);
  
  // Calculate max amount based on balance
  const maxAmount = useMemo(() => {
    if (orderType === 'buy') {
      // For buy orders, max amount is quote balance / price
      const priceNum = parseFloat(price) || 0;
      return priceNum > 0 ? quoteBalance / priceNum : 0;
    } else {
      // For sell orders, max amount is base balance
      return baseBalance;
    }
  }, [orderType, price, baseBalance, quoteBalance]);
  
  // Calculate max total based on balance
  const maxTotal = useMemo(() => {
    if (orderType === 'buy') {
      // For buy orders, max total is quote balance
      return quoteBalance;
    } else {
      // For sell orders, max total is base balance * price
      const priceNum = parseFloat(price) || 0;
      return baseBalance * priceNum;
    }
  }, [orderType, price, baseBalance, quoteBalance]);
  
  // Update price when external price changes
  useEffect(() => {
    if (externalPrice !== undefined && externalPrice !== null) {
      setPrice(externalPrice.toString());
    }
  }, [externalPrice]);
  
  // Calculate total when price or amount changes
  useEffect(() => {
    // Skip if values are empty or invalid
    if (!debouncedPrice || !debouncedAmount) {
      return;
    }
    
    // Parse values
    const priceNum = parseFloat(debouncedPrice);
    const amountNum = parseFloat(debouncedAmount);
    
    // Calculate total
    if (priceNum > 0 && amountNum > 0) {
      const calculatedTotal = (priceNum * amountNum).toFixed(8);
      
      // Only update if different to avoid infinite loop
      if (calculatedTotal !== debouncedTotal) {
        setTotal(calculatedTotal);
      }
    }
  }, [debouncedPrice, debouncedAmount, debouncedTotal]);
  
  // Calculate amount when price or total changes
  useEffect(() => {
    // Skip if price is empty or invalid
    if (!debouncedPrice || !debouncedTotal || parseFloat(debouncedPrice) <= 0) {
      return;
    }
    
    // Skip if amount is being edited
    if (document.activeElement?.id === 'trade-amount') {
      return;
    }
    
    // Parse values
    const priceNum = parseFloat(debouncedPrice);
    const totalNum = parseFloat(debouncedTotal);
    
    // Calculate amount
    if (priceNum > 0 && totalNum > 0) {
      const calculatedAmount = (totalNum / priceNum).toFixed(8);
      
      // Only update if different to avoid infinite loop
      if (calculatedAmount !== debouncedAmount) {
        setAmount(calculatedAmount);
      }
    }
  }, [debouncedPrice, debouncedTotal, debouncedAmount]);
  
  // Handle price change
  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = e.target.value;
    setPrice(newPrice);
    
    // Notify parent component if needed
    if (onPriceChange) {
      onPriceChange(newPrice);
    }
  }, [onPriceChange]);
  
  // Handle amount change
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    
    // Update slider value
    const amountNum = parseFloat(newAmount) || 0;
    const percentage = maxAmount > 0 ? (amountNum / maxAmount) * 100 : 0;
    setSliderValue(Math.min(percentage, 100));
  }, [maxAmount]);
  
  // Handle total change
  const handleTotalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotal = e.target.value;
    setTotal(newTotal);
    
    // Update slider value
    const totalNum = parseFloat(newTotal) || 0;
    const percentage = maxTotal > 0 ? (totalNum / maxTotal) * 100 : 0;
    setSliderValue(Math.min(percentage, 100));
  }, [maxTotal]);
  
  // Handle slider change
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value);
    setSliderValue(percentage);
    
    // Update amount and total based on percentage
    if (orderType === 'buy') {
      const newTotal = (maxTotal * (percentage / 100)).toFixed(8);
      setTotal(newTotal);
    } else {
      const newAmount = (maxAmount * (percentage / 100)).toFixed(8);
      setAmount(newAmount);
    }
  }, [orderType, maxAmount, maxTotal]);
  
  // Handle order type change
  const handleOrderTypeChange = useCallback((type: OrderType) => {
    setOrderType(type);
    
    // Reset form values
    setAmount('');
    setTotal('');
    setSliderValue(0);
    setErrors({});
  }, []);
  
  // Handle form type change
  const handleFormTypeChange = useCallback((type: 'limit' | 'market') => {
    setFormType(type);
    
    // Reset form values
    setAmount('');
    setTotal('');
    setSliderValue(0);
    setErrors({});
    
    // Reset price for market orders
    if (type === 'market') {
      setPrice('Market');
    } else if (price === 'Market') {
      setPrice(externalPrice?.toString() || '0');
    }
  }, [externalPrice, price]);
  
  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    // Validate price for limit orders
    if (formType === 'limit') {
      const priceError = validatePositiveNumber(price, { required: true, allowZero: false });
      if (priceError) {
        newErrors.price = priceError;
      }
    }
    
    // Validate amount
    const amountError = validatePositiveNumber(amount, { required: true, allowZero: false });
    if (amountError) {
      newErrors.amount = amountError;
    }
    
    // Validate total for limit orders
    if (formType === 'limit') {
      const totalError = validatePositiveNumber(total, { required: true, allowZero: false });
      if (totalError) {
        newErrors.total = totalError;
      }
    }
    
    // Check if user has enough balance
    if (orderType === 'buy' && parseFloat(total) > quoteBalance) {
      newErrors.total = `Insufficient ${quoteAsset} balance`;
    } else if (orderType === 'sell' && parseFloat(amount) > baseBalance) {
      newErrors.amount = `Insufficient ${baseAsset} balance`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formType, price, amount, total, orderType, baseAsset, quoteAsset, baseBalance, quoteBalance]);
  
  // Handle form submission
  const handleSubmit = useStableCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Check if wallet is connected
    if (!wallet) {
      addNotification({
        type: 'error',
        title: 'Wallet not connected',
        message: 'Please connect your wallet to place an order'
      });
      return;
    }
    
    // Create order
    const order = {
      type: orderType,
      pair,
      baseAsset,
      quoteAsset,
      price: formType === 'market' ? 'market' : parseFloat(price),
      amount: parseFloat(amount),
      total: parseFloat(total),
      orderType: formType
    };
    
    // Set loading state
    setLoading(true);
    
    try {
      // Submit order
      const response = await api.post('/orders', order);
      
      // Handle success
      if (response && response.data && response.data.success) {
        addNotification({
          type: 'success',
          title: 'Order placed',
          message: `Your ${orderType} order has been placed successfully`
        });
        
        // Reset form
        setAmount('');
        setTotal('');
        setSliderValue(0);
        
        // Notify parent component
        if (onOrderSubmit) {
          onOrderSubmit(response.data.order);
        }
      } else {
        throw new Error(response?.data?.error || 'Failed to place order');
      }
    } catch (error) {
      // Handle error
      addNotification({
        type: 'error',
        title: 'Order failed',
        message: error.message || 'Failed to place order'
      });
    } finally {
      // Reset loading state
      setLoading(false);
    }
  }, [
    validateForm, wallet, addNotification, orderType, pair, baseAsset, quoteAsset,
    formType, price, amount, total, api, onOrderSubmit
  ]);
  
  return (
    <div className={`trade-form-container ${className}`}>
      {/* Order Type Tabs */}
      <div className="order-type-tabs">
        <button
          className={`order-type-tab ${orderType === 'buy' ? 'active' : ''}`}
          onClick={() => handleOrderTypeChange('buy')}
        >
          Buy
        </button>
        <button
          className={`order-type-tab ${orderType === 'sell' ? 'active' : ''}`}
          onClick={() => handleOrderTypeChange('sell')}
        >
          Sell
        </button>
      </div>
      
      {/* Form Type Tabs */}
      <div className="form-type-tabs">
        <button
          className={`form-type-tab ${formType === 'limit' ? 'active' : ''}`}
          onClick={() => handleFormTypeChange('limit')}
        >
          Limit
        </button>
        <button
          className={`form-type-tab ${formType === 'market' ? 'active' : ''}`}
          onClick={() => handleFormTypeChange('market')}
        >
          Market
        </button>
      </div>
      
      {/* Trade Form */}
      <form className="trade-form" onSubmit={handleSubmit}>
        {/* Price Input */}
        <div className="form-group">
          <label htmlFor="trade-price">Price ({quoteAsset})</label>
          <div className="input-group">
            <input
              id="trade-price"
              type="text"
              value={price}
              onChange={handlePriceChange}
              disabled={formType === 'market'}
              className={errors.price ? 'error' : ''}
            />
            <span className="input-group-text">{quoteAsset}</span>
          </div>
          {errors.price && <div className="error-message">{errors.price}</div>}
        </div>
        
        {/* Amount Input */}
        <div className="form-group">
          <label htmlFor="trade-amount">Amount ({baseAsset})</label>
          <div className="input-group">
            <input
              id="trade-amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className={errors.amount ? 'error' : ''}
            />
            <span className="input-group-text">{baseAsset}</span>
          </div>
          {errors.amount && <div className="error-message">{errors.amount}</div>}
        </div>
        
        {/* Total Input */}
        <div className="form-group">
          <label htmlFor="trade-total">Total ({quoteAsset})</label>
          <div className="input-group">
            <input
              id="trade-total"
              type="text"
              value={total}
              onChange={handleTotalChange}
              className={errors.total ? 'error' : ''}
            />
            <span className="input-group-text">{quoteAsset}</span>
          </div>
          {errors.total && <div className="error-message">{errors.total}</div>}
        </div>
        
        {/* Slider */}
        <div className="form-group">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={sliderValue}
            onChange={handleSliderChange}
            className="slider"
          />
          <div className="slider-labels">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* Balance Information */}
        <div className="balance-info">
          <div>
            <span>Available:</span>
            <span>
              {orderType === 'buy'
                ? `${formatNumber(quoteBalance, 8)} ${quoteAsset}`
                : `${formatNumber(baseBalance, 8)} ${baseAsset}`}
            </span>
          </div>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          className={`submit-button ${orderType}-button`}
          disabled={loading || !wallet}
        >
          {loading ? (
            <span className="spinner"></span>
          ) : (
            `${orderType === 'buy' ? 'Buy' : 'Sell'} ${baseAsset}`
          )}
        </button>
      </form>
    </div>
  );
};

export default React.memo(OptimizedTradeForm);