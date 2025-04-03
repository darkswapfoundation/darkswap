# DarkSwap Trading Guide

This guide will walk you through the process of creating and accepting trade offers on the DarkSwap platform.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Creating a Trade Offer](#creating-a-trade-offer)
4. [Viewing Trade Offers](#viewing-trade-offers)
5. [Accepting a Trade Offer](#accepting-a-trade-offer)
6. [Cancelling a Trade Offer](#cancelling-a-trade-offer)
7. [Viewing Trade History](#viewing-trade-history)
8. [Troubleshooting](#troubleshooting)

## Introduction

DarkSwap is a decentralized trading platform that allows you to trade Bitcoin, runes, and alkanes directly with other users. The platform uses a peer-to-peer network to connect users and facilitate trades without the need for a central authority.

## Prerequisites

Before you can start trading on DarkSwap, you need to:

1. **Connect your wallet**: DarkSwap supports various Bitcoin wallets. You need to connect your wallet to the platform to be able to trade.

2. **Have assets to trade**: You need to have Bitcoin, runes, or alkanes in your wallet to be able to create trade offers.

3. **Be connected to the network**: DarkSwap uses a peer-to-peer network to connect users. You need to be connected to the network to be able to see and accept trade offers from other users.

## Creating a Trade Offer

To create a trade offer, follow these steps:

1. **Navigate to the Trade page**: Click on the "Trade" link in the navigation menu.

2. **Fill out the trade form**:
   - **You Send**: Select the asset you want to send and enter the amount.
   - **You Receive**: Select the asset you want to receive and enter the amount.
   - **Expiration**: Enter the expiration time for your trade offer in seconds. The default is 3600 seconds (1 hour).

3. **Click "Create Offer"**: Once you've filled out the form, click the "Create Offer" button to create your trade offer.

4. **Wait for confirmation**: The platform will create your trade offer and broadcast it to the network. You'll see a success notification when the offer is created.

### Example

Let's say you want to sell 0.01 BTC for 1000 RUNE:

1. Navigate to the Trade page.

2. Fill out the trade form:
   - **You Send**: Select "Bitcoin" and enter "0.01".
   - **You Receive**: Select "Rune", enter "rune-id" in the ID field, and enter "1000" in the amount field.
   - **Expiration**: Leave the default value of "3600" (1 hour).

3. Click "Create Offer".

4. Wait for the success notification.

### Notes

- The platform will check your balance before creating the trade offer. If you don't have enough of the asset you're trying to send, you'll see an error message.
- The expiration time is in seconds. For example, 3600 seconds is 1 hour, 86400 seconds is 1 day.
- Once your trade offer is created, it will be visible to other users on the network.

## Viewing Trade Offers

To view available trade offers, follow these steps:

1. **Navigate to the Trade page**: Click on the "Trade" link in the navigation menu.

2. **Scroll down to the Trade Offers section**: This section shows all available trade offers on the network.

3. **Filter and sort trade offers**: You can filter and sort trade offers by asset type, amount, and expiration time.

### Understanding the Trade Offers Table

The Trade Offers table shows the following information for each trade offer:

- **Maker**: The peer ID of the user who created the offer.
- **You Send**: The asset and amount you need to send to accept the offer.
- **You Receive**: The asset and amount you will receive if you accept the offer.
- **Expiration**: The time when the offer will expire.
- **Action**: Buttons to accept or cancel the offer.

### Notes

- Expired trade offers are shown with a greyed-out background and cannot be accepted.
- Your own trade offers are shown with a "Cancel" button instead of an "Accept" button.
- The platform automatically refreshes the trade offers list periodically, but you can also click the "Refresh" button to manually refresh the list.

## Accepting a Trade Offer

To accept a trade offer, follow these steps:

1. **Navigate to the Trade page**: Click on the "Trade" link in the navigation menu.

2. **Find the trade offer you want to accept**: Scroll through the Trade Offers section to find the offer you want to accept.

3. **Check your balance**: Make sure you have enough of the asset you need to send to accept the offer.

4. **Click "Accept"**: Click the "Accept" button next to the trade offer you want to accept.

5. **Confirm the trade**: A confirmation dialog will appear. Review the trade details and click "Confirm" to proceed.

6. **Wait for the trade to complete**: The platform will execute the trade and transfer the assets between the wallets. You'll see a success notification when the trade is completed.

### Example

Let's say you want to accept a trade offer where you send 1000 RUNE and receive 0.01 BTC:

1. Navigate to the Trade page.

2. Find the trade offer in the Trade Offers section.

3. Check that you have at least 1000 RUNE in your wallet.

4. Click "Accept" next to the trade offer.

5. Review the trade details in the confirmation dialog and click "Confirm".

6. Wait for the success notification.

### Notes

- The platform will check your balance before accepting the trade offer. If you don't have enough of the asset you're trying to send, you'll see an error message.
- Once you accept a trade offer, the trade is executed immediately. Make sure you want to proceed before confirming.
- If the trade offer expires before you accept it, you'll see an error message.

## Cancelling a Trade Offer

To cancel a trade offer you've created, follow these steps:

1. **Navigate to the Trade page**: Click on the "Trade" link in the navigation menu.

2. **Find your trade offer**: Scroll through the Trade Offers section to find your offer.

3. **Click "Cancel"**: Click the "Cancel" button next to your trade offer.

4. **Wait for confirmation**: The platform will cancel your trade offer and remove it from the network. You'll see a success notification when the offer is cancelled.

### Notes

- You can only cancel trade offers that you've created.
- Once you cancel a trade offer, it cannot be restored. You'll need to create a new offer if you want to trade again.
- If someone accepts your trade offer before you cancel it, the trade will be executed and cannot be cancelled.

## Viewing Trade History

To view your trade history, follow these steps:

1. **Navigate to the Trade page**: Click on the "Trade" link in the navigation menu.

2. **Scroll down to the Trade History section**: This section shows all your past trades.

### Understanding the Trade History Table

The Trade History table shows the following information for each trade:

- **Date**: The date and time when the trade was executed.
- **Type**: Whether you bought or sold the asset.
- **Asset**: The asset that was traded.
- **Amount**: The amount of the asset that was traded.
- **Price**: The price of the asset in the trade.
- **Status**: The status of the trade (completed, pending, or failed).

### Notes

- The trade history shows all trades you've participated in, whether you created the offer or accepted it.
- The platform automatically refreshes the trade history periodically, but you can also click the "Refresh" button to manually refresh the list.

## Troubleshooting

### Common Issues

#### "Insufficient balance" error when creating a trade offer

This error occurs when you don't have enough of the asset you're trying to send. Check your wallet balance and adjust the amount in your trade offer.

#### "Failed to create trade offer" error

This error can occur for several reasons:

- Network issues: Check your internet connection and try again.
- Server issues: The DarkSwap server might be experiencing issues. Wait a few minutes and try again.
- Wallet issues: Make sure your wallet is connected and has enough funds.

#### "Failed to accept trade offer" error

This error can occur for several reasons:

- The trade offer might have expired or been cancelled by the maker.
- You might not have enough of the asset you need to send to accept the offer.
- Network or server issues might be preventing the trade from being executed.

#### "WebSocket disconnected" warning

This warning indicates that your connection to the DarkSwap server has been lost. The platform will automatically try to reconnect. If the issue persists, check your internet connection and try refreshing the page.

### Getting Help

If you encounter issues that aren't covered in this guide, you can:

- Check the [FAQ](./faq.md) for answers to common questions.
- Join the DarkSwap community on [Discord](https://discord.gg/darkswap) or [Telegram](https://t.me/darkswap) to get help from other users.
- Contact the DarkSwap support team at support@darkswap.io.