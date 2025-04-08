import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { OrderSide, OrderType } from '../types';
import '../styles/TradeForm.css';

interface TradeFormProps {
  baseAsset: string;
  quoteAsset: string;
  lastPrice?: string;
}

const TradeForm: React.FC<TradeFormProps> = ({
  baseAsset,
  quoteAsset,
  lastPrice = '',
}) => {
  const { theme } = useTheme();
  const { api } = useApi();
  const { addNotification } = useNotification();
  
  const [side, setSide] = useState<OrderSide>(OrderSide.Buy);
  const [type, setType] = useState<OrderType>(OrderType.Limit);
  const [price, setPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [baseBalance, setBaseBalance] = useState<string>('0');
  const [quoteBalance, setQuoteBalance] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch balances
  const fetchBalances = useCallback(async () => {
    try {
      const balances = await api.getBalances();
      
      // Find base asset balance
      const baseAssetBalance = balances.find(balance => balance.symbol === baseAsset);
      if (baseAssetBalance) {
        setBaseBalance(baseAssetBalance.available);
      }
      
      // Find quote asset balance
      const quoteAssetBalance = balances.find(balance => balance.symbol === quoteAsset);
      if (quoteAssetBalance) {
        setQuoteBalance(quoteAssetBalance.available);
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  }, [api, baseAsset, quoteAsset]);
  
  // Fetch balances on mount and when assets change
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);
  
  // Update price when lastPrice changes
  useEffect(() => {
    if (lastPrice && !price) {
      setPrice(lastPrice);
    }
  }, [lastPrice, price]);
  
  // Calculate total when price or amount changes
  useEffect(() => {
    if (price && amount) {
      const calculatedTotal = (parseFloat(price) * parseFloat(amount)).toString();
      setTotal(calculatedTotal);
    } else {
      setTotal('');
    }
  }, [price, amount]);
  
  // Calculate amount when price or total changes
  const calculateAmount = useCallback(() => {
    if (price && total && parseFloat(price) > 0) {
      const calculatedAmount = (parseFloat(total) / parseFloat(price)).toString();
      setAmount(calculatedAmount);
    }
  }, [price, total]);
  
  // Handle side change
  const handleSideChange = (newSide: OrderSide) => {
    setSide(newSide);
    setError(null);
  };
  
  // Handle type change
  const handleTypeChange = (newType: OrderType) => {
    setType(newType);
    setError(null);
  };
  
  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
      setError(null);
    }
  };
  
  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };
  
  // Handle total change
  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTotal(value);
      calculateAmount();
      setError(null);
    }
  };
  
  // Handle max button click
  const handleMaxClick = () => {
    if (side === OrderSide.Buy) {
      setTotal(quoteBalance);
      calculateAmount();
    } else {
      setAmount(baseBalance);
    }
    setError(null);
  };
  
  // Validate form
  const validateForm = (): boolean => {
    if (type === OrderType.Limit && (!price || parseFloat(price) <= 0)) {
      setError('Please enter a valid price.');
      return false;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return false;
    }
    
    if (side === OrderSide.Buy) {
      const requiredBalance = parseFloat(total);
      if (requiredBalance > parseFloat(quoteBalance)) {
        setError(`Insufficient ${quoteAsset} balance.`);
        return false;
      }
    } else {
      const requiredBalance = parseFloat(amount);
      if (requiredBalance > parseFloat(baseBalance)) {
        setError(`Insufficient ${baseAsset} balance.`);
        return false;
      }
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create order
      const orderId = await api.createOrder({
        side,
        type,
        baseAsset,
        quoteAsset,
        price: type === OrderType.Limit ? price : '0',
        amount,
        maker: 'user',
      });
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Order Created',
        message: `Your ${side === OrderSide.Buy ? 'buy' : 'sell'} order has been created.`,
      });
      
      // Reset form
      if (side === OrderSide.Buy) {
        setAmount('');
        setTotal('');
      } else {
        setAmount('');
      }
      
      // Refresh balances
      fetchBalances();
    } catch (error) {
      console.error('Failed to create order:', error);
      setError('Failed to create order. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={`trade-form trade-form-${theme}`}>
      <div className="trade-form-header">
        <h3>Place Order</h3>
        <div className="trade-form-tabs">
          <button
            className={`${side === OrderSide.Buy ? 'active' : ''} buy`}
            onClick={() => handleSideChange(OrderSide.Buy)}
          >
            Buy
          </button>
          <button
            className={`${side === OrderSide.Sell ? 'active' : ''} sell`}
            onClick={() => handleSideChange(OrderSide.Sell)}
          >
            Sell
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="trade-form-group">
          <label htmlFor="price">Price ({quoteAsset})</label>
          <div className="trade-form-input-group">
            <input
              id="price"
              type="text"
              value={price}
              onChange={handlePriceChange}
              placeholder="0.00"
              disabled={type === OrderType.Market}
            />
          </div>
        </div>
        
        <div className="trade-form-group">
          <label htmlFor="amount">Amount ({baseAsset})</label>
          <div className="trade-form-input-group">
            <input
              id="amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
            />
            <button
              type="button"
              className="trade-form-max-button"
              onClick={handleMaxClick}
            >
              MAX
            </button>
          </div>
          <div className="trade-form-balance">
            Available: {side === OrderSide.Buy ? quoteBalance : baseBalance} {side === OrderSide.Buy ? quoteAsset : baseAsset}
          </div>
        </div>
        
        {side === OrderSide.Buy && (
          <div className="trade-form-group">
            <label htmlFor="total">Total ({quoteAsset})</label>
            <div className="trade-form-input-group">
              <input
                id="total"
                type="text"
                value={total}
                onChange={handleTotalChange}
                placeholder="0.00"
              />
            </div>
          </div>
        )}
        
        {error && <div className="trade-form-error">{error}</div>}
        
        <button
          type="submit"
          className={`trade-form-submit-button ${side === OrderSide.Buy ? 'buy' : 'sell'}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : `${side === OrderSide.Buy ? 'Buy' : 'Sell'} ${baseAsset}`}
        </button>
      </form>
    </div>
  );
};

export default TradeForm;