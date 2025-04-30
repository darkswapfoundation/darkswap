# DarkSwap SDK Tutorial: P2P Trading

This tutorial will guide you through the process of using the DarkSwap SDK to perform peer-to-peer (P2P) trading. P2P trading allows you to trade directly with other users without relying on the central order book.

## Prerequisites

Before you begin, make sure you have:

- Node.js v16 or later installed
- npm v7 or later installed
- Basic knowledge of JavaScript/TypeScript
- A DarkSwap account (for authentication)
- Completed the [Basic Trading Tutorial](basic-trading.md)

## Installation

If you haven't already installed the DarkSwap SDK, do so now:

```bash
npm install @darkswap/sdk
```

or

```bash
yarn add @darkswap/sdk
```

## Setting Up the SDK

Create a new file called `p2p-trading.js` (or `p2p-trading.ts` if you're using TypeScript) and add the following code:

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
    
    // Authenticate
    await darkswap.auth.login('your-email@example.com', 'your-password');
    console.log('Authenticated successfully');
    
    // Your code will go here
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();
```

Replace `'your-email@example.com'` and `'your-password'` with your actual credentials.

## Initializing P2P Functionality

To use P2P functionality, you need to initialize the P2P module. Add the following code:

```javascript
// Initialize P2P
await darkswap.p2p.init();
console.log('P2P initialized');
```

## Finding Peers

There are several ways to find peers to trade with:

### Public Peer Discovery

You can discover peers that are publicly available:

```javascript
// Find public peers
const peers = await darkswap.p2p.findPeers();
console.log('Available Peers:', peers);
```

This will return a list of peers that are currently online and available for trading.

### Direct Connection

If you know another user's peer ID, you can connect directly to them:

```javascript
// Connect to a specific peer
const peerId = 'peer-id-here'; // Replace with the actual peer ID
const connection = await darkswap.p2p.connect(peerId);
console.log('Connected to peer:', peerId);
```

### Invite Links

You can generate an invite link that allows others to connect directly to you:

```javascript
// Generate an invite link
const inviteLink = await darkswap.p2p.generateInviteLink();
console.log('Invite Link:', inviteLink);
```

You can share this invite link with someone you want to trade with. They can use it to connect directly to you.

To connect using an invite link:

```javascript
// Connect using an invite link
const inviteLink = 'invite-link-here'; // Replace with the actual invite link
const connection = await darkswap.p2p.connectWithInviteLink(inviteLink);
console.log('Connected using invite link');
```

## Managing P2P Connections

Once you've established a connection with a peer, you can manage it:

```javascript
// Get all active connections
const connections = await darkswap.p2p.getConnections();
console.log('Active Connections:', connections);

// Disconnect from a peer
await darkswap.p2p.disconnect(peerId);
console.log('Disconnected from peer:', peerId);
```

## Communicating with Peers

You can send and receive messages from peers:

```javascript
// Send a message to a peer
await darkswap.p2p.sendMessage(peerId, {
  type: 'chat',
  content: 'Hello, would you like to trade?',
});
console.log('Message sent to peer:', peerId);

// Listen for messages from peers
darkswap.p2p.on('message', (message, senderId) => {
  console.log('Message from peer:', senderId, message);
});
```

## Negotiating P2P Trades

P2P trades are negotiated directly between two parties:

### Proposing a Trade

```javascript
// Propose a trade to a peer
const tradeProposal = await darkswap.p2p.proposeTrade(peerId, {
  baseAsset: 'BTC',
  quoteAsset: 'RUNE',
  price: '0.0001',
  amount: '0.01',
  side: 'buy', // 'buy' means you're buying BTC, 'sell' means you're selling BTC
});
console.log('Trade proposed:', tradeProposal);
```

### Listening for Trade Proposals

```javascript
// Listen for trade proposals
darkswap.p2p.on('tradeProposal', async (proposal, senderId) => {
  console.log('Trade proposal from peer:', senderId, proposal);
  
  // You can accept or reject the proposal
  const accept = confirm(`Accept trade proposal from ${senderId}?`);
  
  if (accept) {
    // Accept the proposal
    await darkswap.p2p.acceptTradeProposal(proposal.id);
    console.log('Trade proposal accepted');
  } else {
    // Reject the proposal
    await darkswap.p2p.rejectTradeProposal(proposal.id);
    console.log('Trade proposal rejected');
  }
});
```

### Handling Trade Responses

```javascript
// Listen for trade proposal responses
darkswap.p2p.on('tradeProposalResponse', (response, senderId) => {
  console.log('Trade proposal response from peer:', senderId, response);
  
  if (response.accepted) {
    console.log('Trade proposal was accepted');
  } else {
    console.log('Trade proposal was rejected');
  }
});
```

## Executing P2P Trades

Once a trade proposal is accepted, a P2P trade is created:

```javascript
// Listen for new P2P trades
darkswap.p2p.on('trade', async (trade) => {
  console.log('New P2P trade:', trade);
  
  // Sign the trade
  await darkswap.trades.sign(trade.id);
  console.log('Trade signed');
});
```

## Monitoring P2P Trades

You can monitor the status of your P2P trades:

```javascript
// Get all P2P trades
const p2pTrades = await darkswap.p2p.getTrades();
console.log('P2P Trades:', p2pTrades);

// Get a specific P2P trade
const tradeId = 'trade-id-here'; // Replace with the actual trade ID
const trade = await darkswap.p2p.getTrade(tradeId);
console.log('P2P Trade:', trade);
```

## Complete Example

Here's a complete example that demonstrates P2P trading:

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

    // Initialize P2P
    await darkswap.p2p.init();
    console.log('P2P initialized');

    // Find public peers
    const peers = await darkswap.p2p.findPeers();
    console.log('Available Peers:', peers);

    // Generate an invite link
    const inviteLink = await darkswap.p2p.generateInviteLink();
    console.log('Invite Link:', inviteLink);

    // Listen for incoming connections
    darkswap.p2p.on('connection', (peerId) => {
      console.log('New peer connected:', peerId);
    });

    // Listen for messages
    darkswap.p2p.on('message', (message, senderId) => {
      console.log('Message from peer:', senderId, message);
      
      // If it's a chat message, respond
      if (message.type === 'chat') {
        darkswap.p2p.sendMessage(senderId, {
          type: 'chat',
          content: `Hello! I received your message: "${message.content}"`,
        });
      }
    });

    // Listen for trade proposals
    darkswap.p2p.on('tradeProposal', async (proposal, senderId) => {
      console.log('Trade proposal from peer:', senderId, proposal);
      
      // For this example, we'll automatically accept all proposals
      await darkswap.p2p.acceptTradeProposal(proposal.id);
      console.log('Trade proposal accepted');
    });

    // Listen for trade proposal responses
    darkswap.p2p.on('tradeProposalResponse', (response, senderId) => {
      console.log('Trade proposal response from peer:', senderId, response);
      
      if (response.accepted) {
        console.log('Trade proposal was accepted');
      } else {
        console.log('Trade proposal was rejected');
      }
    });

    // Listen for new P2P trades
    darkswap.p2p.on('trade', async (trade) => {
      console.log('New P2P trade:', trade);
      
      // Sign the trade
      await darkswap.trades.sign(trade.id);
      console.log('Trade signed');
    });

    // If there are peers available, connect to the first one and propose a trade
    if (peers.length > 0) {
      const peerId = peers[0].id;
      
      // Connect to the peer
      await darkswap.p2p.connect(peerId);
      console.log('Connected to peer:', peerId);
      
      // Send a greeting
      await darkswap.p2p.sendMessage(peerId, {
        type: 'chat',
        content: 'Hello! Would you like to trade?',
      });
      
      // Propose a trade
      const tradeProposal = await darkswap.p2p.proposeTrade(peerId, {
        baseAsset: 'BTC',
        quoteAsset: 'RUNE',
        price: '0.0001',
        amount: '0.01',
        side: 'buy',
      });
      console.log('Trade proposed:', tradeProposal);
    }

    // Keep the process running to receive WebSocket updates
    console.log('Listening for P2P events... (Press Ctrl+C to exit)');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

## Running the Example

Save the file and run it with Node.js:

```bash
node p2p-trading.js
```

## Advanced P2P Features

### Custom Trade Parameters

You can specify additional parameters when proposing a trade:

```javascript
const tradeProposal = await darkswap.p2p.proposeTrade(peerId, {
  baseAsset: 'BTC',
  quoteAsset: 'RUNE',
  price: '0.0001',
  amount: '0.01',
  side: 'buy',
  expiresIn: 3600, // Expires in 1 hour (in seconds)
  message: 'I want to buy some BTC with RUNE', // Optional message
});
```

### Counter Proposals

If you receive a trade proposal that you don't agree with, you can send a counter proposal:

```javascript
darkswap.p2p.on('tradeProposal', async (proposal, senderId) => {
  console.log('Trade proposal from peer:', senderId, proposal);
  
  // Send a counter proposal with a different price
  const counterProposal = await darkswap.p2p.counterProposeTrade(proposal.id, {
    price: '0.00012', // Different price
  });
  console.log('Counter proposal sent:', counterProposal);
});
```

### Escrow Services

For high-value trades, you can use an escrow service:

```javascript
const tradeProposal = await darkswap.p2p.proposeTrade(peerId, {
  baseAsset: 'BTC',
  quoteAsset: 'RUNE',
  price: '0.0001',
  amount: '1.0', // A larger amount
  side: 'buy',
  useEscrow: true, // Use escrow service
});
```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to peers:

1. Make sure your internet connection is stable.
2. Check if your firewall is blocking WebRTC connections.
3. Try using a relay server if direct connections aren't working.

### Trade Execution Issues

If trades aren't executing properly:

1. Make sure both parties have signed the PSBT.
2. Check if there are any network issues with the Bitcoin blockchain.
3. Verify that both parties have sufficient funds.

## Conclusion

In this tutorial, you learned how to use the DarkSwap SDK to perform P2P trading. You now have the knowledge to build applications that enable direct trading between users without relying on a central order book.

For more information on the DarkSwap SDK, check out the [SDK Guide](../sdk-guide.md).