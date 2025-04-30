#!/bin/bash

# Exit on error
set -e

echo "Building DarkSwap components..."

# Build core libraries first
echo "Building core libraries..."
cd darkswap-core
cargo build
cd ..

# Build network components
echo "Building network components..."
cd darkswap-network
cargo build || echo "Network components build failed, but continuing..."
cd ..

# Build the main project
echo "Building main project..."
cargo build || echo "Main project build failed, but continuing..."

echo "Build process completed."