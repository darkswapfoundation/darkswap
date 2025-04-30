# Wallet Integration Example

This example demonstrates how to integrate different wallet types with the DarkSwap API, including creating wallets, managing keys, and signing transactions.

## Prerequisites

Before you begin, make sure you have:

1. Installed the DarkSwap SDK
2. Set up the necessary dependencies for wallet integration

## Supported Wallet Types

DarkSwap supports three types of wallets:

1. **SimpleWallet**: A basic wallet implementation provided by DarkSwap
2. **BdkWallet**: A wallet implementation using the Bitcoin Development Kit (BDK)
3. **ExternalWallet**: Integration with external wallet providers (e.g., hardware wallets)

## Creating a Simple Wallet

The SimpleWallet is the easiest to set up and is suitable for testing and development:

```typescript
import DarkSwapWasm, { WalletType, BitcoinNetwork } from '@darkswap/sdk';

async function createSimpleWallet() {
  // Create DarkSwap instance
  const darkswap = new DarkSwapWasm();
  
  // Initialize DarkSwap
  await darkswap.initialize({
    bitcoinNetwork: BitcoinNetwork.Testnet,
    relayUrl: 'wss://relay.darkswap.io',
    listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
    bootstrapPeers: ['/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'],
  });
  
  try {
    // Create a new wallet with a random mnemonic
    const walletId = await darkswap.createWallet({
      type: WalletType.SimpleWallet,
      network: BitcoinNetwork.Testnet,
    });
    
    console.log('Simple wallet created with ID:', walletId);
    
    // Get the wallet details
    const wallet = await darkswap.getWallet(walletId);
    console.log('Wallet details:', wallet);
    
    // IMPORTANT: Save the mnemonic securely
    console.log('Mnemonic (SAVE THIS SECURELY):', wallet.mnemonic);
    
    return walletId;
  } catch (error) {
    console.error('Failed to create simple wallet:', error);
    throw error;
  }
}
```

## Creating a Wallet from an Existing Mnemonic

If you already have a mnemonic phrase, you can create a wallet from it:

```typescript
async function createWalletFromMnemonic(mnemonic: string) {
  // Create DarkSwap instance
  const darkswap = new DarkSwapWasm();
  
  // Initialize DarkSwap
  await darkswap.initialize({
    bitcoinNetwork: BitcoinNetwork.Testnet,
    relayUrl: 'wss://relay.darkswap.io',
    listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
    bootstrapPeers: ['/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'],
  });
  
  try {
    // Create a wallet from the existing mnemonic
    const walletId = await darkswap.createWallet({
      type: WalletType.SimpleWallet,
      network: BitcoinNetwork.Testnet,
      mnemonic,
    });
    
    console.log('Wallet created from mnemonic with ID:', walletId);
    
    // Get the wallet details
    const wallet = await darkswap.getWallet(walletId);
    console.log('Wallet details:', wallet);
    
    return walletId;
  } catch (error) {
    console.error('Failed to create wallet from mnemonic:', error);
    throw error;
  }
}
```

## Creating a BDK Wallet

The BDK wallet provides more advanced features and better security:

```typescript
async function createBdkWallet() {
  // Create DarkSwap instance
  const darkswap = new DarkSwapWasm();
  
  // Initialize DarkSwap
  await darkswap.initialize({
    bitcoinNetwork: BitcoinNetwork.Testnet,
    relayUrl: 'wss://relay.darkswap.io',
    listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
    bootstrapPeers: ['/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'],
  });
  
  try {
    // Create a new BDK wallet
    const walletId = await darkswap.createWallet({
      type: WalletType.BdkWallet,
      network: BitcoinNetwork.Testnet,
    });
    
    console.log('BDK wallet created with ID:', walletId);
    
    // Get the wallet details
    const wallet = await darkswap.getWallet(walletId);
    console.log('Wallet details:', wallet);
    
    // IMPORTANT: Save the mnemonic securely
    console.log('Mnemonic (SAVE THIS SECURELY):', wallet.mnemonic);
    
    return walletId;
  } catch (error) {
    console.error('Failed to create BDK wallet:', error);
    throw error;
  }
}
```

## Integrating with an External Wallet

For production use, you might want to integrate with an external wallet provider:

```typescript
async function integrateExternalWallet(provider: string) {
  // Create DarkSwap instance
  const darkswap = new DarkSwapWasm();
  
  // Initialize DarkSwap
  await darkswap.initialize({
    bitcoinNetwork: BitcoinNetwork.Testnet,
    relayUrl: 'wss://relay.darkswap.io',
    listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
    bootstrapPeers: ['/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'],
  });
  
  try {
    // Integrate with an external wallet provider
    const walletId = await darkswap.createWallet({
      type: WalletType.ExternalWallet,
      network: BitcoinNetwork.Testnet,
      externalWalletProvider: provider,
    });
    
    console.log('External wallet integrated with ID:', walletId);
    
    // Get the wallet details
    const wallet = await darkswap.getWallet(walletId);
    console.log('Wallet details:', wallet);
    
    return walletId;
  } catch (error) {
    console.error('Failed to integrate external wallet:', error);
    throw error;
  }
}
```

## Getting Wallet Balance

To check the balance of a wallet:

```typescript
import { AssetType } from '@darkswap/sdk';

async function getWalletBalance(walletId: string) {
  // Create DarkSwap instance
  const darkswap = new DarkSwapWasm();
  
  // Initialize DarkSwap
  await darkswap.initialize({
    bitcoinNetwork: BitcoinNetwork.Testnet,
    relayUrl: 'wss://relay.darkswap.io',
    listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
    bootstrapPeers: ['/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'],
  });
  
  try {
    // Get Bitcoin balance
    const btcBalance = await darkswap.getBalance(walletId, AssetType.Bitcoin, 'BTC');
    console.log('BTC Balance:', btcBalance);
    
    // Get Rune balance (if applicable)
    try {
      const runeBalance = await darkswap.getBalance(walletId, AssetType.Rune, 'SATS');
      console.log('SATS Rune Balance:', runeBalance);
    } catch (error) {
      console.log('No SATS Rune balance found');
    }
    
    // Get Alkane balance (if applicable)
    try {
      const alkaneBalance = await darkswap.getBalance(walletId, AssetType.Alkane, 'RARE');
      console.log('RARE Alkane Balance:', alkaneBalance);
    } catch (error) {
      console.log('No RARE Alkane balance found');
    }
    
    return {
      btc: btcBalance,
      runes: {
        SATS: runeBalance,
      },
      alkanes: {
        RARE: alkaneBalance,
      },
    };
  } catch (error) {
    console.error('Failed to get wallet balance:', error);
    throw error;
  }
}
```

## Signing a Transaction

When creating or taking an order, you need to sign a transaction:

```typescript
import { Transaction } from '@darkswap/sdk';

async function signTransaction(walletId: string, transaction: Transaction) {
  // Create DarkSwap instance
  const darkswap = new DarkSwapWasm();
  
  // Initialize DarkSwap
  await darkswap.initialize({
    bitcoinNetwork: BitcoinNetwork.Testnet,
    relayUrl: 'wss://relay.darkswap.io',
    listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
    bootstrapPeers: ['/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'],
  });
  
  try {
    // Sign the transaction
    const signedTransaction = await darkswap.signTransaction(walletId, transaction);
    console.log('Transaction signed:', signedTransaction);
    
    return signedTransaction;
  } catch (error) {
    console.error('Failed to sign transaction:', error);
    throw error;
  }
}
```

## Creating and Taking Orders with a Wallet

Here's how to create and take orders using a wallet:

```typescript
import { OrderSide, AssetType } from '@darkswap/sdk';

async function createOrderWithWallet(walletId: string) {
  // Create DarkSwap instance
  const darkswap = new DarkSwapWasm();
  
  // Initialize DarkSwap
  await darkswap.initialize({
    bitcoinNetwork: BitcoinNetwork.Testnet,
    relayUrl: 'wss://relay.darkswap.io',
    listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
    bootstrapPeers: ['/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'],
  });
  
  try {
    // Set the active wallet
    await darkswap.setActiveWallet(walletId);
    
    // Create a sell order
    const orderId = await darkswap.createOrder(
      OrderSide.Sell,
      AssetType.Bitcoin,
      'BTC',
      AssetType.Rune,
      'SATS',
      '0.01',
      '50000',
    );
    
    console.log('Order created with ID:', orderId);
    return orderId;
  } catch (error) {
    console.error('Failed to create order with wallet:', error);
    throw error;
  }
}

async function takeOrderWithWallet(walletId: string, orderId: string) {
  // Create DarkSwap instance
  const darkswap = new DarkSwapWasm();
  
  // Initialize DarkSwap
  await darkswap.initialize({
    bitcoinNetwork: BitcoinNetwork.Testnet,
    relayUrl: 'wss://relay.darkswap.io',
    listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
    bootstrapPeers: ['/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'],
  });
  
  try {
    // Set the active wallet
    await darkswap.setActiveWallet(walletId);
    
    // Get the order details
    const order = await darkswap.getOrder(orderId);
    
    // Take the order
    const tradeId = await darkswap.takeOrder(orderId, order.amount);
    
    console.log('Order taken with trade ID:', tradeId);
    return tradeId;
  } catch (error) {
    console.error('Failed to take order with wallet:', error);
    throw error;
  }
}
```

## Handling Wallet Errors

Proper error handling is crucial when working with wallets:

```typescript
import { WalletError, ErrorCode } from '@darkswap/sdk';

async function handleWalletErrors() {
  try {
    // Attempt to create a wallet
    const walletId = await darkswap.createWallet({
      type: WalletType.SimpleWallet,
      network: BitcoinNetwork.Testnet,
    });
    
    // Attempt to get balance
    const balance = await darkswap.getBalance(walletId, AssetType.Bitcoin, 'BTC');
    
    return balance;
  } catch (error) {
    if (error instanceof WalletError) {
      switch (error.code) {
        case ErrorCode.WalletNotFound:
          console.error('Wallet not found');
          // Handle wallet not found error
          break;
        case ErrorCode.InsufficientFunds:
          console.error('Insufficient funds');
          // Handle insufficient funds error
          break;
        case ErrorCode.SigningFailed:
          console.error('Failed to sign transaction');
          // Handle signing failure
          break;
        default:
          console.error('Wallet error:', error.message);
          // Handle other wallet errors
      }
    } else {
      console.error('Unknown error:', error);
      // Handle unknown errors
    }
    
    throw error;
  }
}
```

## Wallet Security Best Practices

When working with wallets, it's important to follow security best practices:

1. **Never store mnemonics or private keys in plain text**
2. **Use secure storage for sensitive information**
3. **Consider using hardware wallets for large amounts**
4. **Implement proper error handling**
5. **Use testnet for development and testing**

Here's an example of securely storing a mnemonic:

```typescript
// WARNING: This is just an example. In a real application, use a secure storage solution.
function securelyStoreMnemonic(mnemonic: string, password: string) {
  // In a real application, use a proper encryption library
  const encryptedMnemonic = encrypt(mnemonic, password);
  
  // Store the encrypted mnemonic in secure storage
  localStorage.setItem('encrypted_mnemonic', encryptedMnemonic);
  
  console.log('Mnemonic securely stored');
}

function retrieveMnemonic(password: string): string {
  // Retrieve the encrypted mnemonic from secure storage
  const encryptedMnemonic = localStorage.getItem('encrypted_mnemonic');
  
  if (!encryptedMnemonic) {
    throw new Error('No stored mnemonic found');
  }
  
  // Decrypt the mnemonic
  const mnemonic = decrypt(encryptedMnemonic, password);
  
  return mnemonic;
}

// Example encryption and decryption functions (DO NOT USE IN PRODUCTION)
function encrypt(text: string, password: string): string {
  // In a real application, use a proper encryption library
  return btoa(text + password);
}

function decrypt(encryptedText: string, password: string): string {
  // In a real application, use a proper encryption library
  const decoded = atob(encryptedText);
  return decoded.substring(0, decoded.length - password.length);
}
```

## Putting It All Together

Here's a complete example that demonstrates wallet integration:

```typescript
async function walletIntegrationExample() {
  try {
    // 1. Create a new wallet
    console.log('Creating a new wallet...');
    const walletId = await createSimpleWallet();
    
    // 2. Get the wallet balance
    console.log('Getting wallet balance...');
    const balance = await getWalletBalance(walletId);
    
    // 3. Create an order with the wallet
    console.log('Creating an order...');
    const orderId = await createOrderWithWallet(walletId);
    
    // 4. Find matching orders
    console.log('Finding matching orders...');
    const orders = await darkswap.getOrders(
      OrderSide.Buy,
      AssetType.Bitcoin,
      'BTC',
      AssetType.Rune,
      'SATS',
    );
    
    // 5. Take an order if available
    if (orders.length > 0) {
      console.log('Taking an order...');
      const buyOrderId = orders[0].id;
      const tradeId = await takeOrderWithWallet(walletId, buyOrderId);
      
      // 6. Get trade details
      console.log('Getting trade details...');
      const trade = await darkswap.getTrade(tradeId);
      console.log('Trade details:', trade);
    } else {
      console.log('No matching buy orders found');
    }
    
    console.log('Wallet integration example completed successfully');
  } catch (error) {
    console.error('Error during wallet integration example:', error);
  }
}
```

## Conclusion

This example demonstrated how to integrate different wallet types with the DarkSwap API. You can create wallets, manage keys, check balances, and sign transactions. The API provides a simple and intuitive interface for working with wallets in the DarkSwap decentralized exchange.

For more advanced wallet usage, check out the other examples and the API reference documentation.