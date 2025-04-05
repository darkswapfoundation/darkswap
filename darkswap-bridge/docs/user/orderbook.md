# DarkSwap Bridge Order Book Guide

This guide provides detailed information on using the order book functionality of the DarkSwap Bridge.

## Table of Contents

- [Overview](#overview)
- [Creating Orders](#creating-orders)
- [Viewing Orders](#viewing-orders)
- [Filtering and Sorting](#filtering-and-sorting)
- [Taking Orders](#taking-orders)
- [Cancelling Orders](#cancelling-orders)
- [Order Lifecycle](#order-lifecycle)
- [Order Types](#order-types)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The DarkSwap Bridge order book functionality allows you to:

- Create buy and sell orders
- View existing orders
- Filter and sort orders
- Take orders to initiate trades
- Cancel your own orders

The order book is implemented using a peer-to-peer (P2P) architecture, where orders are distributed across the network rather than being stored in a central server.

## Creating Orders

To create a new order:

1. Navigate to the **Order Book** page by clicking on "Order Book" in the navigation menu.
2. In the "Create Order" section, select the order type (Buy or Sell).
3. Enter the asset you want to sell in the "Sell Asset" field.
4. Enter the amount you want to sell in the "Sell Amount" field.
5. Enter the asset you want to buy in the "Buy Asset" field.
6. Enter the amount you want to buy in the "Buy Amount" field.
7. Click the "Create Order" button.

![Create Order](../images/create-order.png)

### Order Types

There are two types of orders:

- **Buy Order**: You want to buy one asset in exchange for another
- **Sell Order**: You want to sell one asset in exchange for another

For example, if you want to buy RUNE with BTC, you would create a buy order with:
- Sell Asset: BTC
- Sell Amount: The amount of BTC you're willing to spend
- Buy Asset: RUNE
- Buy Amount: The amount of RUNE you want to receive

### Price Calculation

The price of an order is calculated as the ratio of the buy amount to the sell amount. For example, if you're selling 0.01 BTC to buy 1000 RUNE, the price is:

```
Price = Buy Amount / Sell Amount = 1000 RUNE / 0.01 BTC = 100,000 RUNE/BTC
```

This means you're willing to pay 0.01 BTC for 1000 RUNE, or 1 BTC for 100,000 RUNE.

## Viewing Orders

The order book displays all orders from all connected peers. For each order, the following information is shown:

- **Type**: Whether it's a buy or sell order
- **Sell Asset**: The asset being sold
- **Sell Amount**: The amount being sold
- **Buy Asset**: The asset being bought
- **Buy Amount**: The amount being bought
- **Price**: The price (buy amount / sell amount)
- **Peer**: The peer who created the order
- **Time**: When the order was created
- **Actions**: Buttons to take or cancel the order

![Order Book](../images/order-book.png)

Buy orders are highlighted in green, and sell orders are highlighted in red.

## Filtering and Sorting

You can filter and sort the order book to find the orders you're interested in:

### Filtering

Use the "Filter" dropdown to filter orders by type:

- **All Orders**: Show all orders
- **Buy Orders**: Show only buy orders
- **Sell Orders**: Show only sell orders

### Sorting

Use the "Sort By" dropdown to sort orders by different criteria:

- **Time**: Sort by the time the order was created
- **Sell Amount**: Sort by the amount being sold
- **Buy Amount**: Sort by the amount being bought
- **Price**: Sort by the price (buy amount / sell amount)

Use the "Sort Order" dropdown to choose between ascending and descending order:

- **Ascending**: Sort from lowest to highest
- **Descending**: Sort from highest to lowest

## Taking Orders

To take an order and initiate a trade:

1. Find the order you want to take in the order book.
2. Click the "Take" button next to the order.

![Take Order](../images/take-order.png)

This will propose a trade to the peer who created the order. The peer will then have the option to accept or reject the trade.

### Partial Fills

Currently, the DarkSwap Bridge only supports taking the full amount of an order. Partial fills (taking only part of an order) are not supported.

## Cancelling Orders

To cancel an order:

1. Find the order you want to cancel in the order book.
2. Click the "Cancel" button next to the order.

![Cancel Order](../images/cancel-order.png)

You can only cancel orders that you created. If you try to cancel someone else's order, you will receive an error message.

## Order Lifecycle

Orders go through the following lifecycle:

1. **Created**: The order is created and distributed to connected peers
2. **Open**: The order is visible in the order book and can be taken by other peers
3. **Filled**: The order is taken by another peer and a trade is initiated
4. **Cancelled**: The order is cancelled by the creator

Orders remain in the order book until they are filled or cancelled. There is no automatic expiration.

## Order Types

### Market Orders

The DarkSwap Bridge currently only supports limit orders, where you specify the exact amount you want to sell and buy. Market orders (where you specify only the amount you want to sell or buy, and accept the best available price) are not supported.

### Limit Orders

When you create an order, you're creating a limit order. This means you're specifying the exact amount you want to sell and buy, and you're not willing to accept a worse price.

For example, if you create an order to sell 0.01 BTC for 1000 RUNE, you're saying that you want exactly 1000 RUNE for your 0.01 BTC, no more and no less.

## Best Practices

### Check the Price

Before creating or taking an order, make sure to check the price. The price is calculated as the ratio of the buy amount to the sell amount. Make sure the price is reasonable and in line with your expectations.

### Check the Peer

Before taking an order, check the peer who created it. If you've had good experiences with this peer in the past, you might be more willing to trade with them again.

### Start Small

If you're trading with a new peer, consider starting with a small amount to build trust before moving on to larger trades.

### Be Patient

The P2P nature of the order book means that it might take some time for your order to be seen by other peers, especially if there aren't many peers connected. Be patient and give it some time.

## Troubleshooting

### Order Not Appearing

If your order doesn't appear in the order book:

1. Make sure you're connected to the network.
2. Check that you have filled in all the required fields correctly.
3. Try refreshing the page.
4. Check the logs for any error messages.

### Can't Take an Order

If you're unable to take an order:

1. Make sure you're connected to the network.
2. Check that you have sufficient funds to fulfill the order.
3. Make sure the order is still open and hasn't been taken by someone else.
4. Check the logs for any error messages.

### Can't Cancel an Order

If you're unable to cancel an order:

1. Make sure you're connected to the network.
2. Check that you're the creator of the order. You can only cancel orders that you created.
3. Make sure the order is still open and hasn't been taken by someone else.
4. Check the logs for any error messages.

### Other Issues

If you encounter any other issues:

1. Check the logs for error messages.
2. Restart the bridge.
3. If the issue persists, report it to the DarkSwap development team.