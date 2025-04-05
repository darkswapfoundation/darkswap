import React, { useState, useMemo, useCallback } from 'react';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useMemoizedValue, useRenderPerformance } from '../utils/memoization';
import { cacheApiResponse } from '../utils/caching';
import { measureApiCall } from '../utils/performanceMonitoring';
import { withAccessibilityCheck } from '../utils/accessibilityChecker';
import { withSecurityCheck } from '../utils/securityChecker';
import { withCrossBrowserCheck } from '../utils/crossBrowserTesting';

interface TradeFormProps {
  initialAsset?: string;
  initialAmount?: number;
  onTradeCreated?: (tradeId: string) => void;
  className?: string;
}

/**
 * Optimized trade form component with performance enhancements
 */
const OptimizedTradeForm: React.FC<TradeFormProps> = ({
  initialAsset = 'BTC',
  initialAmount = 0,
  onTradeCreated,
  className
}) => {
  // Track component render performance
  useRenderPerformance('OptimizedTradeForm');
  
  // Contexts
  const { api } = useApi();
  const { addNotification } = useNotification();
  const { wallet, balance } = useWallet();
  const { subscribe, unsubscribe } = useWebSocket();
  
  // Form state
  const [sellAsset, setSellAsset] = useState<string>(initialAsset);
  const [sellAmount, setSellAmount] = useState<string>(initialAmount.toString());
  const [buyAsset, setBuyAsset] = useState<string>('');
  const [buyAmount, setBuyAmount] = useState<string>('0');
  const [price, setPrice] = useState<string>('0');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Available assets (memoized to prevent unnecessary re-renders)
  const availableAssets = useMemoizedValue(() => {
    return ['BTC', 'ETH', 'USDT', 'RUNE1', 'RUNE2', 'ALKANE1', 'ALKANE2'];
  }, []);
  
  // Memoized balance for the selected sell asset
  const sellAssetBalance = useMemo(() => {
    return balance[sellAsset] || 0;
  }, [balance, sellAsset]);
  
  // Memoized validation function
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    // Validate sell asset
    if (!sellAsset) {
      newErrors.sellAsset = 'Sell asset is required';
    }
    
    // Validate sell amount
    const sellAmountNum = parseFloat(sellAmount);
    if (isNaN(sellAmountNum) || sellAmountNum <= 0) {
      newErrors.sellAmount = 'Sell amount must be a positive number';
    } else if (sellAmountNum > sellAssetBalance) {
      newErrors.sellAmount = `Insufficient balance. You have ${sellAssetBalance} ${sellAsset}`;
    }
    
    // Validate buy asset
    if (!buyAsset) {
      newErrors.buyAsset = 'Buy asset is required';
    } else if (buyAsset === sellAsset) {
      newErrors.buyAsset = 'Buy asset must be different from sell asset';
    }
    
    // Validate buy amount
    const buyAmountNum = parseFloat(buyAmount);
    if (isNaN(buyAmountNum) || buyAmountNum <= 0) {
      newErrors.buyAmount = 'Buy amount must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [sellAsset, sellAmount, buyAsset, buyAmount, sellAssetBalance]);
  
  // Fetch price data with caching
  const fetchPrice = useCallback(async () => {
    if (!sellAsset || !buyAsset || !sellAmount || parseFloat(sellAmount) <= 0) {
      return;
    }
    
    try {
      const cacheKey = `price_${sellAsset}_${buyAsset}_${sellAmount}`;
      
      const priceData = await cacheApiResponse(
        () => measureApiCall(
          `get_price_${sellAsset}_${buyAsset}`,
          () => api.get(`/api/price?sellAsset=${sellAsset}&buyAsset=${buyAsset}&amount=${sellAmount}`)
        ),
        cacheKey,
        30000 // Cache for 30 seconds
      );
      
      if (priceData && priceData.data) {
        setBuyAmount(priceData.data.buyAmount.toString());
        setPrice(priceData.data.price.toString());
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      addNotification('error', 'Failed to fetch price data');
    }
  }, [api, sellAsset, buyAsset, sellAmount, addNotification]);
  
  // Debounced price fetch effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchPrice();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [fetchPrice]);
  
  // Subscribe to order book updates for the selected pair
  React.useEffect(() => {
    if (sellAsset && buyAsset) {
      const topic = `orderbook/${sellAsset}/${buyAsset}`;
      subscribe(topic);
      
      return () => {
        unsubscribe(topic);
      };
    }
  }, [sellAsset, buyAsset, subscribe, unsubscribe]);
  
  // Handle asset change
  const handleSellAssetChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSellAsset(event.target.value);
  }, []);
  
  const handleBuyAssetChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setBuyAsset(event.target.value);
  }, []);
  
  // Handle amount change with validation
  const handleSellAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setSellAmount(value);
    }
  }, []);
  
  const handleBuyAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBuyAmount(value);
      
      // Recalculate price if sell amount and buy amount are valid
      const sellAmountNum = parseFloat(sellAmount);
      const buyAmountNum = parseFloat(value);
      
      if (!isNaN(sellAmountNum) && !isNaN(buyAmountNum) && sellAmountNum > 0 && buyAmountNum > 0) {
        setPrice((buyAmountNum / sellAmountNum).toString());
      }
    }
  }, [sellAmount]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create trade
      const response = await measureApiCall(
        'create_trade',
        () => api.post('/api/trades', {
          sellAsset,
          sellAmount: parseFloat(sellAmount),
          buyAsset,
          buyAmount: parseFloat(buyAmount),
          price: parseFloat(price)
        })
      );
      
      if (response && response.data && response.data.tradeId) {
        addNotification('success', 'Trade created successfully');
        
        // Clear form
        setSellAmount('0');
        setBuyAmount('0');
        setPrice('0');
        
        // Call callback if provided
        if (onTradeCreated) {
          onTradeCreated(response.data.tradeId);
        }
      }
    } catch (error) {
      console.error('Error creating trade:', error);
      addNotification('error', 'Failed to create trade');
    } finally {
      setIsCreating(false);
    }
  }, [api, sellAsset, sellAmount, buyAsset, buyAmount, price, validateForm, addNotification, onTradeCreated]);
  
  // Memoized asset options to prevent unnecessary re-renders
  const assetOptions = useMemo(() => {
    return availableAssets.map(asset => (
      <option key={asset} value={asset}>{asset}</option>
    ));
  }, [availableAssets]);
  
  // Memoized form content to prevent unnecessary re-renders
  const formContent = useMemo(() => (
    <form onSubmit={handleSubmit} className={className} aria-label="Create Trade Form">
      <div className="form-group">
        <label htmlFor="sellAsset">Sell Asset</label>
        <select
          id="sellAsset"
          value={sellAsset}
          onChange={handleSellAssetChange}
          className={errors.sellAsset ? 'error' : ''}
          aria-invalid={!!errors.sellAsset}
          aria-describedby={errors.sellAsset ? 'sellAssetError' : undefined}
          disabled={isCreating}
        >
          <option value="">Select Asset</option>
          {assetOptions}
        </select>
        {errors.sellAsset && (
          <div id="sellAssetError" className="error-message" role="alert">
            {errors.sellAsset}
          </div>
        )}
        <div className="balance-info">
          Balance: {sellAssetBalance} {sellAsset}
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="sellAmount">Sell Amount</label>
        <input
          id="sellAmount"
          type="text"
          value={sellAmount}
          onChange={handleSellAmountChange}
          className={errors.sellAmount ? 'error' : ''}
          aria-invalid={!!errors.sellAmount}
          aria-describedby={errors.sellAmount ? 'sellAmountError' : undefined}
          disabled={isCreating}
        />
        {errors.sellAmount && (
          <div id="sellAmountError" className="error-message" role="alert">
            {errors.sellAmount}
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="buyAsset">Buy Asset</label>
        <select
          id="buyAsset"
          value={buyAsset}
          onChange={handleBuyAssetChange}
          className={errors.buyAsset ? 'error' : ''}
          aria-invalid={!!errors.buyAsset}
          aria-describedby={errors.buyAsset ? 'buyAssetError' : undefined}
          disabled={isCreating}
        >
          <option value="">Select Asset</option>
          {assetOptions}
        </select>
        {errors.buyAsset && (
          <div id="buyAssetError" className="error-message" role="alert">
            {errors.buyAsset}
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="buyAmount">Buy Amount</label>
        <input
          id="buyAmount"
          type="text"
          value={buyAmount}
          onChange={handleBuyAmountChange}
          className={errors.buyAmount ? 'error' : ''}
          aria-invalid={!!errors.buyAmount}
          aria-describedby={errors.buyAmount ? 'buyAmountError' : undefined}
          disabled={isCreating}
        />
        {errors.buyAmount && (
          <div id="buyAmountError" className="error-message" role="alert">
            {errors.buyAmount}
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="price">Price</label>
        <input
          id="price"
          type="text"
          value={price}
          readOnly
          disabled
        />
        <div className="price-info">
          1 {sellAsset} = {price} {buyAsset}
        </div>
      </div>
      
      <button
        type="submit"
        className="submit-button"
        disabled={isCreating || Object.keys(errors).length > 0}
        aria-busy={isCreating}
      >
        {isCreating ? 'Creating Trade...' : 'Create Trade'}
      </button>
    </form>
  ), [
    className, handleSubmit, sellAsset, handleSellAssetChange, errors,
    assetOptions, sellAssetBalance, sellAmount, handleSellAmountChange,
    buyAsset, handleBuyAssetChange, buyAmount, handleBuyAmountChange,
    price, isCreating
  ]);
  
  return formContent;
};

// Export with performance, accessibility, security, and cross-browser checks
export default withCrossBrowserCheck(
  withSecurityCheck(
    withAccessibilityCheck(
      React.memo(OptimizedTradeForm)
    )
  )
);