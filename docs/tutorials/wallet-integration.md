# Wallet Integration Tutorial

This tutorial will guide you through integrating a Bitcoin wallet with your DarkSwap application. We'll cover connecting to different wallet types, managing wallet state, and executing trades using the wallet.

## Prerequisites

Before you begin, make sure you have:

- Completed the [Getting Started Tutorial](./getting-started.md)
- Basic understanding of Bitcoin wallets and transactions
- DarkSwap SDK installed and configured

## Step 1: Set Up the Wallet Context

First, let's create a wallet context to manage wallet state across our application. Create a new file called `src/contexts/WalletContext.js`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DarkSwapWallet } from 'darkswap-web-sys';

// Create the context
const WalletContext = createContext();

// Create a provider component
export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState({});

  // Connect to a wallet
  const connect = async (walletType) => {
    try {
      setConnecting(true);
      setError(null);

      // Create a new wallet instance
      const newWallet = new DarkSwapWallet(walletType);
      
      // Initialize the wallet
      await newWallet.initialize();
      
      // Get the wallet balance
      const walletBalance = await newWallet.getBalance();
      
      // Update state
      setWallet(newWallet);
      setBalance(walletBalance);
      
      // Save wallet type to local storage
      localStorage.setItem('walletType', walletType);
      
      return newWallet;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from the wallet
  const disconnect = async () => {
    if (wallet) {
      try {
        await wallet.disconnect();
      } catch (err) {
        console.error('Error disconnecting wallet:', err);
      }
    }
    
    setWallet(null);
    setBalance({});
    localStorage.removeItem('walletType');
  };

  // Refresh the wallet balance
  const refreshBalance = async () => {
    if (!wallet) return;
    
    try {
      const walletBalance = await wallet.getBalance();
      setBalance(walletBalance);
      return walletBalance;
    } catch (err) {
      console.error('Error refreshing balance:', err);
      setError(err.message);
      throw err;
    }
  };

  // Auto-connect to the wallet on page load
  useEffect(() => {
    const autoConnect = async () => {
      const savedWalletType = localStorage.getItem('walletType');
      
      if (savedWalletType) {
        try {
          await connect(savedWalletType);
        } catch (err) {
          console.error('Error auto-connecting to wallet:', err);
          localStorage.removeItem('walletType');
        }
      }
    };
    
    autoConnect();
  }, []);

  // Create the context value
  const value = {
    wallet,
    connecting,
    error,
    balance,
    connect,
    disconnect,
    refreshBalance,
  };

  // Provide the context value to children
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Create a custom hook for using the wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
}
```

## Step 2: Create a Wallet Connector Component

Next, let's create a component for connecting to different wallet types. Create a new file called `src/components/WalletConnector.js`:

```javascript
import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

function WalletConnector() {
  const { wallet, connecting, error, connect, disconnect } = useWallet();
  const [selectedWalletType, setSelectedWalletType] = useState('bdk');

  const handleConnect = async () => {
    try {
      await connect(selectedWalletType);
    } catch (err) {
      console.error('Error connecting wallet:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
    }
  };

  return (
    <div className="wallet-connector">
      <h2>Wallet Connection</h2>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {wallet ? (
        <div className="wallet-info">
          <p>Connected to {wallet.getType()} wallet</p>
          <p>Address: {wallet.getAddress()}</p>
          <button onClick={handleDisconnect} disabled={connecting}>
            Disconnect
          </button>
        </div>
      ) : (
        <div className="wallet-connect-form">
          <div className="form-group">
            <label htmlFor="wallet-type">Wallet Type:</label>
            <select
              id="wallet-type"
              value={selectedWalletType}
              onChange={(e) => setSelectedWalletType(e.target.value)}
              disabled={connecting}
            >
              <option value="bdk">BDK Wallet</option>
              <option value="simple">Simple Wallet</option>
              <option value="hardware">Hardware Wallet</option>
            </select>
          </div>
          
          <button onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      )}
    </div>
  );
}

export default WalletConnector;
```

## Step 3: Create a Wallet Balance Component

Let's create a component to display the wallet balance. Create a new file called `src/components/WalletBalance.js`:

```javascript
import React, { useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

function WalletBalance() {
  const { wallet, balance, refreshBalance } = useWallet();

  useEffect(() => {
    if (wallet) {
      // Refresh balance when component mounts
      refreshBalance();
      
      // Set up interval to refresh balance every 30 seconds
      const intervalId = setInterval(refreshBalance, 30000);
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [wallet, refreshBalance]);

  if (!wallet) {
    return <div className="wallet-balance">Please connect your wallet</div>;
  }

  return (
    <div className="wallet-balance">
      <h2>Wallet Balance</h2>
      
      <div className="balance-list">
        {Object.entries(balance).map(([asset, amount]) => (
          <div key={asset} className="balance-item">
            <span className="asset">{asset}:</span>
            <span className="amount">{amount}</span>
          </div>
        ))}
      </div>
      
      <button onClick={refreshBalance} className="refresh-button">
        Refresh Balance
      </button>
    </div>
  );
}

export default WalletBalance;
```

## Step 4: Update the Trade Form to Use the Wallet

Now, let's update our trade form to use the wallet for creating and taking orders. Create a new file called `src/components/TradeForm.js`:

```javascript
import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useDarkSwap } from '../contexts/DarkSwapContext';

function TradeForm() {
  const { wallet, balance } = useWallet();
  const { createOrder } = useDarkSwap();
  
  const [baseAsset, setBaseAsset] = useState('BTC');
  const [quoteAsset, setQuoteAsset] = useState('USD');
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('1.0');
  const [price, setPrice] = useState('50000');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet) {
      setError('Please connect your wallet first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Check if user has enough balance
      if (side === 'sell' && balance[baseAsset] < parseFloat(amount)) {
        setError(`Insufficient ${baseAsset} balance`);
        return;
      }
      
      if (side === 'buy' && balance[quoteAsset] < parseFloat(amount) * parseFloat(price)) {
        setError(`Insufficient ${quoteAsset} balance`);
        return;
      }
      
      // Create the order
      const order = await createOrder({
        baseAsset,
        quoteAsset,
        side,
        amount: parseFloat(amount),
        price: parseFloat(price),
        wallet,
      });
      
      setSuccess(`Order created successfully: ${order.id}`);
      
      // Reset form
      setAmount('1.0');
      setPrice('50000');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trade-form">
      <h2>Create Order</h2>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="base-asset">Base Asset:</label>
          <input
            id="base-asset"
            type="text"
            value={baseAsset}
            onChange={(e) => setBaseAsset(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="quote-asset">Quote Asset:</label>
          <input
            id="quote-asset"
            type="text"
            value={quoteAsset}
            onChange={(e) => setQuoteAsset(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="side">Side:</label>
          <select
            id="side"
            value={side}
            onChange={(e) => setSide(e.target.value)}
            disabled={loading}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
          />
          {wallet && side === 'sell' && balance[baseAsset] && (
            <button
              type="button"
              onClick={() => setAmount(balance[baseAsset].toString())}
              disabled={loading}
              className="max-button"
            >
              Max
            </button>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="price">Price:</label>
          <input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Total:</label>
          <div className="total-value">
            {(parseFloat(amount) * parseFloat(price)).toFixed(2)} {quoteAsset}
          </div>
        </div>
        
        <button type="submit" disabled={loading || !wallet}>
          {loading ? 'Creating Order...' : `Place ${side === 'buy' ? 'Buy' : 'Sell'} Order`}
        </button>
      </form>
    </div>
  );
}

export default TradeForm;
```

## Step 5: Create an Order List Component

Let's create a component to display and interact with orders. Create a new file called `src/components/OrderList.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useDarkSwap } from '../contexts/DarkSwapContext';

function OrderList() {
  const { wallet } = useWallet();
  const { getOrders, takeOrder, cancelOrder } = useDarkSwap();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const fetchedOrders = await getOrders();
        setOrders(fetchedOrders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
    
    // Set up interval to refresh orders every 30 seconds
    const intervalId = setInterval(fetchOrders, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [getOrders]);

  const handleTakeOrder = async (orderId) => {
    if (!wallet) {
      setError('Please connect your wallet first');
      return;
    }
    
    try {
      setActionLoading(orderId);
      setError(null);
      
      const order = orders.find((o) => o.id === orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      await takeOrder(orderId, order.amount, wallet);
      
      // Refresh orders
      const fetchedOrders = await getOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!wallet) {
      setError('Please connect your wallet first');
      return;
    }
    
    try {
      setActionLoading(orderId);
      setError(null);
      
      await cancelOrder(orderId, wallet);
      
      // Refresh orders
      const fetchedOrders = await getOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="order-list">Loading orders...</div>;
  }

  if (error) {
    return (
      <div className="order-list">
        <div className="error-message">Error: {error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return <div className="order-list">No orders available</div>;
  }

  return (
    <div className="order-list">
      <h2>Orders</h2>
      
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>Price</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isMyOrder = wallet && order.maker === wallet.getAddress();
            
            return (
              <tr key={order.id} className={order.side}>
                <td>{order.side === 'buy' ? 'Buy' : 'Sell'}</td>
                <td>{order.amount} {order.baseAsset}</td>
                <td>{order.price} {order.quoteAsset}</td>
                <td>{(order.amount * order.price).toFixed(2)} {order.quoteAsset}</td>
                <td>
                  {isMyOrder ? (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={actionLoading === order.id}
                      className="cancel-button"
                    >
                      {actionLoading === order.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTakeOrder(order.id)}
                      disabled={actionLoading === order.id || !wallet}
                      className="take-button"
                    >
                      {actionLoading === order.id ? 'Processing...' : 'Take Order'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default OrderList;
```

## Step 6: Create a DarkSwap Context

Let's create a context for managing DarkSwap functionality. Create a new file called `src/contexts/DarkSwapContext.js`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import init, { DarkSwap } from 'darkswap-web-sys';

// Create the context
const DarkSwapContext = createContext();

// Create a provider component
export function DarkSwapProvider({ children }) {
  const [darkswap, setDarkSwap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize DarkSwap
  useEffect(() => {
    const initDarkSwap = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialize WebAssembly module
        await init();
        
        // Create DarkSwap instance
        const ds = new DarkSwap();
        
        // Connect to the network
        await ds.connect();
        
        setDarkSwap(ds);
      } catch (err) {
        setError(err.message);
        console.error('Error initializing DarkSwap:', err);
      } finally {
        setLoading(false);
      }
    };
    
    initDarkSwap();
    
    // Clean up on unmount
    return () => {
      if (darkswap) {
        darkswap.disconnect();
      }
    };
  }, []);

  // Get orders
  const getOrders = async () => {
    if (!darkswap) throw new Error('DarkSwap not initialized');
    return await darkswap.getOrders();
  };

  // Create order
  const createOrder = async ({ baseAsset, quoteAsset, side, amount, price, wallet }) => {
    if (!darkswap) throw new Error('DarkSwap not initialized');
    if (!wallet) throw new Error('Wallet not connected');
    
    return await darkswap.createOrder({
      baseAsset,
      quoteAsset,
      side,
      amount,
      price,
      wallet,
    });
  };

  // Take order
  const takeOrder = async (orderId, amount, wallet) => {
    if (!darkswap) throw new Error('DarkSwap not initialized');
    if (!wallet) throw new Error('Wallet not connected');
    
    return await darkswap.takeOrder(orderId, amount, wallet);
  };

  // Cancel order
  const cancelOrder = async (orderId, wallet) => {
    if (!darkswap) throw new Error('DarkSwap not initialized');
    if (!wallet) throw new Error('Wallet not connected');
    
    return await darkswap.cancelOrder(orderId, wallet);
  };

  // Get trades
  const getTrades = async () => {
    if (!darkswap) throw new Error('DarkSwap not initialized');
    return await darkswap.getTrades();
  };

  // Create the context value
  const value = {
    darkswap,
    loading,
    error,
    getOrders,
    createOrder,
    takeOrder,
    cancelOrder,
    getTrades,
  };

  // Provide the context value to children
  return (
    <DarkSwapContext.Provider value={value}>
      {children}
    </DarkSwapContext.Provider>
  );
}

// Create a custom hook for using the DarkSwap context
export function useDarkSwap() {
  const context = useContext(DarkSwapContext);
  
  if (!context) {
    throw new Error('useDarkSwap must be used within a DarkSwapProvider');
  }
  
  return context;
}
```

## Step 7: Update the App Component

Now, let's update our main App component to use the wallet and DarkSwap contexts. Update the `src/App.js` file:

```javascript
import React from 'react';
import { WalletProvider } from './contexts/WalletContext';
import { DarkSwapProvider } from './contexts/DarkSwapContext';
import WalletConnector from './components/WalletConnector';
import WalletBalance from './components/WalletBalance';
import TradeForm from './components/TradeForm';
import OrderList from './components/OrderList';
import './App.css';

function App() {
  return (
    <DarkSwapProvider>
      <WalletProvider>
        <div className="app">
          <h1>DarkSwap Trading App</h1>
          
          <div className="wallet-section">
            <WalletConnector />
            <WalletBalance />
          </div>
          
          <div className="trading-section">
            <TradeForm />
            <OrderList />
          </div>
        </div>
      </WalletProvider>
    </DarkSwapProvider>
  );
}

export default App;
```

## Step 8: Add Styling

Let's add some styling for our wallet components. Update the `src/App.css` file:

```css
/* Add these styles to your existing App.css */

.wallet-section {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
}

.wallet-connector,
.wallet-balance {
  flex: 1;
  min-width: 300px;
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.wallet-info {
  margin-top: 10px;
}

.balance-list {
  margin-top: 10px;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.asset {
  font-weight: bold;
}

.refresh-button {
  margin-top: 15px;
  background-color: #6c757d;
}

.refresh-button:hover {
  background-color: #5a6268;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.form-group {
  position: relative;
}

.max-button {
  position: absolute;
  right: 10px;
  top: 32px;
  background-color: #6c757d;
  font-size: 12px;
  padding: 2px 8px;
}

.total-value {
  padding: 8px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.order-list table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.order-list th,
.order-list td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.order-list th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.order-list tr.buy td:first-child {
  color: #28a745;
}

.order-list tr.sell td:first-child {
  color: #dc3545;
}

.cancel-button {
  background-color: #dc3545;
}

.cancel-button:hover {
  background-color: #c82333;
}

.take-button {
  background-color: #007bff;
}

.take-button:hover {
  background-color: #0069d9;
}
```

## Step 9: Run the Application

Start the application:

```bash
npm start
```

Your application should now be running at http://localhost:3000. It will display a wallet connector, wallet balance, trade form, and order list.

## Conclusion

Congratulations! You've successfully integrated a Bitcoin wallet with your DarkSwap application. This integration allows users to:

1. Connect to different wallet types
2. View their wallet balance
3. Create orders using their wallet
4. Take orders from other users
5. Cancel their own orders

This wallet integration is essential for a fully functional DarkSwap application, as it allows users to execute trades using their own Bitcoin wallets.

Next steps:
- Add support for hardware wallets
- Implement transaction signing and verification
- Add support for runes and alkanes
- Implement wallet backup and recovery
- Add transaction history

For more information, refer to the DarkSwap Developer Guide.