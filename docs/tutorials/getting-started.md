# Getting Started with DarkSwap Development

This tutorial will guide you through setting up your development environment and creating a simple application that integrates with DarkSwap.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Rust** (1.70.0 or later)
- **Node.js** (18.x or later) and **npm** (9.x or later)
- **wasm-pack** (0.10.0 or later)
- **Git** (2.30.0 or later)

## Step 1: Clone the Repository

First, clone the DarkSwap repository:

```bash
git clone https://github.com/darkswap/darkswap.git
cd darkswap
```

## Step 2: Install Dependencies

Install the required dependencies:

```bash
# Install Rust dependencies
cargo build

# Install Node.js dependencies
cd web
npm install
cd ..
```

## Step 3: Build the Project

Build the DarkSwap project:

```bash
./build.sh --all
```

## Step 4: Create a Simple Web Application

Let's create a simple web application that displays the current orders from the DarkSwap network. Create a new directory for your application:

```bash
mkdir -p my-darkswap-app
cd my-darkswap-app
```

Initialize a new Node.js project:

```bash
npm init -y
```

Install the required dependencies:

```bash
npm install react react-dom react-scripts darkswap-web-sys
```

Create a new file called `src/index.js`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

Create a new file called `src/App.js`:

```javascript
import React, { useEffect, useState } from 'react';
import init, { DarkSwap } from 'darkswap-web-sys';

function App() {
  const [darkswap, setDarkswap] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initDarkSwap() {
      try {
        await init();
        const ds = new DarkSwap();
        await ds.connect();
        setDarkswap(ds);
        
        const orders = await ds.getOrders();
        setOrders(orders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initDarkSwap();

    return () => {
      if (darkswap) {
        darkswap.disconnect();
      }
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>DarkSwap Orders</h1>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            {order.side} {order.amount} {order.baseAsset} at {order.price} {order.quoteAsset}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

Create a new file called `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DarkSwap App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

Update the `package.json` file to include the following:

```json
{
  "name": "my-darkswap-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "darkswap-web-sys": "^1.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

## Step 5: Run the Application

Start the application:

```bash
npm start
```

Your application should now be running at http://localhost:3000. It will display a list of orders from the DarkSwap network.

## Step 6: Add Order Creation Functionality

Let's add the ability to create new orders. Update the `src/App.js` file:

```javascript
import React, { useEffect, useState } from 'react';
import init, { DarkSwap } from 'darkswap-web-sys';

function App() {
  const [darkswap, setDarkSwap] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [baseAsset, setBaseAsset] = useState('BTC');
  const [quoteAsset, setQuoteAsset] = useState('USD');
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('1.0');
  const [price, setPrice] = useState('50000');

  useEffect(() => {
    async function initDarkSwap() {
      try {
        await init();
        const ds = new DarkSwap();
        await ds.connect();
        setDarkSwap(ds);
        
        const orders = await ds.getOrders();
        setOrders(orders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initDarkSwap();

    return () => {
      if (darkswap) {
        darkswap.disconnect();
      }
    };
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    try {
      const order = await darkswap.createOrder({
        baseAsset,
        quoteAsset,
        side,
        amount: parseFloat(amount),
        price: parseFloat(price),
      });
      
      setOrders([...orders, order]);
      
      // Reset form
      setAmount('1.0');
      setPrice('50000');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>DarkSwap Orders</h1>
      
      <h2>Create Order</h2>
      <form onSubmit={handleCreateOrder}>
        <div>
          <label>
            Base Asset:
            <input
              type="text"
              value={baseAsset}
              onChange={(e) => setBaseAsset(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Quote Asset:
            <input
              type="text"
              value={quoteAsset}
              onChange={(e) => setQuoteAsset(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Side:
            <select value={side} onChange={(e) => setSide(e.target.value)}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Amount:
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Price:
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
        </div>
        <button type="submit">Create Order</button>
      </form>
      
      <h2>Orders</h2>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            {order.side} {order.amount} {order.baseAsset} at {order.price} {order.quoteAsset}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

## Step 7: Add Order Taking Functionality

Let's add the ability to take orders. Update the `src/App.js` file:

```javascript
import React, { useEffect, useState } from 'react';
import init, { DarkSwap } from 'darkswap-web-sys';

function App() {
  const [darkswap, setDarkSwap] = useState(null);
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [baseAsset, setBaseAsset] = useState('BTC');
  const [quoteAsset, setQuoteAsset] = useState('USD');
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('1.0');
  const [price, setPrice] = useState('50000');

  useEffect(() => {
    async function initDarkSwap() {
      try {
        await init();
        const ds = new DarkSwap();
        await ds.connect();
        setDarkSwap(ds);
        
        const orders = await ds.getOrders();
        setOrders(orders);
        
        const trades = await ds.getTrades();
        setTrades(trades);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initDarkSwap();

    return () => {
      if (darkswap) {
        darkswap.disconnect();
      }
    };
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    try {
      const order = await darkswap.createOrder({
        baseAsset,
        quoteAsset,
        side,
        amount: parseFloat(amount),
        price: parseFloat(price),
      });
      
      setOrders([...orders, order]);
      
      // Reset form
      setAmount('1.0');
      setPrice('50000');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTakeOrder = async (orderId) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      const trade = await darkswap.takeOrder(orderId, order.amount);
      
      setTrades([...trades, trade]);
      setOrders(orders.filter((o) => o.id !== orderId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>DarkSwap App</h1>
      
      <h2>Create Order</h2>
      <form onSubmit={handleCreateOrder}>
        <div>
          <label>
            Base Asset:
            <input
              type="text"
              value={baseAsset}
              onChange={(e) => setBaseAsset(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Quote Asset:
            <input
              type="text"
              value={quoteAsset}
              onChange={(e) => setQuoteAsset(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Side:
            <select value={side} onChange={(e) => setSide(e.target.value)}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Amount:
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Price:
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
        </div>
        <button type="submit">Create Order</button>
      </form>
      
      <h2>Orders</h2>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            {order.side} {order.amount} {order.baseAsset} at {order.price} {order.quoteAsset}
            <button onClick={() => handleTakeOrder(order.id)}>Take Order</button>
          </li>
        ))}
      </ul>
      
      <h2>Trades</h2>
      <ul>
        {trades.map((trade) => (
          <li key={trade.id}>
            {trade.side} {trade.amount} {trade.baseAsset} at {trade.price} {trade.quoteAsset} - {trade.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

## Step 8: Add Styling

Let's add some basic styling to our application. Create a new file called `src/App.css`:

```css
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

h1 {
  color: #333;
  text-align: center;
}

h2 {
  color: #555;
  margin-top: 30px;
}

form {
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

form div {
  margin-bottom: 10px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  background-color: #fff;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

li button {
  margin-left: 10px;
}
```

Update the `src/App.js` file to import the CSS:

```javascript
import React, { useEffect, useState } from 'react';
import init, { DarkSwap } from 'darkswap-web-sys';
import './App.css';

// Rest of the code remains the same
```

## Step 9: Run the Application

Start the application:

```bash
npm start
```

Your application should now be running at http://localhost:3000. It will display a form for creating orders, a list of orders, and a list of trades.

## Conclusion

Congratulations! You've created a simple web application that integrates with DarkSwap. This application allows users to view orders, create new orders, and take existing orders.

Next steps:
- Add wallet integration to allow users to connect their wallets
- Add real-time updates using WebSockets
- Improve the user interface with more advanced styling
- Add error handling and validation
- Add support for different asset types (runes, alkanes)

For more information, refer to the DarkSwap Developer Guide.