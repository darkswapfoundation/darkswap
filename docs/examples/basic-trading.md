# Basic Trading Example

This example demonstrates how to use the DarkSwap API to create and take orders, as well as manage trades.

## Prerequisites

Before you begin, make sure you have:

1. Installed the DarkSwap SDK
2. Set up a wallet
3. Connected to the DarkSwap network

## Initialization

First, initialize the DarkSwap module:

```typescript
import DarkSwapWasm, { BitcoinNetwork, Config } from '@darkswap/sdk';

// Create DarkSwap instance
const darkswap = new DarkSwapWasm();

// Initialize DarkSwap
const config: Config = {
  bitcoinNetwork: BitcoinNetwork.Testnet,
  relayUrl: 'wss://relay.darkswap.io',
  listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
  bootstrapPeers: ['/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'],
};

async function init() {
  try {
    await darkswap.initialize(config);
    console.log('DarkSwap initialized');
    
    // Continue with trading operations
    await performTradingOperations();
  } catch (error) {
    console.error('Failed to initialize DarkSwap:', error);
  }
}

init();
```

## Creating an Order

To create an order, use the `createOrder` method:

```typescript
import { OrderSide, AssetType } from '@darkswap/sdk';

async function createSellOrder() {
  try {
    // Create a sell order: Sell 0.01 BTC for 50,000 SATS per BTC
    const orderId = await darkswap.createOrder(
      OrderSide.Sell,      // Order side (Buy or Sell)
      AssetType.Bitcoin,   // Base asset type
      'BTC',               // Base asset ID
      AssetType.Rune,      // Quote asset type
      'SATS',              // Quote asset ID
      '0.01',              // Amount of base asset to sell
      '50000',             // Price per unit of base asset in quote asset
    );
    
    console.log('Sell order created with ID:', orderId);
    return orderId;
  } catch (error) {
    console.error('Failed to create sell order:', error);
    throw error;
  }
}
```

## Getting Order Details

To get details about an order, use the `getOrder` method:

```typescript
async function getOrderDetails(orderId: string) {
  try {
    const order = await darkswap.getOrder(orderId);
    console.log('Order details:', order);
    
    // Order details include:
    // - id: The order ID
    // - side: Buy or Sell
    // - baseAsset: The base asset (e.g., 'BTC')
    // - quoteAsset: The quote asset (e.g., 'SATS')
    // - amount: The amount of the base asset
    // - price: The price per unit of the base asset in the quote asset
    // - timestamp: The time the order was created
    // - status: The status of the order (Open, Filled, Cancelled, Expired)
    // - maker: The address of the user who created the order
    
    return order;
  } catch (error) {
    console.error('Failed to get order details:', error);
    throw error;
  }
}
```

## Finding Orders

To find orders matching specific criteria, use the `getOrders` method:

```typescript
async function findBitcoinSatsOrders() {
  try {
    // Find all orders for the BTC/SATS trading pair
    const orders = await darkswap.getOrders(
      undefined,          // Order side (undefined for both Buy and Sell)
      AssetType.Bitcoin,  // Base asset type
      'BTC',              // Base asset ID
      AssetType.Rune,     // Quote asset type
      'SATS',             // Quote asset ID
    );
    
    console.log('Found', orders.length, 'orders for BTC/SATS');
    
    // Filter for buy orders only
    const buyOrders = orders.filter(order => order.side === OrderSide.Buy);
    console.log('Found', buyOrders.length, 'buy orders');
    
    // Filter for sell orders only
    const sellOrders = orders.filter(order => order.side === OrderSide.Sell);
    console.log('Found', sellOrders.length, 'sell orders');
    
    // Sort by price (ascending for sell orders, descending for buy orders)
    const sortedSellOrders = sellOrders.sort((a, b) => 
      parseFloat(a.price) - parseFloat(b.price)
    );
    
    const sortedBuyOrders = buyOrders.sort((a, b) => 
      parseFloat(b.price) - parseFloat(a.price)
    );
    
    return {
      buyOrders: sortedBuyOrders,
      sellOrders: sortedSellOrders,
    };
  } catch (error) {
    console.error('Failed to find orders:', error);
    throw error;
  }
}
```

## Taking an Order

To take an existing order, use the `takeOrder` method:

```typescript
async function takeOrder(orderId: string) {
  try {
    // Get order details first
    const order = await darkswap.getOrder(orderId);
    console.log('Taking order:', order);
    
    // Take the full amount of the order
    const tradeId = await darkswap.takeOrder(
      orderId,       // The ID of the order to take
      order.amount,  // The amount of the base asset to take
    );
    
    console.log('Order taken successfully. Trade ID:', tradeId);
    return tradeId;
  } catch (error) {
    console.error('Failed to take order:', error);
    throw error;
  }
}
```

## Taking a Partial Order

You can also take a partial amount of an order:

```typescript
async function takePartialOrder(orderId: string, partialAmount: string) {
  try {
    // Get order details first
    const order = await darkswap.getOrder(orderId);
    console.log('Taking partial order:', order);
    
    // Validate that the partial amount is less than or equal to the order amount
    const orderAmount = parseFloat(order.amount);
    const amount = parseFloat(partialAmount);
    
    if (amount > orderAmount) {
      throw new Error(`Partial amount (${amount}) exceeds order amount (${orderAmount})`);
    }
    
    // Take the partial amount of the order
    const tradeId = await darkswap.takeOrder(
      orderId,        // The ID of the order to take
      partialAmount,  // The partial amount of the base asset to take
    );
    
    console.log('Partial order taken successfully. Trade ID:', tradeId);
    return tradeId;
  } catch (error) {
    console.error('Failed to take partial order:', error);
    throw error;
  }
}
```

## Cancelling an Order

To cancel an order that you've created, use the `cancelOrder` method:

```typescript
async function cancelOrder(orderId: string) {
  try {
    await darkswap.cancelOrder(orderId);
    console.log('Order cancelled successfully:', orderId);
  } catch (error) {
    console.error('Failed to cancel order:', error);
    throw error;
  }
}
```

## Getting Trade Details

To get details about a trade, use the `getTrade` method:

```typescript
async function getTradeDetails(tradeId: string) {
  try {
    const trade = await darkswap.getTrade(tradeId);
    console.log('Trade details:', trade);
    
    // Trade details include:
    // - id: The trade ID
    // - orderId: The ID of the order that was taken
    // - taker: The address of the user who took the order
    // - maker: The address of the user who created the order
    // - amount: The amount of the base asset that was traded
    // - price: The price at which the trade was executed
    // - timestamp: The time the trade was executed
    // - status: The status of the trade (Pending, Completed, Failed)
    
    return trade;
  } catch (error) {
    console.error('Failed to get trade details:', error);
    throw error;
  }
}
```

## Finding Trades

To find trades matching specific criteria, use the `getTrades` method:

```typescript
async function findMyTrades(myAddress: string) {
  try {
    // Find all trades where I am either the maker or the taker
    const allTrades = await darkswap.getTrades();
    
    // Filter for trades where I am the maker
    const makerTrades = allTrades.filter(trade => trade.maker === myAddress);
    console.log('Found', makerTrades.length, 'trades where I am the maker');
    
    // Filter for trades where I am the taker
    const takerTrades = allTrades.filter(trade => trade.taker === myAddress);
    console.log('Found', takerTrades.length, 'trades where I am the taker');
    
    // Combine and sort by timestamp (newest first)
    const myTrades = [...makerTrades, ...takerTrades].sort((a, b) => 
      b.timestamp - a.timestamp
    );
    
    return myTrades;
  } catch (error) {
    console.error('Failed to find trades:', error);
    throw error;
  }
}
```

## Putting It All Together

Here's a complete example that demonstrates the trading workflow:

```typescript
async function performTradingOperations() {
  try {
    // 1. Create a sell order
    console.log('Creating sell order...');
    const orderId = await createSellOrder();
    
    // 2. Get order details
    console.log('Getting order details...');
    const order = await getOrderDetails(orderId);
    
    // 3. Find matching orders
    console.log('Finding matching orders...');
    const { buyOrders, sellOrders } = await findBitcoinSatsOrders();
    
    // 4. Take a different order (if available)
    if (buyOrders.length > 0) {
      console.log('Taking a buy order...');
      const buyOrderId = buyOrders[0].id;
      const tradeId = await takeOrder(buyOrderId);
      
      // 5. Get trade details
      console.log('Getting trade details...');
      const trade = await getTradeDetails(tradeId);
    } else {
      console.log('No matching buy orders found');
    }
    
    // 6. Cancel our sell order
    console.log('Cancelling our sell order...');
    await cancelOrder(orderId);
    
    // 7. Find our trades
    console.log('Finding our trades...');
    const myAddress = 'bc1q...'; // Your Bitcoin address
    const myTrades = await findMyTrades(myAddress);
    
    console.log('Trading operations completed successfully');
  } catch (error) {
    console.error('Error during trading operations:', error);
  }
}
```

## Error Handling

It's important to handle errors properly when working with the DarkSwap API:

```typescript
import { OrderError, TradeError, WalletError, NetworkError, ErrorCode } from '@darkswap/sdk';

async function createOrderWithErrorHandling() {
  try {
    const orderId = await darkswap.createOrder(
      OrderSide.Sell,
      AssetType.Bitcoin,
      'BTC',
      AssetType.Rune,
      'SATS',
      '0.01',
      '50000',
    );
    
    return orderId;
  } catch (error) {
    if (error instanceof WalletError) {
      if (error.code === ErrorCode.InsufficientFunds) {
        console.error('Insufficient funds to create order');
        // Handle insufficient funds error
      } else {
        console.error('Wallet error:', error.message);
        // Handle other wallet errors
      }
    } else if (error instanceof OrderError) {
      console.error('Order error:', error.message);
      // Handle order errors
    } else if (error instanceof NetworkError) {
      console.error('Network error:', error.message);
      // Handle network errors
    } else {
      console.error('Unknown error:', error);
      // Handle unknown errors
    }
    
    throw error;
  }
}
```

## Event Handling

You can listen for events to be notified when orders are created, updated, or filled:

```typescript
function setupEventListeners() {
  // Listen for new orders
  const unsubscribeOrders = darkswap.on('order', (order) => {
    console.log('New order received:', order);
    
    // Update UI or take other actions
  });
  
  // Listen for new trades
  const unsubscribeTrades = darkswap.on('trade', (trade) => {
    console.log('New trade received:', trade);
    
    // Update UI or take other actions
  });
  
  // Listen for errors
  const unsubscribeErrors = darkswap.on('error', (error) => {
    console.error('Error received:', error);
    
    // Handle error
  });
  
  // Return a function to unsubscribe from all events
  return () => {
    unsubscribeOrders();
    unsubscribeTrades();
    unsubscribeErrors();
  };
}

// Set up event listeners
const unsubscribe = setupEventListeners();

// Later, when you're done, unsubscribe from all events
// unsubscribe();
```

## Conclusion

This example demonstrated the basic trading operations using the DarkSwap API. You can create, find, take, and cancel orders, as well as get information about trades. The API provides a simple and intuitive interface for interacting with the DarkSwap decentralized exchange.

For more advanced usage, check out the other examples and the API reference documentation.