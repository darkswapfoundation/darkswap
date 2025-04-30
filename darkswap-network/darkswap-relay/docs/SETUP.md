# DarkSwap Relay Server Setup Guide

This guide provides detailed instructions for setting up and running the DarkSwap Relay Server.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [Monitoring](#monitoring)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)

## Prerequisites

Before setting up the DarkSwap Relay Server, ensure you have the following prerequisites installed:

- **Rust** (1.70.0 or later)
- **OpenSSL** (for certificate generation)
- **Git** (for cloning the repository)

### Installing Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Installing OpenSSL

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y openssl libssl-dev
```

#### macOS
```bash
brew install openssl
```

#### Windows
Download and install OpenSSL from [https://slproweb.com/products/Win32OpenSSL.html](https://slproweb.com/products/Win32OpenSSL.html)

## Installation

### Clone the Repository

```bash
git clone https://github.com/darkswap/darkswap.git
cd darkswap/darkswap-relay
```

### Build the Relay Server

```bash
./build.sh
```

For a release build:

```bash
./build.sh --release
```

### Generate Self-Signed Certificates for WebRTC

```bash
./build.sh --generate-certs
```

This will create self-signed certificates in the `certs` directory. For production use, you should replace these with certificates from a trusted certificate authority.

## Configuration

The DarkSwap Relay Server is configured using a TOML configuration file. The default configuration file is `config.toml` in the current directory.

### Configuration Options

#### Network Settings

```toml
[network]
# The IP address to listen on
listen_ip = "0.0.0.0"
# The TCP port to listen on
listen_port = 9001
# The WebSocket port to listen on
ws_port = 9002
# The WebRTC port to listen on
webrtc_port = 9003
# The metrics port to listen on
metrics_port = 9090
# The external address to advertise (optional)
# external_addr = "relay.darkswap.io"
```

#### Security Settings

```toml
[security]
# Path to the certificate file for WebRTC
cert_path = "certs/cert.pem"
# Path to the key file for WebRTC
key_path = "certs/key.pem"
```

#### Relay Settings

```toml
[relay]
# Maximum duration of a circuit in seconds
max_circuit_duration = 3600  # 1 hour
# Maximum bytes that can be transferred over a circuit
max_circuit_bytes = 10485760  # 10 MB
# Maximum number of concurrent circuits
max_circuits = 1000
```

#### Logging Settings

```toml
[logging]
# Log level (trace, debug, info, warn, error)
level = "info"
# Log file path (optional, logs to stdout if not specified)
# file = "/var/log/darkswap-relay.log"
```

### Command-Line Arguments

You can override configuration options using command-line arguments:

```bash
./target/debug/darkswap-relay --help
```

```
USAGE:
    darkswap-relay [OPTIONS]

OPTIONS:
    -c, --config <FILE>                Configuration file path [default: config.toml]
        --listen-ip <IP>               The IP address to listen on
        --listen-port <PORT>           The TCP port to listen on
        --ws-port <PORT>               The WebSocket port to listen on
        --webrtc-port <PORT>           The WebRTC port to listen on
        --metrics-port <PORT>          The metrics port to listen on
        --cert-path <FILE>             Path to the certificate file for WebRTC
        --key-path <FILE>              Path to the key file for WebRTC
        --external-addr <ADDRESS>      The external address to advertise
        --log-level <LEVEL>            The log level (trace, debug, info, warn, error)
    -h, --help                         Print help information
    -V, --version                      Print version information
```

## Running the Server

### Basic Usage

```bash
./target/debug/darkswap-relay
```

For a release build:

```bash
./target/release/darkswap-relay
```

### With WebRTC Support

```bash
./target/debug/darkswap-relay --cert-path certs/cert.pem --key-path certs/key.pem
```

### With Custom Configuration

```bash
./target/debug/darkswap-relay --config my-config.toml
```

### With Command-Line Overrides

```bash
./target/debug/darkswap-relay --listen-ip 127.0.0.1 --listen-port 8001 --log-level debug
```

## Monitoring

The DarkSwap Relay Server exposes metrics in Prometheus format at `/metrics` on the metrics port (default: 9090).

### Available Metrics

- **Connected Peers**: Number of connected peers
- **Active Circuits**: Number of active circuits
- **Circuit Data Transfer**: Amount of data transferred over circuits
- **Connection Durations**: Duration of peer connections
- **Error Counts**: Number of errors by type

### Prometheus Configuration

Add the following to your Prometheus configuration:

```yaml
scrape_configs:
  - job_name: 'darkswap-relay'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:9090']
```

### Grafana Dashboard

You can create a Grafana dashboard to visualize the metrics. Here's a simple example:

```json
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": null,
      "fieldConfig": {
        "defaults": {},
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 2,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.5.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "exemplar": true,
          "expr": "darkswap_relay_connected_peers",
          "interval": "",
          "legendFormat": "Connected Peers",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Connected Peers",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    }
  ],
  "schemaVersion": 27,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "DarkSwap Relay Server",
  "uid": "darkswap-relay",
  "version": 1
}
```

## Security Considerations

### Network Security

- **Firewall Configuration**: Ensure that the relay server's ports are accessible from the internet.
- **DDoS Protection**: Consider using a DDoS protection service for production deployments.
- **Rate Limiting**: The relay server includes rate limiting to prevent abuse.

### Certificate Security

- **Production Certificates**: For production use, replace the self-signed certificates with certificates from a trusted certificate authority.
- **Certificate Renewal**: Set up automatic certificate renewal to avoid expiration.
- **Private Key Protection**: Ensure that the private key is properly protected and not accessible to unauthorized users.

### Access Control

- **IP Allowlisting**: Consider restricting access to the relay server based on IP addresses.
- **Authentication**: The relay server does not currently support authentication, but you can use a reverse proxy to add authentication if needed.

## Troubleshooting

### Common Issues

#### Connection Refused

If you see "Connection refused" errors, check that:
- The relay server is running
- The firewall allows connections to the relay server's ports
- The relay server is listening on the correct IP address

#### Certificate Errors

If you see certificate errors, check that:
- The certificate and key files exist and are readable
- The certificate is valid and not expired
- The certificate is trusted by the client

#### High CPU or Memory Usage

If the relay server is using too much CPU or memory, consider:
- Reducing the maximum number of concurrent circuits
- Reducing the maximum circuit duration
- Increasing the server's resources

### Logging

To enable more detailed logging, set the log level to `debug` or `trace`:

```bash
./target/debug/darkswap-relay --log-level debug
```

### Checking Connectivity

You can use the `telnet` command to check if the relay server's ports are accessible:

```bash
telnet relay.darkswap.io 9001
```

## Docker Deployment

### Building the Docker Image

```bash
docker build -t darkswap-relay .
```

### Running the Docker Container

```bash
docker run -p 9001:9001 -p 9002:9002 -p 9003:9003/udp -p 9090:9090 darkswap-relay
```

### With Custom Configuration

```bash
docker run -p 9001:9001 -p 9002:9002 -p 9003:9003/udp -p 9090:9090 -v $(pwd)/config.toml:/app/config.toml darkswap-relay
```

### With Certificates

```bash
docker run -p 9001:9001 -p 9002:9002 -p 9003:9003/udp -p 9090:9090 -v $(pwd)/certs:/app/certs darkswap-relay --cert-path /app/certs/cert.pem --key-path /app/certs/key.pem
```

## Production Deployment

For production deployments, consider the following:

### System Requirements

- **CPU**: 2+ cores
- **Memory**: 4+ GB RAM
- **Disk**: 20+ GB SSD
- **Network**: 100+ Mbps connection

### High Availability

For high availability, deploy multiple relay servers behind a load balancer.

### Monitoring and Alerting

Set up monitoring and alerting for the relay server using Prometheus and Grafana.

### Automatic Restart

Use a process manager like systemd or supervisor to automatically restart the relay server if it crashes.

### Example systemd Service

Create a file at `/etc/systemd/system/darkswap-relay.service`:

```ini
[Unit]
Description=DarkSwap Relay Server
After=network.target

[Service]
User=darkswap
Group=darkswap
WorkingDirectory=/opt/darkswap-relay
ExecStart=/opt/darkswap-relay/target/release/darkswap-relay
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable darkswap-relay
sudo systemctl start darkswap-relay
```

### Logging to a File

To log to a file instead of stdout, update the configuration:

```toml
[logging]
level = "info"
file = "/var/log/darkswap-relay.log"
```

### Log Rotation

Set up log rotation to prevent the log file from growing too large:

```bash
sudo nano /etc/logrotate.d/darkswap-relay
```

```
/var/log/darkswap-relay.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 darkswap darkswap
    postrotate
        systemctl kill -s HUP darkswap-relay.service
    endscript
}
```

## Conclusion

This guide provides detailed instructions for setting up and running the DarkSwap Relay Server. For more information, check out the [README](../README.md) file or the [project documentation](https://github.com/darkswap/darkswap).