import React, { useEffect, useState } from 'react';
import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork, Asset, Order, BestBidAsk, EventType } from '../utils/DarkSwapClient';

/**
 * DarkSwap Demo component
 */
const DarkSwapDemo: React.FC = () => {
  // DarkSwap client
  const [client, setClient] = useState<DarkSwapClient | null>(null);
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  // Error state
  const [error, setError] = useState<string | null>(null);
  // Wallet address
  const [address, setAddress] = useState<string | null>(null);
  // Wallet balance
  const [balance, setBalance] = useState<number | null>(null);
  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  // Best bid and ask
  const [bestBidAsk, setBestBidAsk] = useState<BestBidAsk | null>(null);
  // Events
  const [events, setEvents] = useState<string[]>([]);
  // Order form
  const [orderForm, setOrderForm] = useState({
    side: OrderSide.Buy,
    amount: '0.01',
    price: '20000',
  });

  /**
   * Initialize DarkSwap client
   */
  useEffect(() => {
    const initClient = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create DarkSwap client
        const darkswapClient = new DarkSwapClient();
        
        // Initialize WebAssembly module
        await darkswapClient.initialize('/darkswap-wasm/darkswap_wasm_bg.wasm');
        
        // Create DarkSwap instance
        await darkswapClient.create({
          network: BitcoinNetwork.Testnet,
          walletType: 'simple',
          enableWebRTC: true,
          iceServers: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
          ],
        });
        
        // Add event listener
        darkswapClient.addEventListener((event) => {
          setEvents((prevEvents) => [
            `${new Date().toISOString()} - ${event.type}: ${JSON.stringify(event)}`,
            ...prevEvents,
          ]);
        });
        
        // Start DarkSwap
        await darkswapClient.start();
        
        // Get wallet address
        const walletAddress = await darkswapClient.getAddress();
        setAddress(walletAddress);
        
        // Get wallet balance
        const walletBalance = await darkswapClient.getBalance();
        setBalance(walletBalance);
        
        // Get orders
        const btcOrders = await darkswapClient.getOrders(
          { type: AssetType.Bitcoin },
          { type: AssetType.Bitcoin }
        );
        setOrders(btcOrders);
        
        // Get best bid and ask
        const btcBestBidAsk = await darkswapClient.getBestBidAsk(
          { type: AssetType.Bitcoin },
          { type: AssetType.Bitcoin }
        );
        setBestBidAsk(btcBestBidAsk);
        
        // Set client
        setClient(darkswapClient);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize DarkSwap client:', err);
        setError(`Failed to initialize DarkSwap client: ${err}`);
        setLoading(false);
      }
    };
    
    initClient();
    
    // Cleanup
    return () => {
      if (client) {
        client.stop().catch((err) => {
          console.error('Failed to stop DarkSwap client:', err);
        });
      }
    };
  }, []);

  /**
   * Handle order form change
   */
  const handleOrderFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrderForm((prevForm) => ({
      ...prevForm,
      [name]: name === 'side' ? parseInt(value, 10) : value,
    }));
  };

  /**
   * Handle order form submit
   */
  const handleOrderFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client || !address) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Create order
      const order = await client.createOrder(
        { type: AssetType.Bitcoin },
        { type: AssetType.Bitcoin },
        orderForm.side as OrderSide,
        orderForm.amount,
        orderForm.price,
        address,
        3600 // 1 hour expiry
      );
      
      // Add order to list
      setOrders((prevOrders) => [order, ...prevOrders]);
      
      // Get best bid and ask
      const btcBestBidAsk = await client.getBestBidAsk(
        { type: AssetType.Bitcoin },
        { type: AssetType.Bitcoin }
      );
      setBestBidAsk(btcBestBidAsk);
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to create order:', err);
      setError(`Failed to create order: ${err}`);
      setLoading(false);
    }
  };

  /**
   * Handle order cancel
   */
  const handleOrderCancel = async (orderId: string) => {
    if (!client) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Cancel order
      await client.cancelOrder(orderId);
      
      // Remove order from list
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
      
      // Get best bid and ask
      const btcBestBidAsk = await client.getBestBidAsk(
        { type: AssetType.Bitcoin },
        { type: AssetType.Bitcoin }
      );
      setBestBidAsk(btcBestBidAsk);
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError(`Failed to cancel order: ${err}`);
      setLoading(false);
    }
  };

  /**
   * Handle order take
   */
  const handleOrderTake = async (orderId: string, amount: string) => {
    if (!client) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Take order
      const trade = await client.takeOrder(orderId, amount);
      
      // Add event
      setEvents((prevEvents) => [
        `${new Date().toISOString()} - Trade created: ${JSON.stringify(trade)}`,
        ...prevEvents,
      ]);
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to take order:', err);
      setError(`Failed to take order: ${err}`);
      setLoading(false);
    }
  };

  /**
   * Render loading state
   */
  if (loading) {
    return <div>Loading...</div>;
  }

  /**
   * Render error state
   */
  if (error) {
    return <div>Error: {error}</div>;
  }

  /**
   * Render component
   */
  return (
    <div className="darkswap-demo">
      <h1>DarkSwap Demo</h1>
      
      <div className="wallet-info">
        <h2>Wallet</h2>
        <p>Address: {address}</p>
        <p>Balance: {balance} satoshis</p>
      </div>
      
      <div className="market-info">
        <h2>Market</h2>
        <p>Best bid: {bestBidAsk?.bid || 'N/A'}</p>
        <p>Best ask: {bestBidAsk?.ask || 'N/A'}</p>
      </div>
      
      <div className="order-form">
        <h2>Create Order</h2>
        <form onSubmit={handleOrderFormSubmit}>
          <div>
            <label htmlFor="side">Side:</label>
            <select
              id="side"
              name="side"
              value={orderForm.side}
              onChange={handleOrderFormChange}
            >
              <option value={OrderSide.Buy}>Buy</option>
              <option value={OrderSide.Sell}>Sell</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="amount">Amount:</label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={orderForm.amount}
              onChange={handleOrderFormChange}
            />
          </div>
          
          <div>
            <label htmlFor="price">Price:</label>
            <input
              type="text"
              id="price"
              name="price"
              value={orderForm.price}
              onChange={handleOrderFormChange}
            />
          </div>
          
          <button type="submit">Create Order</button>
        </form>
      </div>
      
      <div className="orders">
        <h2>Orders</h2>
        {orders.length === 0 ? (
          <p>No orders</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Side</th>
                <th>Amount</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id.substring(0, 8)}...</td>
                  <td>{order.side === OrderSide.Buy ? 'Buy' : 'Sell'}</td>
                  <td>{order.amount}</td>
                  <td>{order.price}</td>
                  <td>{order.status}</td>
                  <td>
                    <button onClick={() => handleOrderCancel(order.id)}>Cancel</button>
                    <button onClick={() => handleOrderTake(order.id, order.amount)}>Take</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="events">
        <h2>Events</h2>
        {events.length === 0 ? (
          <p>No events</p>
        ) : (
          <ul>
            {events.map((event, index) => (
              <li key={index}>{event}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DarkSwapDemo;