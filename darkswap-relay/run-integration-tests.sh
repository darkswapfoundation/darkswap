#!/bin/bash

# DarkSwap Relay Server Integration Tests
# This script runs integration tests for the relay server

set -e

# Configuration
TEST_DIR="tests"
RELAY_BIN="target/debug/darkswap-relay"
CONFIG_FILE="config.toml"
TEST_CONFIG_FILE="$TEST_DIR/test-config.toml"
TEST_CERT_DIR="$TEST_DIR/certs"
TEST_CERT_FILE="$TEST_CERT_DIR/cert.pem"
TEST_KEY_FILE="$TEST_CERT_DIR/key.pem"
TEST_PORT_BASE=19000

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if the relay binary exists
if [ ! -f "$RELAY_BIN" ]; then
    log_info "Building relay server"
    cargo build
fi

# Create test directory if it doesn't exist
if [ ! -d "$TEST_DIR" ]; then
    log_info "Creating test directory: $TEST_DIR"
    mkdir -p "$TEST_DIR"
fi

# Create test certificate directory if it doesn't exist
if [ ! -d "$TEST_CERT_DIR" ]; then
    log_info "Creating test certificate directory: $TEST_CERT_DIR"
    mkdir -p "$TEST_CERT_DIR"
fi

# Generate test certificates if they don't exist
if [ ! -f "$TEST_CERT_FILE" ] || [ ! -f "$TEST_KEY_FILE" ]; then
    log_info "Generating test certificates"
    openssl req -x509 -newkey rsa:4096 -keyout "$TEST_KEY_FILE" -out "$TEST_CERT_FILE" -days 1 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi

# Create test configuration file
log_info "Creating test configuration file"
cat > "$TEST_CONFIG_FILE" << EOF
# DarkSwap Relay Server Test Configuration

# Enable metrics server
enable_metrics = true

# Network settings
[network]
# The IP address to listen on
listen_ip = "127.0.0.1"
# The TCP port to listen on
listen_port = $((TEST_PORT_BASE + 1))
# The WebSocket port to listen on
ws_port = $((TEST_PORT_BASE + 2))
# The WebRTC port to listen on
webrtc_port = $((TEST_PORT_BASE + 3))
# The metrics port to listen on
metrics_port = $((TEST_PORT_BASE + 90))
# Bootstrap nodes
bootstrap_nodes = []
# Relay nodes
relay_nodes = []

# Security settings
[security]
# Path to the certificate file for WebRTC
cert_path = "$TEST_CERT_FILE"
# Path to the key file for WebRTC
key_path = "$TEST_KEY_FILE"
# Peer timeout in seconds
peer_timeout = 30
# Connection timeout in seconds
connection_timeout = 10

# Relay settings
[relay]
# Maximum duration of a circuit in seconds
max_circuit_duration = 60
# Maximum bytes that can be transferred over a circuit
max_circuit_bytes = 1048576  # 1 MB
# Maximum number of concurrent circuits
max_circuits = 10
# Maximum number of circuits per peer
max_circuits_per_peer = 2
# Maximum bandwidth per circuit in bytes per second
max_bandwidth_per_circuit = 102400  # 100 KB/s
# Reservation duration in seconds
reservation_duration = 60
# Circuit cleanup interval in seconds
circuit_cleanup_interval = 10
# Reservation cleanup interval in seconds
reservation_cleanup_interval = 30

# WebRTC settings
[webrtc]
# STUN servers
stun_servers = [
  "stun:stun.l.google.com:19302"
]
# TURN servers
turn_servers = []
# ICE gathering timeout in seconds
ice_gathering_timeout = 5
# Connection establishment timeout in seconds
connection_establishment_timeout = 10
# Data channel establishment timeout in seconds
data_channel_establishment_timeout = 5

# Logging settings
[logging]
# Log level (trace, debug, info, warn, error)
level = "debug"
# Log file path (optional)
file = "$TEST_DIR/relay-test.log"
EOF

# Run the relay server in the background
log_info "Starting relay server for testing"
$RELAY_BIN --config "$TEST_CONFIG_FILE" > "$TEST_DIR/relay-output.log" 2>&1 &
RELAY_PID=$!

# Wait for the relay server to start
log_info "Waiting for relay server to start"
sleep 2

# Check if the relay server is running
if ! ps -p $RELAY_PID > /dev/null; then
    log_error "Relay server failed to start"
    cat "$TEST_DIR/relay-output.log"
    exit 1
fi

# Run the WebRTC connection test
log_info "Running WebRTC connection test"
cargo test --test webrtc_connection_test -- --nocapture

# Run the circuit relay test
log_info "Running circuit relay test"
cargo test --test circuit_relay_test -- --nocapture

# Run the signaling server test
log_info "Running signaling server test"
cargo test --test signaling_server_test -- --nocapture

# Kill the relay server
log_info "Stopping relay server"
kill $RELAY_PID

# Wait for the relay server to stop
log_info "Waiting for relay server to stop"
wait $RELAY_PID || true

log_info "Integration tests completed successfully"