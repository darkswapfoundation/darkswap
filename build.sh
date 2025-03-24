#!/bin/bash

# DarkSwap Build Script
# This script builds the DarkSwap project components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}       DarkSwap Build Script          ${NC}"
echo -e "${BLUE}=======================================${NC}"

# Parse arguments
BUILD_SDK=false
BUILD_CLI=false
BUILD_DAEMON=false
BUILD_WEB=false
BUILD_ALL=false
RELEASE=false

for arg in "$@"
do
    case $arg in
        --sdk)
        BUILD_SDK=true
        shift
        ;;
        --cli)
        BUILD_CLI=true
        shift
        ;;
        --daemon)
        BUILD_DAEMON=true
        shift
        ;;
        --web)
        BUILD_WEB=true
        shift
        ;;
        --all)
        BUILD_ALL=true
        shift
        ;;
        --release)
        RELEASE=true
        shift
        ;;
        *)
        # Unknown option
        ;;
    esac
done

# If no specific component is selected, build all
if [ "$BUILD_SDK" = false ] && [ "$BUILD_CLI" = false ] && [ "$BUILD_DAEMON" = false ] && [ "$BUILD_WEB" = false ] && [ "$BUILD_ALL" = false ]; then
    BUILD_ALL=true
fi

# If build all is selected, set all components to true
if [ "$BUILD_ALL" = true ]; then
    BUILD_SDK=true
    BUILD_CLI=true
    BUILD_DAEMON=true
    BUILD_WEB=true
fi

# Set build mode
BUILD_MODE="debug"
CARGO_FLAGS=""
if [ "$RELEASE" = true ]; then
    BUILD_MODE="release"
    CARGO_FLAGS="--release"
fi

echo -e "${YELLOW}Build mode: ${BUILD_MODE}${NC}"

# Build SDK
if [ "$BUILD_SDK" = true ]; then
    echo -e "${YELLOW}Building DarkSwap SDK...${NC}"
    
    # Build Rust SDK
    cd darkswap-sdk
    cargo build $CARGO_FLAGS
    
    # Build WASM bindings if in release mode
    if [ "$RELEASE" = true ]; then
        echo -e "${YELLOW}Building WASM bindings...${NC}"
        wasm-pack build --target web --out-dir ../web/node_modules/@darkswap/sdk --release
    fi
    
    cd ..
    echo -e "${GREEN}DarkSwap SDK built successfully!${NC}"
fi

# Build CLI
if [ "$BUILD_CLI" = true ]; then
    echo -e "${YELLOW}Building DarkSwap CLI...${NC}"
    cd darkswap-cli
    cargo build $CARGO_FLAGS
    cd ..
    echo -e "${GREEN}DarkSwap CLI built successfully!${NC}"
fi

# Build Daemon
if [ "$BUILD_DAEMON" = true ]; then
    echo -e "${YELLOW}Building DarkSwap Daemon...${NC}"
    cd darkswap-daemon
    cargo build $CARGO_FLAGS
    cd ..
    echo -e "${GREEN}DarkSwap Daemon built successfully!${NC}"
fi

# Build Web Interface
if [ "$BUILD_WEB" = true ]; then
    echo -e "${YELLOW}Building DarkSwap Web Interface...${NC}"
    cd web
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
    fi
    
    # Build web interface
    if [ "$RELEASE" = true ]; then
        npm run build
    else
        npm run build:dev
    fi
    
    cd ..
    echo -e "${GREEN}DarkSwap Web Interface built successfully!${NC}"
fi

echo -e "${BLUE}=======================================${NC}"
echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${BLUE}=======================================${NC}"

# Print instructions
echo -e "${YELLOW}To run the CLI:${NC}"
if [ "$RELEASE" = true ]; then
    echo -e "  ./target/release/darkswap-cli --help"
else
    echo -e "  ./target/debug/darkswap-cli --help"
fi

echo -e "${YELLOW}To run the Daemon:${NC}"
if [ "$RELEASE" = true ]; then
    echo -e "  ./target/release/darkswap-daemon --listen 127.0.0.1:8000"
else
    echo -e "  ./target/debug/darkswap-daemon --listen 127.0.0.1:8000"
fi

echo -e "${YELLOW}To run the Web Interface:${NC}"
echo -e "  cd web && npm run dev"