#!/bin/bash

# Build script for DarkSwap Bridge

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building DarkSwap Bridge...${NC}"

# Create directories if they don't exist
mkdir -p darkswap-core/darkswap-lib/src
mkdir -p darkswap-network/darkswap-p2p/src
mkdir -p darkswap-bridge/src/bin

# Build darkswap-core
echo -e "${YELLOW}Building darkswap-core...${NC}"
cd darkswap-core/darkswap-lib
cargo build
cd ../..

# Build darkswap-network
echo -e "${YELLOW}Building darkswap-network...${NC}"
cd darkswap-network/darkswap-p2p
cargo build
cd ../..

# Build darkswap-bridge
echo -e "${YELLOW}Building darkswap-bridge...${NC}"
cd darkswap-bridge
cargo build
cd ..

echo -e "${GREEN}Build completed successfully!${NC}"
echo ""
echo -e "${YELLOW}To run the bridge:${NC}"
echo "1. Start the wallet adapter:"
echo "   cd darkswap-bridge && cargo run --bin wallet_adapter -- --ipc wallet_ipc --bridge bridge_ipc"
echo ""
echo "2. Start the network adapter:"
echo "   cd darkswap-bridge && cargo run --bin network_adapter -- --ipc network_ipc --bridge bridge_ipc"
echo ""
echo "3. Start the bridge CLI:"
echo "   cd darkswap-bridge && cargo run --bin bridge_cli"
echo ""