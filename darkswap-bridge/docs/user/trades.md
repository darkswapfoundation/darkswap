# DarkSwap Bridge Trades Guide

This guide provides detailed information on using the trades functionality of the DarkSwap Bridge.

## Table of Contents

- [Overview](#overview)
- [Trade Lifecycle](#trade-lifecycle)
- [Viewing Trades](#viewing-trades)
- [Filtering Trades](#filtering-trades)
- [Trade Actions](#trade-actions)
  - [Accepting Trades](#accepting-trades)
  - [Rejecting Trades](#rejecting-trades)
  - [Executing Trades](#executing-trades)
  - [Confirming Trades](#confirming-trades)
  - [Cancelling Trades](#cancelling-trades)
- [Trade Details](#trade-details)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Overview

The DarkSwap Bridge trades functionality allows you to:

- View proposed, accepted, executing, confirmed, and cancelled trades
- Accept or reject trade proposals
- Execute trades by creating and signing transactions
- Confirm trades once they are executed
- Cancel trades at various stages of the trade lifecycle

Trades are created when a user takes an order from the order book. The trade then goes through a series of steps before it is completed.

## Trade Lifecycle

Trades go through the following lifecycle:

1. **Proposed**: A user has taken an order and proposed a trade to the order creator
2. **Accepted**: The order creator has accepted the trade proposal
3. **Rejected**: The order creator has rejected the trade proposal
4. **Executing**: The trade is being executed with a Bitcoin transaction
5. **Confirmed**: The trade has been confirmed and the transaction has been broadcast to the Bitcoin network
6. **Cancelled**: The trade has been cancelled by either party

![Trade Lifecycle](../images/trade-lifecycle.png)

## Viewing Trades

To view your trades:

1. Navigate to the **Trades** page by clicking on "Trades" in the navigation menu.
2. The page displays a list of all your trades, including their status, amount, counterparty, and time.

![Trades Page](../images/trades-page.png)

For each trade, the following information is shown:

- **ID**: The unique identifier of the trade
- **Amount**: The amount being traded
- **Initiator**: The peer who initiated the trade (took the order)
- **Counterparty**: The peer who created the order
- **Time**: When the trade was proposed
- **Status**: The current status of the trade (proposed, accepted, rejected, executing, confirmed, cancelled)
- **Actions**: Buttons to perform actions on the trade (accept, reject, execute, confirm, cancel, view details)

## Filtering Trades

You can filter trades by their status to find the ones you're interested in:

- **All**: Show all trades
- **Proposed**: Show only proposed trades
- **Accepted**: Show only accepted trades
- **Executing**: Show only executing trades
- **Confirmed**: Show only confirmed trades
- **Cancelled**: Show only cancelled trades

Click on the corresponding button to filter the trades.

![Filter Trades](../images/filter-trades.png)

## Trade Actions

Depending on the status of a trade and your role in it (initiator or counterparty), you can perform different actions on a trade.

### Accepting Trades

If you're the counterparty (order creator) and a trade is in the "Proposed" status, you can accept it:

1. Find the trade in the list.
2. Click the "Accept" button next to the trade.

![Accept Trade](../images/accept-trade.png)

This will change the trade status to "Accepted" and notify the initiator.

### Rejecting Trades

If you're the counterparty (order creator) and a trade is in the "Proposed" status, you can reject it:

1. Find the trade in the list.
2. Click the "Reject" button next to the trade.

![Reject Trade](../images/reject-trade.png)

This will change the trade status to "Rejected" and notify the initiator.

### Executing Trades

If you're the initiator (order taker) and a trade is in the "Accepted" status, you can execute it:

1. Find the trade in the list.
2. Click the "Execute" button next to the trade.

![Execute Trade](../images/execute-trade.png)

This will create a Bitcoin transaction for the trade, sign it, and send it to the counterparty. The trade status will change to "Executing".

### Confirming Trades

If you're the counterparty (order creator) and a trade is in the "Executing" status, you can confirm it:

1. Find the trade in the list.
2. Click the "Confirm" button next to the trade.

![Confirm Trade](../images/confirm-trade.png)

This will broadcast the transaction to the Bitcoin network and change the trade status to "Confirmed".

### Cancelling Trades

You can cancel a trade at various stages of the trade lifecycle:

1. Find the trade in the list.
2. Click the "Cancel" button next to the trade.

![Cancel Trade](../images/cancel-trade.png)

This will change the trade status to "Cancelled" and notify the other party.

You can cancel a trade in the following situations:

- If you're the initiator and the trade is in the "Proposed" status
- If you're the counterparty and the trade is in the "Proposed" or "Accepted" status
- If either party and the trade is in the "Executing" status for too long (timeout)

## Trade Details

To view the details of a trade:

1. Find the trade in the list.
2. Click the "Details" button next to the trade.

![Trade Details](../images/trade-details.png)

This will display a card with detailed information about the trade, including:

- **ID**: The unique identifier of the trade
- **Order ID**: The ID of the order that was taken
- **Amount**: The amount being traded
- **Initiator**: The peer who initiated the trade
- **Counterparty**: The peer who created the order
- **Time**: When the trade was proposed
- **Status**: The current status of the trade
- **Transaction ID**: The ID of the Bitcoin transaction (if the trade is in the "Executing" or "Confirmed" status)

## Security Considerations

When trading with DarkSwap Bridge, keep the following security considerations in mind:

### 1. Counterparty Risk

Since DarkSwap Bridge is a peer-to-peer system, there is always a risk that the counterparty might not fulfill their part of the trade. To mitigate this risk:

- Start with small trades to build trust
- Check if the counterparty has a good reputation
- Use the built-in trade protocol, which includes safeguards

### 2. Transaction Security

The DarkSwap Bridge uses Bitcoin transactions to execute trades. These transactions are secure, but keep in mind:

- Transactions are irreversible once confirmed
- Make sure you're trading with the correct amount
- Double-check all transaction details before confirming

### 3. Network Security

The DarkSwap Bridge uses a peer-to-peer network for communication. To ensure network security:

- Make sure you're connected to trusted peers
- Be cautious when connecting to unknown peers
- Keep your bridge software up to date

## Troubleshooting

### Trade Stuck in "Proposed" Status

If a trade is stuck in the "Proposed" status:

1. The counterparty might be offline or not have seen the proposal yet
2. The counterparty might be considering the proposal
3. There might be a network issue preventing the counterparty from receiving the proposal

You can:
- Wait for the counterparty to come online
- Cancel the trade and try again later
- Contact the counterparty through another channel

### Trade Stuck in "Accepted" Status

If a trade is stuck in the "Accepted" status:

1. The initiator might be offline or not have seen the acceptance yet
2. The initiator might be preparing the transaction
3. There might be a network issue preventing the initiator from receiving the acceptance

You can:
- Wait for the initiator to come online
- Cancel the trade and try again later
- Contact the initiator through another channel

### Trade Stuck in "Executing" Status

If a trade is stuck in the "Executing" status:

1. The counterparty might be offline or not have seen the transaction yet
2. The counterparty might be verifying the transaction
3. There might be a network issue preventing the counterparty from receiving the transaction

You can:
- Wait for the counterparty to come online
- Cancel the trade if it's been too long (timeout)
- Contact the counterparty through another channel

### Other Issues

If you encounter any other issues:

1. Check the logs for error messages
2. Restart the bridge
3. If the issue persists, report it to the DarkSwap development team