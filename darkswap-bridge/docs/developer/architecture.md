# DarkSwap Bridge Architecture

This document provides an overview of the DarkSwap Bridge architecture, explaining how the different components work together to enable communication between the wallet and networking components of DarkSwap.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
- [Communication Flow](#communication-flow)
- [Security](#security)
- [Persistence](#persistence)
- [Web Interface](#web-interface)
- [Backend Server](#backend-server)
- [Deployment](#deployment)

## Overview

The DarkSwap Bridge is designed to solve a dependency conflict between the wallet and networking components of DarkSwap. The wallet component requires `bip39` v1.0.1 (via `bdk`), which depends on `unicode-normalization` v0.1.9, while the networking component requires `libp2p`, which depends on `unicode-normalization` v0.1.17 or newer.

To resolve this conflict, the bridge uses inter-process communication (IPC) to enable communication between separate processes:

1. **Wallet Process**: Contains all Bitcoin wallet functionality with its dependencies
2. **Network Process**: Contains all P2P networking functionality with its dependencies
3. **Bridge**: Facilitates communication between these processes

## Components

The DarkSwap Bridge consists of the following components:

### 1. Bridge Core

The bridge core is responsible for facilitating communication between the wallet and networking components. It includes:

- **IPC Channels**: Channels for sending and receiving messages between processes
- **Message Types**: Definitions for the different types of messages that can be sent between processes
- **Bridge Client**: Client for sending messages to the bridge
- **Bridge Server**: Server for receiving messages from the bridge

### 2. Wallet Adapter

The wallet adapter is responsible for adapting the wallet component to the bridge. It includes:

- **Wallet Manager**: Manager for creating and managing wallets
- **Message Handler**: Handler for processing wallet-related messages
- **Response Generator**: Generator for creating responses to wallet-related messages

### 3. Network Adapter

The network adapter is responsible for adapting the networking component to the bridge. It includes:

- **P2P Manager**: Manager for creating and managing P2P connections
- **Message Handler**: Handler for processing network-related messages
- **Response Generator**: Generator for creating responses to network-related messages

### 4. Web Interface

The web interface provides a user-friendly way to interact with the bridge. It includes:

- **React Components**: UI components for the web interface
- **Context Providers**: Providers for managing state and communication with the backend server
- **Pages**: Pages for different sections of the web interface

### 5. Backend Server

The backend server acts as an intermediary between the web interface and the bridge. It includes:

- **API Routes**: Routes for handling API requests from the web interface
- **WebSocket Server**: Server for real-time communication with the web interface
- **Bridge Client**: Client for communicating with the bridge

## Communication Flow

The communication flow between the different components is as follows:

1. **Web Interface to Backend Server**: The web interface sends HTTP requests to the backend server's API routes and receives real-time updates via WebSocket.

2. **Backend Server to Bridge**: The backend server sends messages to the bridge via IPC and receives responses.

3. **Bridge to Wallet/Network Adapters**: The bridge forwards messages to the appropriate adapter (wallet or network) via IPC and receives responses.

4. **Wallet/Network Adapters to Components**: The adapters process the messages and interact with the wallet or networking components as needed.

5. **Components to Adapters**: The components send responses back to the adapters.

6. **Adapters to Bridge**: The adapters forward the responses back to the bridge via IPC.

7. **Bridge to Backend Server**: The bridge forwards the responses back to the backend server via IPC.

8. **Backend Server to Web Interface**: The backend server forwards the responses back to the web interface via HTTP or WebSocket.

## Security

The DarkSwap Bridge includes several security features:

### 1. Authentication

The bridge uses JWT (JSON Web Tokens) for authentication. When a user logs in to the web interface, the backend server verifies their credentials and issues a JWT token. This token is then included in all subsequent requests to the backend server.

### 2. Encryption

The bridge uses encryption to protect sensitive data, such as wallet mnemonics and passphrases. The encryption is implemented using a combination of symmetric and asymmetric encryption.

### 3. Process Isolation

By running the wallet and networking components in separate processes, the bridge provides process isolation, which enhances security by preventing one component from accessing the memory of another component.

## Persistence

The DarkSwap Bridge includes a persistence layer for storing data:

### 1. Wallet Data

Wallet data, such as mnemonics, passphrases, and addresses, is stored in encrypted form in the file system. The encryption key is derived from the user's passphrase.

### 2. Network Data

Network data, such as peer information and connection status, is stored in memory and is not persisted across restarts.

### 3. Order Book Data

Order book data, such as orders and trades, is stored in memory and is not persisted across restarts.

## Web Interface

The web interface is built with React and TypeScript, and uses Bootstrap for styling. It includes:

### 1. Context Providers

- **AuthContext**: Manages authentication state and user sessions
- **BridgeContext**: Manages communication with the bridge server
- **ThemeContext**: Manages theme preferences

### 2. UI Components

- **Navigation**: Main navigation bar with status indicators
- **ThemeToggle**: Toggle button for switching between light and dark mode
- **ProtectedRoute**: Route component that requires authentication

### 3. Pages

- **Dashboard**: Overview of the system status with charts and statistics
- **Wallet**: Wallet management interface for creating and managing wallets
- **Network**: Network management interface for connecting to peers
- **OrderBook**: Order book display and management
- **Trades**: Trade history and management
- **Settings**: System settings

## Backend Server

The backend server is built with Express.js and TypeScript, and uses Socket.IO for real-time communication. It includes:

### 1. API Routes

- **/api/auth**: Authentication endpoints
- **/api/bridge**: Bridge-related endpoints

### 2. WebSocket Events

- **wallet_status**: Updates on wallet status
- **network_status**: Updates on network status
- **wallet_balance**: Updates on wallet balance
- **connected_peers**: Updates on connected peers
- **orders**: Updates on orders
- **trades**: Updates on trades

### 3. Bridge Client

The bridge client is responsible for communicating with the bridge via IPC. It includes:

- **Message Sender**: Sends messages to the bridge
- **Message Receiver**: Receives messages from the bridge
- **Event Emitter**: Emits events for WebSocket communication

## Deployment

The DarkSwap Bridge can be deployed in several ways:

### 1. Docker Deployment

The bridge can be deployed using Docker Compose, which creates containers for the bridge, backend server, and web interface.

### 2. Systemd Deployment

The bridge can be deployed using systemd services, which run the bridge, backend server, and web interface as separate services.

### 3. Manual Deployment

The bridge can be deployed manually by running the bridge, backend server, and web interface separately.

### 4. Monitoring

The bridge includes monitoring using Prometheus and Grafana, which provide metrics and dashboards for monitoring the system.