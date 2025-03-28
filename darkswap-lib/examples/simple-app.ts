/**
 * Simple example of using the DarkSwap TypeScript library
 */

import { DarkSwap, OrderSide } from '../src';

async function main() {
  try {
    console.log('Initializing DarkSwap...');
    
    // Create a DarkSwap instance with configuration
    const darkswap = new DarkSwap({
      network: {
        bootstrapPeers: [
          // Add bootstrap peers here
          // { peerId: 'QmExample1', address: '/ip4/127.0.0.1/tcp/8000/p2p/QmExample1' },
        ],
        topics: [
          'darkswap/orderbook/v1',
          'darkswap/trade/v1',
        ],
        relayPeers: [
          // Add relay peers here
          // { peerId: 'QmExample2', address: '/ip4/127.0.0.1/tcp/8001/p2p/QmExample2' },
        ],
      },
    });
    
    // Initialize DarkSwap
    await darkswap.initialize();
    console.log(`Initialized with peer ID: ${darkswap.getLocalPeerId()}`);
    
    // Listen for events
    darkswap.addEventListener('peerConnected', (event) => {
      console.log(`Peer connected: ${event.peerId}`);
    });
    
    darkswap.addEventListener('peerDisconnected', (event) => {
      console.log(`Peer disconnected: ${event.peerId}`);
    });
    
    darkswap.addEventListener('messageReceived', (event) => {
      if (event.type === 'messageReceived') {
        const decoder = new TextDecoder();
        const messageText = decoder.decode(event.message);
        console.log(`Message from ${event.peerId} on ${event.topic}: ${messageText}`);
      }
    });
    
    // Connect to a peer
    // await darkswap.connect('/ip4/127.0.0.1/tcp/8000/p2p/QmExample');
    // console.log('Connected to peer');
    
    // Create an order
    const order = await darkswap.createOrder(
      'BTC',       // Base asset
      'USDT',      // Quote asset
      OrderSide.Sell, // Order side
      '0.1',       // Amount
      '30000',     // Price
    );
    console.log('Created order:', order);
    
    // Get all orders
    const orders = darkswap.getAllOrders();
    console.log('All orders:', orders);
    
    // Get orders for a trading pair
    const btcUsdtOrders = darkswap.getOrdersForPair('BTC', 'USDT');
    console.log('BTC/USDT orders:', btcUsdtOrders);
    
    // Get the best bid and ask
    const bestBid = darkswap.getBestBid('BTC', 'USDT');
    const bestAsk = darkswap.getBestAsk('BTC', 'USDT');
    console.log('Best bid:', bestBid);
    console.log('Best ask:', bestAsk);
    
    // Take an order
    // await darkswap.takeOrder(order.id, '0.05');
    // console.log('Took order');
    
    // Cancel an order
    await darkswap.cancelOrder(order.id);
    console.log('Cancelled order');
    
    console.log('Example completed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();