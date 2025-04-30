#!/bin/bash

# Start script for DarkSwap web interface

# Exit on error
set -e

echo "Starting DarkSwap web interface..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm 8+ and try again."
    exit 1
fi

# Check if the relay server is running
if ! pgrep -f "darkswap-relay" > /dev/null; then
    echo "Starting relay server..."
    cd ../darkswap-relay
    cargo run --release &
    RELAY_PID=$!
    echo "Relay server started with PID $RELAY_PID"
    
    # Give the relay server some time to start
    sleep 2
else
    echo "Relay server is already running."
fi

# Start the web interface
echo "Starting web interface..."
cd ../web
npm start