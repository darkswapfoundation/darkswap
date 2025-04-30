#!/bin/bash

# DarkSwap Relay Server Build Script
# This script builds the relay server and runs it

set -e

# Configuration
BUILD_TYPE=${BUILD_TYPE:-debug}
CONFIG_FILE=${CONFIG_FILE:-config.toml}
GENERATE_CERTS=${GENERATE_CERTS:-true}

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

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --release)
            BUILD_TYPE=release
            shift
            ;;
        --debug)
            BUILD_TYPE=debug
            shift
            ;;
        --config)
            CONFIG_FILE=$2
            shift 2
            ;;
        --no-certs)
            GENERATE_CERTS=false
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --release       Build in release mode"
            echo "  --debug         Build in debug mode (default)"
            echo "  --config FILE   Use the specified config file"
            echo "  --no-certs      Skip certificate generation"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Generate certificates if needed
if [ "$GENERATE_CERTS" = true ]; then
    log_info "Generating certificates"
    ./generate-certs.sh
fi

# Build the relay server
log_info "Building relay server in $BUILD_TYPE mode"
if [ "$BUILD_TYPE" = "release" ]; then
    cargo build --release
    BINARY=target/release/darkswap-relay
else
    cargo build
    BINARY=target/debug/darkswap-relay
fi

# Check if the build was successful
if [ ! -f "$BINARY" ]; then
    log_error "Build failed"
    exit 1
fi

log_info "Build completed successfully"
log_info "Binary: $BINARY"
log_info "Config: $CONFIG_FILE"

# Run the relay server
log_info "Running relay server"
$BINARY --config $CONFIG_FILE