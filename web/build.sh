#!/bin/bash

# Build script for DarkSwap web interface

# Exit on error
set -e

echo "Building DarkSwap web interface..."

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

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack is not installed. Installing wasm-pack..."
    cargo install wasm-pack
fi

# Build the WebAssembly bindings
echo "Building WebAssembly bindings..."
cd ../darkswap-web-sys
wasm-pack build --target web

# Build the TypeScript library
echo "Building TypeScript library..."
cd ../darkswap-lib
npm install
npm run build

# Build the web interface
echo "Building web interface..."
cd ../web
npm install
npm run build

echo "Build completed successfully!"
echo "The build artifacts are in the 'build' directory."
echo "You can serve the build with a static server:"
echo "  npx serve -s build"