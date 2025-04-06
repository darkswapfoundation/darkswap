/**
 * Trade - Trading page component
 * 
 * This page allows users to view the order book, trade history,
 * and place orders for trading assets.
 */

import React, { useState } from 'react';
import { useDarkSwapContext } from '../contexts/DarkSwapContext';
import { AssetType, Order } from '../wasm/DarkSwapWasm';
import OrderBook from '../components/OrderBook';
import TradeHistory from '../components/TradeHistory';
import WalletIntegration from '../components/WalletIntegration';
import P2PStatus from '../components/P2PStatus';
import { Card } from '../components/MemoizedComponents';

/**
 * Trade component
 */
const Trade: React.FC = () => {
  const { isInitialized } = useDarkSwapContext();
  
  // Trading pair state
  const [baseAssetType] = useState<AssetType>(AssetType.Bitcoin);
  const [baseAssetId] = useState<string>('BTC');
  const [quoteAssetType] = useState<AssetType>(AssetType.Bitcoin);
  const [quoteAssetId] = useState<string>('USD');
  
  // Selected order state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Handle order selection
  const handleOrderSelected = (order: Order) => {
    setSelectedOrder(order);
  };
  
  return (
    <div className="trade-page">
      <h1>Trade {baseAssetId}/{quoteAssetId}</h1>
      
      <div className="trade-page-content">
        <div className="trade-page-left">
          <OrderBook
            baseAssetType={baseAssetType}
            baseAssetId={baseAssetId}
            quoteAssetType={quoteAssetType}
            quoteAssetId={quoteAssetId}
            onOrderSelected={handleOrderSelected}
          />
          
          <TradeHistory
            baseAssetType={baseAssetType}
            baseAssetId={baseAssetId}
            quoteAssetType={quoteAssetType}
            quoteAssetId={quoteAssetId}
          />
        </div>
        
        <div className="trade-page-right">
          <WalletIntegration />
          
          <Card className="trade-form">
            <h2>Place Order</h2>
            
            {!isInitialized ? (
              <div className="not-initialized">
                <p>DarkSwap is not initialized.</p>
                <p>Please go to the Settings page to initialize DarkSwap.</p>
              </div>
            ) : selectedOrder ? (
              <div className="take-order-form">
                <h3>Take Order</h3>
                
                <div className="order-details">
                  <div className="order-detail">
                    <span className="label">Type:</span>
                    <span className="value">{selectedOrder.side === 0 ? 'Buy' : 'Sell'}</span>
                  </div>
                  
                  <div className="order-detail">
                    <span className="label">Price:</span>
                    <span className="value">{selectedOrder.price} {quoteAssetId}</span>
                  </div>
                  
                  <div className="order-detail">
                    <span className="label">Amount:</span>
                    <span className="value">{selectedOrder.amount} {baseAssetId}</span>
                  </div>
                  
                  <div className="order-detail">
                    <span className="label">Total:</span>
                    <span className="value">
                      {(parseFloat(selectedOrder.price) * parseFloat(selectedOrder.amount)).toFixed(2)} {quoteAssetId}
                    </span>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      // This is a placeholder for actual order taking
                      alert(`Taking order ${selectedOrder.id}`);
                    }}
                  >
                    Take Order
                  </button>
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="create-order-form">
                <h3>Create Order</h3>
                
                <div className="form-group">
                  <label htmlFor="orderType">Order Type</label>
                  <select id="orderType">
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="price">Price ({quoteAssetId})</label>
                  <input type="number" id="price" placeholder="0.00" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="amount">Amount ({baseAssetId})</label>
                  <input type="number" id="amount" placeholder="0.00000000" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="total">Total ({quoteAssetId})</label>
                  <input type="number" id="total" placeholder="0.00" readOnly />
                </div>
                
                <div className="form-actions">
                  <button className="btn btn-primary">
                    Place Order
                  </button>
                </div>
              </div>
            )}
          </Card>
          
          <P2PStatus />
        </div>
      </div>
    </div>
  );
};

export default Trade;