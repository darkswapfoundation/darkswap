#!/bin/bash

# Build WebAssembly module for DarkSwap SDK
echo "Building WebAssembly module for DarkSwap SDK..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack is not installed. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Copy the fixed wasm.rs to the original location
echo "Copying fixed wasm.rs to darkswap-sdk/src/wasm.rs..."
cp darkswap-sdk/src/wasm_fixed.rs darkswap-sdk/src/wasm.rs

# Build the WebAssembly module
echo "Building WebAssembly module..."
cd darkswap-sdk
wasm-pack build --target web --out-dir ../web/public/darkswap-wasm

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "WebAssembly module built successfully!"
    echo "Output directory: web/public/darkswap-wasm"
else
    echo "Failed to build WebAssembly module."
    exit 1
fi

# Create a package.json file for the WebAssembly module
echo "Creating package.json for the WebAssembly module..."
cat > ../web/public/darkswap-wasm/package.json << EOL
{
  "name": "darkswap-wasm",
  "version": "0.1.0",
  "description": "WebAssembly bindings for DarkSwap SDK",
  "main": "darkswap_wasm.js",
  "types": "darkswap_wasm.d.ts",
  "files": [
    "darkswap_wasm_bg.wasm",
    "darkswap_wasm.js",
    "darkswap_wasm.d.ts"
  ],
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "MIT"
}
EOL

echo "Done!"