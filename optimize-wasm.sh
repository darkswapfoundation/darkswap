#!/bin/bash

# Optimize WebAssembly module for DarkSwap SDK
echo "Optimizing WebAssembly module for DarkSwap SDK..."

# Check if wasm-opt is installed
if ! command -v wasm-opt &> /dev/null; then
    echo "wasm-opt is not installed. Installing binaryen..."
    
    # Check the operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y binaryen
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install binaryen
    else
        echo "Unsupported operating system. Please install binaryen manually."
        exit 1
    fi
fi

# Check if the WebAssembly module exists
if [ ! -f "web/public/darkswap-wasm/darkswap_wasm_bg.wasm" ]; then
    echo "WebAssembly module not found. Please build it first using ./build-wasm.sh"
    exit 1
fi

# Create a backup of the original WebAssembly module
echo "Creating backup of the original WebAssembly module..."
cp web/public/darkswap-wasm/darkswap_wasm_bg.wasm web/public/darkswap-wasm/darkswap_wasm_bg.wasm.bak

# Get the original size
ORIGINAL_SIZE=$(stat -c%s "web/public/darkswap-wasm/darkswap_wasm_bg.wasm.bak" 2>/dev/null || stat -f%z "web/public/darkswap-wasm/darkswap_wasm_bg.wasm.bak")
echo "Original size: $ORIGINAL_SIZE bytes"

# Optimize the WebAssembly module
echo "Optimizing WebAssembly module..."
wasm-opt -Oz -o web/public/darkswap-wasm/darkswap_wasm_bg.wasm web/public/darkswap-wasm/darkswap_wasm_bg.wasm.bak

# Get the optimized size
OPTIMIZED_SIZE=$(stat -c%s "web/public/darkswap-wasm/darkswap_wasm_bg.wasm" 2>/dev/null || stat -f%z "web/public/darkswap-wasm/darkswap_wasm_bg.wasm")
echo "Optimized size: $OPTIMIZED_SIZE bytes"

# Calculate the size reduction
SIZE_REDUCTION=$((ORIGINAL_SIZE - OPTIMIZED_SIZE))
PERCENTAGE_REDUCTION=$(echo "scale=2; $SIZE_REDUCTION * 100 / $ORIGINAL_SIZE" | bc)
echo "Size reduction: $SIZE_REDUCTION bytes ($PERCENTAGE_REDUCTION%)"

echo "WebAssembly module optimization complete!"