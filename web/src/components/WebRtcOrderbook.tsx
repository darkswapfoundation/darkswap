import React, { useState, useEffect } from 'react';
import { useWebRtc } from '../contexts/WebRtcContext';

interface Order {
  id: string;
  peerId: string;
  assetId: string;
  amount: string;
  price: string;
  type: 'buy' | 'sell';
  timestamp: string;
}

/**
 * WebRTC Orderbook component
 * Displays and manages orders shared through WebRTC connections
 */
const WebRtcOrderbook: React.FC = () => {
  // WebRTC context
  const {
    isConnected,
    isConnecting,
    error,
    localPeerId,
    connectedPeers,
    sendString,
    onMessage,
    offMessage,
  } = useWebRtc();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrder, setNewOrder] = useState<{
    assetId: string;
    amount: string;
    price: string;
    type: 'buy' | 'sell';
  }>({
    assetId: '',
    amount: '',
    price: '',
    type: 'buy',
  });
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Available assets
  const availableAssets = [
    { id: 'rune:DANK', name: 'DANK Rune' },
    { id: 'rune:MEME', name: 'MEME Rune' },
    { id: 'rune:PEPE', name: 'PEPE Rune' },
    { id: 'alkane:METHANE', name: 'METHANE Alkane' },
    { id: 'alkane:ETHANE', name: 'ETHANE Alkane' },
  ];

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (peerId: string, data: any) => {
      try {
        // Parse the message
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Handle different message types
        switch (message.type) {
          case 'order_new':
            handleNewOrder(peerId, message);
            break;
          case 'order_cancel':
            handleCancelOrder(peerId, message);
            break;
          case 'order_match':
            handleMatchOrder(peerId, message);
            break;
          case 'order_sync_request':
            handleSyncRequest(peerId);
            break;
          case 'order_sync_response':
            handleSyncResponse(peerId, message);
            break;
          default:
            // Ignore other message types
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    onMessage(handleMessage);

    return () => {
      offMessage(handleMessage);
    };
  }, [onMessage, offMessage, orders]);

  // Request order sync when connecting to new peers
  useEffect(() => {
    if (connectedPeers.length > 0) {
      // Request order sync from all connected peers
      connectedPeers.forEach((peerId) => {
        requestOrderSync(peerId);
      });
    }
  }, [connectedPeers]);

  // Handle new order
  const handleNewOrder = (peerId: string, message: any) => {
    const { orderId, assetId, amount, price, type, timestamp } = message;
    
    // Check if order already exists
    if (orders.some((order) => order.id === orderId)) {
      return;
    }
    
    // Add the order
    setOrders((prev) => [
      ...prev,
      {
        id: orderId,
        peerId,
        assetId,
        amount,
        price,
        type,
        timestamp,
      },
    ]);
    
    setStatusMessage(`Received new ${type} order for ${amount} ${assetId} at ${price} sats from ${peerId}`);
  };

  // Handle cancel order
  const handleCancelOrder = (peerId: string, message: any) => {
    const { orderId } = message;
    
    // Remove the order
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
    
    setStatusMessage(`Order ${orderId} cancelled by ${peerId}`);
  };

  // Handle match order
  const handleMatchOrder = (peerId: string, message: any) => {
    const { orderId, matchedOrderId } = message;
    
    // Remove both orders
    setOrders((prev) => prev.filter((order) => order.id !== orderId && order.id !== matchedOrderId));
    
    setStatusMessage(`Order ${orderId} matched with ${matchedOrderId} by ${peerId}`);
  };

  // Handle sync request
  const handleSyncRequest = (peerId: string) => {
    // Send all orders to the peer
    const message = {
      type: 'order_sync_response',
      orders: orders.map((order) => ({
        orderId: order.id,
        assetId: order.assetId,
        amount: order.amount,
        price: order.price,
        type: order.type,
        timestamp: order.timestamp,
      })),
    };
    
    sendString(peerId, JSON.stringify(message));
  };

  // Handle sync response
  const handleSyncResponse = (peerId: string, message: any) => {
    const { orders: receivedOrders } = message;
    
    // Add new orders
    receivedOrders.forEach((receivedOrder: any) => {
      const { orderId, assetId, amount, price, type, timestamp } = receivedOrder;
      
      // Check if order already exists
      if (orders.some((order) => order.id === orderId)) {
        return;
      }
      
      // Add the order
      setOrders((prev) => [
        ...prev,
        {
          id: orderId,
          peerId,
          assetId,
          amount,
          price,
          type,
          timestamp,
        },
      ]);
    });
    
    setStatusMessage(`Synced ${receivedOrders.length} orders from ${peerId}`);
  };

  // Request order sync
  const requestOrderSync = (peerId: string) => {
    const message = {
      type: 'order_sync_request',
    };
    
    sendString(peerId, JSON.stringify(message));
  };

  // Create a new order
  const createOrder = () => {
    if (!newOrder.assetId || !newOrder.amount || !newOrder.price) {
      setStatusMessage('Please fill in all order details');
      return;
    }
    
    // Create an order ID
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the order
    const order: Order = {
      id: orderId,
      peerId: localPeerId || '',
      assetId: newOrder.assetId,
      amount: newOrder.amount,
      price: newOrder.price,
      type: newOrder.type,
      timestamp: new Date().toISOString(),
    };
    
    // Add the order
    setOrders((prev) => [...prev, order]);
    
    // Broadcast the order to all connected peers
    const message = {
      type: 'order_new',
      orderId,
      assetId: newOrder.assetId,
      amount: newOrder.amount,
      price: newOrder.price,
      orderType: newOrder.type,
      timestamp: order.timestamp,
    };
    
    connectedPeers.forEach((peerId) => {
      sendString(peerId, JSON.stringify(message));
    });
    
    // Reset the form
    setNewOrder({
      assetId: '',
      amount: '',
      price: '',
      type: 'buy',
    });
    
    setStatusMessage(`Created new ${newOrder.type} order for ${newOrder.amount} ${newOrder.assetId} at ${newOrder.price} sats`);
  };

  // Cancel an order
  const cancelOrder = (orderId: string) => {
    // Check if the order exists and belongs to the local peer
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      setStatusMessage('Order not found');
      return;
    }
    
    if (order.peerId !== localPeerId) {
      setStatusMessage('You can only cancel your own orders');
      return;
    }
    
    // Remove the order
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    
    // Broadcast the cancellation to all connected peers
    const message = {
      type: 'order_cancel',
      orderId,
    };
    
    connectedPeers.forEach((peerId) => {
      sendString(peerId, JSON.stringify(message));
    });
    
    setStatusMessage(`Cancelled order ${orderId}`);
  };

  // Match an order
  const matchOrder = (orderId: string) => {
    // Check if the order exists
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      setStatusMessage('Order not found');
      return;
    }
    
    // Find a matching order
    const matchingOrders = orders.filter((o) => 
      o.assetId === order.assetId && 
      o.type !== order.type &&
      o.peerId !== order.peerId
    );
    
    if (matchingOrders.length === 0) {
      setStatusMessage('No matching orders found');
      return;
    }
    
    // Find the best matching order
    const bestMatch = matchingOrders.reduce((best, current) => {
      if (order.type === 'buy') {
        // For buy orders, find the lowest sell price
        return parseFloat(current.price) < parseFloat(best.price) ? current : best;
      } else {
        // For sell orders, find the highest buy price
        return parseFloat(current.price) > parseFloat(best.price) ? current : best;
      }
    }, matchingOrders[0]);
    
    // Remove both orders
    setOrders((prev) => prev.filter((o) => o.id !== orderId && o.id !== bestMatch.id));
    
    // Broadcast the match to all connected peers
    const message = {
      type: 'order_match',
      orderId,
      matchedOrderId: bestMatch.id,
    };
    
    connectedPeers.forEach((peerId) => {
      sendString(peerId, JSON.stringify(message));
    });
    
    setStatusMessage(`Matched order ${orderId} with ${bestMatch.id}`);
  };

  // Filter orders by asset
  const filteredOrders = selectedAsset
    ? orders.filter((order) => order.assetId === selectedAsset)
    : orders;

  // Group orders by type
  const buyOrders = filteredOrders
    .filter((order) => order.type === 'buy')
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); // Sort by price descending

  const sellOrders = filteredOrders
    .filter((order) => order.type === 'sell')
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); // Sort by price ascending

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>P2P Orderbook</h2>
      
      {/* Status message */}
      {statusMessage && (
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '4px',
          padding: '10px',
          marginBottom: '20px',
          color: '#4cc9f0',
        }}>
          {statusMessage}
        </div>
      )}
      
      {/* Connection status */}
      <div style={{ marginBottom: '20px' }}>
        <p>
          Status: {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
        </p>
        {error && (
          <p style={{ color: '#ff6b6b' }}>
            Error: {error.message}
          </p>
        )}
        <p>Local Peer ID: {localPeerId}</p>
        <p>Connected Peers: {connectedPeers.length}</p>
      </div>
      
      {/* Create order form */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3>Create Order</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Asset</label>
            <select
              value={newOrder.assetId}
              onChange={(e) => setNewOrder({ ...newOrder, assetId: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #333',
                backgroundColor: '#1a1a2e',
                color: 'white',
              }}
            >
              <option value="">Select Asset</option>
              {availableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Type</label>
            <select
              value={newOrder.type}
              onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value as 'buy' | 'sell' })}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #333',
                backgroundColor: '#1a1a2e',
                color: 'white',
              }}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Amount</label>
            <input
              type="text"
              value={newOrder.amount}
              onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
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
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Price (sats)</label>
            <input
              type="text"
              value={newOrder.price}
              onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })}
              placeholder="Price in sats"
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
        <button
          onClick={createOrder}
          style={{
            padding: '10px 20px',
            backgroundColor: newOrder.type === 'buy' ? '#4cc9f0' : '#f72585',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {newOrder.type === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
        </button>
      </div>
      
      {/* Filter by asset */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Filter by Asset</label>
        <select
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #333',
            backgroundColor: '#16213e',
            color: 'white',
          }}
        >
          <option value="">All Assets</option>
          {availableAssets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Orderbook */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Buy orders */}
        <div>
          <h3 style={{ color: '#4cc9f0' }}>Buy Orders</h3>
          {buyOrders.length === 0 ? (
            <p>No buy orders</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Asset</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Amount</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buyOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>
                      {order.assetId}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>
                      {order.amount}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>
                      {order.price}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>
                      {order.peerId === localPeerId ? (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f72585',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '5px',
                          }}
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => matchOrder(order.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#4cc9f0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Match
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Sell orders */}
        <div>
          <h3 style={{ color: '#f72585' }}>Sell Orders</h3>
          {sellOrders.length === 0 ? (
            <p>No sell orders</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Asset</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Amount</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>
                      {order.assetId}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>
                      {order.amount}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>
                      {order.price}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>
                      {order.peerId === localPeerId ? (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f72585',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '5px',
                          }}
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => matchOrder(order.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#4cc9f0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Match
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebRtcOrderbook;