import React, { useEffect, useState } from 'react';
import { WebRtcEnabledDarkSwapClient, WebRtcMessageType } from '../utils/WebRtcEnabledDarkSwapClient';
import { AssetType, OrderSide, BitcoinNetwork } from '../utils/DarkSwapClient';
import '../styles/WebRtcDarkSwapDemo.css';

/**
 * WebRTC-enabled DarkSwap demo component
 */
const WebRtcDarkSwapDemo: React.FC = () => {
  // Client state
  const [client, setClient] = useState<WebRtcEnabledDarkSwapClient | null>(null);
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
  // Connected peers
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  // Peer ID input
  const [peerIdInput, setPeerIdInput] = useState<string>('');
  // Chat message input
  const [chatMessageInput, setChatMessageInput] = useState<string>('');
  // Chat messages
  const [chatMessages, setChatMessages] = useState<{ peerId: string; message: string; timestamp: number }[]>([]);
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

        // Generate a random peer ID
        const localPeerId = `peer-${Math.floor(Math.random() * 1000000)}`;
        
        // Create WebRTC-enabled DarkSwap client
        const darkswapClient = new WebRtcEnabledDarkSwapClient(
          localPeerId,
          'wss://signaling.darkswap.io'
        );
        
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
        
        // Update connected peers
        updateConnectedPeers(darkswapClient);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize WebRTC-enabled DarkSwap client:', err);
        setError(`Failed to initialize WebRTC-enabled DarkSwap client: ${err}`);
        setLoading(false);
      }
    };
    
    initClient();
    
    // Cleanup
    return () => {
      if (client) {
        client.stop().catch((err) => {
          console.error('Failed to stop WebRTC-enabled DarkSwap client:', err);
        });
      }
    };
  }, []);

  /**
   * Update connected peers
   */
  const updateConnectedPeers = (client: WebRtcEnabledDarkSwapClient) => {
    const peers = client.getConnectedPeers();
    setConnectedPeers(peers);
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
   * Handle connect to peer
   */
  const handleConnectToPeer = async () => {
    if (!client || !peerIdInput) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Connect to peer
      await client.connectToPeer(peerIdInput);
      
      // Update connected peers
      updateConnectedPeers(client);
      
      // Clear input
      setPeerIdInput('');
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to connect to peer:', err);
      setError(`Failed to connect to peer: ${err}`);
      setLoading(false);
    }
  };

  /**
   * Handle send chat message
   */
  const handleSendChatMessage = async (peerId: string) => {
    if (!client || !chatMessageInput) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Send chat message
      await client.sendMessageToPeer(peerId, WebRtcMessageType.Chat, {
        message: chatMessageInput,
        timestamp: Date.now(),
      });
      
      // Add message to chat
      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          peerId,
          message: chatMessageInput,
          timestamp: Date.now(),
        },
      ]);
      
      // Clear input
      setChatMessageInput('');
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to send chat message:', err);
      setError(`Failed to send chat message: ${err}`);
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
    <div className="webrtc-darkswap-demo">
      <h1>WebRTC-enabled DarkSwap Demo</h1>
      
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
      
      <div className="webrtc-section">
        <h2>WebRTC</h2>
        
        <div className="peer-connection">
          <h3>Connect to Peer</h3>
          <div className="peer-connection-form">
            <input
              type="text"
              placeholder="Peer ID"
              value={peerIdInput}
              onChange={(e) => setPeerIdInput(e.target.value)}
            />
            <button onClick={handleConnectToPeer}>Connect</button>
          </div>
        </div>
        
        <div className="connected-peers">
          <h3>Connected Peers</h3>
          {connectedPeers.length === 0 ? (
            <p>No connected peers</p>
          ) : (
            <ul>
              {connectedPeers.map((peerId) => (
                <li key={peerId}>
                  <div className="peer-info">
                    <span>{peerId}</span>
                    <div className="peer-actions">
                      <input
                        type="text"
                        placeholder="Message"
                        value={chatMessageInput}
                        onChange={(e) => setChatMessageInput(e.target.value)}
                      />
                      <button onClick={() => handleSendChatMessage(peerId)}>Send</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="chat-messages">
          <h3>Chat Messages</h3>
          {chatMessages.length === 0 ? (
            <p>No chat messages</p>
          ) : (
            <ul>
              {chatMessages.map((message, index) => (
                <li key={index}>
                  <div className="chat-message">
                    <span className="chat-message-peer">{message.peerId}:</span>
                    <span className="chat-message-text">{message.message}</span>
                    <span className="chat-message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
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

export default WebRtcDarkSwapDemo;