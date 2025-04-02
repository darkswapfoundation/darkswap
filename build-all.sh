#!/bin/bash

# Build script for the entire DarkSwap project

set -e

echo "Building DarkSwap project..."

# Build the DarkSwap SDK
echo "Building DarkSwap SDK..."
cd darkswap-sdk
./build.sh
cd ..

# Build the WebAssembly bindings
echo "Building WebAssembly bindings..."
cd darkswap-web-sys
./build.sh
cd ..

# Build the web interface
echo "Building web interface..."
cd web
npm install
npm run build
cd ..

echo "DarkSwap project built successfully!"