#!/bin/bash
# Build script for DarkSwap WebAssembly module

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building DarkSwap WebAssembly module...${NC}"

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo -e "${YELLOW}wasm-pack not found. Installing...${NC}"
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: cargo not found. Please install Rust and cargo.${NC}"
    exit 1
fi

# Navigate to darkswap-sdk directory
cd darkswap-sdk

# Add wasm32-unknown-unknown target if not already added
echo -e "${GREEN}Adding wasm32-unknown-unknown target...${NC}"
rustup target add wasm32-unknown-unknown

# Create a temporary Cargo.toml with minimal dependencies for WebAssembly
echo -e "${GREEN}Creating temporary Cargo.toml for WebAssembly build...${NC}"
cp Cargo.toml Cargo.toml.backup

# Create a minimal Cargo.toml for WebAssembly build
cat > Cargo.toml << EOF
[package]
name = "darkswap-sdk"
version = "0.1.0"
edition = "2021"
description = "DarkSwap SDK"
license = "MIT"

[lib]
crate-type = ["cdylib", "rlib"]

[features]
default = []
wasm = ["wasm-bindgen", "js-sys", "web-sys", "console_error_panic_hook", "wasm-bindgen-futures"]

[dependencies]
wasm-bindgen = { version = "0.2", optional = true }
js-sys = { version = "0.3", optional = true }
web-sys = { version = "0.3", features = ["console"], optional = true }
console_error_panic_hook = { version = "0.1.7", optional = true }
wasm-bindgen-futures = { version = "0.4", optional = true }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
rust_decimal = "1.30"

[dev-dependencies]
wasm-bindgen-test = "0.3"
EOF

# Build the WebAssembly module
echo -e "${GREEN}Building WebAssembly module...${NC}"
mkdir -p ../web/public/wasm
wasm-pack build --target web --out-dir ../web/public/wasm -- --features wasm

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}WebAssembly module built successfully!${NC}"
    
    # Create JavaScript bindings
    echo -e "${GREEN}Creating TypeScript bindings...${NC}"
    
    # Create directory if it doesn't exist
    mkdir -p ../web/src/wasm-bindings
    
    # Copy the generated JavaScript bindings
    cp ../web/public/wasm/darkswap_sdk.js ../web/src/wasm-bindings/darkswap_wasm.js
    cp ../web/public/wasm/darkswap_sdk.d.ts ../web/src/wasm-bindings/darkswap_wasm.d.ts
    
    # Update the import path in the TypeScript bindings
    sed -i 's/\.\/darkswap_sdk_bg\.wasm/\.\/wasm\/darkswap_sdk_bg\.wasm/g' ../web/src/wasm-bindings/darkswap_wasm.js
    
    echo -e "${GREEN}TypeScript bindings created successfully!${NC}"
    
    # Update the App.tsx to use the WebAssembly module
    echo -e "${GREEN}Updating App.tsx to use the WebAssembly module...${NC}"
    sed -i 's/autoInitialize={false}/autoInitialize={true}/g' ../web/src/App.tsx
    sed -i 's/wasmPath="\/darkswap_wasm\.wasm"/wasmPath="\/wasm\/darkswap_sdk_bg\.wasm"/g' ../web/src/App.tsx
    
    echo -e "${GREEN}App.tsx updated successfully!${NC}"
    
    echo -e "${GREEN}DarkSwap WebAssembly module built and integrated successfully!${NC}"
else
    echo -e "${RED}Error: Failed to build WebAssembly module.${NC}"
    # Restore the original Cargo.toml
    mv Cargo.toml.backup Cargo.toml
    exit 1
fi

# Restore the original Cargo.toml
echo -e "${GREEN}Restoring original Cargo.toml...${NC}"
mv Cargo.toml.backup Cargo.toml

# Return to the original directory
cd ..

echo -e "${GREEN}Build complete!${NC}"