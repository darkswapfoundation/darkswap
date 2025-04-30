# DarkSwap CLI

The DarkSwap CLI is a command-line interface for interacting with the DarkSwap SDK. It provides commands for managing orders, trades, and wallet operations.

## Features

- Create, cancel, and take orders
- List orders with filtering by asset, side, and status
- Get market data
- Connect wallet with different wallet types
- Daemon management

## Installation

### Building from Source

```bash
# Clone the repository
git clone https://github.com/darkswap/darkswap.git
cd darkswap

# Build the CLI
cargo build --release -p darkswap-cli

# The binary will be available at target/release/darkswap-cli
```

### Installing from Binary

1. Download the latest release from the [releases page](https://github.com/darkswap/darkswap/releases).
2. Extract the archive and copy the binary to a location in your PATH.

```bash
# Linux/macOS
chmod +x darkswap-cli
sudo cp darkswap-cli /usr/local/bin/

# Windows
# Copy darkswap-cli.exe to a location in your PATH
```

## Usage

### General Usage

```bash
darkswap-cli [OPTIONS] <COMMAND>
```

### Options

- `-c, --config <FILE>` - Path to configuration file
- `-n, --network <NETWORK>` - Bitcoin network (mainnet, testnet, regtest, signet)
- `-h, --help` - Print help information
- `-V, --version` - Print version information

### Commands

#### Daemon

Start the DarkSwap daemon:

```bash
darkswap-cli daemon --listen 127.0.0.1:8080
```

#### Create Order

Create a new order:

```bash
darkswap-cli create-order \
  --base-asset BTC \
  --quote-asset RUNE:123 \
  --side buy \
  --amount 0.1 \
  --price 20000 \
  --expiry 3600
```

#### Cancel Order

Cancel an existing order:

```bash
darkswap-cli cancel-order --order-id <ORDER_ID>
```

#### Take Order

Take an existing order:

```bash
darkswap-cli take-order --order-id <ORDER_ID> --amount 0.05
```

#### List Orders

List orders with optional filtering:

```bash
darkswap-cli list-orders \
  --base-asset BTC \
  --quote-asset RUNE:123 \
  --side buy \
  --status open
```

#### Market Data

Get market data for a trading pair:

```bash
darkswap-cli market --base-asset BTC --quote-asset RUNE:123
```

#### Connect Wallet

Connect a wallet:

```bash
darkswap-cli connect-wallet --wallet-type simple --private-key <PRIVATE_KEY>
```

Or with a mnemonic:

```bash
darkswap-cli connect-wallet --wallet-type bdk --mnemonic "<MNEMONIC>" --derivation-path "m/84'/0'/0'/0/0"
```

## Asset Format

Assets are specified in the following format:

- `BTC` - Bitcoin
- `RUNE:<id>` - Rune with ID
- `ALKANE:<id>` - Alkane with ID

## Examples

### Create a Buy Order for Runes

```bash
darkswap-cli create-order \
  --base-asset RUNE:123 \
  --quote-asset BTC \
  --side buy \
  --amount 100 \
  --price 0.0001
```

### Create a Sell Order for Alkanes

```bash
darkswap-cli create-order \
  --base-asset ALKANE:ABC123 \
  --quote-asset BTC \
  --side sell \
  --amount 50 \
  --price 0.0002
```

### List All Open Buy Orders

```bash
darkswap-cli list-orders --side buy --status open
```

### Get Market Data for a Trading Pair

```bash
darkswap-cli market --base-asset RUNE:123 --quote-asset BTC
```

## Configuration

The CLI can be configured through a configuration file. By default, it looks for a file at `~/.darkswap/config.json`.

Example configuration:

```json
{
  "bitcoin": {
    "network": "testnet"
  },
  "wallet": {
    "wallet_type": "simple",
    "private_key": "your_private_key_here"
  },
  "p2p": {
    "listen_addresses": ["/ip4/0.0.0.0/tcp/9000"],
    "bootstrap_peers": [],
    "relay_servers": []
  }
}
```

## Development

### Running Tests

```bash
cargo test -p darkswap-cli
```

### Building Documentation

```bash
cargo doc -p darkswap-cli --open