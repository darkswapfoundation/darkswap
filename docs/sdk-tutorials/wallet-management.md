# DarkSwap SDK Tutorial: Wallet Management

This tutorial will guide you through the process of using the DarkSwap SDK to manage wallets, including creating wallets, importing existing wallets, managing keys, and handling transactions.

## Prerequisites

Before you begin, make sure you have:

- Node.js v16 or later installed
- npm v7 or later installed
- Basic knowledge of JavaScript/TypeScript
- Basic understanding of Bitcoin wallets and transactions

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

Create a new file called `wallet-management.js` (or `wallet-management.ts` if you're using TypeScript) and add the following code:

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

## Creating a New Wallet

To create a new wallet, add the following code:

```javascript
// Create a new wallet
const wallet = await darkswap.wallet.create();
console.log('New Wallet Created:');
console.log('Mnemonic:', wallet.mnemonic);
console.log('Address:', wallet.address);

// IMPORTANT: Store the mnemonic securely
// This is the only way to recover your wallet if you lose access
```

The `create` method generates a new BIP39 mnemonic phrase and derives a Bitcoin wallet from it. The mnemonic phrase is a series of words that can be used to recover the wallet if needed.

## Importing an Existing Wallet

If you already have a wallet (represented by a mnemonic phrase), you can import it:

```javascript
// Import an existing wallet
const mnemonic = 'your twelve or twenty four word mnemonic phrase here';
const importedWallet = await darkswap.wallet.import(mnemonic);
console.log('Wallet Imported:');
console.log('Address:', importedWallet.address);
```

Replace `'your twelve or twenty four word mnemonic phrase here'` with your actual mnemonic phrase.

## Connecting to an External Wallet

DarkSwap also supports connecting to external wallets:

```javascript
// Connect to an external wallet (e.g., MetaMask)
await darkswap.wallet.connectExternal('metamask');
console.log('Connected to external wallet');

// Or connect to a hardware wallet
await darkswap.wallet.connectHardware('ledger');
console.log('Connected to hardware wallet');
```

## Getting Wallet Information

Once you have a wallet set up, you can get information about it:

```javascript
// Get wallet information
const walletInfo = await darkswap.wallet.getInfo();
console.log('Wallet Info:', walletInfo);
```

This will return information such as the wallet address, balance, and other details.

## Checking Wallet Balance

To check the balance of your wallet:

```javascript
// Get wallet balance
const balance = await darkswap.wallet.getBalance();
console.log('Wallet Balance:', balance);
```

This will return the balance for all assets in your wallet.

## Getting Deposit Addresses

To get a deposit address for a specific asset:

```javascript
// Get a deposit address for Bitcoin
const btcAddress = await darkswap.wallet.getDepositAddress('BTC');
console.log('BTC Deposit Address:', btcAddress);

// Get a deposit address for a rune
const runeAddress = await darkswap.wallet.getDepositAddress('RUNE');
console.log('RUNE Deposit Address:', runeAddress);

// Get a deposit address for an alkane
const alkaneAddress = await darkswap.wallet.getDepositAddress('ALKANE');
console.log('ALKANE Deposit Address:', alkaneAddress);
```

## Withdrawing Funds

To withdraw funds from your wallet:

```javascript
// Withdraw Bitcoin
const btcWithdrawal = await darkswap.wallet.withdraw({
  asset: 'BTC',
  amount: '0.01',
  address: 'recipient-btc-address',
});
console.log('BTC Withdrawal:', btcWithdrawal);

// Withdraw a rune
const runeWithdrawal = await darkswap.wallet.withdraw({
  asset: 'RUNE',
  amount: '100',
  address: 'recipient-btc-address', // Runes are sent to Bitcoin addresses
});
console.log('RUNE Withdrawal:', runeWithdrawal);

// Withdraw an alkane
const alkaneWithdrawal = await darkswap.wallet.withdraw({
  asset: 'ALKANE',
  amount: '50',
  address: 'recipient-btc-address', // Alkanes are sent to Bitcoin addresses
});
console.log('ALKANE Withdrawal:', alkaneWithdrawal);
```

Replace `'recipient-btc-address'` with the actual recipient address.

## Viewing Transaction History

To view your transaction history:

```javascript
// Get all transactions
const transactions = await darkswap.wallet.getTransactions();
console.log('All Transactions:', transactions);

// Get Bitcoin transactions
const btcTransactions = await darkswap.wallet.getTransactions({ asset: 'BTC' });
console.log('BTC Transactions:', btcTransactions);

// Get transactions by type
const depositTransactions = await darkswap.wallet.getTransactions({ type: 'deposit' });
console.log('Deposit Transactions:', depositTransactions);

// Get transactions by status
const pendingTransactions = await darkswap.wallet.getTransactions({ status: 'pending' });
console.log('Pending Transactions:', pendingTransactions);

// Get transactions within a date range
const recentTransactions = await darkswap.wallet.getTransactions({
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  to: new Date(),
});
console.log('Recent Transactions:', recentTransactions);
```

## Working with UTXOs

For advanced wallet management, you can work directly with UTXOs (Unspent Transaction Outputs):

```javascript
// Get all UTXOs
const utxos = await darkswap.wallet.getUtxos();
console.log('UTXOs:', utxos);

// Get UTXOs for a specific asset
const btcUtxos = await darkswap.wallet.getUtxos({ asset: 'BTC' });
console.log('BTC UTXOs:', btcUtxos);
```

## Creating and Signing PSBTs

DarkSwap uses PSBTs (Partially Signed Bitcoin Transactions) for secure trading. You can also create and sign PSBTs manually:

```javascript
// Create a PSBT
const psbt = await darkswap.wallet.createPsbt({
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
  // The difference between inputs and outputs is the fee
});
console.log('Created PSBT:', psbt);

// Sign a PSBT
const signedPsbt = await darkswap.wallet.signPsbt(psbt);
console.log('Signed PSBT:', signedPsbt);

// Broadcast a fully signed PSBT
const txid = await darkswap.wallet.broadcastPsbt(signedPsbt);
console.log('Transaction broadcast, TXID:', txid);
```

## Managing Multiple Wallets

The DarkSwap SDK supports managing multiple wallets:

```javascript
// Create multiple wallets
const wallet1 = await darkswap.wallet.create();
const wallet2 = await darkswap.wallet.create();

// Switch between wallets
await darkswap.wallet.use(wallet1.id);
console.log('Using wallet 1');

// Get the current wallet
const currentWallet = await darkswap.wallet.getCurrent();
console.log('Current Wallet:', currentWallet);

// Switch to another wallet
await darkswap.wallet.use(wallet2.id);
console.log('Using wallet 2');
```

## Wallet Security

### Encrypting a Wallet

For added security, you can encrypt your wallet:

```javascript
// Encrypt the wallet
await darkswap.wallet.encrypt('your-secure-password');
console.log('Wallet encrypted');

// Decrypt the wallet
await darkswap.wallet.decrypt('your-secure-password');
console.log('Wallet decrypted');
```

### Backing Up a Wallet

Always back up your wallet:

```javascript
// Get the wallet backup (mnemonic)
const backup = await darkswap.wallet.getBackup();
console.log('Wallet Backup (KEEP THIS SECURE):', backup);
```

### Verifying Addresses

Before sending funds, it's a good practice to verify addresses:

```javascript
// Verify a Bitcoin address
const isValidBtc = await darkswap.wallet.isValidAddress('btc-address', 'BTC');
console.log('Is valid BTC address:', isValidBtc);

// Verify a rune address (which is a Bitcoin address)
const isValidRune = await darkswap.wallet.isValidAddress('rune-address', 'RUNE');
console.log('Is valid RUNE address:', isValidRune);
```

## Address Book Management

The SDK provides functionality to manage an address book:

```javascript
// Add an address to the address book
await darkswap.wallet.addAddressBookEntry({
  address: 'btc-address',
  label: 'My Friend',
  asset: 'BTC',
});
console.log('Address added to address book');

// Get all address book entries
const addressBook = await darkswap.wallet.getAddressBook();
console.log('Address Book:', addressBook);

// Get address book entries for a specific asset
const btcAddressBook = await darkswap.wallet.getAddressBook({ asset: 'BTC' });
console.log('BTC Address Book:', btcAddressBook);

// Remove an address from the address book
await darkswap.wallet.removeAddressBookEntry('btc-address');
console.log('Address removed from address book');
```

## Fee Estimation

To estimate transaction fees:

```javascript
// Get fee estimates
const feeEstimates = await darkswap.wallet.getFeeEstimates();
console.log('Fee Estimates:');
console.log('Fast:', feeEstimates.fast, 'sat/vB');
console.log('Medium:', feeEstimates.medium, 'sat/vB');
console.log('Slow:', feeEstimates.slow, 'sat/vB');

// Estimate fee for a specific transaction
const estimatedFee = await darkswap.wallet.estimateFee({
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
  feeRate: feeEstimates.medium, // in sat/vB
});
console.log('Estimated Fee:', estimatedFee, 'satoshis');
```

## Complete Example

Here's a complete example that demonstrates wallet management:

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

    // Create a new wallet
    const wallet = await darkswap.wallet.create();
    console.log('New Wallet Created:');
    console.log('Mnemonic:', wallet.mnemonic);
    console.log('Address:', wallet.address);

    // Get wallet information
    const walletInfo = await darkswap.wallet.getInfo();
    console.log('Wallet Info:', walletInfo);

    // Get wallet balance
    const balance = await darkswap.wallet.getBalance();
    console.log('Wallet Balance:', balance);

    // Get a deposit address for Bitcoin
    const btcAddress = await darkswap.wallet.getDepositAddress('BTC');
    console.log('BTC Deposit Address:', btcAddress);

    // Get transaction history
    const transactions = await darkswap.wallet.getTransactions();
    console.log('Transactions:', transactions);

    // Get UTXOs
    const utxos = await darkswap.wallet.getUtxos();
    console.log('UTXOs:', utxos);

    // Get fee estimates
    const feeEstimates = await darkswap.wallet.getFeeEstimates();
    console.log('Fee Estimates:');
    console.log('Fast:', feeEstimates.fast, 'sat/vB');
    console.log('Medium:', feeEstimates.medium, 'sat/vB');
    console.log('Slow:', feeEstimates.slow, 'sat/vB');

    // Add an address to the address book
    await darkswap.wallet.addAddressBookEntry({
      address: 'tb1q9h6tlfk5r7d39q9u8lxt9mneec3crt8g5jug4r',
      label: 'Test Address',
      asset: 'BTC',
    });
    console.log('Address added to address book');

    // Get address book
    const addressBook = await darkswap.wallet.getAddressBook();
    console.log('Address Book:', addressBook);

    // Encrypt the wallet
    await darkswap.wallet.encrypt('secure-password');
    console.log('Wallet encrypted');

    // Decrypt the wallet
    await darkswap.wallet.decrypt('secure-password');
    console.log('Wallet decrypted');

    // Get wallet backup
    const backup = await darkswap.wallet.getBackup();
    console.log('Wallet Backup (KEEP THIS SECURE):', backup);

    console.log('Wallet management operations completed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

## Running the Example

Save the file and run it with Node.js:

```bash
node wallet-management.js
```

## Next Steps

Now that you've learned the basics of wallet management with the DarkSwap SDK, you can:

- Integrate wallet management into your trading application
- Build a wallet interface for users
- Implement advanced transaction handling
- Create a multi-wallet management system

Check out the [SDK Guide](../sdk-guide.md) for more information on the DarkSwap SDK.

## Troubleshooting

### Wallet Creation Issues

If you're having trouble creating a wallet:

1. Make sure you're connected to the internet.
2. Check if you're using the correct network (TESTNET or MAINNET).
3. Ensure you have the latest version of the SDK.

### Transaction Issues

If transactions aren't being processed:

1. Check if you have sufficient funds.
2. Verify that the recipient address is valid.
3. Make sure the fee is sufficient.
4. Check the network status to ensure there are no delays.

### Security Considerations

When working with wallets:

1. Never store mnemonics or private keys in plain text.
2. Always encrypt sensitive information.
3. Use hardware wallets for large amounts.
4. Regularly back up your wallet.
5. Verify addresses before sending funds.

## Conclusion

In this tutorial, you learned how to use the DarkSwap SDK to manage wallets, including creating wallets, importing existing wallets, managing keys, and handling transactions. You now have the knowledge to build applications that securely manage cryptocurrency wallets.