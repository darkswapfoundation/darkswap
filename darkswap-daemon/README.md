# DarkSwap Daemon

The DarkSwap Daemon is a background service that provides a REST API and WebSocket interface for interacting with the DarkSwap SDK. It manages the P2P network, orderbook, and trade execution.

## Features

- REST API for order management, market data, and wallet operations
- WebSocket interface for real-time updates
- Service management for Linux, macOS, and Windows
- Configurable through command-line arguments and configuration files

## Installation

### Building from Source

```bash
# Clone the repository
git clone https://github.com/darkswap/darkswap.git
cd darkswap

# Build the daemon
cargo build --release -p darkswap-daemon

# The binary will be available at target/release/darkswap-daemon
```

### Installing as a Service

#### Linux (systemd)

1. Copy the binary to a system location:

```bash
sudo cp target/release/darkswap-daemon /usr/local/bin/
```

2. Copy the service file:

```bash
sudo cp darkswap-daemon/darkswap.service /etc/systemd/system/
```

3. Create a user for the service:

```bash
sudo useradd -r -s /bin/false darkswap
```

4. Create necessary directories:

```bash
sudo mkdir -p /opt/darkswap
sudo chown darkswap:darkswap /opt/darkswap
```

5. Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable darkswap
sudo systemctl start darkswap
```

6. Check the service status:

```bash
sudo systemctl status darkswap
```

#### macOS (launchd)

1. Copy the binary to a system location:

```bash
sudo cp target/release/darkswap-daemon /usr/local/bin/
```

2. Copy the plist file:

```bash
sudo cp darkswap-daemon/com.darkswap.daemon.plist /Library/LaunchDaemons/
```

3. Create necessary directories:

```bash
sudo mkdir -p /usr/local/var/darkswap
sudo mkdir -p /usr/local/var/log
```

4. Load and start the service:

```bash
sudo launchctl load /Library/LaunchDaemons/com.darkswap.daemon.plist
```

5. Check the service status:

```bash
sudo launchctl list | grep darkswap
```

#### Windows

1. Copy the binary to a system location:

```powershell
Copy-Item .\target\release\darkswap-daemon.exe -Destination "C:\Program Files\DarkSwap\"
```

2. Install NSSM (Non-Sucking Service Manager) from https://nssm.cc/

3. Run the service installation script:

```powershell
# Run as Administrator
.\darkswap-daemon\darkswap-service.ps1
```

4. Check the service status:

```powershell
Get-Service DarkSwapDaemon
```

## Usage

### Starting the Daemon

```bash
darkswap-daemon --addr 127.0.0.1:3000
```

### API Endpoints

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

### WebSocket Interface

Connect to the WebSocket endpoint at `ws://127.0.0.1:3000/ws` to receive real-time updates.

#### Subscribe to Events

```json
{
  "type": "Subscribe",
  "payload": {
    "events": ["order_created", "order_canceled", "trade_started"]
  }
}
```

#### Unsubscribe from Events

```json
{
  "type": "Unsubscribe",
  "payload": {
    "events": ["order_created"]
  }
}
```

## Configuration

The daemon can be configured through command-line arguments and environment variables:

- `--addr` - Listen address (default: 127.0.0.1:3000)
- `RUST_LOG` - Log level (default: info)

## Development

### Running Tests

```bash
cargo test -p darkswap-daemon
```

### Building Documentation

```bash
cargo doc -p darkswap-daemon --open