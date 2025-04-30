# DarkSwap SDK Tutorial: WebAssembly Integration

This tutorial will guide you through the process of using the DarkSwap SDK's WebAssembly (Wasm) features to enhance your application's performance. WebAssembly allows you to run high-performance code in the browser, making it ideal for computationally intensive tasks like cryptography and order matching.

## Prerequisites

Before you begin, make sure you have:

- Node.js v16 or later installed
- npm v7 or later installed
- Basic knowledge of JavaScript/TypeScript
- Basic understanding of WebAssembly concepts
- Completed the [Basic Trading Tutorial](basic-trading.md)

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

Create a new file called `wasm-integration.js` (or `wasm-integration.ts` if you're using TypeScript) and add the following code:

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

## Initializing WebAssembly

Before using WebAssembly features, you need to initialize the WebAssembly module:

```javascript
// Initialize WebAssembly
await darkswap.wasm.init();
console.log('WebAssembly initialized');

// Check if WebAssembly is supported
const isWasmSupported = darkswap.wasm.isSupported();
console.log('WebAssembly supported:', isWasmSupported);

// If WebAssembly is not supported, the SDK will use JavaScript fallbacks
if (!isWasmSupported) {
  console.warn('WebAssembly is not supported in this environment. Using JavaScript fallbacks.');
}

// Check WebAssembly features
const wasmFeatures = darkswap.wasm.getFeatures();
console.log('WebAssembly features:', wasmFeatures);
```

The `init` method loads and compiles the WebAssembly modules. The `isSupported` method checks if WebAssembly is supported in the current environment. The `getFeatures` method returns information about the WebAssembly features supported by the browser.

## Using WebAssembly for Cryptographic Operations

WebAssembly is particularly useful for cryptographic operations, which are computationally intensive:

```javascript
// Generate a key pair
const keyPair = await darkswap.wasm.crypto.generateKeyPair();
console.log('Key Pair:', keyPair);

// Sign a message
const message = 'Hello, DarkSwap!';
const signature = await darkswap.wasm.crypto.sign(message, keyPair.privateKey);
console.log('Signature:', signature);

// Verify a signature
const isValid = await darkswap.wasm.crypto.verify(message, signature, keyPair.publicKey);
console.log('Signature valid:', isValid);

// Hash a message (SHA-256)
const hash = await darkswap.wasm.crypto.sha256(message);
console.log('SHA-256 Hash:', hash);

// Hash a message (RIPEMD-160)
const ripemdHash = await darkswap.wasm.crypto.ripemd160(message);
console.log('RIPEMD-160 Hash:', ripemdHash);
```

## Using WebAssembly for PSBT Operations

WebAssembly is also used for Partially Signed Bitcoin Transaction (PSBT) operations:

```javascript
// Create a PSBT
const psbt = await darkswap.wasm.psbt.create({
  inputs: [
    {
      txid: 'transaction-id',
      vout: 0,
      value: 1000000, // in satoshis
    },
  ],
  outputs: [
    {
      address: 'recipient-address',
      value: 900000, // in satoshis
    },
  ],
});
console.log('Created PSBT:', psbt);

// Sign a PSBT
const signedPsbt = await darkswap.wasm.psbt.sign(psbt, keyPair.privateKey);
console.log('Signed PSBT:', signedPsbt);

// Combine PSBTs
const combinedPsbt = await darkswap.wasm.psbt.combine([signedPsbt, anotherSignedPsbt]);
console.log('Combined PSBT:', combinedPsbt);

// Finalize a PSBT
const finalizedPsbt = await darkswap.wasm.psbt.finalize(combinedPsbt);
console.log('Finalized PSBT:', finalizedPsbt);

// Extract a transaction from a PSBT
const transaction = await darkswap.wasm.psbt.extractTransaction(finalizedPsbt);
console.log('Extracted Transaction:', transaction);
```

## Using WebAssembly for Order Matching

WebAssembly is used for efficient order matching in the DarkSwap orderbook:

```javascript
// Create some orders
const buyOrder1 = {
  id: '1',
  type: 'buy',
  price: '0.0001',
  amount: '10',
  timestamp: Date.now(),
};

const buyOrder2 = {
  id: '2',
  type: 'buy',
  price: '0.00009',
  amount: '5',
  timestamp: Date.now(),
};

const sellOrder1 = {
  id: '3',
  type: 'sell',
  price: '0.00011',
  amount: '7',
  timestamp: Date.now(),
};

const sellOrder2 = {
  id: '4',
  type: 'sell',
  price: '0.00012',
  amount: '3',
  timestamp: Date.now(),
};

// Create an orderbook
const orderbook = await darkswap.wasm.orderbook.create();
console.log('Created orderbook');

// Add orders to the orderbook
await darkswap.wasm.orderbook.addOrder(orderbook, buyOrder1);
await darkswap.wasm.orderbook.addOrder(orderbook, buyOrder2);
await darkswap.wasm.orderbook.addOrder(orderbook, sellOrder1);
await darkswap.wasm.orderbook.addOrder(orderbook, sellOrder2);
console.log('Added orders to orderbook');

// Get the orderbook state
const orderbookState = await darkswap.wasm.orderbook.getState(orderbook);
console.log('Orderbook state:', orderbookState);

// Match orders
const matches = await darkswap.wasm.orderbook.matchOrders(orderbook);
console.log('Order matches:', matches);

// Remove an order from the orderbook
await darkswap.wasm.orderbook.removeOrder(orderbook, buyOrder1.id);
console.log('Removed order from orderbook');
```

## Using WebAssembly for Runes and Alkanes

WebAssembly is used for operations related to runes and alkanes:

```javascript
// Create a rune transaction
const runeTransaction = await darkswap.wasm.runes.createTransaction({
  inputs: [
    {
      txid: 'transaction-id',
      vout: 0,
      value: 1000000, // in satoshis
    },
  ],
  outputs: [
    {
      address: 'recipient-address',
      value: 900000, // in satoshis
      rune: {
        id: 'rune-id',
        amount: '100',
      },
    },
  ],
});
console.log('Created rune transaction:', runeTransaction);

// Create an alkane transaction
const alkaneTransaction = await darkswap.wasm.alkanes.createTransaction({
  inputs: [
    {
      txid: 'transaction-id',
      vout: 0,
      value: 1000000, // in satoshis
    },
  ],
  outputs: [
    {
      address: 'recipient-address',
      value: 900000, // in satoshis
      alkane: {
        id: 'alkane-id',
        amount: '50',
      },
    },
  ],
});
console.log('Created alkane transaction:', alkaneTransaction);
```

## Performance Considerations

WebAssembly is designed for performance, but there are some considerations to keep in mind:

```javascript
// Measure WebAssembly performance
const start = performance.now();
const hash = await darkswap.wasm.crypto.sha256('Hello, DarkSwap!');
const end = performance.now();
console.log(`SHA-256 hash took ${end - start} ms`);

// Compare with JavaScript performance
const jsStart = performance.now();
const jsHash = await darkswap.crypto.sha256('Hello, DarkSwap!'); // JavaScript implementation
const jsEnd = performance.now();
console.log(`JavaScript SHA-256 hash took ${jsEnd - jsStart} ms`);

// WebAssembly initialization time
const initStart = performance.now();
await darkswap.wasm.init();
const initEnd = performance.now();
console.log(`WebAssembly initialization took ${initEnd - initStart} ms`);
```

WebAssembly modules have an initialization cost, but they typically outperform JavaScript for computationally intensive tasks once initialized.

## Memory Management

WebAssembly has its own memory model, which is managed by the SDK:

```javascript
// Get WebAssembly memory information
const memoryInfo = await darkswap.wasm.getMemoryInfo();
console.log('WebAssembly memory info:', memoryInfo);

// Manually trigger garbage collection (if needed)
await darkswap.wasm.gc();
console.log('WebAssembly garbage collection triggered');
```

The SDK automatically manages memory, but you can manually trigger garbage collection if needed.

## Error Handling

When working with WebAssembly, it's important to handle errors properly:

```javascript
try {
  const result = await darkswap.wasm.crypto.sha256('Hello, DarkSwap!');
  console.log('Result:', result);
} catch (error) {
  if (error instanceof darkswap.errors.WasmNotSupportedError) {
    console.error('WebAssembly is not supported in this environment');
  } else if (error instanceof darkswap.errors.WasmInitializationError) {
    console.error('WebAssembly initialization failed:', error.message);
  } else if (error instanceof darkswap.errors.WasmRuntimeError) {
    console.error('WebAssembly runtime error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Advanced WebAssembly Usage

For advanced users, the SDK provides direct access to the WebAssembly module:

```javascript
// Get the raw WebAssembly module
const wasmModule = await darkswap.wasm.getModule();
console.log('WebAssembly module:', wasmModule);

// Call a WebAssembly function directly
const result = await darkswap.wasm.callFunction('function_name', [arg1, arg2]);
console.log('Function result:', result);

// Access WebAssembly memory directly
const memory = await darkswap.wasm.getMemory();
console.log('WebAssembly memory:', memory);
```

Direct access to the WebAssembly module is not recommended for most use cases, as the SDK provides higher-level abstractions that are easier to use and less error-prone.

## Complete Example

Here's a complete example that demonstrates WebAssembly integration:

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

    // Initialize WebAssembly
    await darkswap.wasm.init();
    console.log('WebAssembly initialized');

    // Check if WebAssembly is supported
    const isWasmSupported = darkswap.wasm.isSupported();
    console.log('WebAssembly supported:', isWasmSupported);

    // Check WebAssembly features
    const wasmFeatures = darkswap.wasm.getFeatures();
    console.log('WebAssembly features:', wasmFeatures);

    // Generate a key pair
    const keyPair = await darkswap.wasm.crypto.generateKeyPair();
    console.log('Key Pair:', keyPair);

    // Sign a message
    const message = 'Hello, DarkSwap!';
    const signature = await darkswap.wasm.crypto.sign(message, keyPair.privateKey);
    console.log('Signature:', signature);

    // Verify a signature
    const isValid = await darkswap.wasm.crypto.verify(message, signature, keyPair.publicKey);
    console.log('Signature valid:', isValid);

    // Hash a message (SHA-256)
    const hash = await darkswap.wasm.crypto.sha256(message);
    console.log('SHA-256 Hash:', hash);

    // Create a PSBT
    const psbt = await darkswap.wasm.psbt.create({
      inputs: [
        {
          txid: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
          vout: 0,
          value: 1000000, // in satoshis
        },
      ],
      outputs: [
        {
          address: 'tb1q9h6tlfk5r7d39q9u8lxt9mneec3crt8g5jug4r',
          value: 900000, // in satoshis
        },
      ],
    });
    console.log('Created PSBT:', psbt);

    // Sign a PSBT
    const signedPsbt = await darkswap.wasm.psbt.sign(psbt, keyPair.privateKey);
    console.log('Signed PSBT:', signedPsbt);

    // Measure WebAssembly performance
    const start = performance.now();
    const perfHash = await darkswap.wasm.crypto.sha256('Hello, DarkSwap!');
    const end = performance.now();
    console.log(`SHA-256 hash took ${end - start} ms`);

    // Get WebAssembly memory information
    const memoryInfo = await darkswap.wasm.getMemoryInfo();
    console.log('WebAssembly memory info:', memoryInfo);

    console.log('WebAssembly integration completed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

## Running the Example

Save the file and run it with Node.js:

```bash
node wasm-integration.js
```

## Next Steps

Now that you've learned how to use WebAssembly with the DarkSwap SDK, you can:

- Optimize performance-critical parts of your application
- Implement custom WebAssembly modules
- Build high-performance trading algorithms
- Create efficient order matching systems

Check out the [SDK Guide](../sdk-guide.md) for more information on the DarkSwap SDK.

## Troubleshooting

### WebAssembly Support Issues

If WebAssembly is not supported in your environment:

1. Make sure you're using a modern browser that supports WebAssembly.
2. Check if WebAssembly is enabled in your browser settings.
3. The SDK will automatically fall back to JavaScript implementations, but performance may be affected.

### Performance Issues

If WebAssembly performance is not as expected:

1. Make sure you're not initializing WebAssembly modules too frequently.
2. Consider batching operations to reduce overhead.
3. Profile your application to identify bottlenecks.

### Memory Issues

If you encounter memory issues:

1. Make sure you're not creating too many WebAssembly instances.
2. Consider manually triggering garbage collection if memory usage is high.
3. Monitor memory usage to identify leaks.

## Conclusion

In this tutorial, you learned how to use the DarkSwap SDK's WebAssembly features to enhance your application's performance. WebAssembly is particularly useful for computationally intensive tasks like cryptography, order matching, and transaction handling. By leveraging WebAssembly, you can build high-performance applications that provide a better user experience.