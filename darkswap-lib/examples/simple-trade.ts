/**
 * Simple trade example
 * 
 * This example demonstrates how to use the DarkSwap TypeScript Library to create and execute a trade.
 */

import { 
  createClient, 
  createWallet, 
  createOrderbook, 
  createTrade, 
  OrderSide, 
  WalletType, 
  BitcoinNetwork 
} from '../src';

async function main() {
  try {
    console.log('DarkSwap Simple Trade Example');
    console.log('-----------------------------');
    
    // Create a client
    console.log('Creating client...');
    const client = createClient({
      apiUrl: 'https://api.darkswap.xyz',
      wsUrl: 'wss://ws.darkswap.xyz',
      network: BitcoinNetwork.TESTNET,
    });
    
    // Connect to the WebSocket API
    console.log('Connecting to WebSocket API...');
    await client.connectWebSocket();
    console.log('Connected to WebSocket API');
    
    // Create a wallet
    console.log('Creating wallet...');
    const wallet = createWallet({
      type: WalletType.WASM,
      network: BitcoinNetwork.TESTNET,
    });
    
    // Connect to the wallet
    console.log('Connecting to wallet...');
    const connected = await wallet.connect();
    
    if (!connected) {
      console.error('Failed to connect to wallet');
      return;
    }
    
    console.log('Connected to wallet');
    console.log(`Wallet address: ${wallet.getAddress()}`);
    
    // Get the wallet balance
    const balance = wallet.getBalance();
    console.log(`BTC balance: ${balance.btc.btc} BTC (${balance.btc.sats} sats)`);
    console.log(`Rune balances: ${balance.runes.length}`);
    console.log(`Alkane balances: ${balance.alkanes.length}`);
    
    // Create an orderbook
    console.log('Creating orderbook...');
    const orderbook = createOrderbook(client, {
      baseAsset: 'BTC',
      quoteAsset: 'RUNE:0x123',
    });
    
    // Sync the orderbook
    console.log('Syncing orderbook...');
    await orderbook.sync();
    console.log('Orderbook synced');
    
    // Get all orders
    const orders = orderbook.getOrders();
    console.log(`Orders: ${orders.length}`);
    
    // Get buy orders
    const buyOrders = orderbook.getBuyOrders();
    console.log(`Buy orders: ${buyOrders.length}`);
    
    // Get sell orders
    const sellOrders = orderbook.getSellOrders();
    console.log(`Sell orders: ${sellOrders.length}`);
    
    // Create a new order
    console.log('Creating order...');
    const orderId = await orderbook.createOrder(
      OrderSide.BUY,
      '0.1',
      '20000',
      24 * 60 * 60 * 1000
    );
    console.log(`Order created: ${orderId}`);
    
    // Get the order
    const order = orderbook.getOrder(orderId);
    
    if (!order) {
      console.error('Order not found');
      return;
    }
    
    // Create a trade
    console.log('Creating trade...');
    const trade = createTrade(client, wallet, {
      autoFinalize: true,
      autoBroadcast: true,
    });
    
    // Find a matching order
    const matchingOrders = orderbook.matchOrder(
      order.side === OrderSide.BUY ? OrderSide.SELL : OrderSide.BUY,
      order.amount,
      order.price
    );
    
    if (matchingOrders.length === 0) {
      console.log('No matching orders found');
      
      // Cancel the order
      console.log('Cancelling order...');
      await orderbook.cancelOrder(orderId);
      console.log('Order cancelled');
      
      return;
    }
    
    const matchingOrder = matchingOrders[0];
    console.log(`Found matching order: ${matchingOrder.id}`);
    
    // Create a trade
    console.log('Creating trade...');
    const tradeExecution = await trade.createTrade(order, matchingOrder);
    console.log(`Trade created: ${tradeExecution.id}`);
    
    // Wait for the trade to complete
    console.log('Waiting for trade to complete...');
    const completedTrade = await trade.waitForTradeCompletion(tradeExecution.id);
    console.log(`Trade completed: ${completedTrade.id}`);
    
    // Disconnect from the WebSocket API
    console.log('Disconnecting from WebSocket API...');
    client.disconnectWebSocket();
    console.log('Disconnected from WebSocket API');
    
    // Disconnect from the wallet
    console.log('Disconnecting from wallet...');
    wallet.disconnect();
    console.log('Disconnected from wallet');
    
    console.log('Example completed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main().catch(console.error);