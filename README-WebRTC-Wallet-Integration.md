# WebRTC Wallet Integration for DarkSwap

This document provides an overview of the WebRTC wallet integration for DarkSwap, which enables peer-to-peer trading of Bitcoin, runes, and alkanes directly between users.

## Overview

The WebRTC wallet integration combines the power of WebRTC for peer-to-peer communication with wallet functionality for secure transaction execution. This enables users to trade directly with each other without intermediaries, enhancing privacy, reducing fees, and improving the overall trading experience.

## Features

- **Direct P2P Trading**: Trade directly with other users without intermediaries
- **Wallet Integration**: Connect your wallet and execute trades securely
- **Support for Multiple Assets**: Trade Bitcoin, runes, and alkanes
- **Real-time Communication**: Chat with trading partners using text, audio, or video
- **Secure Transactions**: All transactions are signed locally and executed on the Bitcoin blockchain
- **Trade History**: Keep track of all your trades in one place

## Components

### WebRTC Components

- **WebRTC Manager**: Handles connection management, signaling, and data channels
- **WebRTC Connection**: Manages individual peer connections and data transfer
- **WebRTC Context**: Provides React context for WebRTC functionality

### Wallet Integration Components

- **WebRtcWalletIntegration**: Connects WebRTC P2P functionality with wallet operations
- **P2P Trade Page**: Dedicated page for peer-to-peer trading

### Advanced Features

- **STUN/TURN Server Integration**: Enables NAT traversal for reliable connections
- **Bandwidth Management**: Optimizes connection performance
- **Audio/Video Chat**: Enables voice and video calls between traders

## How It Works

### P2P Trading Flow

1. **Connection Establishment**:
   - Users connect to the WebRTC network
   - They can see other connected peers

2. **Trade Initiation**:
   - User selects a peer to trade with
   - User specifies what they offer (Bitcoin, rune, or alkane) and what they request
   - User sends a trade request to the selected peer

3. **Trade Negotiation**:
   - Recipient receives the trade request with details
   - Recipient can accept or reject the trade

4. **Trade Execution**:
   - Upon acceptance, the initiator creates a Bitcoin transaction
   - The transaction is signed using the wallet integration
   - The signed transaction is sent to the recipient
   - Both parties receive confirmation of the executed trade

5. **Trade Completion**:
   - The trade is marked as completed
   - The transaction is recorded in the trade history

## Implementation Details

### Message Types

The WebRTC wallet integration uses the following message types for P2P trading:

- `TradeRequest`: Initiates a trade request
- `TradeResponse`: Accepts or rejects a trade request
- `TradeExecution`: Executes a trade with a signed transaction
- `TradeCompletion`: Completes a trade

### Trade Status

Trades can have the following statuses:

- `Pending`: Trade request has been sent but not yet responded to
- `Accepted`: Trade request has been accepted
- `Rejected`: Trade request has been rejected
- `Executed`: Trade has been executed with a signed transaction
- `Completed`: Trade has been completed
- `Failed`: Trade execution failed

### Asset Types

The following asset types are supported:

- `Bitcoin`: Bitcoin (BTC)
- `Rune`: Bitcoin Runes
- `Alkane`: Alkanes

## Usage

### Prerequisites

- A Bitcoin wallet
- A WebRTC-compatible browser (Chrome, Firefox, Safari, Edge)

### Trading Steps

1. Navigate to the P2P Trade page
2. Connect your wallet
3. Select a peer to trade with
4. Enter the details of your trade offer
5. Send the trade request
6. Wait for the recipient to accept or reject your offer
7. If accepted, the trade will be executed automatically
8. Once completed, the trade will be recorded in your trade history

## Security Considerations

- **End-to-End Encryption**: All communications are encrypted using WebRTC's built-in security
- **Direct P2P Connection**: No central server involved in the trade execution
- **Local Transaction Signing**: Private keys never leave the user's device
- **Blockchain Verification**: All trades are executed on the Bitcoin blockchain

## Testing

The WebRTC wallet integration includes comprehensive tests to ensure reliability and security:

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test the interaction between WebRTC and wallet functionality
- **End-to-End Tests**: Test the complete trading flow

To run the tests:

```bash
# Install dependencies
npm install

# Run tests
npm test
```

Or use the provided script:

```bash
./setup-and-test.sh
```

## Future Improvements

- **Multi-Signature Trades**: Implement multi-signature transactions for enhanced security
- **Escrow Services**: Add optional escrow services for high-value trades
- **Reputation System**: Implement a reputation system for traders
- **Mobile Support**: Optimize for mobile devices
- **Trade Templates**: Create common trade templates for frequently traded assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.