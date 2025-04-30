import React, { useEffect, useState } from 'react';
import { WebWorkerDarkSwapClient } from '../utils/WebWorkerDarkSwapClient';
import { AssetType, OrderSide, BitcoinNetwork } from '../utils/DarkSwapClient';
import { isWebWorkerSupported } from '../utils/WebWorkerWasmLoader';
import '../styles/DarkSwapDemo.css';

/**
 * Web Worker DarkSwap demo component
 */
const WebWorkerDarkSwapDemo: React.FC = () => {
  // DarkSwap client
  const [client, setClient] = useState<WebWorkerDarkSwapClient | null>(null);
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  // Error state
  const [error, setError] = useState<string | null>(null);
  // Wallet address
  const [address, setAddress] = useState<string | null>(null);
  // Wallet balance
  const [balance, setBalance] = useState<number | null>(null);
  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  // Best bid and ask
  const [bestBidAsk, setBestBidAsk] = useState<any | null>(null);
  // Events
  const [events, setEvents] = useState<string[]>([]);
  // Performance metrics
  const [metrics, setMetrics] = useState<{
    initTime: number;
    createTime: number;
    startTime: number;
    operationTimes: { [key: string]: number };
  }>({
    initTime: 0,
    createTime: 0,
    startTime: 0,
    operationTimes: {},
  });
  // Order form
  const [orderForm, setOrderForm] = useState({
    side: OrderSide.Buy,
    amount: '0.01',
    price: '20000',
  });
  // Web Worker supported
  const [webWorkerSupported, setWebWorkerSupported] = useState<boolean | null>(null);

  /**
   * Initialize DarkSwap client
   */
  useEffect(() => {
    const initClient = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if Web Workers are supported
        const isWorkerSupported = isWebWorkerSupported();
        setWebWorkerSupported(isWorkerSupported);

        const startTime = performance.now();

        // Create DarkSwap client
        const darkswapClient = new WebWorkerDarkSwapClient();
        
        // Initialize the client
        await darkswapClient.initialize();
        
        const initTime = performance.now() - startTime;
        
        // Add event listener
        darkswapClient.addEventListener((event) => {
          setEvents((prevEvents) => [
            `${new Date().toISOString()} - ${event.type}: ${JSON.stringify(event)}`,
            ...prevEvents,
          ]);
        });
        
        // Set client
        setClient(darkswapClient);
        
        // Update metrics
        setMetrics(prev => ({
          ...prev,
          initTime,
        }));
        
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
   * Create DarkSwap instance
   */
  const createInstance = async () => {
    if (!client) {
      return;
    }
    
    try {
      setLoading(true);
      
      const startTime = performance.now();
      
      // Create DarkSwap instance
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      });
      
      const createTime = performance.now() - startTime;
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        createTime,
      }));
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to create DarkSwap instance:', err);
      setError(`Failed to create DarkSwap instance: ${err}`);
      setLoading(false);
    }
  };

  /**
   * Start DarkSwap
   */
  const startDarkSwap = async () => {
    if (!client) {
      return;
    }
    
    try {
      setLoading(true);
      
      const startTime = performance.now();
      
      // Start DarkSwap
      await client.start();
      
      const startDuration = performance.now() - startTime;
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        startTime: startDuration,
      }));
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to start DarkSwap:', err);
      setError(`Failed to start DarkSwap: ${err}`);
      setLoading(false);
    }
  };

  /**
   * Get wallet information
   */
  const getWalletInfo = async () => {
    if (!client) {
      return;
    }
    
    try {
      setLoading(true);
      
      const startTime = performance.now();
      
      // Get wallet address
      const walletAddress = await client.getAddress();
      setAddress(walletAddress);
      
      // Get wallet balance
      const walletBalance = await client.getBalance();
      setBalance(walletBalance);
      
      const operationTime = performance.now() - startTime;
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        operationTimes: {
          ...prev.operationTimes,
          getWalletInfo: operationTime,
        },
      }));
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to get wallet information:', err);
      setError(`Failed to get wallet information: ${err}`);
      setLoading(false);
    }
  };

  /**
   * Get market data
   */
  const getMarketData = async () => {
    if (!client) {
      return;
    }
    
    try {
      setLoading(true);
      
      const startTime = performance.now();
      
      // Get orders
      const btcOrders = await client.getOrders(
        { type: AssetType.Bitcoin },
        { type: AssetType.Bitcoin }
      );
      setOrders(btcOrders);
      
      // Get best bid and ask
      const btcBestBidAsk = await client.getBestBidAsk(
        { type: AssetType.Bitcoin },
        { type: AssetType.Bitcoin }
      );
      setBestBidAsk(btcBestBidAsk);
      
      const operationTime = performance.now() - startTime;
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        operationTimes: {
          ...prev.operationTimes,
          getMarketData: operationTime,
        },
      }));
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to get market data:', err);
      setError(`Failed to get market data: ${err}`);
      setLoading(false);
    }
  };

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
      
      const startTime = performance.now();
      
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
      
      const operationTime = performance.now() - startTime;
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        operationTimes: {
          ...prev.operationTimes,
          createOrder: operationTime,
        },
      }));
      
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
      
      const startTime = performance.now();
      
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
      
      const operationTime = performance.now() - startTime;
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        operationTimes: {
          ...prev.operationTimes,
          cancelOrder: operationTime,
        },
      }));
      
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
      
      const startTime = performance.now();
      
      // Take order
      const trade = await client.takeOrder(orderId, amount);
      
      // Add event
      setEvents((prevEvents) => [
        `${new Date().toISOString()} - Trade created: ${JSON.stringify(trade)}`,
        ...prevEvents,
      ]);
      
      const operationTime = performance.now() - startTime;
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        operationTimes: {
          ...prev.operationTimes,
          takeOrder: operationTime,
        },
      }));
      
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
      <h1>Web Worker DarkSwap Demo</h1>
      
      <div className="streaming-status">
        <h2>Web Worker Status</h2>
        <p>
          Web Workers are {webWorkerSupported ? 'supported' : 'not supported'} in your browser.
          {!webWorkerSupported && ' Falling back to regular initialization.'}
        </p>
      </div>
      
      <div className="performance-metrics">
        <h2>Performance Metrics</h2>
        <p>Initialization time: {metrics.initTime.toFixed(2)} ms</p>
        <p>Create instance time: {metrics.createTime.toFixed(2)} ms</p>
        <p>Start time: {metrics.startTime.toFixed(2)} ms</p>
        <h3>Operation Times</h3>
        <ul>
          {Object.entries(metrics.operationTimes).map(([operation, time]) => (
            <li key={operation}>
              {operation}: {time.toFixed(2)} ms
            </li>
          ))}
        </ul>
      </div>
      
      <div className="client-actions">
        <h2>Client Actions</h2>
        <button onClick={createInstance} disabled={!!address}>Create Instance</button>
        <button onClick={startDarkSwap} disabled={!client || !!address}>Start DarkSwap</button>
        <button onClick={getWalletInfo} disabled={!client}>Get Wallet Info</button>
        <button onClick={getMarketData} disabled={!client}>Get Market Data</button>
      </div>
      
      {address && (
        <div className="wallet-info">
          <h2>Wallet</h2>
          <p>Address: {address}</p>
          <p>Balance: {balance} satoshis</p>
        </div>
      )}
      
      {bestBidAsk && (
        <div className="market-info">
          <h2>Market</h2>
          <p>Best bid: {bestBidAsk.bid || 'N/A'}</p>
          <p>Best ask: {bestBidAsk.ask || 'N/A'}</p>
        </div>
      )}
      
      {address && (
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
      )}
      
      {orders.length > 0 && (
        <div className="orders">
          <h2>Orders</h2>
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
        </div>
      )}
      
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

export default WebWorkerDarkSwapDemo;