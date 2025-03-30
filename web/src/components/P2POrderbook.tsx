import React, { useState, useEffect } from 'react';
import { useOrderbook } from '../contexts/OrderbookContext';
import { useWallet } from '../contexts/WalletContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  Order,
  OrderSide,
  OrderStatus,
  OrderAsset,
  AssetType,
} from '../utils/OrderbookUtils';

/**
 * P2P Orderbook component
 * Displays and allows interaction with the decentralized orderbook
 */
const P2POrderbook: React.FC = () => {
  // Contexts
  const {
    orderbook,
    isLoading,
    error,
    createOrder,
    cancelOrder,
    getOpenOrders,
    getMyOrders,
    refreshOrderbook,
  } = useOrderbook();

  const { isConnected: isWalletConnected, address } = useWallet();
  const { addNotification } = useNotification();

  // State
  const [activeTab, setActiveTab] = useState<'open' | 'my'>('open');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [newOrderSide, setNewOrderSide] = useState<OrderSide>(OrderSide.Buy);
  const [newOrderBaseAssetType, setNewOrderBaseAssetType] = useState<AssetType>(AssetType.Bitcoin);
  const [newOrderBaseAssetId, setNewOrderBaseAssetId] = useState<string>('');
  const [newOrderBaseAmount, setNewOrderBaseAmount] = useState<string>('');
  const [newOrderQuoteAssetType, setNewOrderQuoteAssetType] = useState<AssetType>(AssetType.Rune);
  const [newOrderQuoteAssetId, setNewOrderQuoteAssetId] = useState<string>('');
  const [newOrderQuoteAmount, setNewOrderQuoteAmount] = useState<string>('');
  const [newOrderExpiry, setNewOrderExpiry] = useState<number>(0); // 0 means no expiry
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Get orders based on active tab
  const getOrders = (): Order[] => {
    if (activeTab === 'open') {
      return getOpenOrders();
    } else {
      return getMyOrders();
    }
  };

  // Handle order creation
  const handleCreateOrder = async () => {
    if (!isWalletConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }

    if (!newOrderBaseAmount || !newOrderQuoteAmount) {
      addNotification('error', 'Please enter amounts for both assets');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create base asset
      const baseAsset: OrderAsset = {
        type: newOrderBaseAssetType,
        id: newOrderBaseAssetId || undefined,
        amount: newOrderBaseAmount,
      };

      // Create quote asset
      const quoteAsset: OrderAsset = {
        type: newOrderQuoteAssetType,
        id: newOrderQuoteAssetId || undefined,
        amount: newOrderQuoteAmount,
      };

      // Calculate expiry time if needed
      const expiresAt = newOrderExpiry > 0 ? Date.now() + newOrderExpiry * 60 * 60 * 1000 : undefined;

      // Create the order
      await createOrder(newOrderSide, baseAsset, quoteAsset, expiresAt);

      // Reset form
      setNewOrderBaseAmount('');
      setNewOrderQuoteAmount('');
      setIsCreatingOrder(false);
    } catch (error) {
      console.error('Error creating order:', error);
      addNotification('error', `Error creating order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    try {
      setIsSubmitting(true);
      await cancelOrder(orderId);
    } catch (error) {
      console.error('Error cancelling order:', error);
      addNotification('error', `Error cancelling order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Format expiry
  const formatExpiry = (expiresAt?: number): string => {
    if (!expiresAt) return 'Never';

    const now = Date.now();
    if (expiresAt <= now) return 'Expired';

    const diff = expiresAt - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
    }

    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  };

  // Get status color
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.Open:
        return '#90be6d'; // Green
      case OrderStatus.Filled:
        return '#277da1'; // Blue
      case OrderStatus.Cancelled:
        return '#f94144'; // Red
      case OrderStatus.Expired:
        return '#f8961e'; // Orange
      default:
        return '#6c757d'; // Gray
    }
  };

  // Get side color
  const getSideColor = (side: OrderSide): string => {
    return side === OrderSide.Buy ? '#90be6d' : '#f94144';
  };

  // Format asset
  const formatAsset = (asset: OrderAsset): string => {
    let assetName = asset.type.toString();
    if (asset.id) {
      assetName += ` (${asset.id.substring(0, 8)}...)`;
    }
    return `${asset.amount} ${assetName}`;
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h2>P2P Orderbook</h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => refreshOrderbook()}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: isLoading ? '#333' : '#4cc9f0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button
            onClick={() => setIsCreatingOrder(true)}
            disabled={!isWalletConnected || isCreatingOrder}
            style={{
              padding: '8px 16px',
              backgroundColor: !isWalletConnected || isCreatingOrder ? '#333' : '#90be6d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !isWalletConnected || isCreatingOrder ? 'not-allowed' : 'pointer',
            }}
          >
            Create Order
          </button>
        </div>
      </div>
      
      {error && (
        <div style={{
          backgroundColor: '#f94144',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          Error: {error.message}
        </div>
      )}
      
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333',
        marginBottom: '20px',
      }}>
        <button
          onClick={() => setActiveTab('open')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'open' ? '#16213e' : 'transparent',
            color: activeTab === 'open' ? 'white' : '#ccc',
            border: 'none',
            borderBottom: activeTab === 'open' ? '2px solid #4cc9f0' : 'none',
            cursor: 'pointer',
          }}
        >
          Open Orders
        </button>
        
        <button
          onClick={() => setActiveTab('my')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'my' ? '#16213e' : 'transparent',
            color: activeTab === 'my' ? 'white' : '#ccc',
            border: 'none',
            borderBottom: activeTab === 'my' ? '2px solid #4cc9f0' : 'none',
            cursor: 'pointer',
          }}
        >
          My Orders
        </button>
      </div>
      
      {/* Order creation form */}
      {isCreatingOrder && (
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h3>Create Order</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Side</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setNewOrderSide(OrderSide.Buy)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: newOrderSide === OrderSide.Buy ? '#90be6d' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                Buy
              </button>
              
              <button
                onClick={() => setNewOrderSide(OrderSide.Sell)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: newOrderSide === OrderSide.Sell ? '#f94144' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                Sell
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <h4>Base Asset</h4>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Asset Type</label>
                <select
                  value={newOrderBaseAssetType}
                  onChange={(e) => setNewOrderBaseAssetType(e.target.value as AssetType)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #333',
                    backgroundColor: '#1a1a2e',
                    color: 'white',
                  }}
                >
                  <option value={AssetType.Bitcoin}>Bitcoin</option>
                  <option value={AssetType.Rune}>Rune</option>
                  <option value={AssetType.Alkane}>Alkane</option>
                </select>
              </div>
              
              {newOrderBaseAssetType !== AssetType.Bitcoin && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Asset ID</label>
                  <input
                    type="text"
                    value={newOrderBaseAssetId}
                    onChange={(e) => setNewOrderBaseAssetId(e.target.value)}
                    placeholder="Asset ID"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #333',
                      backgroundColor: '#1a1a2e',
                      color: 'white',
                    }}
                  />
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Amount</label>
                <input
                  type="text"
                  value={newOrderBaseAmount}
                  onChange={(e) => setNewOrderBaseAmount(e.target.value)}
                  placeholder="Amount"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #333',
                    backgroundColor: '#1a1a2e',
                    color: 'white',
                  }}
                />
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <h4>Quote Asset</h4>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Asset Type</label>
                <select
                  value={newOrderQuoteAssetType}
                  onChange={(e) => setNewOrderQuoteAssetType(e.target.value as AssetType)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #333',
                    backgroundColor: '#1a1a2e',
                    color: 'white',
                  }}
                >
                  <option value={AssetType.Bitcoin}>Bitcoin</option>
                  <option value={AssetType.Rune}>Rune</option>
                  <option value={AssetType.Alkane}>Alkane</option>
                </select>
              </div>
              
              {newOrderQuoteAssetType !== AssetType.Bitcoin && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Asset ID</label>
                  <input
                    type="text"
                    value={newOrderQuoteAssetId}
                    onChange={(e) => setNewOrderQuoteAssetId(e.target.value)}
                    placeholder="Asset ID"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #333',
                      backgroundColor: '#1a1a2e',
                      color: 'white',
                    }}
                  />
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Amount</label>
                <input
                  type="text"
                  value={newOrderQuoteAmount}
                  onChange={(e) => setNewOrderQuoteAmount(e.target.value)}
                  placeholder="Amount"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #333',
                    backgroundColor: '#1a1a2e',
                    color: 'white',
                  }}
                />
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Expiry (hours, 0 for no expiry)</label>
            <input
              type="number"
              value={newOrderExpiry}
              onChange={(e) => setNewOrderExpiry(parseInt(e.target.value) || 0)}
              min="0"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #333',
                backgroundColor: '#1a1a2e',
                color: 'white',
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateOrder}
              disabled={isSubmitting || !newOrderBaseAmount || !newOrderQuoteAmount}
              style={{
                padding: '10px 20px',
                backgroundColor: isSubmitting || !newOrderBaseAmount || !newOrderQuoteAmount ? '#333' : '#90be6d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting || !newOrderBaseAmount || !newOrderQuoteAmount ? 'not-allowed' : 'pointer',
                flex: 1,
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </button>
            
            <button
              onClick={() => setIsCreatingOrder(false)}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Orders list */}
      {getOrders().length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Side</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Base Asset</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Quote Asset</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Creator</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Created</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Expires</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getOrders().map((order) => (
                <tr
                  key={order.id}
                  style={{
                    backgroundColor: selectedOrder?.id === order.id ? '#2a2a4e' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                >
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    <span style={{ color: getSideColor(order.side), fontWeight: 'bold' }}>
                      {order.side === OrderSide.Buy ? 'Buy' : 'Sell'}
                    </span>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    {formatAsset(order.baseAsset)}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    {formatAsset(order.quoteAsset)}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    {order.creatorAddress.substring(0, 8)}...
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    {formatDate(order.createdAt)}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    {formatExpiry(order.expiresAt)}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    <span style={{ color: getStatusColor(order.status), fontWeight: 'bold' }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    {activeTab === 'my' && order.status === OrderStatus.Open && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(order.id);
                        }}
                        disabled={isSubmitting}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: isSubmitting ? '#333' : '#f94144',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    
                    {activeTab === 'open' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement order matching and trade execution
                          addNotification('info', 'Trade execution not implemented yet');
                        }}
                        disabled={isSubmitting}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: isSubmitting ? '#333' : '#90be6d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Trade
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Selected order details */}
      {selectedOrder && (
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px',
        }}>
          <h3>Order Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <strong>ID:</strong> {selectedOrder.id}
            </div>
            <div>
              <strong>Creator:</strong> {selectedOrder.creatorAddress}
            </div>
            <div>
              <strong>Side:</strong>{' '}
              <span style={{ color: getSideColor(selectedOrder.side) }}>
                {selectedOrder.side === OrderSide.Buy ? 'Buy' : 'Sell'}
              </span>
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <span style={{ color: getStatusColor(selectedOrder.status) }}>
                {selectedOrder.status}
              </span>
            </div>
            <div>
              <strong>Base Asset:</strong> {formatAsset(selectedOrder.baseAsset)}
            </div>
            <div>
              <strong>Quote Asset:</strong> {formatAsset(selectedOrder.quoteAsset)}
            </div>
            <div>
              <strong>Created:</strong> {formatDate(selectedOrder.createdAt)}
            </div>
            <div>
              <strong>Expires:</strong> {formatExpiry(selectedOrder.expiresAt)}
            </div>
          </div>
          
          {selectedOrder.fills.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Fills</h4>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Counterparty</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Transaction</th>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.fills.map((fill) => (
                    <tr key={fill.id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                        {fill.counterpartyAddress.substring(0, 8)}...
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                        {fill.amount}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                        {fill.txid ? fill.txid.substring(0, 8) + '...' : 'N/A'}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                        {formatDate(fill.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default P2POrderbook;