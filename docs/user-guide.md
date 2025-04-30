# DarkSwap User Guide

Welcome to DarkSwap, a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes. This guide will help you get started with DarkSwap and explain how to use its features.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Wallet Setup](#wallet-setup)
4. [Trading](#trading)
5. [Orders](#orders)
6. [Trades](#trades)
7. [Settings](#settings)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

## Introduction

DarkSwap is a decentralized peer-to-peer trading platform that enables users to trade Bitcoin, runes, and alkanes without requiring a central server or authority. It uses WebRTC for browser-to-browser communication and circuit relay for NAT traversal, ensuring a secure and private trading experience.

### Key Features

- **Decentralized**: No central server or authority is required for trading.
- **Peer-to-Peer**: Direct browser-to-browser communication using WebRTC.
- **Secure**: All trades are executed using Partially Signed Bitcoin Transactions (PSBTs).
- **Private**: No KYC or registration required.
- **Multi-Asset**: Support for Bitcoin, runes, and alkanes.

## Getting Started

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **Browser**: Chrome 80+, Firefox 75+, Safari 13+, or Edge 80+
- **Internet Connection**: Broadband connection with at least 1 Mbps upload and download speeds

### Installation

DarkSwap is a web application that runs in your browser. No installation is required. Simply visit [https://darkswap.io](https://darkswap.io) to get started.

### Creating an Account

1. Visit [https://darkswap.io](https://darkswap.io)
2. Click on the "Get Started" button
3. Choose "Create Account"
4. Enter your email address and password
5. Click "Create Account"
6. Verify your email address by clicking the link in the verification email

### Logging In

1. Visit [https://darkswap.io](https://darkswap.io)
2. Click on the "Login" button
3. Enter your email address and password
4. Click "Login"

## Wallet Setup

Before you can start trading on DarkSwap, you need to set up your wallet.

### Connecting an External Wallet

DarkSwap supports connecting to external wallets for Bitcoin, runes, and alkanes.

1. Click on the "Wallet" tab in the navigation menu
2. Click on "Connect Wallet"
3. Choose your wallet provider from the list
4. Follow the instructions to connect your wallet

### Creating a New Wallet

If you don't have a wallet, you can create one directly in DarkSwap.

1. Click on the "Wallet" tab in the navigation menu
2. Click on "Create Wallet"
3. Follow the instructions to create a new wallet
4. **Important**: Write down your recovery phrase and store it in a safe place. This is the only way to recover your wallet if you lose access to your account.

### Depositing Funds

1. Click on the "Wallet" tab in the navigation menu
2. Click on "Deposit"
3. Choose the asset you want to deposit (BTC, rune, or alkane)
4. Copy the deposit address or scan the QR code
5. Send the funds from your external wallet to the deposit address
6. Wait for the transaction to be confirmed (this may take a few minutes)

### Withdrawing Funds

1. Click on the "Wallet" tab in the navigation menu
2. Click on "Withdraw"
3. Choose the asset you want to withdraw (BTC, rune, or alkane)
4. Enter the withdrawal address and amount
5. Click "Withdraw"
6. Confirm the withdrawal by entering your password
7. Wait for the transaction to be confirmed (this may take a few minutes)

## Trading

### Market Overview

The "Trade" page provides an overview of the market, including:

- **Price Chart**: Shows the price history of the selected trading pair
- **Orderbook**: Shows the current buy and sell orders for the selected trading pair
- **Trade History**: Shows the recent trades for the selected trading pair
- **Trade Form**: Allows you to create buy and sell orders

### Selecting a Trading Pair

1. Click on the "Trade" tab in the navigation menu
2. Click on the trading pair selector (e.g., "BTC/ETH")
3. Choose the base asset (e.g., BTC) and quote asset (e.g., ETH) from the dropdown menus
4. Click "Select" to load the selected trading pair

### Creating a Buy Order

1. Click on the "Trade" tab in the navigation menu
2. Select the trading pair you want to trade
3. In the "Buy" section of the trade form:
   - Enter the price you want to pay per unit of the base asset
   - Enter the amount of the base asset you want to buy
   - The total cost in the quote asset will be calculated automatically
4. Click "Buy" to create the order
5. Confirm the order details and click "Confirm"
6. Your order will be added to the orderbook and broadcast to the network

### Creating a Sell Order

1. Click on the "Trade" tab in the navigation menu
2. Select the trading pair you want to trade
3. In the "Sell" section of the trade form:
   - Enter the price you want to receive per unit of the base asset
   - Enter the amount of the base asset you want to sell
   - The total amount you will receive in the quote asset will be calculated automatically
4. Click "Sell" to create the order
5. Confirm the order details and click "Confirm"
6. Your order will be added to the orderbook and broadcast to the network

### Market Orders

Market orders are executed immediately at the best available price.

1. Click on the "Trade" tab in the navigation menu
2. Select the trading pair you want to trade
3. In the "Buy" or "Sell" section of the trade form:
   - Click on "Market" to switch to market order mode
   - Enter the amount of the base asset you want to buy or sell
   - The total cost or amount you will receive will be calculated based on the current orderbook
4. Click "Buy" or "Sell" to create the order
5. Confirm the order details and click "Confirm"
6. Your order will be executed immediately if there are matching orders in the orderbook

### Limit Orders

Limit orders are executed only when the price reaches the specified level.

1. Click on the "Trade" tab in the navigation menu
2. Select the trading pair you want to trade
3. In the "Buy" or "Sell" section of the trade form:
   - Click on "Limit" to switch to limit order mode
   - Enter the price you want to pay or receive per unit of the base asset
   - Enter the amount of the base asset you want to buy or sell
   - The total cost or amount you will receive will be calculated automatically
4. Click "Buy" or "Sell" to create the order
5. Confirm the order details and click "Confirm"
6. Your order will be added to the orderbook and executed when the price reaches the specified level

## Orders

### Viewing Your Orders

1. Click on the "Orders" tab in the navigation menu
2. You will see a list of your open orders
3. Click on the "History" tab to view your order history

### Cancelling an Order

1. Click on the "Orders" tab in the navigation menu
2. Find the order you want to cancel in the list of open orders
3. Click on the "Cancel" button next to the order
4. Confirm the cancellation by clicking "Confirm"
5. The order will be removed from the orderbook and the network

### Modifying an Order

1. Click on the "Orders" tab in the navigation menu
2. Find the order you want to modify in the list of open orders
3. Click on the "Modify" button next to the order
4. Update the price and/or amount
5. Click "Update" to save the changes
6. Confirm the modification by clicking "Confirm"
7. The order will be updated in the orderbook and the network

## Trades

### Viewing Your Trades

1. Click on the "Trades" tab in the navigation menu
2. You will see a list of your recent trades
3. Click on a trade to view its details

### Trade Execution

When your order matches with another order, a trade is created. The trade execution process involves the following steps:

1. **Trade Creation**: When two orders match, a trade is created and both parties are notified.
2. **PSBT Creation**: A Partially Signed Bitcoin Transaction (PSBT) is created for the trade.
3. **PSBT Signing**: Both parties sign the PSBT with their private keys.
4. **Trade Execution**: The signed PSBT is broadcast to the Bitcoin network.
5. **Trade Confirmation**: The trade is confirmed once the transaction is included in a block.

### Trade Status

Trades can have the following statuses:

- **Pending**: The trade has been created but not yet executed.
- **Completed**: The trade has been executed and confirmed on the blockchain.
- **Cancelled**: The trade has been cancelled by one of the parties.
- **Failed**: The trade execution failed due to an error.

## Settings

### Profile Settings

1. Click on the "Settings" tab in the navigation menu
2. Click on the "Profile" tab
3. Update your profile information (name, email, etc.)
4. Click "Save" to save the changes

### Security Settings

1. Click on the "Settings" tab in the navigation menu
2. Click on the "Security" tab
3. Update your security settings (password, two-factor authentication, etc.)
4. Click "Save" to save the changes

### Notification Settings

1. Click on the "Settings" tab in the navigation menu
2. Click on the "Notifications" tab
3. Update your notification preferences
4. Click "Save" to save the changes

### Theme Settings

1. Click on the "Settings" tab in the navigation menu
2. Click on the "Theme" tab
3. Choose your preferred theme (light, dark, or system)
4. Click "Save" to save the changes

## Troubleshooting

### Connection Issues

If you are experiencing connection issues:

1. Check your internet connection
2. Ensure that your browser is up to date
3. Try refreshing the page
4. Clear your browser cache and cookies
5. Try using a different browser
6. Check if your firewall or antivirus is blocking WebRTC connections
7. Try using a different network (e.g., switch from Wi-Fi to mobile data)

### Order Issues

If you are experiencing issues with your orders:

1. Check if you have sufficient funds in your wallet
2. Ensure that the price and amount are valid
3. Check if the order has been cancelled or filled
4. Try creating a new order

### Trade Issues

If you are experiencing issues with your trades:

1. Check the trade status in the "Trades" tab
2. Ensure that both parties have signed the PSBT
3. Check if the transaction has been broadcast to the network
4. Wait for the transaction to be confirmed (this may take a few minutes)

### Wallet Issues

If you are experiencing issues with your wallet:

1. Check if your wallet is connected
2. Ensure that you have sufficient funds
3. Try reconnecting your wallet
4. Check if your wallet provider is experiencing issues

## FAQ

### General Questions

#### What is DarkSwap?

DarkSwap is a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes. It enables users to trade these assets without requiring a central server or authority, using WebRTC for browser-to-browser communication and circuit relay for NAT traversal.

#### How does DarkSwap work?

DarkSwap uses a peer-to-peer network to connect traders directly with each other. When you create an order, it is broadcast to the network and added to the orderbook. When another user creates a matching order, a trade is created and executed using Partially Signed Bitcoin Transactions (PSBTs).

#### Is DarkSwap secure?

Yes, DarkSwap is designed with security in mind. All trades are executed using Partially Signed Bitcoin Transactions (PSBTs), which ensure that funds are only transferred when both parties agree to the trade. Additionally, all communication between peers is encrypted using WebRTC's built-in encryption.

### Trading Questions

#### What assets can I trade on DarkSwap?

DarkSwap supports trading of Bitcoin, runes, and alkanes.

#### What are the trading fees?

DarkSwap does not charge any trading fees. However, you will need to pay network fees for Bitcoin transactions.

#### How long does it take to execute a trade?

Trade execution time depends on the Bitcoin network. Once both parties have signed the PSBT, the transaction is broadcast to the network and typically takes 10-60 minutes to be confirmed, depending on network congestion.

### Wallet Questions

#### What wallets are supported?

DarkSwap supports connecting to external wallets that support Bitcoin, runes, and alkanes. You can also create a new wallet directly in DarkSwap.

#### How do I recover my wallet?

If you created a wallet in DarkSwap, you can recover it using your recovery phrase. If you connected an external wallet, you will need to follow the recovery process for that wallet.

#### Are my funds safe?

Your funds are stored in your wallet, not on DarkSwap. DarkSwap only facilitates the trading process and does not have access to your private keys or funds.

### Technical Questions

#### What is WebRTC?

WebRTC (Web Real-Time Communication) is a technology that enables direct browser-to-browser communication without requiring a central server. DarkSwap uses WebRTC to connect traders directly with each other.

#### What is a circuit relay?

A circuit relay is a server that helps peers connect to each other when they are behind NATs or firewalls. DarkSwap uses circuit relays to ensure that peers can connect to each other even if they are behind NATs or firewalls.

#### What is a PSBT?

A PSBT (Partially Signed Bitcoin Transaction) is a Bitcoin transaction that has been partially signed by one or more parties. DarkSwap uses PSBTs to execute trades, ensuring that funds are only transferred when both parties agree to the trade.

#### What are runes and alkanes?

Runes and alkanes are Bitcoin-based tokens that can be created and traded on the Bitcoin network. Runes are fungible tokens, while alkanes are tokens with programmable conditions (predicates).

## Support

If you need help with DarkSwap, you can:

- Visit the [DarkSwap Documentation](https://docs.darkswap.io)
- Join the [DarkSwap Discord](https://discord.gg/darkswap)
- Contact support at [support@darkswap.io](mailto:support@darkswap.io)