#!/bin/bash

# Build script for DarkSwap SDK

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}       DarkSwap SDK Build Script        ${NC}"
echo -e "${GREEN}=========================================${NC}"

# Check for Rust
if ! command -v rustc &> /dev/null; then
    echo -e "${RED}Error: Rust is not installed.${NC}"
    echo "Please install Rust from https://rustup.rs/"
    exit 1
fi

# Check for wasm-pack if building for wasm
if [[ "$*" == *"--wasm"* ]] && ! command -v wasm-pack &> /dev/null; then
    echo -e "${RED}Error: wasm-pack is not installed.${NC}"
    echo "Please install wasm-pack with: cargo install wasm-pack"
    exit 1
fi

# Parse arguments
BUILD_TYPE="debug"
BUILD_WASM=false
RUN_TESTS=true
CLEAN=false

for arg in "$@"; do
    case $arg in
        --release)
            BUILD_TYPE="release"
            ;;
        --wasm)
            BUILD_WASM=true
            ;;
        --no-tests)
            RUN_TESTS=false
            ;;
        --clean)
            CLEAN=true
            ;;
        --help)
            echo "Usage: ./build.sh [options]"
            echo ""
            echo "Options:"
            echo "  --release    Build in release mode"
            echo "  --wasm       Build WebAssembly package"
            echo "  --no-tests   Skip running tests"
            echo "  --clean      Clean build artifacts before building"
            echo "  --help       Show this help message"
            exit 0
            ;;
    esac
done

# Clean if requested
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}Cleaning build artifacts...${NC}"
    cargo clean
    if [ -d "pkg" ]; then
        rm -rf pkg
    fi
    echo -e "${GREEN}Clean complete.${NC}"
fi

# Build SDK
echo -e "${YELLOW}Building DarkSwap SDK (${BUILD_TYPE})...${NC}"

if [ "$BUILD_TYPE" = "release" ]; then
    cargo build --release
else
    cargo build
fi

echo -e "${GREEN}Build complete.${NC}"

# Run tests if requested
if [ "$RUN_TESTS" = true ]; then
    echo -e "${YELLOW}Running tests...${NC}"
    
    if [ "$BUILD_TYPE" = "release" ]; then
        cargo test --release
    else
        cargo test
    fi
    
    echo -e "${GREEN}Tests complete.${NC}"
fi

# Build WebAssembly package if requested
if [ "$BUILD_WASM" = true ]; then
    echo -e "${YELLOW}Building WebAssembly package...${NC}"
    
    if [ "$BUILD_TYPE" = "release" ]; then
        wasm-pack build --target web --release --features wasm
    else
        wasm-pack build --target web --dev --features wasm
    fi
    
    echo -e "${GREEN}WebAssembly build complete.${NC}"
    echo -e "${YELLOW}WebAssembly package is available in the 'pkg' directory.${NC}"
fi

# Print success message
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}       DarkSwap SDK Build Success       ${NC}"
echo -e "${GREEN}=========================================${NC}"

# Print next steps
echo -e "${YELLOW}Next steps:${NC}"
echo "  - Run examples: cargo run --example simple_trade"
echo "  - Run trading bot: cargo run --example trading_bot"
if [ "$BUILD_WASM" = true ]; then
    echo "  - Use WebAssembly package in web applications"
fi