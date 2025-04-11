import React, { useState, useEffect } from 'react';
import { useWalletBalance } from '../contexts/WebSocketContext';

// Trade form props
interface TradeFormProps {
  baseAsset: string;
  quoteAsset: string;
  className?: string;
  onSubmit?: (order: {
    baseAsset: string;
    quoteAsset: string;
    price: string;
    amount: string;
    type: 'buy' | 'sell';
  }) => void;
  initialPrice?: string;
  initialType?: 'buy' | 'sell';
}

/**
 * Trade form component
 * @param props Component props
 * @returns Trade form component
 */
const TradeForm: React.FC<TradeFormProps> = ({
  baseAsset,
  quoteAsset,
  className,
  onSubmit,
  initialPrice = '',
  initialType = 'buy',
}) => {
  // State
  const [type, setType] = useState<'buy' | 'sell'>(initialType);
  const [price, setPrice] = useState<string>(initialPrice);
  const [amount, setAmount] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [errors, setErrors] = useState<{
    price?: string;
    amount?: string;
    total?: string;
    balance?: string;
  }>({});
  
  // Get wallet balance
  const balance = useWalletBalance();
  
  // Update total when price or amount changes
  useEffect(() => {
    if (price && amount) {
      const priceValue = parseFloat(price);
      const amountValue = parseFloat(amount);
      
      if (!isNaN(priceValue) && !isNaN(amountValue)) {
        setTotal((priceValue * amountValue).toFixed(8));
      } else {
        setTotal('');
      }
    } else {
      setTotal('');
    }
  }, [price, amount]);
  
  // Update amount when price or total changes
  useEffect(() => {
    if (price && total && parseFloat(price) > 0) {
      const priceValue = parseFloat(price);
      const totalValue = parseFloat(total);
      
      if (!isNaN(priceValue) && !isNaN(totalValue)) {
        setAmount((totalValue / priceValue).toFixed(8));
      }
    }
  }, [price, total]);
  
  // Validate form
  const validateForm = () => {
    const newErrors: {
      price?: string;
      amount?: string;
      total?: string;
      balance?: string;
    } = {};
    
    // Validate price
    if (!price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    // Validate amount
    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    // Validate balance
    if (type === 'buy' && balance[quoteAsset]) {
      const totalValue = parseFloat(total);
      const balanceValue = parseFloat(balance[quoteAsset]);
      
      if (totalValue > balanceValue) {
        newErrors.balance = `Insufficient ${quoteAsset} balance`;
      }
    } else if (type === 'sell' && balance[baseAsset]) {
      const amountValue = parseFloat(amount);
      const balanceValue = parseFloat(balance[baseAsset]);
      
      if (amountValue > balanceValue) {
        newErrors.balance = `Insufficient ${baseAsset} balance`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && onSubmit) {
      onSubmit({
        baseAsset,
        quoteAsset,
        price,
        amount,
        type,
      });
      
      // Reset form
      setAmount('');
      setTotal('');
    }
  };
  
  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value);
  };
  
  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };
  
  // Handle total change
  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotal(e.target.value);
  };
  
  // Handle type change
  const handleTypeChange = (newType: 'buy' | 'sell') => {
    setType(newType);
    setErrors({});
  };
  
  // Format balance
  const formatBalance = (balanceValue: string | undefined) => {
    if (!balanceValue) {
      return '0.00000000';
    }
    
    return parseFloat(balanceValue).toFixed(8);
  };
  
  return (
    <div className={`trade-form ${className || ''}`}>
      <div className="trade-form-header">
        <h3>Trade</h3>
        <div className="trade-form-pair">{baseAsset}/{quoteAsset}</div>
      </div>
      
      <div className="trade-form-content">
        <div className="trade-form-tabs">
          <button
            className={`trade-form-tab ${type === 'buy' ? 'active' : ''}`}
            onClick={() => handleTypeChange('buy')}
          >
            Buy
          </button>
          <button
            className={`trade-form-tab ${type === 'sell' ? 'active' : ''}`}
            onClick={() => handleTypeChange('sell')}
          >
            Sell
          </button>
        </div>
        
        <form className="trade-form-form" onSubmit={handleSubmit}>
          <div className="trade-form-group">
            <label htmlFor="price">Price ({quoteAsset})</label>
            <input
              type="text"
              id="price"
              value={price}
              onChange={handlePriceChange}
              placeholder="0.00000000"
              className={errors.price ? 'error' : ''}
            />
            {errors.price && <div className="trade-form-error">{errors.price}</div>}
          </div>
          
          <div className="trade-form-group">
            <label htmlFor="amount">Amount ({baseAsset})</label>
            <input
              type="text"
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00000000"
              className={errors.amount ? 'error' : ''}
            />
            {errors.amount && <div className="trade-form-error">{errors.amount}</div>}
          </div>
          
          <div className="trade-form-group">
            <label htmlFor="total">Total ({quoteAsset})</label>
            <input
              type="text"
              id="total"
              value={total}
              onChange={handleTotalChange}
              placeholder="0.00000000"
              className={errors.total ? 'error' : ''}
            />
            {errors.total && <div className="trade-form-error">{errors.total}</div>}
          </div>
          
          <div className="trade-form-balance">
            <div className="trade-form-balance-label">
              {type === 'buy'
                ? `${quoteAsset} Balance:`
                : `${baseAsset} Balance:`}
            </div>
            <div className="trade-form-balance-value">
              {type === 'buy'
                ? formatBalance(balance[quoteAsset])
                : formatBalance(balance[baseAsset])}
            </div>
          </div>
          
          {errors.balance && (
            <div className="trade-form-error trade-form-balance-error">
              {errors.balance}
            </div>
          )}
          
          <button
            type="submit"
            className={`trade-form-submit trade-form-submit-${type}`}
          >
            {type === 'buy' ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TradeForm;