#!/bin/bash

# Script to run integration tests for DarkSwap WebAssembly bindings

set -e

# Check if the relay server is running
check_relay_server() {
    echo "Checking if relay server is running..."
    if curl -s http://localhost:9090/metrics > /dev/null; then
        echo "Relay server is running."
        return 0
    else
        echo "Relay server is not running."
        return 1
    fi
}

# Start the relay server
start_relay_server() {
    echo "Starting relay server..."
    
    # Check if the relay server binary exists
    if [ ! -f "../darkswap-relay/target/debug/darkswap-relay" ]; then
        echo "Building relay server..."
        (cd ../darkswap-relay && cargo build)
    fi
    
    # Start the relay server in the background
    ../darkswap-relay/target/debug/darkswap-relay &
    RELAY_PID=$!
    
    # Wait for the relay server to start
    echo "Waiting for relay server to start..."
    for i in {1..10}; do
        if check_relay_server; then
            break
        fi
        sleep 1
    done
    
    # Check if the relay server started successfully
    if ! check_relay_server; then
        echo "Failed to start relay server."
        exit 1
    fi
    
    echo "Relay server started with PID $RELAY_PID"
}

# Stop the relay server
stop_relay_server() {
    if [ -n "$RELAY_PID" ]; then
        echo "Stopping relay server (PID $RELAY_PID)..."
        kill $RELAY_PID
        wait $RELAY_PID 2>/dev/null || true
        echo "Relay server stopped."
    fi
}

# Parse command line arguments
START_RELAY=true
RELAY_SERVER="ws://localhost:9002/ws"
TEST_FILES="tests/integration/*.test.ts"

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-relay)
            START_RELAY=false
            shift
            ;;
        --relay-server)
            RELAY_SERVER="$2"
            shift 2
            ;;
        --test-files)
            TEST_FILES="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-relay         Don't start a relay server"
            echo "  --relay-server URL Use a specific relay server URL [default: ws://localhost:9002/ws]"
            echo "  --test-files GLOB  Run specific test files [default: tests/integration/*.test.ts]"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Set up trap to stop the relay server on exit
trap stop_relay_server EXIT

# Start the relay server if needed
if [ "$START_RELAY" = true ]; then
    start_relay_server
fi

# Run the integration tests
echo "Running integration tests..."
RELAY_SERVER="$RELAY_SERVER" npx vitest run $TEST_FILES

echo "Integration tests completed successfully!"