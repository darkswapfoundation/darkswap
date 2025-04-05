# Getting Started with DarkSwap Bridge

This guide will help you get started with the DarkSwap Bridge, a component that enables communication between the wallet and networking components of DarkSwap.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Bridge](#running-the-bridge)
- [Using the Web Interface](#using-the-web-interface)
- [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

Before installing DarkSwap Bridge, make sure you have the following prerequisites installed:

- **Rust** (1.68 or later)
- **Node.js** (18.x or later)
- **npm** (9.x or later)
- **Docker** (optional, for containerized deployment)

### Installation Methods

#### Method 1: Direct Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/darkswap/darkswap-bridge.git
   cd darkswap-bridge
   ```

2. Build the Rust components:
   ```bash
   cargo build --release
   ```

3. Install the web interface dependencies:
   ```bash
   cd web
   npm install
   cd ..
   ```

4. Install the server dependencies:
   ```bash
   cd server
   npm install
   cd ..
   ```

#### Method 2: Docker Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/darkswap/darkswap-bridge.git
   cd darkswap-bridge
   ```

2. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Configuration

### Bridge Configuration

The bridge configuration is stored in the `.env` file in the server directory. You can create this file by copying the example:

```bash
cp server/.env.example server/.env
```

Edit the `.env` file to configure the following settings:

- `PORT`: The port for the server (default: 3001)
- `NODE_ENV`: The environment (development or production)
- `JWT_SECRET`: Secret key for JWT tokens
- `BRIDGE_PATH`: Path to the bridge executable

### Web Interface Configuration

The web interface configuration is stored in the `.env` file in the web directory. You can create this file by copying the example:

```bash
cp web/.env.example web/.env
```

Edit the `.env` file to configure the following settings:

- `REACT_APP_API_URL`: URL of the server API (default: http://localhost:3001)

## Running the Bridge

### Method 1: Using the Scripts

The DarkSwap Bridge comes with scripts to start and stop the bridge:

1. Start the bridge:
   ```bash
   ./scripts/start.sh
   ```

2. Stop the bridge:
   ```bash
   ./scripts/stop.sh
   ```

### Method 2: Using Docker Compose

If you installed using Docker Compose, you can start and stop the bridge using the following commands:

1. Start the bridge:
   ```bash
   docker-compose up -d
   ```

2. Stop the bridge:
   ```bash
   docker-compose down
   ```

### Method 3: Manual Start

You can also start the components manually:

1. Start the bridge:
   ```bash
   ./target/release/darkswap-bridge --server
   ```

2. Start the server:
   ```bash
   cd server
   npm start
   ```

3. Start the web interface:
   ```bash
   cd web
   npm start
   ```

## Using the Web Interface

Once the bridge is running, you can access the web interface at http://localhost:3000.

### Login

The default credentials are:
- Username: `admin`
- Password: `admin123`

### Dashboard

The dashboard provides an overview of the system status, including:
- Bridge status
- Wallet status
- Network status
- Wallet balance
- Connected peers
- Orders and trades

### Wallet

The wallet page allows you to:
- Create a new wallet
- Open an existing wallet
- View wallet balance
- Create new addresses
- Send transactions

### Network

The network page allows you to:
- Connect to peers
- Disconnect from peers
- Send messages to peers
- View connected peers

### Order Book

The order book page allows you to:
- Create new orders
- View existing orders
- Take orders
- Cancel orders

### Trades

The trades page allows you to:
- View trade history
- Accept trades
- Reject trades
- Execute trades
- Confirm trades
- Cancel trades

### Settings

The settings page allows you to configure:
- Theme (light or dark)
- Log level
- Path settings
- Auto-start options

## Troubleshooting

### Common Issues

#### Bridge fails to start

If the bridge fails to start, check the following:
- Make sure the bridge executable is built correctly
- Check the logs for errors
- Make sure the required ports are available

#### Web interface fails to connect to the server

If the web interface fails to connect to the server, check the following:
- Make sure the server is running
- Check the server logs for errors
- Make sure the `REACT_APP_API_URL` is set correctly in the web interface configuration

#### Server fails to connect to the bridge

If the server fails to connect to the bridge, check the following:
- Make sure the bridge is running
- Check the bridge logs for errors
- Make sure the `BRIDGE_PATH` is set correctly in the server configuration

### Getting Help

If you encounter any issues that are not covered in this guide, please:
1. Check the [FAQ](./faq.md) for common questions and answers
2. Check the [Troubleshooting Guide](./troubleshooting.md) for more detailed troubleshooting steps
3. Open an issue on the [GitHub repository](https://github.com/darkswap/darkswap-bridge/issues)