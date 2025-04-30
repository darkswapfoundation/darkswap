/**
 * DarkSwap SDK and Relay Server Integration Example
 * 
 * This example demonstrates how to use the DarkSwap SDK with a relay server
 * for NAT traversal and WebRTC connections.
 */

// In a real application, you would import the DarkSwap SDK
// import darkswap from 'darkswap-web-sys';

// For this example, we'll use a mock implementation
class MockDarkSwap {
  constructor() {
    this.initialized = false;
    this.connected = false;
    this.walletConnected = false;
    this.peers = [];
    this.relays = [];
    this.eventListeners = {};
  }
  
  async initialize(config) {
    console.log('Initializing DarkSwap SDK with config:', config);
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.initialized = true;
    this.emit('initialized');
    return true;
  }
  
  async connect() {
    console.log('Connecting to P2P network');
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.connected = true;
    this.emit('network', { type: 'connected' });
    return true;
  }
  
  async connectToRelay(relayAddress) {
    console.log(`Connecting to relay server: ${relayAddress}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    this.relays.push({
      address: relayAddress,
      connected: true,
      latency: Math.floor(Math.random() * 100) + 20,
    });
    this.emit('network', { 
      type: 'relay_connected',
      data: { address: relayAddress }
    });
    return true;
  }
  
  async getPeers() {
    return this.peers;
  }
  
  async getRelays() {
    return this.relays;
  }
  
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
    return this;
  }
  
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
    return this;
  }
  
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
    return true;
  }
}

// Create a mock instance
const darkswap = new MockDarkSwap();

/**
 * Main function to demonstrate the integration
 */
async function main() {
  try {
    console.log('Starting DarkSwap SDK and Relay Server integration example');
    
    // Step 1: Initialize the SDK with relay configuration
    await darkswap.initialize({
      network: {
        bootstrapPeers: [],
        relays: [
          'ws://localhost:9001/ws',
          'ws://relay-1.darkswap.io/ws',
          'ws://relay-2.darkswap.io/ws',
        ],
        maxPeers: 10,
        enableDht: true,
        enableMdns: false,
        enableWebRtc: true,
      },
    });
    console.log('SDK initialized successfully');
    
    // Step 2: Set up event listeners
    darkswap.on('network', handleNetworkEvent);
    darkswap.on('network:peer_connected', handlePeerConnected);
    darkswap.on('network:peer_disconnected', handlePeerDisconnected);
    darkswap.on('network:relay_connected', handleRelayConnected);
    darkswap.on('network:relay_disconnected', handleRelayDisconnected);
    
    // Step 3: Connect to the P2P network
    await darkswap.connect();
    console.log('Connected to P2P network');
    
    // Step 4: Connect to relay servers
    await connectToRelays();
    
    // Step 5: Simulate peer discovery and connections
    simulatePeerDiscovery();
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

/**
 * Connect to relay servers
 */
async function connectToRelays() {
  const relays = [
    'ws://localhost:9001/ws',
    'ws://relay-1.darkswap.io/ws',
    'ws://relay-2.darkswap.io/ws',
  ];
  
  console.log(`Connecting to ${relays.length} relay servers...`);
  
  for (const relay of relays) {
    try {
      await darkswap.connectToRelay(relay);
      console.log(`Connected to relay: ${relay}`);
    } catch (error) {
      console.error(`Failed to connect to relay ${relay}:`, error);
    }
  }
}

/**
 * Simulate peer discovery and connections
 */
function simulatePeerDiscovery() {
  // Simulate discovering peers through the relay
  setTimeout(() => {
    const peer1 = {
      id: 'peer-1',
      address: '/ip4/192.168.1.1/tcp/9000',
      connected: true,
      latency: 50,
    };
    
    darkswap.peers.push(peer1);
    darkswap.emit('network', {
      type: 'peer_connected',
      data: peer1,
    });
    
    console.log(`Peer connected: ${peer1.id} (${peer1.address})`);
  }, 2000);
  
  setTimeout(() => {
    const peer2 = {
      id: 'peer-2',
      address: '/ip4/192.168.1.2/tcp/9000',
      connected: true,
      latency: 80,
    };
    
    darkswap.peers.push(peer2);
    darkswap.emit('network', {
      type: 'peer_connected',
      data: peer2,
    });
    
    console.log(`Peer connected: ${peer2.id} (${peer2.address})`);
  }, 3500);
  
  // Simulate a peer disconnecting
  setTimeout(() => {
    const peer = darkswap.peers[0];
    if (peer) {
      peer.connected = false;
      darkswap.emit('network', {
        type: 'peer_disconnected',
        data: peer,
      });
      
      console.log(`Peer disconnected: ${peer.id} (${peer.address})`);
    }
  }, 6000);
  
  // Simulate a relay disconnecting
  setTimeout(() => {
    const relay = darkswap.relays[1];
    if (relay) {
      relay.connected = false;
      darkswap.emit('network', {
        type: 'relay_disconnected',
        data: { address: relay.address },
      });
      
      console.log(`Relay disconnected: ${relay.address}`);
    }
  }, 8000);
}

/**
 * Handle network events
 */
function handleNetworkEvent(event) {
  console.log(`Network event: ${event.type}`, event.data || '');
}

/**
 * Handle peer connected events
 */
function handlePeerConnected(event) {
  const peer = event.data;
  console.log(`Peer connected: ${peer.id} (${peer.address})`);
  console.log(`Current peers: ${darkswap.peers.length}`);
}

/**
 * Handle peer disconnected events
 */
function handlePeerDisconnected(event) {
  const peer = event.data;
  console.log(`Peer disconnected: ${peer.id} (${peer.address})`);
  console.log(`Current peers: ${darkswap.peers.filter(p => p.connected).length}`);
}

/**
 * Handle relay connected events
 */
function handleRelayConnected(event) {
  const relay = event.data;
  console.log(`Relay connected: ${relay.address}`);
  console.log(`Current relays: ${darkswap.relays.length}`);
}

/**
 * Handle relay disconnected events
 */
function handleRelayDisconnected(event) {
  const relay = event.data;
  console.log(`Relay disconnected: ${relay.address}`);
  console.log(`Current relays: ${darkswap.relays.filter(r => r.connected).length}`);
}

// Run the main function
main().catch(console.error);