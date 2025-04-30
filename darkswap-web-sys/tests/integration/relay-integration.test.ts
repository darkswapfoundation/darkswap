/**
 * Integration test for DarkSwap WebAssembly bindings with relay server
 * 
 * This test demonstrates how to use the DarkSwap WebAssembly bindings with a relay server.
 * It requires a running relay server to pass.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import darkswap from '../../src/index';

// Skip these tests if the SKIP_INTEGRATION_TESTS environment variable is set
const SKIP_TESTS = process.env.SKIP_INTEGRATION_TESTS === 'true';

// Relay server configuration
const RELAY_SERVER = process.env.RELAY_SERVER || 'ws://localhost:9002/ws';

// Test timeout
const TEST_TIMEOUT = 30000; // 30 seconds

describe('DarkSwap Relay Integration', () => {
  // Skip all tests if SKIP_INTEGRATION_TESTS is set
  if (SKIP_TESTS) {
    it.skip('Integration tests are skipped', () => {});
    return;
  }
  
  // Initialize the SDK before all tests
  beforeAll(async () => {
    // Initialize the SDK with relay configuration
    await darkswap.initialize({
      network: {
        bootstrapPeers: [],
        relays: [RELAY_SERVER],
        maxPeers: 10,
        enableDht: true,
        enableMdns: false,
        enableWebRtc: true,
      },
    });
    
    // Connect to the P2P network
    await darkswap.connect();
  }, TEST_TIMEOUT);
  
  // Disconnect after all tests
  afterAll(async () => {
    // Disconnect from the P2P network
    if (darkswap.isConnected()) {
      await darkswap.disconnect();
    }
  });
  
  // Test connecting to the relay server
  it('should connect to the relay server', async () => {
    // Connect to the relay server
    await darkswap.connectToRelay(RELAY_SERVER);
    
    // Wait for the connection to be established
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if connected to the P2P network
    expect(darkswap.isConnected()).toBe(true);
  }, TEST_TIMEOUT);
  
  // Test getting peers
  it('should get peers', async () => {
    // Get peers
    const peers = await darkswap.getPeers();
    
    // Log the peers
    console.log('Connected peers:', peers);
    
    // Peers might be empty if no other peers are connected
    expect(Array.isArray(peers)).toBe(true);
  }, TEST_TIMEOUT);
  
  // Test creating and canceling an order
  it('should create and cancel an order', async () => {
    // Connect a wallet (mock implementation)
    await darkswap.connectWallet({
      type: 'wasm',
      network: 'testnet',
      enableRunes: true,
      enableAlkanes: true,
    });
    
    // Create an order
    const order = {
      baseAsset: 'BTC',
      quoteAsset: 'RUNE1',
      side: 'buy' as const,
      type: 'limit' as const,
      price: '0.0001',
      amount: '1.0',
    };
    
    // Create the order
    const orderId = await darkswap.createOrder(order);
    
    // Check if the order was created
    expect(orderId).toBeTruthy();
    
    // Get orders
    const orders = await darkswap.getOrders();
    
    // Check if the order is in the orderbook
    const createdOrder = orders.find(entry => entry.order.id === orderId);
    expect(createdOrder).toBeTruthy();
    
    // Cancel the order
    await darkswap.cancelOrder(orderId);
    
    // Get orders again
    const updatedOrders = await darkswap.getOrders();
    
    // Check if the order is no longer active
    const canceledOrder = updatedOrders.find(entry => entry.order.id === orderId);
    expect(canceledOrder?.isActive).toBe(false);
    
    // Disconnect the wallet
    await darkswap.disconnectWallet();
  }, TEST_TIMEOUT);
  
  // Test event handling
  it('should handle network events', async () => {
    // Create a promise that resolves when a network event is received
    const eventPromise = new Promise<any>(resolve => {
      const handler = (event: any) => {
        // Remove the event listener
        darkswap.off('network', handler);
        
        // Resolve the promise with the event
        resolve(event);
      };
      
      // Add the event listener
      darkswap.on('network', handler);
    });
    
    // Connect to the relay server (this should trigger a network event)
    await darkswap.connectToRelay(RELAY_SERVER);
    
    // Wait for the event
    const event = await eventPromise;
    
    // Check if the event is valid
    expect(event).toBeTruthy();
    expect(event.type).toBeTruthy();
  }, TEST_TIMEOUT);
});

/**
 * This test suite demonstrates how to use the DarkSwap WebAssembly bindings with a relay server.
 * It covers the following functionality:
 * 
 * 1. Initializing the SDK with relay configuration
 * 2. Connecting to the P2P network
 * 3. Connecting to a relay server
 * 4. Getting peers
 * 5. Creating and canceling orders
 * 6. Handling network events
 * 
 * To run these tests, you need a running relay server. You can start a relay server using the
 * darkswap-relay package:
 * 
 * ```bash
 * cd ../darkswap-relay
 * ./target/debug/darkswap-relay
 * ```
 * 
 * Then run the tests:
 * 
 * ```bash
 * npm test -- integration/relay-integration.test.ts
 * ```
 * 
 * If you want to skip these tests, set the SKIP_INTEGRATION_TESTS environment variable:
 * 
 * ```bash
 * SKIP_INTEGRATION_TESTS=true npm test -- integration/relay-integration.test.ts
 * ```
 */