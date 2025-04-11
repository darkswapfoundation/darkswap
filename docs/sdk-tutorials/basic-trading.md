# DarkSwap SDK Tutorial: Basic Trading

This tutorial will guide you through the process of using the DarkSwap SDK to perform basic trading operations. By the end of this tutorial, you'll be able to create orders, view the orderbook, and execute trades.

## Prerequisites

Before you begin, make sure you have:

- Node.js v16 or later installed
- npm v7 or later installed
- Basic knowledge of JavaScript/TypeScript
- A DarkSwap account (for authentication)

## Installation

First, install the DarkSwap SDK:

```bash
npm install @darkswap/sdk
```

or

```bash
yarn add @darkswap/sdk
```

## Setting Up the SDK

Create a new file called `trading.js` (or `trading.ts` if you're using TypeScript) and add the following code:

```javascript
// Import the SDK
const { DarkSwap, Network } = require('@darkswap/sdk');
// or for TypeScript/ES modules:
// import { DarkSwap, Network } from '@darkswap/sdk';

// Initialize the SDK
const darkswap = new DarkSwap({
  network: Network.TESTNET, // Use TESTNET for testing, MAINNET for production
});

// Main function
async function main() {
  try {
    // Connect to the SDK
    await darkswap.connect();
    console.log('Connected to DarkSwap SDK');
    
    // Your code will go here
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();
```

## Authentication

To perform trading operations, you need to authenticate with the DarkSwap API. Add the following code to your `main` function:

```javascript
// Authenticate with email and password
await darkswap.auth.login('your-email@example.com', 'your-password');
console.log('Authenticated successfully');

// Alternatively, you can use an API key
// await darkswap.auth.loginWithApiKey('your-api-key');
```

Replace `'your-email@example.com'` and `'your-password'` with your actual credentials.

## Checking Your Wallet Balance

Before trading, it's a good idea to check your wallet balance. Add the following code:

```javascript
// Get wallet balance
const balance = await darkswap.wallet.getBalance();
console.log('Wallet Balance:', balance);
```

This will output your balance for all assets in your wallet.

## Viewing the Orderbook

To make informed trading decisions, you'll want to view the current orderbook. Add the following code:

```javascript
// Define the trading pair
const baseAsset = 'BTC';
const quoteAsset = 'RUNE';

// Get the orderbook
const orderbook = await darkswap.market.getOrderbook(baseAsset, quoteAsset);
console.log('Orderbook:');
console.log('Bids (Buy Orders):', orderbook.bids);
console.log('Asks (Sell Orders):', orderbook.asks);
```

This will output the current bids (buy orders) and asks (sell orders) for the BTC/RUNE trading pair.

## Creating a Buy Order

Now, let's create a buy order. Add the following code:

```javascript
// Create a buy order
const buyOrder = await darkswap.orders.create({
  type: 'buy',
  baseAsset: 'BTC',
  quoteAsset: 'RUNE',
  price: '0.0001', // The price in the quote asset (RUNE) per unit of the base asset (BTC)
  amount: '0.01', // The amount of the base asset (BTC) to buy
});

console.log('Buy Order Created:', buyOrder);
```

This will create a limit buy order for 0.01 BTC at a price of 0.0001 RUNE per BTC.

## Creating a Sell Order

Similarly, you can create a sell order. Add the following code:

```javascript
// Create a sell order
const sellOrder = await darkswap.orders.create({
  type: 'sell',
  baseAsset: 'BTC',
  quoteAsset: 'RUNE',
  price: '0.00012', // The price in the quote asset (RUNE) per unit of the base asset (BTC)
  amount: '0.01', // The amount of the base asset (BTC) to sell
});

console.log('Sell Order Created:', sellOrder);
```

This will create a limit sell order for 0.01 BTC at a price of 0.00012 RUNE per BTC.

## Viewing Your Orders

To view your open orders, add the following code:

```javascript
// Get your open orders
const openOrders = await darkswap.orders.getAll({ status: 'open' });
console.log('Open Orders:', openOrders);
```

This will output all your open orders.

## Cancelling an Order

If you want to cancel an order, add the following code:

```javascript
// Cancel the buy order we just created
await darkswap.orders.cancel(buyOrder.id);
console.log('Order Cancelled:', buyOrder.id);
```

This will cancel the buy order we created earlier.

## Handling Trades

When your order is matched with another order, a trade is created. To view your trades, add the following code:

```javascript
// Get your trades
const trades = await darkswap.trades.getAll();
console.log('Trades:', trades);
```

This will output all your trades.

## Signing a Trade

When a trade is created, you need to sign the PSBT (Partially Signed Bitcoin Transaction) to complete the trade. Add the following code:

```javascript
// Check if there are any trades that need signing
const pendingTrades = trades.filter(trade => 
  trade.status === 'pending' && 
  !trade.signatures.buyer // Assuming you're the buyer
);

if (pendingTrades.length > 0) {
  // Sign the first pending trade
  const trade = pendingTrades[0];
  const signedTrade = await darkswap.trades.sign(trade.id);
  console.log('Trade Signed:', signedTrade);
}
```

This will sign any pending trades where you're the buyer and haven't signed yet.

## Real-time Updates with WebSockets

To receive real-time updates about orders and trades, you can use WebSockets. Add the following code:

```javascript
// Subscribe to order updates
darkswap.events.on('order', (order) => {
  console.log('Order Update:', order);
});

// Subscribe to trade updates
darkswap.events.on('trade', (trade) => {
  console.log('Trade Update:', trade);
});

// Keep the process running to receive WebSocket updates
console.log('Listening for updates... (Press Ctrl+C to exit)');
```

This will log any updates to your orders or trades in real-time.

## Complete Example

Here's the complete example:

```javascript
const { DarkSwap, Network } = require('@darkswap/sdk');

async function main() {
  try {
    // Initialize the SDK
    const darkswap = new DarkSwap({
      network: Network.TESTNET,
    });

    // Connect to the SDK
    await darkswap.connect();
    console.log('Connected to DarkSwap SDK');

    // Authenticate
    await darkswap.auth.login('your-email@example.com', 'your-password');
    console.log('Authenticated successfully');

    // Get wallet balance
    const balance = await darkswap.wallet.getBalance();
    console.log('Wallet Balance:', balance);

    // Define the trading pair
    const baseAsset = 'BTC';
    const quoteAsset = 'RUNE';

    // Get the orderbook
    const orderbook = await darkswap.market.getOrderbook(baseAsset, quoteAsset);
    console.log('Orderbook:');
    console.log('Bids (Buy Orders):', orderbook.bids);
    console.log('Asks (Sell Orders):', orderbook.asks);

    // Create a buy order
    const buyOrder = await darkswap.orders.create({
      type: 'buy',
      baseAsset: 'BTC',
      quoteAsset: 'RUNE',
      price: '0.0001',
      amount: '0.01',
    });
    console.log('Buy Order Created:', buyOrder);

    // Create a sell order
    const sellOrder = await darkswap.orders.create({
      type: 'sell',
      baseAsset: 'BTC',
      quoteAsset: 'RUNE',
      price: '0.00012',
      amount: '0.01',
    });
    console.log('Sell Order Created:', sellOrder);

    // Get your open orders
    const openOrders = await darkswap.orders.getAll({ status: 'open' });
    console.log('Open Orders:', openOrders);

    // Cancel the buy order
    await darkswap.orders.cancel(buyOrder.id);
    console.log('Order Cancelled:', buyOrder.id);

    // Get your trades
    const trades = await darkswap.trades.getAll();
    console.log('Trades:', trades);

    // Check if there are any trades that need signing
    const pendingTrades = trades.filter(trade => 
      trade.status === 'pending' && 
      !trade.signatures.buyer // Assuming you're the buyer
    );

    if (pendingTrades.length > 0) {
      // Sign the first pending trade
      const trade = pendingTrades[0];
      const signedTrade = await darkswap.trades.sign(trade.id);
      console.log('Trade Signed:', signedTrade);
    }

    // Subscribe to order updates
    darkswap.events.on('order', (order) => {
      console.log('Order Update:', order);
    });

    // Subscribe to trade updates
    darkswap.events.on('trade', (trade) => {
      console.log('Trade Update:', trade);
    });

    // Keep the process running to receive WebSocket updates
    console.log('Listening for updates... (Press Ctrl+C to exit)');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

## Running the Example

Save the file and run it with Node.js:

```bash
node trading.js
```

## Next Steps

Now that you've learned the basics of trading with the DarkSwap SDK, you can:

- Explore more advanced order types
- Implement error handling and retries
- Build a trading bot
- Create a custom trading interface

Check out the [SDK Guide](../sdk-guide.md) for more information on the DarkSwap SDK.

## Troubleshooting

### Authentication Issues

If you're having trouble authenticating, make sure your credentials are correct. You can also try using an API key instead of email and password.

### Order Creation Issues

If you're having trouble creating orders, check your wallet balance to make sure you have enough funds. Also, make sure the price and amount are valid for the trading pair.

### WebSocket Issues

If you're not receiving WebSocket updates, make sure your network allows WebSocket connections. You can also try reconnecting to the WebSocket server.

## Conclusion

In this tutorial, you learned how to use the DarkSwap SDK to perform basic trading operations. You now have the knowledge to build applications that interact with the DarkSwap platform.