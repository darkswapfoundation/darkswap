# DarkSwap P2P Network Testing Guide

This guide provides instructions for testing the DarkSwap P2P network to ensure all components are functioning correctly. It covers manual testing procedures, automated testing scripts, and troubleshooting common issues.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Manual Testing Procedures](#manual-testing-procedures)
   - [Testing Peer Discovery](#testing-peer-discovery)
   - [Testing Direct Connections](#testing-direct-connections)
   - [Testing Relay Connections](#testing-relay-connections)
   - [Testing WebRTC Signaling](#testing-webrtc-signaling)
   - [Testing Message Exchange](#testing-message-exchange)
4. [Automated Testing](#automated-testing)
   - [Using the P2P Test Script](#using-the-p2p-test-script)
   - [Test Script Options](#test-script-options)
   - [Understanding Test Results](#understanding-test-results)
5. [Performance Testing](#performance-testing)
   - [Latency Testing](#latency-testing)
   - [Throughput Testing](#throughput-testing)
   - [Stress Testing](#stress-testing)
6. [Security Testing](#security-testing)
   - [Authentication Testing](#authentication-testing)
   - [Encryption Testing](#encryption-testing)
   - [DoS Protection Testing](#dos-protection-testing)
7. [Troubleshooting](#troubleshooting)
   - [Common Issues](#common-issues)
   - [Diagnostic Tools](#diagnostic-tools)
   - [Logs and Debugging](#logs-and-debugging)
8. [Continuous Testing](#continuous-testing)
   - [Integration with CI/CD](#integration-with-cicd)
   - [Monitoring and Alerts](#monitoring-and-alerts)

## Introduction

The DarkSwap P2P network is a critical component of the platform, enabling direct peer-to-peer communication for trading. Thorough testing is essential to ensure its reliability, performance, and security.

This guide covers both manual and automated testing procedures for all aspects of the P2P network, including:

- Peer discovery
- Connection establishment (direct and relayed)
- WebRTC signaling
- Message exchange
- Performance under various conditions
- Security features

## Prerequisites

Before testing the P2P network, ensure you have:

1. DarkSwap CLI installed (`darkswap-cli`)
2. DarkSwap daemon running (`darkswap-daemon`)
3. Access to at least one relay server
4. Access to at least one signaling server
5. Basic command-line tools (`curl`, `jq`, `netstat`)

To install the required tools:

```bash
# Install jq (JSON processor)
sudo apt-get install jq

# Install net-tools (for netstat)
sudo apt-get install net-tools

# Install curl
sudo apt-get install curl
```

## Manual Testing Procedures

### Testing Peer Discovery

#### DHT-Based Discovery

1. Check if DHT-based peer discovery is working:

```bash
darkswap-cli p2p discover --method dht
```

Expected output: A list of peers discovered via the DHT.

2. Verify that your peer is properly registered in the DHT:

```bash
darkswap-cli p2p status
```

Look for the "DHT Status" section to confirm your peer is registered.

#### Relay-Based Discovery

1. Check if relay-based peer discovery is working:

```bash
darkswap-cli p2p discover --method relay
```

Expected output: A list of peers discovered via relay servers.

2. Verify that your peer is connected to relay servers:

```bash
darkswap-cli p2p status
```

Look for the "Relay Connections" section to confirm connections to relay servers.

#### Local Network Discovery

1. Check if local network discovery is working:

```bash
darkswap-cli p2p discover --method local
```

Expected output: A list of peers discovered on the local network (if any).

### Testing Direct Connections

1. Find a peer to connect to:

```bash
darkswap-cli p2p discover
```

2. Connect to the peer directly:

```bash
darkswap-cli p2p connect --peer-id <PEER_ID>
```

Replace `<PEER_ID>` with the ID of a discovered peer.

3. Verify the connection:

```bash
darkswap-cli p2p status
```

Look for the peer in the "Connected Peers" section with a connection type of "direct".

4. Send a test message:

```bash
darkswap-cli p2p send --peer-id <PEER_ID> --message "Hello, this is a test message"
```

5. Disconnect from the peer:

```bash
darkswap-cli p2p disconnect --peer-id <PEER_ID>
```

### Testing Relay Connections

1. Find a peer to connect to:

```bash
darkswap-cli p2p discover
```

2. Connect to the peer via relay:

```bash
darkswap-cli p2p connect --peer-id <PEER_ID> --force-relay
```

Replace `<PEER_ID>` with the ID of a discovered peer.

3. Verify the connection:

```bash
darkswap-cli p2p status
```

Look for the peer in the "Connected Peers" section with a connection type of "relay".

4. Send a test message:

```bash
darkswap-cli p2p send --peer-id <PEER_ID> --message "Hello, this is a relay test message"
```

5. Disconnect from the peer:

```bash
darkswap-cli p2p disconnect --peer-id <PEER_ID>
```

### Testing WebRTC Signaling

1. Check the signaling server status:

```bash
darkswap-cli p2p signaling status
```

Expected output: Information about the signaling server connection.

2. Test WebRTC connection establishment:

```bash
darkswap-cli p2p test-webrtc
```

This command tests the entire WebRTC connection establishment process, including signaling, ICE candidate gathering, and data channel creation.

3. View WebRTC statistics:

```bash
darkswap-cli p2p webrtc stats
```

Expected output: Statistics about WebRTC connections, including ICE candidates, connection types, and data channel information.

### Testing Message Exchange

1. Connect to a peer:

```bash
darkswap-cli p2p connect --peer-id <PEER_ID>
```

2. Send a message:

```bash
darkswap-cli p2p send --peer-id <PEER_ID> --message "Test message at $(date)"
```

3. Check message delivery status:

```bash
darkswap-cli p2p message status --message-id <MESSAGE_ID>
```

Replace `<MESSAGE_ID>` with the ID returned from the send command.

4. Test message broadcasting:

```bash
darkswap-cli p2p broadcast --message "Broadcast test message at $(date)"
```

This sends a message to all connected peers.

## Automated Testing

### Using the P2P Test Script

The DarkSwap repository includes a comprehensive P2P network test script that automates testing of all P2P components.

To run the test script:

```bash
./scripts/test-p2p-network.sh
```

This script will:

1. Check dependencies
2. Verify that required services are running
3. Test peer discovery (DHT, relay, and local)
4. Test direct connections
5. Test relay connections
6. Test WebRTC signaling
7. Test message broadcasting
8. Test performance under stress conditions
9. Test connection recovery
10. Collect and report network metrics
11. Generate a detailed test report

### Test Script Options

The test script supports several options that can be modified at the top of the script:

- `TEST_TIMEOUT`: Maximum time (in seconds) to wait for operations to complete
- `PEER_COUNT`: Number of peers to test connections with
- `MESSAGE_COUNT`: Number of messages to send during stress testing
- `RELAY_TEST`: Whether to test relay connections
- `DIRECT_TEST`: Whether to test direct connections
- `SIGNALING_TEST`: Whether to test WebRTC signaling
- `STRESS_TEST`: Whether to perform stress testing
- `RECOVERY_TEST`: Whether to test connection recovery

To modify these options, edit the script or set environment variables before running:

```bash
export PEER_COUNT=5
export STRESS_TEST=false
./scripts/test-p2p-network.sh
```

### Understanding Test Results

The test script uses color-coded output to indicate success or failure:

- Green (✓): Test passed
- Red (✗): Test failed
- Yellow (section headers): Test section
- Normal text (ℹ): Informational messages

At the end of the test, a JSON report file is generated with detailed results. This file can be used for further analysis or comparison with previous test runs.

## Performance Testing

### Latency Testing

To test the latency of P2P connections:

```bash
darkswap-cli p2p ping --peer-id <PEER_ID> --count 10
```

This sends 10 ping messages to the peer and reports the minimum, maximum, and average round-trip times.

For more detailed latency analysis:

```bash
darkswap-cli p2p latency-test --peer-id <PEER_ID> --duration 60
```

This runs a 60-second latency test with continuous pings and provides statistical analysis.

### Throughput Testing

To test the throughput of P2P connections:

```bash
darkswap-cli p2p throughput-test --peer-id <PEER_ID> --duration 30 --direction both
```

This runs a 30-second throughput test in both directions (upload and download) and reports the results in bytes per second.

Options for the `--direction` parameter:
- `send`: Test upload throughput only
- `receive`: Test download throughput only
- `both`: Test both upload and download throughput

### Stress Testing

To perform stress testing on the P2P network:

```bash
darkswap-cli p2p stress-test --peers 10 --duration 300 --message-rate 100
```

This connects to 10 peers, sends messages at a rate of 100 messages per second, and runs for 300 seconds.

To test with increasing load:

```bash
darkswap-cli p2p stress-test --peers 10 --duration 300 --message-rate-start 10 --message-rate-end 1000 --message-rate-step 10
```

This starts at 10 messages per second and increases by 10 every second until reaching 1000 messages per second.

## Security Testing

### Authentication Testing

To test peer authentication:

```bash
# Test with valid authentication
darkswap-cli p2p connect --peer-id <PEER_ID> --auth-token <VALID_TOKEN>

# Test with invalid authentication
darkswap-cli p2p connect --peer-id <PEER_ID> --auth-token <INVALID_TOKEN>
```

The second command should fail with an authentication error.

### Encryption Testing

To verify that P2P communications are encrypted:

```bash
# Enable verbose logging
darkswap-cli config set log.level debug

# Connect to a peer
darkswap-cli p2p connect --peer-id <PEER_ID>

# Send a message
darkswap-cli p2p send --peer-id <PEER_ID> --message "Encryption test"

# Check logs for encryption information
darkswap-cli logs --grep "encryption"
```

The logs should show that messages are encrypted before transmission and decrypted upon receipt.

### DoS Protection Testing

To test DoS protection mechanisms:

```bash
# Test rate limiting
darkswap-cli p2p dos-test --peer-id <PEER_ID> --test rate-limiting

# Test message size limits
darkswap-cli p2p dos-test --peer-id <PEER_ID> --test message-size

# Test connection flooding
darkswap-cli p2p dos-test --test connection-flood
```

These tests attempt to trigger DoS protection mechanisms and report whether they are functioning correctly.

## Troubleshooting

### Common Issues

#### Peer Discovery Failures

If peer discovery is not working:

1. Check if the DHT is functioning:

```bash
darkswap-cli p2p dht status
```

2. Verify relay server connections:

```bash
darkswap-cli p2p relay status
```

3. Check network connectivity:

```bash
ping bootstrap.libp2p.io
```

#### Connection Establishment Failures

If connections cannot be established:

1. Check for NAT or firewall issues:

```bash
darkswap-cli p2p nat-test
```

2. Verify that STUN/TURN servers are reachable:

```bash
darkswap-cli p2p ice-test
```

3. Check for WebRTC support:

```bash
darkswap-cli p2p webrtc-support
```

#### Message Delivery Failures

If messages are not being delivered:

1. Check connection status:

```bash
darkswap-cli p2p status
```

2. Verify message queue:

```bash
darkswap-cli p2p message queue
```

3. Check for network congestion:

```bash
darkswap-cli p2p metrics
```

### Diagnostic Tools

#### Network Diagnostics

```bash
darkswap-cli p2p diagnostics --full
```

This runs a comprehensive diagnostic check of the P2P network and reports any issues found.

#### Connection Tracing

```bash
darkswap-cli p2p trace --peer-id <PEER_ID> --duration 60
```

This traces all communication with the specified peer for 60 seconds and saves the trace to a file for analysis.

#### Protocol Analysis

```bash
darkswap-cli p2p protocol-analyze --peer-id <PEER_ID>
```

This analyzes the protocol messages exchanged with the peer and reports any anomalies or inefficiencies.

### Logs and Debugging

#### Viewing Logs

```bash
# View recent logs
darkswap-cli logs --tail 100

# View logs related to P2P
darkswap-cli logs --grep "p2p"

# View logs for a specific peer
darkswap-cli logs --grep "<PEER_ID>"
```

#### Enabling Debug Logging

```bash
# Enable debug logging for P2P module
darkswap-cli config set log.p2p debug

# Enable trace logging for WebRTC
darkswap-cli config set log.webrtc trace
```

#### Collecting Debug Information

```bash
darkswap-cli debug-info --output debug-info.zip
```

This collects comprehensive debug information, including logs, configuration, and system information, and saves it to a zip file.

## Continuous Testing

### Integration with CI/CD

To integrate P2P network testing into your CI/CD pipeline:

1. Add the test script to your CI configuration:

```yaml
# Example GitHub Actions workflow
name: P2P Network Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Set up environment
      run: |
        sudo apt-get update
        sudo apt-get install -y jq net-tools curl
    - name: Start DarkSwap services
      run: |
        ./scripts/start-services.sh
    - name: Run P2P network tests
      run: |
        ./scripts/test-p2p-network.sh
    - name: Upload test report
      uses: actions/upload-artifact@v2
      with:
        name: p2p-test-report
        path: p2p_network_test_report_*.json
```

2. Configure test parameters for CI:

```bash
# Create a CI-specific configuration
cat > scripts/ci-p2p-test-config.sh << EOF
export TEST_TIMEOUT=60
export PEER_COUNT=3
export MESSAGE_COUNT=5
export RELAY_TEST=true
export DIRECT_TEST=true
export SIGNALING_TEST=true
export STRESS_TEST=false
export RECOVERY_TEST=true
EOF

# Source the configuration in the test script
source scripts/ci-p2p-test-config.sh
```

### Monitoring and Alerts

To set up continuous monitoring and alerts for the P2P network:

1. Configure periodic testing:

```bash
# Add to crontab
crontab -e

# Run tests every hour and send alerts on failure
0 * * * * /path/to/darkswap/scripts/test-p2p-network.sh --quiet || /path/to/darkswap/scripts/send-alert.sh "P2P network test failed"
```

2. Set up monitoring dashboards:

```bash
# Export metrics for Prometheus
darkswap-cli p2p metrics --prometheus > /var/lib/prometheus/p2p_metrics.prom

# Set up Grafana dashboard
# Import the dashboard JSON from monitoring/grafana/dashboards/p2p-network.json
```

3. Configure alerts based on metrics:

```yaml
# Example Prometheus alert rule
groups:
- name: p2p-network
  rules:
  - alert: P2PConnectionsLow
    expr: darkswap_p2p_connected_peers < 5
    for: 15m
    labels:
      severity: warning
    annotations:
      summary: "Low P2P connections"
      description: "Number of P2P connections has been below 5 for 15 minutes."
  - alert: P2PMessageFailureRateHigh
    expr: rate(darkswap_p2p_message_failures[5m]) / rate(darkswap_p2p_message_attempts[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High P2P message failure rate"
      description: "P2P message failure rate is above 10% for 5 minutes."
```

By following this testing guide, you can ensure that the DarkSwap P2P network is functioning correctly, performing optimally, and secure against potential threats.