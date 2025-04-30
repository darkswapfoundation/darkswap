# DarkSwap User Guide - Part 4: Advanced Features

## Advanced Features

DarkSwap offers several advanced features for experienced users. This section will guide you through peer-to-peer trading, partially signed Bitcoin transactions (PSBTs), runes and alkanes, and WebRTC connections.

### Peer-to-Peer Trading

DarkSwap's peer-to-peer (P2P) trading feature allows you to trade directly with other users without relying on a central order book.

#### Finding P2P Trading Partners

There are several ways to find P2P trading partners on DarkSwap:

1. **Public Peer Discovery**: Navigate to the "P2P" section and click on "Find Peers" to see a list of available peers.
2. **Direct Connection**: If you know another user's peer ID, you can connect directly to them.
3. **Invite Links**: Users can generate invite links that allow others to connect directly to them.

#### Establishing a P2P Connection

To establish a P2P connection:

1. Navigate to the "P2P" section in the main navigation.
2. Click on "Connect to Peer".
3. Enter the peer ID or paste an invite link.
4. Click "Connect".
5. Wait for the connection to be established.
6. Once connected, you can chat and negotiate trades directly with the peer.

#### Negotiating P2P Trades

P2P trades are negotiated directly between the two parties:

1. Discuss the terms of the trade in the chat.
2. Once you've agreed on the terms, click "Create Trade".
3. Fill in the trade details (assets, amounts, etc.).
4. Click "Propose Trade" to send the trade proposal to your peer.
5. The peer can accept, reject, or counter the proposal.
6. If accepted, both parties need to sign the transaction.
7. Once signed by both parties, the transaction is broadcast to the network.

#### P2P Trade Security

P2P trades use the same security mechanisms as regular trades:

- Partially Signed Bitcoin Transactions (PSBTs) ensure that funds are only released when both parties have signed.
- Escrow services are available for high-value trades.
- Reputation systems help identify trustworthy trading partners.

### Partially Signed Bitcoin Transactions (PSBTs)

Partially Signed Bitcoin Transactions (PSBTs) are a key feature of DarkSwap that enable secure peer-to-peer trading.

#### What are PSBTs?

PSBTs are a standardized format for Bitcoin transactions that are not yet fully signed. They allow multiple parties to collaborate on a transaction before it is broadcast to the network.

In the context of DarkSwap, PSBTs are used to ensure that trades are atomic, meaning that either both parties receive their funds or neither does.

#### How PSBTs Work in DarkSwap

When a trade is created on DarkSwap:

1. A PSBT is created that includes inputs from both the buyer and the seller.
2. The buyer signs their inputs, indicating that they are willing to release their funds.
3. The seller signs their inputs, indicating that they are willing to release their funds.
4. Once both parties have signed, the transaction is complete and can be broadcast to the network.

If either party fails to sign, the transaction cannot be completed, and no funds are transferred.

#### Signing PSBTs

To sign a PSBT:

1. Navigate to the "Trades" section.
2. Find the trade that requires your signature.
3. Click on "Sign Transaction".
4. Review the transaction details carefully.
5. Enter your wallet password or use your hardware wallet to sign.
6. Click "Sign" to complete the process.

#### Verifying PSBTs

Before signing a PSBT, you should verify its contents:

1. Click on "View Transaction Details" to see the full PSBT.
2. Verify that the inputs and outputs match what you agreed to.
3. Check that the fee is reasonable.
4. If anything looks suspicious, do not sign the transaction.

### Runes and Alkanes

DarkSwap supports trading of Bitcoin, runes, and alkanes. This section explains what runes and alkanes are and how to trade them on DarkSwap.

#### What are Runes?

Runes are a type of digital asset that exists on the Bitcoin blockchain. They are created and transferred using the Runes protocol, which allows for the creation of fungible tokens on Bitcoin.

Key characteristics of runes:

- They are native to the Bitcoin blockchain.
- They are fungible, meaning each rune of a particular type is identical to every other rune of the same type.
- They can represent various assets, such as currencies, commodities, or utility tokens.

#### What are Alkanes?

Alkanes are another type of digital asset on the Bitcoin blockchain, created using the Alkanes protocol. They are similar to runes but with some key differences.

Key characteristics of alkanes:

- They are also native to the Bitcoin blockchain.
- They use a different protocol than runes, with some technical differences.
- They can also represent various assets.

#### Trading Runes and Alkanes

Trading runes and alkanes on DarkSwap is similar to trading Bitcoin:

1. Navigate to the "Trade" section.
2. Select the rune or alkane you want to trade from the asset selector.
3. Create buy or sell orders as you would with Bitcoin.
4. When a trade is matched, the runes or alkanes are transferred using a PSBT.

#### Depositing and Withdrawing Runes and Alkanes

To deposit runes or alkanes:

1. Navigate to the "Wallet" section.
2. Click on the "Deposit" tab.
3. Select the rune or alkane you want to deposit.
4. Send the runes or alkanes to the provided address.

To withdraw runes or alkanes:

1. Navigate to the "Wallet" section.
2. Click on the "Withdraw" tab.
3. Select the rune or alkane you want to withdraw.
4. Enter the withdrawal address and amount.
5. Click "Withdraw" to initiate the withdrawal.

### WebRTC Connections

DarkSwap uses WebRTC (Web Real-Time Communication) for peer-to-peer connections. This section explains how WebRTC works in DarkSwap and how to troubleshoot connection issues.

#### What is WebRTC?

WebRTC is a technology that enables real-time communication directly between browsers without requiring an intermediary server. In DarkSwap, WebRTC is used for:

- Direct peer-to-peer trading
- Decentralized order book distribution
- Real-time chat between users

#### How WebRTC Works in DarkSwap

When you connect to another peer on DarkSwap:

1. A WebRTC connection is established using a signaling server.
2. Once the connection is established, all communication happens directly between the peers.
3. The connection is encrypted end-to-end, ensuring privacy.
4. If the direct connection fails (e.g., due to NAT or firewalls), a relay server is used as a fallback.

#### WebRTC Connection Status

You can check the status of your WebRTC connections in the "Network" section:

1. Navigate to the "Network" section in the main navigation.
2. You'll see a list of all your active connections.
3. For each connection, you can see:
   - The peer ID
   - The connection status
   - The connection type (direct or relayed)
   - The data transfer rate

#### Troubleshooting WebRTC Connections

If you're having issues with WebRTC connections:

1. Check your internet connection.
2. Make sure your browser supports WebRTC (most modern browsers do).
3. Check if your firewall is blocking WebRTC connections.
4. Try using a different network (some corporate networks block WebRTC).
5. If all else fails, DarkSwap will automatically fall back to using a relay server.

#### WebRTC Privacy Considerations

WebRTC connections can potentially reveal your IP address to peers. If privacy is a concern:

1. Navigate to the "Settings" section.
2. Click on the "Privacy" tab.
3. Enable "Always use relay servers" to prevent direct connections.
4. Note that using relay servers may result in higher latency.