#!/bin/bash

# Run tests for the DarkSwap WebAssembly bindings

set -e

echo "Running tests for DarkSwap WebAssembly bindings..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack is not installed. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Run tests in Chrome
echo "Running tests in Chrome..."
wasm-pack test --chrome --headless

# Run tests in Firefox
echo "Running tests in Firefox..."
wasm-pack test --firefox --headless

echo "All tests passed!"