import React, { useState, useCallback } from 'react';
import { OrderBookFilters as OrderBookFiltersType } from '../utils/types';

interface OrderBookFiltersProps {
  filters: OrderBookFiltersType;
  onFilterChange: (filters: Partial<OrderBookFiltersType>) => void;
  onPairChange: (pair: string) => void;
  currentPair: string;
  onViewModeChange: (mode: 'table' | 'chart') => void;
  currentViewMode: 'table' | 'chart';
  className?: string;
}

/**
 * Order book filters component
 */
const OrderBookFilters: React.FC<OrderBookFiltersProps> = ({
  filters,
  onFilterChange,
  onPairChange,
  currentPair,
  onViewModeChange,
  currentViewMode,
  className
}) => {
  // Local state for input values
  const [minAmountInput, setMinAmountInput] = useState<string>(filters.minAmount.toString());
  const [maxAmountInput, setMaxAmountInput] = useState<string>(
    filters.maxAmount === Infinity ? '' : filters.maxAmount.toString()
  );
  
  // Available trading pairs
  const availablePairs = [
    'BTC/RUNE1',
    'BTC/RUNE2',
    'BTC/ALKANE1',
    'BTC/ALKANE2',
    'ETH/RUNE1',
    'ETH/RUNE2',
    'ETH/ALKANE1',
    'ETH/ALKANE2',
    'USDT/RUNE1',
    'USDT/RUNE2',
    'USDT/ALKANE1',
    'USDT/ALKANE2'
  ];
  
  // Handle pair change
  const handlePairChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onPairChange(e.target.value);
  }, [onPairChange]);
  
  // Handle view mode change
  const handleViewModeChange = useCallback((mode: 'table' | 'chart') => {
    onViewModeChange(mode);
  }, [onViewModeChange]);
  
  // Handle order type change
  const handleOrderTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      orderType: e.target.value as 'buy' | 'sell' | 'all'
    });
  }, [onFilterChange]);
  
  // Handle min amount change
  const handleMinAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMinAmountInput(value);
    
    // Only update filter if value is valid
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numValue = value === '' ? 0 : parseFloat(value);
      if (!isNaN(numValue)) {
        onFilterChange({ minAmount: numValue });
      }
    }
  }, [onFilterChange]);
  
  // Handle max amount change
  const handleMaxAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxAmountInput(value);
    
    // Only update filter if value is valid
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numValue = value === '' ? Infinity : parseFloat(value);
      if (!isNaN(numValue)) {
        onFilterChange({ maxAmount: numValue });
      }
    }
  }, [onFilterChange]);
  
  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setMinAmountInput('0');
    setMaxAmountInput('');
    onFilterChange({
      minAmount: 0,
      maxAmount: Infinity,
      orderType: 'all'
    });
  }, [onFilterChange]);
  
  return (
    <div className={`order-book-filters ${className || ''}`}>
      <div className="filter-row">
        <div className="filter-group">
          <label htmlFor="pair-select">Trading Pair</label>
          <select
            id="pair-select"
            value={currentPair}
            onChange={handlePairChange}
            aria-label="Select trading pair"
          >
            {availablePairs.map(pair => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="order-type-select">Order Type</label>
          <select
            id="order-type-select"
            value={filters.orderType}
            onChange={handleOrderTypeChange}
            aria-label="Filter by order type"
          >
            <option value="all">All Orders</option>
            <option value="buy">Buy Orders</option>
            <option value="sell">Sell Orders</option>
          </select>
        </div>
      </div>
      
      <div className="filter-row">
        <div className="filter-group">
          <label htmlFor="min-amount-input">Min Amount</label>
          <input
            id="min-amount-input"
            type="text"
            value={minAmountInput}
            onChange={handleMinAmountChange}
            placeholder="0"
            aria-label="Minimum order amount"
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="max-amount-input">Max Amount</label>
          <input
            id="max-amount-input"
            type="text"
            value={maxAmountInput}
            onChange={handleMaxAmountChange}
            placeholder="No limit"
            aria-label="Maximum order amount"
          />
        </div>
        
        <button
          className="reset-button"
          onClick={handleResetFilters}
          aria-label="Reset filters"
        >
          Reset Filters
        </button>
      </div>
      
      <div className="view-mode-toggle">
        <button
          className={`view-mode-button ${currentViewMode === 'table' ? 'active' : ''}`}
          onClick={() => handleViewModeChange('table')}
          aria-label="Table view"
          aria-pressed={currentViewMode === 'table'}
        >
          Table
        </button>
        <button
          className={`view-mode-button ${currentViewMode === 'chart' ? 'active' : ''}`}
          onClick={() => handleViewModeChange('chart')}
          aria-label="Chart view"
          aria-pressed={currentViewMode === 'chart'}
        >
          Chart
        </button>
      </div>
    </div>
  );
};

export default React.memo(OrderBookFilters);