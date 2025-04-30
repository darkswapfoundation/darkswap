# DarkSwap Bridge Network Guide

This guide provides detailed information on using the network functionality of the DarkSwap Bridge.

## Table of Contents

- [Overview](#overview)
- [Network Status](#network-status)
- [Connecting to Peers](#connecting-to-peers)
- [Disconnecting from Peers](#disconnecting-from-peers)
- [Sending Messages](#sending-messages)
- [Broadcasting Messages](#broadcasting-messages)
- [Viewing Received Messages](#viewing-received-messages)
- [Network Configuration](#network-configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The DarkSwap Bridge network functionality allows you to:

- Connect to other DarkSwap nodes
- Send and receive messages
- Broadcast messages to all connected peers
- View the status of your network connections

The network is implemented using a peer-to-peer (P2P) architecture with WebRTC for direct browser-to-browser communication and a circuit relay for NAT traversal.

## Network Status

The network status is displayed at the top of the Network page. It shows whether the network component is connected to the bridge.

![Network Status](../images/network-status.png)

The status can be one of the following:

- **Connected**: The network component is connected to the bridge
- **Disconnected**: The network component is not connected to the bridge

If the status is disconnected, you may need to restart the bridge or check the logs for error messages.

## Connecting to Peers

To connect to a peer:

1. Navigate to the **Network** page by clicking on "Network" in the navigation menu.
2. In the "Connect to Peer" section, enter the peer's address in the "Peer Address" field.
3. Click the "Connect" button.

![Connect to Peer](../images/connect-to-peer.png)

The peer address should be in the format `hostname:port` or `ip-address:port`. For example:
- `peer1.example.com:8333`
- `192.168.1.100:8333`

If the connection is successful, the peer will be added to the list of connected peers.

### Peer Discovery

DarkSwap Bridge includes automatic peer discovery mechanisms:

1. **Bootstrap Nodes**: The bridge connects to a set of well-known bootstrap nodes when it starts.
2. **DHT**: The bridge uses a Distributed Hash Table (DHT) to discover other nodes on the network.
3. **mDNS**: The bridge uses multicast DNS to discover other nodes on the local network.

You can disable automatic peer discovery in the settings if you prefer to manage your connections manually.

## Disconnecting from Peers

To disconnect from a peer:

1. Navigate to the **Network** page.
2. In the "Connected Peers" section, find the peer you want to disconnect from.
3. Click the "Disconnect" button next to the peer.

![Disconnect from Peer](../images/disconnect-from-peer.png)

The peer will be removed from the list of connected peers.

## Sending Messages

To send a message to a specific peer:

1. Navigate to the **Network** page.
2. In the "Send Message" section, enter the peer's address in the "Peer Address" field.
3. Enter your message in the "Message" field.
4. Click the "Send to Peer" button.

![Send Message](../images/send-message.png)

If the message is sent successfully, you will see a success message.

### Message Types

DarkSwap Bridge supports several types of messages:

1. **Text Messages**: Simple text messages for testing and debugging
2. **Order Messages**: Messages related to orders and trading
3. **Trade Messages**: Messages related to trade execution
4. **System Messages**: Messages related to system status and configuration

The message type is automatically determined based on the content of the message.

## Broadcasting Messages

To broadcast a message to all connected peers:

1. Navigate to the **Network** page.
2. In the "Send Message" section, enter your message in the "Message" field.
3. Click the "Broadcast to All Peers" button.

![Broadcast Message](../images/broadcast-message.png)

If the message is broadcast successfully, you will see a success message.

### Broadcast Limits

To prevent spam and network congestion, there are limits on how frequently you can broadcast messages:

- **Rate Limit**: You can broadcast a maximum of 10 messages per minute
- **Size Limit**: Each message can be a maximum of 1 MB in size

If you exceed these limits, your messages will be rejected.

## Viewing Received Messages

Received messages are displayed at the bottom of the Network page. For each message, the following information is shown:

- **From**: The address of the peer that sent the message
- **Message**: The content of the message
- **Time**: The date and time when the message was received

![Received Messages](../images/received-messages.png)

The messages are sorted by time, with the most recent messages at the top.

## Network Configuration

You can configure the network settings in the Settings page:

1. Navigate to the **Settings** page by clicking on "Settings" in the navigation menu.
2. In the "Network Settings" section, you can configure:
   - **Auto Connect**: Whether to automatically connect to peers when the bridge starts
   - **Bootstrap Nodes**: The list of bootstrap nodes to connect to
   - **DHT Enabled**: Whether to use the DHT for peer discovery
   - **mDNS Enabled**: Whether to use mDNS for peer discovery
   - **Circuit Relay**: Whether to use circuit relay for NAT traversal
   - **WebRTC Enabled**: Whether to use WebRTC for direct browser-to-browser communication

![Network Settings](../images/network-settings.png)

After changing the settings, click the "Save Settings" button to apply the changes.

## Troubleshooting

### Can't Connect to Peers

If you're having trouble connecting to peers:

1. Check that the peer address is correct and the peer is online.
2. Make sure your network allows outgoing connections to the peer's port.
3. If you're behind a NAT or firewall, make sure circuit relay is enabled.
4. Check the logs for any error messages.

### Messages Not Being Received

If your messages are not being received by peers:

1. Make sure you're connected to the peer.
2. Check that the message size is within the limits.
3. Make sure you're not exceeding the rate limits.
4. Check the logs for any error messages.

### Network Status Shows Disconnected

If the network status shows disconnected:

1. Make sure the bridge is running.
2. Try restarting the bridge.
3. Check the logs for any error messages.

### Other Issues

If you encounter any other issues:

1. Check the logs for error messages.
2. Restart the bridge.
3. If the issue persists, report it to the DarkSwap development team.