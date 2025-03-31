# DarkSwap Phase 2

This document provides comprehensive information about Phase 2 of the DarkSwap project, including components, build instructions, installation, and usage.

## Overview

Phase 2 of the DarkSwap project focuses on implementing the core SDK, CLI, and daemon components. These components provide the foundation for the DarkSwap platform, enabling P2P trading of Bitcoin, runes, and alkanes.

## Components

### Core SDK (darkswap-sdk)

The SDK serves as the foundation for both the CLI and daemon, providing all the functionality needed for P2P trading.

Key modules:
- **Network Module**: Interface with the P2P network
- **Orderbook Module**: Manage orders and match trades
- **Trade Module**: Handle trade execution
- **Bitcoin Utils Module**: Provide Bitcoin-specific functionality
- **Types Module**: Define common data structures
- **Config Module**: Handle configuration

### Command-Line Interface (darkswap-cli)

The CLI provides a user-friendly interface for interacting with the SDK from the command line.

Key commands:
- **daemon**: Start the DarkSwap daemon
- **create-order**: Create a new order
- **cancel-order**: Cancel an existing order
- **take-order**: Take an existing order
- **list-orders**: List orders with filtering
- **market**: Get market data for a trading pair
- **connect-wallet**: Connect a wallet for trading

### Daemon (darkswap-daemon)

The daemon provides a background service with a REST API and WebSocket interface for interacting with the DarkSwap network.

Key components:
- **API Server**: Provide REST API endpoints
- **WebSocket Server**: Provide real-time updates
- **Event System**: Handle and broadcast events
- **P2P Node**: Participate in the P2P network
- **Service Management**: Run as a system service

## Building

To build the Phase 2 components, use the provided build script:

```bash
# Make the script executable
chmod +x build-phase2.sh

# Run the build script
./build-phase2.sh
```

This will build the following components:
- darkswap-sdk
- darkswap-cli
- darkswap-daemon

The binaries will be placed in the `target/phase2/` directory, along with service files and documentation.

## Installation

To install the Phase 2 components, use the provided installation script:

```bash
# Make the script executable
chmod +x install-phase2.sh

# Run the installation script as root/administrator
sudo ./install-phase2.sh
```

This will:
1. Install the binaries to the appropriate location for your operating system
2. Install the service files for your operating system
3. Create a default configuration
4. Copy documentation

### Manual Installation

If you prefer to install manually, follow these steps:

#### Linux

1. Copy the binaries to a location in your PATH:
   ```bash
   sudo cp target/phase2/darkswap-cli /usr/local/bin/
   sudo cp target/phase2/darkswap-daemon /usr/local/bin/
   ```

2. Copy the service file:
   ```bash
   sudo cp target/phase2/service-files/darkswap.service /etc/systemd/system/
   ```

3. Create configuration directory:
   ```bash
   sudo mkdir -p /etc/darkswap
   ```

4. Create data and log directories:
   ```bash
   sudo mkdir -p /var/lib/darkswap
   sudo mkdir -p /var/log/darkswap
   ```

5. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now darkswap
   ```

#### macOS

1. Copy the binaries to a location in your PATH:
   ```bash
   sudo cp target/phase2/darkswap-cli /usr/local/bin/
   sudo cp target/phase2/darkswap-daemon /usr/local/bin/
   ```

2. Copy the service file:
   ```bash
   sudo cp target/phase2/service-files/com.darkswap.daemon.plist /Library/LaunchDaemons/
   ```

3. Create configuration directory:
   ```bash
   sudo mkdir -p /usr/local/etc/darkswap
   ```

4. Create data and log directories:
   ```bash
   sudo mkdir -p /usr/local/var/darkswap
   sudo mkdir -p /usr/local/var/log/darkswap
   ```

5. Load and start the service:
   ```bash
   sudo launchctl load /Library/LaunchDaemons/com.darkswap.daemon.plist
   sudo launchctl start com.darkswap.daemon
   ```

#### Windows

1. Create installation directory:
   ```powershell
   mkdir "C:\Program Files\DarkSwap"
   ```

2. Copy the binaries:
   ```powershell
   Copy-Item "target\phase2\darkswap-cli.exe" -Destination "C:\Program Files\DarkSwap\"
   Copy-Item "target\phase2\darkswap-daemon.exe" -Destination "C:\Program Files\DarkSwap\"
   ```

3. Copy the service script:
   ```powershell
   Copy-Item "target\phase2\service-files\darkswap-service.ps1" -Destination "C:\Program Files\DarkSwap\"
   ```

4. Create configuration, data, and log directories:
   ```powershell
   mkdir "C:\Program Files\DarkSwap\config"
   mkdir "C:\Program Files\DarkSwap\data"
   mkdir "C:\Program Files\DarkSwap\logs"
   ```

5. Install the service (run PowerShell as Administrator):
   ```powershell
   & "C:\Program Files\DarkSwap\darkswap-service.ps1"
   ```

## Verification

To verify the installation, use the provided verification script:

```bash
# Make the script executable
chmod +x verify-phase2.sh

# Run the verification script
./verify-phase2.sh
```

This will check if:
1. The binaries are installed correctly
2. The service is installed and running
3. The daemon is responding to requests
4. The documentation is available

## Usage

### CLI Usage

The CLI provides a command-line interface for interacting with the DarkSwap network.

```bash
# Show help
darkswap-cli --help

# Start the daemon
darkswap-cli daemon --listen 127.0.0.1:3000

# Create an order
darkswap-cli create-order \
  --base-asset BTC \
  --quote-asset RUNE:123 \
  --side buy \
  --amount 0.1 \
  --price 20000 \
  --expiry 3600

# Cancel an order
darkswap-cli cancel-order --order-id <ORDER_ID>

# Take an order
darkswap-cli take-order --order-id <ORDER_ID> --amount 0.05

# List orders
darkswap-cli list-orders \
  --base-asset BTC \
  --quote-asset RUNE:123 \
  --side buy \
  --status open

# Get market data
darkswap-cli market --base-asset BTC --quote-asset RUNE:123

# Connect a wallet
darkswap-cli connect-wallet --wallet-type simple --private-key <PRIVATE_KEY>
```

### Daemon Usage

The daemon provides a REST API and WebSocket interface for interacting with the DarkSwap network.

#### REST API Endpoints

- `GET /health` - Health check
- `GET /orders` - List orders
- `POST /orders` - Create an order
- `GET /orders/:id` - Get an order
- `DELETE /orders/:id` - Cancel an order
- `POST /orders/:id/take` - Take an order
- `GET /market` - Get market data
- `GET /runes` - List runes
- `GET /runes/:id` - Get a rune
- `GET /alkanes` - List alkanes
- `GET /alkanes/:id` - Get an alkane
- `GET /ws` - WebSocket endpoint

#### WebSocket Interface

Connect to the WebSocket endpoint at `ws://127.0.0.1:3000/ws` to receive real-time updates.

##### Subscribe to Events

```json
{
  "type": "Subscribe",
  "payload": {
    "events": ["order_created", "order_canceled", "trade_started"]
  }
}
```

##### Unsubscribe from Events

```json
{
  "type": "Unsubscribe",
  "payload": {
    "events": ["order_created"]
  }
}
```

## Configuration

The daemon and CLI can be configured through a configuration file. By default, they look for a file at:

- Linux: `/etc/darkswap/config.json`
- macOS: `/usr/local/etc/darkswap/config.json`
- Windows: `C:\Program Files\DarkSwap\config\config.json`

Example configuration:

```json
{
  "bitcoin": {
    "network": "testnet"
  },
  "p2p": {
    "listen_addresses": ["/ip4/0.0.0.0/tcp/9000"],
    "bootstrap_peers": [],
    "relay_servers": []
  },
  "api": {
    "listen_address": "127.0.0.1:3000"
  },
  "wallet": {
    "wallet_type": "simple"
  }
}
```

## Service Management

### Linux (systemd)

```bash
# Start the service
sudo systemctl start darkswap

# Stop the service
sudo systemctl stop darkswap

# Enable the service to start at boot
sudo systemctl enable darkswap

# Disable the service from starting at boot
sudo systemctl disable darkswap

# Check the service status
sudo systemctl status darkswap

# View logs
sudo journalctl -u darkswap
```

### macOS (launchd)

```bash
# Start the service
sudo launchctl start com.darkswap.daemon

# Stop the service
sudo launchctl stop com.darkswap.daemon

# Load the service (enable at boot)
sudo launchctl load /Library/LaunchDaemons/com.darkswap.daemon.plist

# Unload the service (disable at boot)
sudo launchctl unload /Library/LaunchDaemons/com.darkswap.daemon.plist

# Check if the service is running
sudo launchctl list | grep com.darkswap.daemon

# View logs
tail -f /usr/local/var/log/darkswap/daemon.log
```

### Windows

```powershell
# Start the service
Start-Service DarkSwapDaemon

# Stop the service
Stop-Service DarkSwapDaemon

# Set the service to start automatically
Set-Service -Name DarkSwapDaemon -StartupType Automatic

# Set the service to start manually
Set-Service -Name DarkSwapDaemon -StartupType Manual

# Check the service status
Get-Service DarkSwapDaemon

# View logs
Get-Content "C:\Program Files\DarkSwap\logs\daemon.log"
```

## Troubleshooting

### Common Issues

1. **Daemon fails to start**
   - Check the logs for errors
   - Verify the configuration file is valid
   - Ensure the required ports are not in use

2. **CLI cannot connect to daemon**
   - Verify the daemon is running
   - Check the API listen address in the configuration
   - Ensure there are no firewall rules blocking the connection

3. **Service fails to install**
   - Ensure you have administrative privileges
   - Check for conflicting services
   - Verify the service files are correctly formatted

### Logs

Logs are stored in the following locations:

- Linux: `/var/log/darkswap/`
- macOS: `/usr/local/var/log/darkswap/`
- Windows: `C:\Program Files\DarkSwap\logs\`

## Next Steps

After completing Phase 2, the project will move on to Phase 3, which focuses on:

1. Implementing the relay server with DTLS/ICE support
2. Developing the web interface using React
3. Creating WebAssembly bindings for browser integration
4. Developing the TypeScript library for web applications
5. Completing the runes and alkanes support

## Conclusion

Phase 2 of the DarkSwap project provides the core functionality needed for P2P trading of Bitcoin, runes, and alkanes. The CLI and daemon components offer a solid foundation for the next phase of development, which will focus on the web interface and relay server.