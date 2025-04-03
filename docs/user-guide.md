# DarkSwap User Guide

Welcome to DarkSwap, the decentralized trading platform for Bitcoin, runes, and alkanes. This guide will help you get started with DarkSwap and explain how to use its features.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Connecting a Wallet](#connecting-a-wallet)
  - [User Interface Overview](#user-interface-overview)
- [Trading](#trading)
  - [Creating Orders](#creating-orders)
  - [Taking Orders](#taking-orders)
  - [Managing Orders](#managing-orders)
  - [Trade History](#trade-history)
- [Wallet Management](#wallet-management)
  - [Viewing Balances](#viewing-balances)
  - [Sending Assets](#sending-assets)
  - [Receiving Assets](#receiving-assets)
- [Runes and Alkanes](#runes-and-alkanes)
  - [Understanding Runes](#understanding-runes)
  - [Understanding Alkanes](#understanding-alkanes)
  - [Trading Runes and Alkanes](#trading-runes-and-alkanes)
- [Advanced Features](#advanced-features)
  - [Predicate Alkanes](#predicate-alkanes)
  - [Market Analysis](#market-analysis)
  - [Notifications](#notifications)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Getting Help](#getting-help)
- [Security Best Practices](#security-best-practices)
  - [Protecting Your Wallet](#protecting-your-wallet)
  - [Verifying Transactions](#verifying-transactions)
  - [Avoiding Scams](#avoiding-scams)

## Introduction

DarkSwap is a decentralized trading platform that allows you to trade Bitcoin, runes, and alkanes directly with other users without the need for intermediaries. It uses a peer-to-peer network to connect traders and execute trades securely and efficiently.

Key features of DarkSwap include:

- **Decentralized Trading**: Trade directly with other users without intermediaries.
- **Bitcoin, Runes, and Alkanes Support**: Trade a variety of assets on the Bitcoin network.
- **Secure Transactions**: All trades are executed using Partially Signed Bitcoin Transactions (PSBTs) for security.
- **Real-Time Updates**: Receive real-time updates on orders, trades, and market data.
- **User-Friendly Interface**: Easy-to-use interface for creating and taking orders.

## Getting Started

### Installation

#### Desktop Application

1. Download the DarkSwap desktop application from the [official website](https://darkswap.io/download).
2. Run the installer and follow the on-screen instructions.
3. Launch the DarkSwap application.

#### Web Application

1. Visit the [DarkSwap web application](https://app.darkswap.io) in your web browser.
2. The web application works best with Chrome, Firefox, Safari, or Edge.

### Connecting a Wallet

To use DarkSwap, you need to connect a Bitcoin wallet. DarkSwap supports various wallet types:

#### Simple Wallet

1. Click on the "Connect Wallet" button in the top-right corner of the application.
2. Select "Simple Wallet" from the dropdown menu.
3. Enter your private key or seed phrase.
4. Click "Connect" to connect your wallet.

> **Warning**: Only use the Simple Wallet option for testing or with small amounts. For better security, use a hardware wallet or a wallet with BIP39 support.

#### Hardware Wallet

1. Click on the "Connect Wallet" button in the top-right corner of the application.
2. Select your hardware wallet type (e.g., Ledger, Trezor) from the dropdown menu.
3. Connect your hardware wallet to your computer and follow the on-screen instructions.
4. Approve the connection on your hardware wallet.

#### BIP39 Wallet

1. Click on the "Connect Wallet" button in the top-right corner of the application.
2. Select "BIP39 Wallet" from the dropdown menu.
3. Enter your seed phrase.
4. Select the derivation path.
5. Click "Connect" to connect your wallet.

### User Interface Overview

The DarkSwap user interface is divided into several sections:

#### Navigation

The navigation menu is located on the left side of the application and provides access to the main sections:

- **Home**: Overview of the platform and recent activity.
- **Trade**: Create and take orders.
- **Orders**: View and manage your orders.
- **Wallet**: View your wallet balances and transaction history.
- **Market**: View market data and price charts.
- **Settings**: Configure application settings.

#### Header

The header is located at the top of the application and provides access to:

- **Wallet Connection**: Connect and disconnect your wallet.
- **Notifications**: View notifications about orders, trades, and other events.
- **Theme Toggle**: Switch between light and dark themes.
- **User Menu**: Access user-specific options.

#### Main Content Area

The main content area displays the content of the selected section.

#### Footer

The footer is located at the bottom of the application and provides:

- **Links**: Links to important resources.
- **Version**: The current version of the application.
- **Copyright**: Copyright information.

## Trading

### Creating Orders

To create a new order:

1. Navigate to the "Trade" section using the navigation menu.
2. Select the trading pair (e.g., BTC/RUNE:123) from the dropdown menu.
3. Choose the order type (buy or sell).
4. Enter the amount and price.
5. Set the expiry time for the order.
6. Click "Create Order" to submit the order.

#### Order Types

DarkSwap supports the following order types:

- **Buy**: Create an order to buy an asset.
- **Sell**: Create an order to sell an asset.

#### Order Parameters

When creating an order, you need to specify the following parameters:

- **Base Asset**: The asset you want to buy or sell (e.g., BTC).
- **Quote Asset**: The asset you want to use for pricing (e.g., RUNE:123).
- **Side**: Whether you want to buy or sell the base asset.
- **Amount**: The amount of the base asset you want to buy or sell.
- **Price**: The price of the base asset in terms of the quote asset.
- **Expiry**: The time after which the order will expire if not filled.

### Taking Orders

To take an existing order:

1. Navigate to the "Orders" section using the navigation menu.
2. Browse the list of open orders or filter by trading pair and side.
3. Click on an order to view its details.
4. Enter the amount you want to take (can be less than the full order amount).
5. Click "Take Order" to execute the trade.

#### Partial Fills

DarkSwap supports partial fills, which means you can take only a portion of an order. For example, if someone is selling 1 BTC, you can choose to buy only 0.5 BTC.

### Managing Orders

To manage your orders:

1. Navigate to the "Orders" section using the navigation menu.
2. Click on the "My Orders" tab to view your orders.
3. Filter your orders by status (open, filled, canceled).
4. Click on an order to view its details.
5. Click "Cancel" to cancel an open order.

#### Order Status

Orders in DarkSwap can have the following statuses:

- **Open**: The order is active and can be taken by other users.
- **Filled**: The order has been completely filled.
- **Partially Filled**: The order has been partially filled and is still open for the remaining amount.
- **Canceled**: The order has been canceled and is no longer active.
- **Expired**: The order has expired and is no longer active.

### Trade History

To view your trade history:

1. Navigate to the "Orders" section using the navigation menu.
2. Click on the "Trade History" tab to view your completed trades.
3. Filter your trades by trading pair and date range.
4. Click on a trade to view its details.

#### Trade Details

The trade details page shows the following information:

- **Trade ID**: The unique identifier for the trade.
- **Order ID**: The ID of the order that was taken.
- **Trading Pair**: The base and quote assets involved in the trade.
- **Side**: Whether you bought or sold the base asset.
- **Amount**: The amount of the base asset that was traded.
- **Price**: The price at which the trade was executed.
- **Total**: The total value of the trade in the quote asset.
- **Fee**: The fee paid for the trade.
- **Date**: The date and time when the trade was executed.
- **Status**: The status of the trade (completed, pending, failed).
- **Transaction ID**: The ID of the Bitcoin transaction that executed the trade.

## Wallet Management

### Viewing Balances

To view your wallet balances:

1. Navigate to the "Wallet" section using the navigation menu.
2. The main page shows your Bitcoin balance and a list of your runes and alkanes.
3. Click on an asset to view its details.

#### Asset Details

The asset details page shows the following information:

- **Asset Name**: The name of the asset.
- **Asset Symbol**: The symbol of the asset.
- **Balance**: Your current balance of the asset.
- **Value**: The estimated value of your balance in USD.
- **Transaction History**: A list of transactions involving the asset.

### Sending Assets

To send assets to another address:

1. Navigate to the "Wallet" section using the navigation menu.
2. Click on the asset you want to send.
3. Click the "Send" button.
4. Enter the recipient's address.
5. Enter the amount you want to send.
6. Click "Review" to review the transaction details.
7. Click "Send" to confirm and send the transaction.

#### Transaction Fees

When sending assets, you need to pay a transaction fee in Bitcoin. The fee is calculated based on the current network conditions and the size of the transaction.

### Receiving Assets

To receive assets:

1. Navigate to the "Wallet" section using the navigation menu.
2. Click on the asset you want to receive.
3. Click the "Receive" button.
4. Your wallet address will be displayed along with a QR code.
5. Share this address with the sender.

#### Multiple Addresses

For enhanced privacy, DarkSwap can generate a new address for each transaction. To generate a new address:

1. Navigate to the "Wallet" section using the navigation menu.
2. Click on the asset you want to receive.
3. Click the "Receive" button.
4. Click "Generate New Address" to create a new receiving address.

## Runes and Alkanes

### Understanding Runes

Runes are digital assets on the Bitcoin network that represent various types of tokens. They are created using the Runes protocol, which allows for the creation and transfer of tokens on the Bitcoin blockchain.

Key characteristics of runes:

- **Fungible**: Runes are fungible, meaning each unit is interchangeable with another unit of the same rune.
- **Divisible**: Runes can be divided into smaller units, similar to Bitcoin.
- **Transferable**: Runes can be transferred between Bitcoin addresses.
- **Limited Supply**: Each rune has a fixed supply defined at creation.

### Understanding Alkanes

Alkanes are a special type of rune that includes additional logic in the form of predicates. Predicates are conditions that must be satisfied for the alkane to be transferred.

Key characteristics of alkanes:

- **Predicate-Based**: Alkanes include predicates that define conditions for transfers.
- **Programmable**: The predicates can be programmed to implement various types of logic.
- **Conditional Transfers**: Transfers of alkanes are only valid if the predicates are satisfied.
- **Complex Logic**: Alkanes can implement complex logic for transfers, such as time locks, price conditions, and more.

### Trading Runes and Alkanes

Trading runes and alkanes on DarkSwap is similar to trading Bitcoin, with a few additional considerations:

1. **Asset Selection**: When creating or taking an order, make sure to select the correct rune or alkane by checking its ID.
2. **Predicate Verification**: When trading alkanes, make sure to verify the predicates to ensure they match your expectations.
3. **Liquidity**: Some runes and alkanes may have limited liquidity, which can affect the price and ease of trading.

## Advanced Features

### Predicate Alkanes

Predicate alkanes are alkanes with specific predicates that implement advanced functionality. DarkSwap supports various types of predicate alkanes:

#### Equality Predicate Alkanes

Equality predicate alkanes can only be transferred if a specified condition is equal to a specified value. For example, an equality predicate alkane might require that the price of Bitcoin is equal to or greater than a specified value.

#### Range Predicate Alkanes

Range predicate alkanes can only be transferred if a specified condition falls within a specified range. For example, a range predicate alkane might require that the price of Bitcoin is between two specified values.

#### Time Lock Predicate Alkanes

Time lock predicate alkanes can only be transferred after a specified time. For example, a time lock predicate alkane might require that the current time is after a specified date.

#### Composite Predicate Alkanes

Composite predicate alkanes combine multiple predicates using logical operators (AND, OR, NOT). For example, a composite predicate alkane might require that the price of Bitcoin is above a specified value AND the current time is after a specified date.

### Market Analysis

DarkSwap provides tools for market analysis to help you make informed trading decisions:

#### Price Charts

To view price charts:

1. Navigate to the "Market" section using the navigation menu.
2. Select the trading pair from the dropdown menu.
3. Choose the time period (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w).
4. The chart will display the price history for the selected trading pair and time period.

#### Order Book

To view the order book:

1. Navigate to the "Trade" section using the navigation menu.
2. Select the trading pair from the dropdown menu.
3. The order book will display the current buy and sell orders for the selected trading pair.

#### Market Statistics

To view market statistics:

1. Navigate to the "Market" section using the navigation menu.
2. Select the trading pair from the dropdown menu.
3. The market statistics will display information such as:
   - Last Price: The price of the most recent trade.
   - 24h High: The highest price in the last 24 hours.
   - 24h Low: The lowest price in the last 24 hours.
   - 24h Volume: The trading volume in the last 24 hours.
   - 24h Change: The price change in the last 24 hours.

### Notifications

DarkSwap provides notifications to keep you informed about important events:

#### Types of Notifications

- **Order Created**: Notifies you when your order is created.
- **Order Filled**: Notifies you when your order is filled.
- **Order Canceled**: Notifies you when your order is canceled.
- **Order Expired**: Notifies you when your order expires.
- **Trade Started**: Notifies you when a trade is initiated.
- **Trade Completed**: Notifies you when a trade is completed.
- **Trade Failed**: Notifies you when a trade fails.
- **Wallet Connected**: Notifies you when your wallet is connected.
- **Wallet Disconnected**: Notifies you when your wallet is disconnected.
- **Network Status**: Notifies you about changes in the network status.

#### Notification Settings

To configure notification settings:

1. Navigate to the "Settings" section using the navigation menu.
2. Click on the "Notifications" tab.
3. Enable or disable specific types of notifications.
4. Configure notification delivery methods (in-app, email, browser).

## Troubleshooting

### Common Issues

#### Wallet Connection Issues

If you're having trouble connecting your wallet:

1. Make sure you're using a supported wallet type.
2. Check that your wallet is properly set up and has funds.
3. Try disconnecting and reconnecting your wallet.
4. Restart the DarkSwap application.

#### Order Creation Issues

If you're having trouble creating orders:

1. Make sure your wallet is connected and has sufficient funds.
2. Check that you've entered valid values for amount and price.
3. Ensure that the expiry time is in the future.
4. Try creating the order again with different parameters.

#### Trade Execution Issues

If you're having trouble executing trades:

1. Make sure your wallet is connected and has sufficient funds.
2. Check that the order you're trying to take is still available.
3. Ensure that you've entered a valid amount to take.
4. Try taking the order again with a different amount.

#### Network Connectivity Issues

If you're having trouble connecting to the DarkSwap network:

1. Check your internet connection.
2. Make sure your firewall or antivirus software is not blocking the DarkSwap application.
3. Try restarting the DarkSwap application.
4. Check the DarkSwap status page for any known issues.

### Getting Help

If you're still having issues, you can get help from the following resources:

- **Documentation**: Check the [DarkSwap documentation](https://docs.darkswap.io) for more information.
- **FAQ**: Check the [Frequently Asked Questions](https://darkswap.io/faq) for answers to common questions.
- **Support**: Contact [DarkSwap support](https://darkswap.io/support) for assistance.
- **Community**: Join the [DarkSwap community](https://discord.gg/darkswap) to get help from other users.

## Security Best Practices

### Protecting Your Wallet

To protect your wallet and funds:

1. **Use a Hardware Wallet**: For maximum security, use a hardware wallet like Ledger or Trezor.
2. **Keep Your Private Keys Safe**: Never share your private keys or seed phrases with anyone.
3. **Use Strong Passwords**: Use strong, unique passwords for your wallet and DarkSwap account.
4. **Enable Two-Factor Authentication**: If available, enable two-factor authentication for your wallet and DarkSwap account.
5. **Keep Software Updated**: Keep your wallet software and the DarkSwap application updated to the latest version.

### Verifying Transactions

Before confirming any transaction:

1. **Check the Recipient Address**: Make sure the recipient address is correct.
2. **Verify the Amount**: Make sure the amount is correct.
3. **Check the Fee**: Make sure the fee is reasonable.
4. **Confirm on Hardware Wallet**: If using a hardware wallet, verify the transaction details on the device before confirming.

### Avoiding Scams

To avoid scams:

1. **Verify URLs**: Always make sure you're on the official DarkSwap website or using the official DarkSwap application.
2. **Be Wary of Phishing**: Be cautious of emails, messages, or websites asking for your private keys or seed phrases.
3. **Check Order Details**: Before taking an order, carefully check the details to ensure they match your expectations.
4. **Research Assets**: Before trading a new rune or alkane, research it to ensure it's legitimate.
5. **Start Small**: When trying a new feature or trading a new asset, start with a small amount to minimize risk.

## Conclusion

This guide has covered the basics of using DarkSwap for trading Bitcoin, runes, and alkanes. As you become more familiar with the platform, you'll discover additional features and capabilities that can enhance your trading experience.

Remember to always prioritize security and do your own research before trading. If you have any questions or need assistance, don't hesitate to reach out to the DarkSwap community or support team.

Happy trading!