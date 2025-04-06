# DarkSwap User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
   - [Installation](#installation)
   - [Creating an Account](#creating-an-account)
   - [Connecting a Wallet](#connecting-a-wallet)
3. [Trading Guide](#trading-guide)
   - [Understanding the Interface](#understanding-the-interface)
   - [Creating Orders](#creating-orders)
   - [Taking Orders](#taking-orders)
   - [Managing Orders](#managing-orders)
   - [Viewing Trade History](#viewing-trade-history)
4. [Wallet Management](#wallet-management)
   - [Supported Wallet Types](#supported-wallet-types)
   - [Viewing Balances](#viewing-balances)
   - [Depositing Funds](#depositing-funds)
   - [Withdrawing Funds](#withdrawing-funds)
5. [Settings and Preferences](#settings-and-preferences)
   - [General Settings](#general-settings)
   - [Network Settings](#network-settings)
   - [Notification Settings](#notification-settings)
   - [Wallet Settings](#wallet-settings)
6. [Runes and Alkanes](#runes-and-alkanes)
   - [What are Runes?](#what-are-runes)
   - [What are Alkanes?](#what-are-alkanes)
   - [Trading Runes and Alkanes](#trading-runes-and-alkanes)
7. [Security Best Practices](#security-best-practices)
   - [Securing Your Wallet](#securing-your-wallet)
   - [Verifying Transactions](#verifying-transactions)
   - [Avoiding Scams](#avoiding-scams)
8. [Troubleshooting](#troubleshooting)
   - [Common Issues](#common-issues)
   - [Error Messages](#error-messages)
   - [Getting Support](#getting-support)

## Introduction

DarkSwap is a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes. It enables users to trade these assets without requiring a central server or authority, using WebRTC for browser-to-browser communication and circuit relay for NAT traversal.

This user guide will help you understand how to use DarkSwap effectively, from setting up your account and connecting your wallet to creating and taking orders, managing your trades, and configuring your settings.

## Getting Started

### Installation

DarkSwap is a web-based application, so there's no need to install any software. Simply visit [https://darkswap.io](https://darkswap.io) in your web browser to get started.

For the best experience, we recommend using one of the following browsers:

- Google Chrome (version 90 or later)
- Mozilla Firefox (version 88 or later)
- Microsoft Edge (version 90 or later)
- Safari (version 14 or later)

### Creating an Account

DarkSwap is a decentralized platform that doesn't require you to create an account. Instead, you'll connect your wallet to the platform to start trading.

### Connecting a Wallet

To use DarkSwap, you'll need to connect a compatible wallet. Follow these steps to connect your wallet:

1. Click the "Connect Wallet" button in the top-right corner of the page.
2. Select your wallet type from the list of available options.
3. Follow the prompts to connect your wallet.
4. Once connected, you'll see your wallet address and balance in the top-right corner of the page.

DarkSwap supports the following wallet types:

- Bitcoin wallets (via BDK)
- Hardware wallets (Ledger, Trezor)
- Browser wallets (MetaMask, Phantom)
- Mobile wallets (via QR code)

## Trading Guide

### Understanding the Interface

The DarkSwap trading interface consists of several key components:

- **Market Selector**: Located at the top of the page, this allows you to select the trading pair you want to trade.
- **Price Chart**: Displays the price history for the selected trading pair.
- **Orderbook**: Shows the current buy and sell orders for the selected trading pair.
- **Trade Form**: Allows you to create buy or sell orders.
- **Order History**: Shows your open orders and trade history.

### Creating Orders

To create a new order, follow these steps:

1. Select the trading pair you want to trade using the Market Selector.
2. In the Trade Form, select "Buy" or "Sell" depending on the type of order you want to create.
3. Enter the amount of the base asset you want to buy or sell.
4. Enter the price per unit in terms of the quote asset.
5. Review the total cost or proceeds of your order.
6. Click "Place Buy Order" or "Place Sell Order" to create your order.

Your order will be added to the orderbook and will be visible to other users. If your order matches an existing order, it will be executed immediately.

### Taking Orders

To take an existing order, follow these steps:

1. Browse the orderbook to find an order you want to take.
2. Click on the order to fill in the Trade Form with the order details.
3. Adjust the amount if you want to take only part of the order.
4. Click "Take Order" to execute the trade.

When you take an order, a peer-to-peer connection will be established between you and the order creator using WebRTC. The trade will be executed using Partially Signed Bitcoin Transactions (PSBTs) to ensure security and trustlessness.

### Managing Orders

You can view and manage your open orders in the Order History section. To cancel an order, follow these steps:

1. Find the order you want to cancel in the Order History section.
2. Click the "Cancel" button next to the order.
3. Confirm the cancellation when prompted.

Your order will be removed from the orderbook and will no longer be visible to other users.

### Viewing Trade History

You can view your trade history in the Order History section. This includes all trades you've participated in, whether as a maker (creating an order) or a taker (taking an order).

For each trade, you can see the following information:

- Trading pair
- Type (buy or sell)
- Amount
- Price
- Total
- Status
- Timestamp

Click on a trade to view more details, including the transaction ID and counterparty information.

## Wallet Management

### Supported Wallet Types

DarkSwap supports various wallet types, including:

- **Bitcoin Core Wallet**: Connect to a Bitcoin Core node running on your local machine or a remote server.
- **BDK Wallet**: Use the Bitcoin Development Kit wallet for a lightweight option.
- **Hardware Wallets**: Connect to Ledger or Trezor hardware wallets for enhanced security.
- **Browser Wallets**: Connect to browser-based wallets like MetaMask for Ethereum-based assets.
- **Mobile Wallets**: Connect to mobile wallets via QR code scanning.

### Viewing Balances

Once your wallet is connected, you can view your balances in the Wallet section. This shows the amount of each asset you hold, including Bitcoin, runes, and alkanes.

To view your balances, follow these steps:

1. Click on your wallet address in the top-right corner of the page.
2. Select "Wallet" from the dropdown menu.
3. View your balances in the Balances section.

### Depositing Funds

To deposit funds into your wallet, follow these steps:

1. Click on your wallet address in the top-right corner of the page.
2. Select "Wallet" from the dropdown menu.
3. Click the "Deposit" button next to the asset you want to deposit.
4. Follow the prompts to complete the deposit.

For Bitcoin deposits, you'll be shown a deposit address. Send Bitcoin to this address to fund your wallet.

For runes and alkanes, you'll need to follow the specific deposit instructions for each asset.

### Withdrawing Funds

To withdraw funds from your wallet, follow these steps:

1. Click on your wallet address in the top-right corner of the page.
2. Select "Wallet" from the dropdown menu.
3. Click the "Withdraw" button next to the asset you want to withdraw.
4. Enter the withdrawal address and amount.
5. Click "Withdraw" to initiate the withdrawal.
6. Confirm the withdrawal when prompted.

Withdrawals are processed on-chain and may take some time to complete depending on network congestion.

## Settings and Preferences

### General Settings

The General Settings section allows you to customize your DarkSwap experience. To access General Settings, follow these steps:

1. Click on your wallet address in the top-right corner of the page.
2. Select "Settings" from the dropdown menu.
3. Click on the "General" tab.

In the General Settings section, you can configure the following options:

- **Theme**: Choose between light and dark mode.
- **Auto Connect Wallet**: Enable or disable automatic wallet connection on page load.
- **Default Market**: Set your default trading pair.
- **Chart Timeframe**: Set your default chart timeframe.
- **Order Book Depth**: Set the number of orders to display in the orderbook.

### Network Settings

The Network Settings section allows you to configure your connection to the DarkSwap network. To access Network Settings, follow these steps:

1. Click on your wallet address in the top-right corner of the page.
2. Select "Settings" from the dropdown menu.
3. Click on the "Network" tab.

In the Network Settings section, you can configure the following options:

- **API URL**: Set the URL for the DarkSwap API.
- **WebSocket URL**: Set the URL for the DarkSwap WebSocket server.
- **Relay Servers**: Add or remove relay servers for NAT traversal.
- **Bootstrap Peers**: Add or remove bootstrap peers for the P2P network.

### Notification Settings

The Notification Settings section allows you to configure how you receive notifications. To access Notification Settings, follow these steps:

1. Click on your wallet address in the top-right corner of the page.
2. Select "Settings" from the dropdown menu.
3. Click on the "Notifications" tab.

In the Notification Settings section, you can configure the following options:

- **Order Created**: Enable or disable notifications when an order is created.
- **Order Cancelled**: Enable or disable notifications when an order is cancelled.
- **Order Filled**: Enable or disable notifications when an order is filled.
- **Trade Started**: Enable or disable notifications when a trade starts.
- **Trade Completed**: Enable or disable notifications when a trade completes.
- **Trade Failed**: Enable or disable notifications when a trade fails.
- **Market Updates**: Enable or disable notifications for market updates.
- **System Notifications**: Enable or disable system notifications.

### Wallet Settings

The Wallet Settings section allows you to configure your wallet connection. To access Wallet Settings, follow these steps:

1. Click on your wallet address in the top-right corner of the page.
2. Select "Settings" from the dropdown menu.
3. Click on the "Wallet" tab.

In the Wallet Settings section, you can view your wallet information and disconnect your wallet if needed.

## Runes and Alkanes

### What are Runes?

Runes are a type of digital asset built on the Bitcoin blockchain. They are created using the Runes protocol, which allows for the creation of fungible tokens on Bitcoin.

Runes have the following characteristics:

- **Fungibility**: Each rune of the same type is interchangeable with any other rune of the same type.
- **Divisibility**: Runes can be divided into smaller units, similar to how Bitcoin can be divided into satoshis.
- **Transferability**: Runes can be transferred between Bitcoin addresses.
- **Scarcity**: The supply of each rune type is fixed at creation.

### What are Alkanes?

Alkanes are another type of digital asset built on the Bitcoin blockchain. They are created using the Alkanes protocol, which is similar to the Runes protocol but with some key differences.

Alkanes have the following characteristics:

- **Non-fungibility**: Each alkane is unique and cannot be interchanged with any other alkane, even of the same type.
- **Indivisibility**: Alkanes cannot be divided into smaller units.
- **Transferability**: Alkanes can be transferred between Bitcoin addresses.
- **Uniqueness**: Each alkane has unique properties that distinguish it from other alkanes.

### Trading Runes and Alkanes

Trading runes and alkanes on DarkSwap is similar to trading Bitcoin. You can create buy or sell orders for runes and alkanes, and take existing orders from other users.

To trade runes or alkanes, follow these steps:

1. Select a trading pair that includes the rune or alkane you want to trade.
2. Create a buy or sell order as described in the [Creating Orders](#creating-orders) section.
3. Wait for your order to be matched, or take an existing order as described in the [Taking Orders](#taking-orders) section.

When trading runes or alkanes, make sure to verify the asset ID to ensure you're trading the correct asset. Rune IDs typically start with "RUNE:" followed by a unique identifier, while alkane IDs typically start with "ALKANE:" followed by a unique identifier.

## Security Best Practices

### Securing Your Wallet

To keep your assets safe, follow these security best practices:

- **Use a Hardware Wallet**: Hardware wallets provide the highest level of security by keeping your private keys offline.
- **Backup Your Wallet**: Make sure to backup your wallet's seed phrase or private keys in a secure location.
- **Use Strong Passwords**: If your wallet requires a password, use a strong, unique password and consider using a password manager.
- **Enable Two-Factor Authentication**: If your wallet supports it, enable two-factor authentication for an extra layer of security.
- **Keep Software Updated**: Keep your wallet software and operating system updated with the latest security patches.

### Verifying Transactions

Before confirming any transaction, make sure to verify the following:

- **Recipient Address**: Double-check the recipient address to ensure you're sending funds to the correct address.
- **Amount**: Verify the amount you're sending is correct.
- **Fee**: Check the transaction fee to ensure it's reasonable.
- **Asset**: Make sure you're sending the correct asset, especially when dealing with runes and alkanes.

### Avoiding Scams

To avoid scams and phishing attempts, follow these guidelines:

- **Verify URLs**: Always check that you're on the correct website (https://darkswap.io) before connecting your wallet.
- **Be Wary of Offers**: If an offer seems too good to be true, it probably is.
- **Don't Share Private Keys**: Never share your private keys or seed phrase with anyone, including DarkSwap support.
- **Use Official Channels**: Only download wallet software from official sources and only use links provided on the official DarkSwap website.

## Troubleshooting

### Common Issues

#### Wallet Connection Issues

If you're having trouble connecting your wallet, try the following:

1. Make sure your wallet is unlocked and accessible.
2. Refresh the page and try connecting again.
3. Clear your browser cache and cookies, then try again.
4. Try using a different browser.
5. Check if your wallet software needs to be updated.

#### Trade Execution Issues

If you're having trouble executing trades, try the following:

1. Make sure you have sufficient balance to cover the trade amount and any fees.
2. Check your network connection to ensure you're connected to the internet.
3. If using a hardware wallet, make sure it's connected and unlocked.
4. Try creating a smaller order to see if the issue is related to the order size.
5. Check if there are any pending transactions in your wallet that might be causing conflicts.

#### WebRTC Connection Issues

If you're having trouble establishing WebRTC connections with other users, try the following:

1. Make sure your browser supports WebRTC (most modern browsers do).
2. Check if your firewall or network configuration is blocking WebRTC connections.
3. Try using a different network connection.
4. Enable the use of relay servers in the Network Settings.

### Error Messages

Here are some common error messages you might encounter and how to resolve them:

#### "Insufficient Balance"

This error occurs when you don't have enough balance to cover the trade amount and any fees. Make sure you have sufficient balance before creating or taking an order.

#### "Wallet Not Connected"

This error occurs when you try to perform an action that requires a connected wallet, but your wallet is not connected. Connect your wallet and try again.

#### "Order Not Found"

This error occurs when you try to take an order that no longer exists. The order may have been filled or cancelled by another user. Refresh the orderbook and try again.

#### "Network Error"

This error occurs when there's an issue with your internet connection or the DarkSwap servers. Check your internet connection and try again later.

#### "WebRTC Connection Failed"

This error occurs when the WebRTC connection between you and the other user fails to establish. This could be due to network issues or incompatible browsers. Try using a different network connection or browser.

### Getting Support

If you're still experiencing issues after trying the troubleshooting steps, you can get support through the following channels:

- **Discord**: Join our Discord community at [https://discord.gg/darkswap](https://discord.gg/darkswap) for real-time support from the community and team members.
- **Email**: Contact our support team at support@darkswap.io for personalized assistance.
- **GitHub**: Report bugs or suggest features on our GitHub repository at [https://github.com/darkswap/darkswap](https://github.com/darkswap/darkswap).
- **Documentation**: Check our documentation at [https://docs.darkswap.io](https://docs.darkswap.io) for detailed guides and information.

When seeking support, please provide as much information as possible about the issue you're experiencing, including:

- A detailed description of the issue
- Steps to reproduce the issue
- Any error messages you're seeing
- Your browser and operating system
- Your wallet type and version