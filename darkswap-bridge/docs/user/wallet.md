# DarkSwap Bridge Wallet Guide

This guide provides detailed information on using the wallet functionality of the DarkSwap Bridge.

## Table of Contents

- [Overview](#overview)
- [Creating a Wallet](#creating-a-wallet)
- [Opening an Existing Wallet](#opening-an-existing-wallet)
- [Viewing Wallet Balance](#viewing-wallet-balance)
- [Creating Addresses](#creating-addresses)
- [Sending Transactions](#sending-transactions)
- [Viewing Transaction History](#viewing-transaction-history)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Overview

The DarkSwap Bridge wallet functionality allows you to:

- Create and manage Bitcoin wallets
- Generate new addresses
- Send and receive Bitcoin
- View transaction history
- Monitor wallet balance

The wallet is implemented using the Bitcoin Development Kit (BDK), which provides a secure and reliable way to interact with the Bitcoin network.

## Creating a Wallet

To create a new wallet:

1. Navigate to the **Wallet** page by clicking on "Wallet" in the navigation menu.
2. If you're not already in create mode, click on "Create new wallet".
3. Enter a name for your wallet in the "Wallet Name" field.
4. Enter a strong passphrase in the "Passphrase" field. This passphrase will be used to encrypt your wallet data.
5. Click the "Create" button.

![Create Wallet](../images/create-wallet.png)

**Important**: Make sure to remember your wallet name and passphrase. If you forget them, you will not be able to access your wallet.

### Wallet Security

When you create a wallet, the following security measures are implemented:

- The wallet mnemonic (seed phrase) is encrypted using your passphrase
- The encrypted mnemonic is stored in the file system
- The passphrase is never stored anywhere
- All communication between the web interface and the wallet is encrypted

## Opening an Existing Wallet

To open an existing wallet:

1. Navigate to the **Wallet** page by clicking on "Wallet" in the navigation menu.
2. If you're not already in open mode, click on "Open existing wallet".
3. Enter the name of your wallet in the "Wallet Name" field.
4. Enter your passphrase in the "Passphrase" field.
5. Click the "Open" button.

![Open Wallet](../images/open-wallet.png)

If the wallet name and passphrase are correct, the wallet will be opened and you will see your wallet balance and addresses.

## Viewing Wallet Balance

Once you have opened a wallet, your balance will be displayed on the Wallet page. The balance is divided into two categories:

- **Confirmed**: Bitcoin that has been confirmed on the blockchain
- **Unconfirmed**: Bitcoin that has been received but not yet confirmed

![Wallet Balance](../images/wallet-balance.png)

The balance is automatically updated when new transactions are received or when existing transactions are confirmed.

## Creating Addresses

To create a new address:

1. Open your wallet as described above.
2. Click the "Create New Address" button.

![Create Address](../images/create-address.png)

A new address will be generated and added to the list of addresses. You can use this address to receive Bitcoin.

### Address Types

The DarkSwap Bridge supports the following address types:

- **Native SegWit (bech32)**: Addresses starting with "bc1q"
- **Nested SegWit (P2SH-P2WPKH)**: Addresses starting with "3"
- **Legacy (P2PKH)**: Addresses starting with "1"

By default, Native SegWit addresses are generated as they offer the lowest transaction fees.

## Sending Transactions

To send Bitcoin:

1. Open your wallet as described above.
2. In the "Send Transaction" section, enter the recipient's address in the "Recipient" field.
3. Enter the amount to send in satoshis in the "Amount (sats)" field.
4. Enter the fee rate in satoshis per virtual byte in the "Fee Rate (sat/vB)" field.
5. Click the "Send" button.

![Send Transaction](../images/send-transaction.png)

### Fee Rates

The fee rate determines how quickly your transaction will be confirmed. Higher fee rates result in faster confirmation times, but also higher transaction fees.

Here are some recommended fee rates:

- **High Priority**: 5-10 sat/vB (confirmation within 1-2 blocks)
- **Medium Priority**: 2-5 sat/vB (confirmation within 3-6 blocks)
- **Low Priority**: 1-2 sat/vB (confirmation within 6+ blocks)

You can check current recommended fee rates on websites like [mempool.space](https://mempool.space/).

## Viewing Transaction History

Your transaction history is displayed at the bottom of the Wallet page. For each transaction, the following information is shown:

- **Transaction ID**: The unique identifier of the transaction
- **Amount**: The amount of Bitcoin sent or received
- **Recipient**: The address that received the Bitcoin
- **Date**: The date and time when the transaction was created
- **Status**: The current status of the transaction (pending, confirmed, etc.)

![Transaction History](../images/transaction-history.png)

You can click on a transaction ID to view more details about the transaction.

## Security Considerations

When using the DarkSwap Bridge wallet, keep the following security considerations in mind:

1. **Passphrase Security**: Use a strong, unique passphrase for each wallet. Consider using a password manager to generate and store your passphrases.

2. **Backup**: The DarkSwap Bridge does not provide a way to export your wallet mnemonic. Make sure to keep a secure backup of your wallet data.

3. **Privacy**: Be aware that all transactions on the Bitcoin blockchain are public. Consider using privacy-enhancing techniques like coin control if privacy is a concern.

4. **Physical Security**: Ensure that your computer is secure and free from malware. Consider using a hardware wallet for large amounts of Bitcoin.

## Troubleshooting

### Wallet Won't Open

If you're having trouble opening your wallet:

1. Double-check that you're entering the correct wallet name and passphrase.
2. Make sure that the wallet file exists in the storage directory.
3. Check the logs for any error messages.

### Transaction Won't Send

If you're having trouble sending a transaction:

1. Make sure you have sufficient funds to cover the transaction amount and fee.
2. Check that the recipient address is valid.
3. Try increasing the fee rate if the transaction is stuck.
4. Check the logs for any error messages.

### Balance Is Incorrect

If your balance appears to be incorrect:

1. Make sure your wallet is fully synced with the blockchain.
2. Check if you have any unconfirmed transactions.
3. Try restarting the bridge.

### Other Issues

If you encounter any other issues:

1. Check the logs for error messages.
2. Restart the bridge.
3. If the issue persists, report it to the DarkSwap development team.