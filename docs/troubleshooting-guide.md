# DarkSwap Troubleshooting Guide

This guide provides solutions to common issues that you might encounter while using DarkSwap. It covers installation problems, connection issues, trading errors, wallet problems, and more.

## Table of Contents

1. [Installation Issues](#installation-issues)
   - [Node.js and npm Issues](#nodejs-and-npm-issues)
   - [Rust and Cargo Issues](#rust-and-cargo-issues)
   - [WebAssembly Issues](#webassembly-issues)
   - [Build Errors](#build-errors)
2. [Connection Issues](#connection-issues)
   - [API Connection Problems](#api-connection-problems)
   - [WebSocket Connection Problems](#websocket-connection-problems)
   - [WebRTC Connection Problems](#webrtc-connection-problems)
   - [P2P Network Issues](#p2p-network-issues)
3. [Trading Issues](#trading-issues)
   - [Order Creation Problems](#order-creation-problems)
   - [Order Matching Problems](#order-matching-problems)
   - [Trade Execution Problems](#trade-execution-problems)
   - [Transaction Signing Issues](#transaction-signing-issues)
4. [Wallet Issues](#wallet-issues)
   - [Wallet Creation Problems](#wallet-creation-problems)
   - [Wallet Import Problems](#wallet-import-problems)
   - [Balance Issues](#balance-issues)
   - [Transaction Issues](#transaction-issues)

## Installation Issues

### Node.js and npm Issues

#### Problem: Incompatible Node.js Version

**Symptoms:**
- Error messages mentioning Node.js version requirements
- Build failures with syntax errors

**Solution:**
1. Check the required Node.js version:
   ```bash
   cat package.json | grep "engines"
   ```

2. Install the correct Node.js version using nvm:
   ```bash
   nvm install 16
   nvm use 16
   ```

3. Verify the installation:
   ```bash
   node --version
   ```

#### Problem: npm Dependencies Installation Failure

**Symptoms:**
- Error messages during `npm install`
- Missing modules errors when running the application

**Solution:**
1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

2. Delete node_modules directory and package-lock.json:
   ```bash
   rm -rf node_modules
   rm package-lock.json
   ```

3. Reinstall dependencies:
   ```bash
   npm install
   ```

### Rust and Cargo Issues

#### Problem: Incompatible Rust Version

**Symptoms:**
- Error messages mentioning Rust version requirements
- Build failures with syntax errors

**Solution:**
1. Check the required Rust version:
   ```bash
   cat rust-toolchain.toml
   ```

2. Update Rust using rustup:
   ```bash
   rustup update
   ```

3. If a specific version is required, install it:
   ```bash
   rustup install 1.60.0
   rustup default 1.60.0
   ```

#### Problem: Cargo Build Failures

**Symptoms:**
- Error messages during `cargo build`
- Missing dependencies or features

**Solution:**
1. Update Cargo registry:
   ```bash
   cargo update
   ```

2. Clean the build directory:
   ```bash
   cargo clean
   ```

3. Build with verbose output to identify the issue:
   ```bash
   cargo build -v
   ```

### WebAssembly Issues

#### Problem: wasm-pack Installation Failure

**Symptoms:**
- Error messages during wasm-pack installation
- Command not found errors

**Solution:**
1. Install wasm-pack using cargo:
   ```bash
   cargo install wasm-pack
   ```

2. If that fails, try installing from GitHub:
   ```bash
   curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
   ```

#### Problem: WebAssembly Compilation Errors

**Symptoms:**
- Error messages during wasm-pack build
- Missing features or dependencies

**Solution:**
1. Ensure the wasm32 target is installed:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

2. Check for specific wasm features in Cargo.toml:
   ```toml
   [features]
   wasm = ["dep:wasm-bindgen", "dep:js-sys"]
   ```

3. Build with the correct target and features:
   ```bash
   wasm-pack build --target web --features wasm
   ```

### Build Errors

#### Problem: Build Script Failures

**Symptoms:**
- Error messages when running build scripts
- Missing environment variables or tools

**Solution:**
1. Check the build script for required environment variables:
   ```bash
   cat build.sh
   ```

2. Set any required environment variables:
   ```bash
   export VARIABLE_NAME=value
   ```

3. Ensure all required tools are installed:
   ```bash
   # Check for required tools
   command -v tool_name >/dev/null 2>&1 || { echo "Tool not found"; exit 1; }
   ```

#### Problem: TypeScript Compilation Errors

**Symptoms:**
- Type errors during build
- Missing type definitions

**Solution:**
1. Install required type definitions:
   ```bash
   npm install --save-dev @types/package-name
   ```

2. Check tsconfig.json for correct configuration:
   ```json
   {
     "compilerOptions": {
       "target": "es2020",
       "module": "esnext",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true
     }
   }
   ```

## Connection Issues

### API Connection Problems

#### Problem: API Endpoint Unreachable

**Symptoms:**
- Error messages about connection refused
- Timeout errors when making API requests

**Solution:**
1. Check if the API server is running:
   ```bash
   curl -I http://localhost:8000/api/health
   ```

2. Verify the API URL configuration:
   ```javascript
   // Check the API URL in your configuration
   console.log(config.apiUrl);
   ```

3. Check for network issues:
   ```bash
   ping api.darkswap.io
   ```

#### Problem: API Authentication Failures

**Symptoms:**
- 401 Unauthorized responses
- Authentication token errors

**Solution:**
1. Check if your authentication token is valid:
   ```javascript
   // Log the token (be careful with sensitive information)
   console.log("Token exists:", !!localStorage.getItem("authToken"));
   ```

2. Try logging out and logging in again to refresh the token.

3. Check if the token is being sent correctly in requests:
   ```javascript
   // Ensure the Authorization header is set correctly
   fetch('/api/resource', {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem("authToken")}`
     }
   });
   ```

### WebSocket Connection Problems

#### Problem: WebSocket Connection Failures

**Symptoms:**
- Error messages about WebSocket connection failures
- Real-time updates not working

**Solution:**
1. Check if the WebSocket server is running:
   ```bash
   # For a local WebSocket server
   netstat -an | grep 8001
   ```

2. Verify the WebSocket URL configuration:
   ```javascript
   // Check the WebSocket URL in your configuration
   console.log(config.wsUrl);
   ```

3. Test the WebSocket connection manually:
   ```javascript
   const ws = new WebSocket('wss://ws.darkswap.io');
   ws.onopen = () => console.log('Connected');
   ws.onerror = (error) => console.error('Error:', error);
   ```

#### Problem: WebSocket Disconnections

**Symptoms:**
- Frequent WebSocket disconnections
- Error messages about the connection being closed

**Solution:**
1. Implement reconnection logic:
   ```javascript
   function createWebSocket() {
     const ws = new WebSocket('wss://ws.darkswap.io');
     
     ws.onclose = () => {
       console.log('Connection closed, reconnecting...');
       setTimeout(createWebSocket, 1000);
     };
     
     return ws;
   }
   ```

2. Check for network stability issues.

3. Increase WebSocket ping/pong interval to keep the connection alive:
   ```javascript
   // Send a ping every 30 seconds
   setInterval(() => {
     if (ws.readyState === WebSocket.OPEN) {
       ws.send(JSON.stringify({ type: 'ping' }));
     }
   }, 30000);
   ```

### WebRTC Connection Problems

#### Problem: WebRTC Connection Establishment Failures

**Symptoms:**
- Peers cannot connect to each other
- ICE connection state never reaches "connected"

**Solution:**
1. Check if WebRTC is supported in the browser:
   ```javascript
   if (typeof RTCPeerConnection !== 'undefined') {
     console.log('WebRTC is supported');
   } else {
     console.error('WebRTC is not supported');
   }
   ```

2. Ensure STUN/TURN servers are configured correctly:
   ```javascript
   const peerConnection = new RTCPeerConnection({
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' },
       {
         urls: 'turn:turn.darkswap.io:3478',
         username: 'username',
         credential: 'password'
       }
     ]
   });
   ```

3. Monitor ICE candidate gathering and connection states:
   ```javascript
   peerConnection.onicecandidate = (event) => {
     console.log('ICE candidate:', event.candidate);
   };
   
   peerConnection.oniceconnectionstatechange = () => {
     console.log('ICE connection state:', peerConnection.iceConnectionState);
   };
   ```

### P2P Network Issues

#### Problem: Peer Discovery Failures

**Symptoms:**
- Unable to find peers on the network
- Empty peer list

**Solution:**
1. Check if the discovery mechanism is working:
   ```javascript
   // Log discovery attempts
   console.log('Starting peer discovery');
   darkswap.p2p.findPeers().then(peers => {
     console.log('Found peers:', peers);
   });
   ```

2. Verify that you're connected to the correct network:
   ```javascript
   console.log('Current network:', darkswap.network);
   ```

3. Check if relay servers are reachable:
   ```bash
   ping relay.darkswap.io
   ```

## Trading Issues

### Order Creation Problems

#### Problem: Order Creation Failures

**Symptoms:**
- Error messages when creating orders
- Orders not appearing in the order book

**Solution:**
1. Check if you have sufficient balance:
   ```javascript
   const balance = await darkswap.wallet.getBalance();
   console.log('Balance:', balance);
   ```

2. Verify order parameters:
   ```javascript
   // Ensure price and amount are valid numbers
   const price = parseFloat(priceInput.value);
   const amount = parseFloat(amountInput.value);
   
   if (isNaN(price) || price <= 0) {
     console.error('Invalid price');
     return;
   }
   
   if (isNaN(amount) || amount <= 0) {
     console.error('Invalid amount');
     return;
   }
   ```

3. Check for minimum order size restrictions:
   ```javascript
   const minimumOrderSize = 0.001; // BTC
   if (amount < minimumOrderSize) {
     console.error(`Order size must be at least ${minimumOrderSize} BTC`);
     return;
   }
   ```

### Order Matching Problems

#### Problem: Orders Not Being Matched

**Symptoms:**
- Orders remain in the order book for a long time
- No trades are executed despite matching prices

**Solution:**
1. Check if there are matching orders in the order book:
   ```javascript
   const orderbook = await darkswap.market.getOrderbook('BTC', 'RUNE');
   console.log('Bids:', orderbook.bids);
   console.log('Asks:', orderbook.asks);
   ```

2. Verify that your order price is competitive:
   ```javascript
   // For buy orders, check if your price is at or above the lowest ask
   if (orderType === 'buy' && orderbook.asks.length > 0) {
     const lowestAsk = parseFloat(orderbook.asks[0].price);
     if (price < lowestAsk) {
       console.log(`Your buy price (${price}) is below the lowest ask (${lowestAsk})`);
     }
   }
   ```

### Trade Execution Problems

#### Problem: Trade Execution Failures

**Symptoms:**
- Trades fail to execute after matching
- Error messages during trade execution

**Solution:**
1. Check the trade status:
   ```javascript
   const trade = await darkswap.trades.get(tradeId);
   console.log('Trade status:', trade.status);
   console.log('Error message:', trade.errorMessage);
   ```

2. Verify that both parties have signed the transaction:
   ```javascript
   console.log('Buyer signature:', trade.signatures.buyer ? 'Present' : 'Missing');
   console.log('Seller signature:', trade.signatures.seller ? 'Present' : 'Missing');
   ```

3. Try to sign the transaction again:
   ```javascript
   try {
     await darkswap.trades.sign(trade.id);
     console.log('Transaction signed successfully');
   } catch (error) {
     console.error('Signing error:', error.message);
   }
   ```

## Wallet Issues

### Wallet Creation Problems

#### Problem: Wallet Creation Failures

**Symptoms:**
- Error messages when creating a wallet
- Wallet not created

**Solution:**
1. Check for entropy sources:
   ```javascript
   // Check if the browser has access to secure random number generation
   if (window.crypto && window.crypto.getRandomValues) {
     console.log('Secure random number generation is available');
   } else {
     console.error('Secure random number generation is not available');
   }
   ```

2. Try creating a wallet with a different method:
   ```javascript
   try {
     // Try alternative method
     const wallet = await darkswap.wallet.createWithEntropy(customEntropy);
     console.log('Wallet created with custom entropy');
   } catch (error) {
     console.error('Alternative creation error:', error.message);
   }
   ```

### Wallet Import Problems

#### Problem: Mnemonic Import Failures

**Symptoms:**
- Error messages when importing a mnemonic
- Wallet not imported

**Solution:**
1. Check for typos in the mnemonic:
   ```javascript
   const words = mnemonic.split(' ');
   for (const word of words) {
     const similarWords = findSimilarWords(word, bip39Wordlist);
     if (similarWords.length > 0) {
       console.log(`Did you mean: ${similarWords.join(', ')} instead of ${word}?`);
     }
   }
   ```

2. Verify the mnemonic format:
   ```javascript
   // Remove extra spaces
   const cleanedMnemonic = mnemonic.trim().replace(/\s+/g, ' ');
   console.log('Cleaned mnemonic:', cleanedMnemonic);
   ```

## Getting Help

If you're experiencing issues that aren't covered in this guide, there are several ways to get help:

1. **Community Forum**: Visit the [DarkSwap Forum](https://forum.darkswap.io) to search for solutions or ask questions.

2. **Discord Community**: Join the [DarkSwap Discord](https://discord.gg/darkswap) to chat with other users and get real-time help.

3. **GitHub Issues**: Check the [GitHub Issues](https://github.com/darkswap/darkswap/issues) for known problems or report new ones.

4. **Documentation**: Refer to the [DarkSwap Documentation](https://docs.darkswap.io) for comprehensive guides and reference material.

5. **Support Email**: For critical issues, contact support at support@darkswap.io.

When reporting issues, always include:
- The version of DarkSwap you're using
- Your operating system and browser version
- Steps to reproduce the issue
- Any error messages or logs
- Screenshots if applicable
