# TypeScript Library and Web Interface Integration Guide

This document provides guidance for integrating the DarkSwap TypeScript library with the web interface, enabling users to interact with the DarkSwap network through a user-friendly interface.

## Architecture Overview

The integration between the TypeScript library and web interface consists of several key components:

1. **TypeScript Library (darkswap-lib)**: Provides the API for interacting with the DarkSwap network
2. **React Context Providers**: Manage global state and provide access to the DarkSwap API
3. **React Components**: Render the user interface and handle user interactions
4. **State Management**: Manage application state using React Context and reducers

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Interface                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    React Components                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Context Providers                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   TypeScript Library                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  WebAssembly Bindings                       │
└─────────────────────────────────────────────────────────────┘
```

## Integration Components

### 1. Context Providers

Create context providers to manage global state and provide access to the DarkSwap API:

```tsx
// In web/src/contexts/DarkSwapContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DarkSwapProvider as LibProvider, DarkSwap } from 'darkswap-lib';
import { useConfig } from './ConfigContext';

// Create a context for the DarkSwap instance
const DarkSwapContext = createContext<DarkSwap | null>(null);

// Create a hook to access the DarkSwap instance
export const useDarkSwap = () => {
  const context = useContext(DarkSwapContext);
  if (!context) {
    throw new Error('useDarkSwap must be used within a DarkSwapProvider');
  }
  return context;
};

// Create a provider component
export const DarkSwapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = useConfig();
  
  return (
    <LibProvider config={config.darkswap}>
      {children}
    </LibProvider>
  );
};
```

### 2. State Management

Implement state management using React Context and reducers:

```tsx
// In web/src/contexts/OrderbookContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useDarkSwap } from './DarkSwapContext';
import { Order } from '../types';

// Define the state type
interface OrderbookState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

// Define the action types
type OrderbookAction =
  | { type: 'FETCH_ORDERS_START' }
  | { type: 'FETCH_ORDERS_SUCCESS'; payload: Order[] }
  | { type: 'FETCH_ORDERS_FAILURE'; payload: string }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'REMOVE_ORDER'; payload: string };

// Create the reducer
const orderbookReducer = (state: OrderbookState, action: OrderbookAction): OrderbookState => {
  switch (action.type) {
    case 'FETCH_ORDERS_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_ORDERS_SUCCESS':
      return { ...state, loading: false, orders: action.payload };
    case 'FETCH_ORDERS_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload] };
    case 'REMOVE_ORDER':
      return { ...state, orders: state.orders.filter(order => order.id !== action.payload) };
    default:
      return state;
  }
};

// Create the context
const OrderbookContext = createContext<{
  state: OrderbookState;
  dispatch: React.Dispatch<OrderbookAction>;
} | null>(null);

// Create a hook to access the orderbook state and dispatch
export const useOrderbook = () => {
  const context = useContext(OrderbookContext);
  if (!context) {
    throw new Error('useOrderbook must be used within an OrderbookProvider');
  }
  return context;
};

// Create a provider component
export const OrderbookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const darkswap = useDarkSwap();
  
  const [state, dispatch] = useReducer(orderbookReducer, {
    orders: [],
    loading: false,
    error: null,
  });
  
  useEffect(() => {
    // Subscribe to orderbook events
    const handleOrderCreated = (order: Order) => {
      dispatch({ type: 'ADD_ORDER', payload: order });
    };
    
    const handleOrderRemoved = (orderId: string) => {
      dispatch({ type: 'REMOVE_ORDER', payload: orderId });
    };
    
    darkswap.addEventListener((event) => {
      if (event.type === 'trade') {
        if (event.payload.type === 'order_created') {
          handleOrderCreated(event.payload.payload);
        } else if (event.payload.type === 'order_removed') {
          handleOrderRemoved(event.payload.payload);
        }
      }
    });
    
    // Fetch initial orders
    dispatch({ type: 'FETCH_ORDERS_START' });
    darkswap.getOrders()
      .then(orders => dispatch({ type: 'FETCH_ORDERS_SUCCESS', payload: orders }))
      .catch(error => dispatch({ type: 'FETCH_ORDERS_FAILURE', payload: error.message }));
    
    return () => {
      // Cleanup
    };
  }, [darkswap]);
  
  return (
    <OrderbookContext.Provider value={{ state, dispatch }}>
      {children}
    </OrderbookContext.Provider>
  );
};
```

### 3. React Components

Create React components that use the context providers:

```tsx
// In web/src/components/Orderbook.tsx
import React from 'react';
import { useOrderbook } from '../contexts/OrderbookContext';
import { Order } from '../types';

export const Orderbook: React.FC = () => {
  const { state } = useOrderbook();
  const { orders, loading, error } = state;
  
  if (loading) {
    return <div>Loading orders...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return (
    <div className="orderbook">
      <h2>Orderbook</h2>
      {orders.length === 0 ? (
        <p>No orders available</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Price</th>
              <th>Amount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const OrderRow: React.FC<{ order: Order }> = ({ order }) => {
  return (
    <tr>
      <td>{order.price}</td>
      <td>{order.amount}</td>
      <td>{order.price * order.amount}</td>
    </tr>
  );
};
```

### 4. Trade Form

Create a form for creating orders:

```tsx
// In web/src/components/TradeForm.tsx
import React, { useState } from 'react';
import { useDarkSwap } from '../contexts/DarkSwapContext';

export const TradeForm: React.FC = () => {
  const darkswap = useDarkSwap();
  
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!price || !amount) {
      setError('Please enter price and amount');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await darkswap.createOrder({
        side,
        price: parseFloat(price),
        amount: parseFloat(amount),
      });
      
      // Reset form
      setPrice('');
      setAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="trade-form">
      <h2>Create Order</h2>
      {error && (
        <div className="error">{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <input
              type="radio"
              name="side"
              value="buy"
              checked={side === 'buy'}
              onChange={() => setSide('buy')}
            />
            Buy
          </label>
          <label>
            <input
              type="radio"
              name="side"
              value="sell"
              checked={side === 'sell'}
              onChange={() => setSide('sell')}
            />
            Sell
          </label>
        </div>
        <div className="form-group">
          <label htmlFor="price">Price:</label>
          <input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={loading}
            step="0.00000001"
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            step="0.00000001"
            min="0"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Order...' : `${side === 'buy' ? 'Buy' : 'Sell'} Order`}
        </button>
      </form>
    </div>
  );
};
```

### 5. Peer Status Component

Create a component to display peer status:

```tsx
// In web/src/components/PeerStatus.tsx
import React from 'react';
import { useLocalPeerId, usePeerConnections } from 'darkswap-lib/react';

export const PeerStatus: React.FC = () => {
  const localPeerId = useLocalPeerId();
  const connectedPeers = usePeerConnections();
  
  return (
    <div className="peer-status">
      <h3>Peer Status</h3>
      <div>
        <strong>Local Peer ID:</strong> {localPeerId || 'Not connected'}
      </div>
      <div>
        <strong>Connected Peers:</strong> {connectedPeers.length}
      </div>
      {connectedPeers.length > 0 && (
        <ul>
          {connectedPeers.map((peerId) => (
            <li key={peerId}>{peerId}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### 6. Relay Status Component

Create a component to display relay status:

```tsx
// In web/src/components/RelayStatus.tsx
import React from 'react';
import { useRelayConnections, useCloseRelay } from 'darkswap-lib/react';

export const RelayStatus: React.FC = () => {
  const relayConnections = useRelayConnections();
  const closeRelay = useCloseRelay();
  
  const handleCloseRelay = async (relayId: string) => {
    try {
      await closeRelay(relayId);
    } catch (error) {
      console.error('Failed to close relay:', error);
    }
  };
  
  return (
    <div className="relay-status">
      <h3>Relay Connections</h3>
      {relayConnections.length === 0 ? (
        <p>No active relay connections</p>
      ) : (
        <ul>
          {relayConnections.map(({ peerId, relayId }) => (
            <li key={relayId}>
              <div>
                <strong>Peer:</strong> {peerId}
              </div>
              <div>
                <strong>Relay ID:</strong> {relayId}
              </div>
              <button onClick={() => handleCloseRelay(relayId)}>
                Close Relay
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

## Integration Steps

### 1. Install Dependencies

Install the TypeScript library in the web interface:

```bash
# In web directory
npm install ../darkswap-lib
```

### 2. Set Up Context Providers

Set up the context providers in the application:

```tsx
// In web/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DarkSwapProvider } from './contexts/DarkSwapContext';
import { OrderbookProvider } from './contexts/OrderbookContext';
import { WalletProvider } from './contexts/WalletContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Home } from './pages/Home';
import { Trade } from './pages/Trade';
import { Orders } from './pages/Orders';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';
import { Layout } from './components/Layout';

const App: React.FC = () => {
  return (
    <ConfigProvider>
      <ThemeProvider>
        <DarkSwapProvider>
          <WalletProvider>
            <OrderbookProvider>
              <Router>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/trade" element={<Trade />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/about" element={<About />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </Router>
            </OrderbookProvider>
          </WalletProvider>
        </DarkSwapProvider>
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default App;
```

### 3. Create Pages

Create pages that use the components:

```tsx
// In web/src/pages/Trade.tsx
import React from 'react';
import { TradeForm } from '../components/TradeForm';
import { Orderbook } from '../components/Orderbook';
import { PeerStatus } from '../components/PeerStatus';
import { RelayStatus } from '../components/RelayStatus';

export const Trade: React.FC = () => {
  return (
    <div className="trade-page">
      <h1>Trade</h1>
      <div className="trade-container">
        <div className="trade-left">
          <TradeForm />
          <PeerStatus />
          <RelayStatus />
        </div>
        <div className="trade-right">
          <Orderbook />
        </div>
      </div>
    </div>
  );
};
```

### 4. Implement Error Handling

Implement error handling for the integration:

```tsx
// In web/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 5. Add Loading States

Add loading states for asynchronous operations:

```tsx
// In web/src/components/LoadingSpinner.tsx
import React from 'react';

interface Props {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const LoadingSpinner: React.FC<Props> = ({ size = 'medium', message }) => {
  return (
    <div className={`loading-spinner loading-spinner-${size}`}>
      <div className="spinner"></div>
      {message && <p>{message}</p>}
    </div>
  );
};
```

## Common Issues and Solutions

### 1. State Management Complexity

**Issue**: Managing complex state across multiple components.

**Solution**:
- Use React Context for global state
- Implement reducers for complex state logic
- Consider using a state management library like Redux for very complex state

### 2. Performance Issues

**Issue**: Performance issues with large datasets or complex UI.

**Solution**:
- Use React.memo for pure components
- Implement virtualized lists for large datasets
- Use useMemo and useCallback hooks to prevent unnecessary re-renders
- Consider using web workers for heavy computations

### 3. Error Handling

**Issue**: Handling errors from asynchronous operations.

**Solution**:
- Use try/catch blocks for async operations
- Implement error boundaries for component errors
- Add proper error states in the UI
- Log errors for debugging

### 4. Testing

**Issue**: Testing components that depend on the DarkSwap API.

**Solution**:
- Mock the DarkSwap API for unit tests
- Use React Testing Library for component tests
- Implement integration tests for critical flows
- Use end-to-end testing for full application testing

## Next Steps

1. **Enhance UI Components**
   - Improve the orderbook visualization
   - Add charts for price history
   - Implement a more user-friendly trade form

2. **Add More Features**
   - Implement order history
   - Add wallet integration UI
   - Create a dashboard for network statistics

3. **Improve Performance**
   - Optimize rendering for large datasets
   - Implement caching for API calls
   - Add pagination for large lists

4. **Enhance Testing**
   - Add more unit tests for components
   - Implement integration tests for critical flows
   - Add end-to-end tests for the full application