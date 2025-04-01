#!/bin/bash

# Install wasm-pack if not already installed
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    cargo install wasm-pack
fi

# Build the WebAssembly bindings with the wasm feature
echo "Building WebAssembly bindings..."
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory,+mutable-globals' \
wasm-pack build --target web -- --no-default-features --features wasm

echo "WebAssembly bindings built successfully!"