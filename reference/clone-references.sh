#!/bin/bash

# DarkSwap Reference Cloning Script
# This script clones reference repositories for DarkSwap development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   DarkSwap Reference Cloning Script   ${NC}"
echo -e "${BLUE}=======================================${NC}"

# Create reference directory if it doesn't exist
REFERENCE_DIR="$(dirname "$0")"
mkdir -p "$REFERENCE_DIR/repos"
cd "$REFERENCE_DIR/repos"

# Function to clone or update a repository
clone_or_update_repo() {
    local repo_url="$1"
    local repo_name="$2"
    local branch="$3"
    
    if [ -d "$repo_name" ]; then
        echo -e "${YELLOW}Updating $repo_name...${NC}"
        cd "$repo_name"
        git fetch
        git checkout "$branch"
        git pull
        cd ..
    else
        echo -e "${YELLOW}Cloning $repo_name...${NC}"
        git clone --branch "$branch" "$repo_url" "$repo_name"
    fi
    
    echo -e "${GREEN}$repo_name is ready!${NC}"
}

# Clone PintSwap repositories
echo -e "${YELLOW}Cloning PintSwap repositories...${NC}"

# PintSwap SDK
clone_or_update_repo "https://github.com/pintswap/pintswap-sdk.git" "pintswap-sdk" "main"

# PintSwap CLI
clone_or_update_repo "https://github.com/pintswap/pintswap-cli.git" "pintswap-cli" "main"

# PintSwap Daemon
clone_or_update_repo "https://github.com/pintswap/pintswap-daemon.git" "pintswap-daemon" "main"

# Clone Bitcoin-related repositories
echo -e "${YELLOW}Cloning Bitcoin-related repositories...${NC}"

# Rust Bitcoin
clone_or_update_repo "https://github.com/rust-bitcoin/rust-bitcoin.git" "rust-bitcoin" "master"

# BDK (Bitcoin Dev Kit)
clone_or_update_repo "https://github.com/bitcoindevkit/bdk.git" "bdk" "master"

# Runes
clone_or_update_repo "https://github.com/ordinals/ord.git" "ord" "master"

# Alkanes
clone_or_update_repo "https://github.com/alkanes-rs/alkanes.git" "alkanes" "main"

# Clone P2P networking repositories
echo -e "${YELLOW}Cloning P2P networking repositories...${NC}"

# Rust libp2p
clone_or_update_repo "https://github.com/libp2p/rust-libp2p.git" "rust-libp2p" "master"

# WebRTC examples
clone_or_update_repo "https://github.com/webrtc/samples.git" "webrtc-samples" "main"

# Clone subfrost (for circuit relay implementation)
clone_or_update_repo "https://github.com/subfrost/subfrost.git" "subfrost" "main"

# Clone orbitals (for NFT support)
clone_or_update_repo "https://github.com/orbitals/orbitals.git" "orbitals" "main"

# Clone oyl-sdk (for alkanes)
clone_or_update_repo "https://github.com/oyl-sdk/oyl-sdk.git" "oyl-sdk" "latest"

echo -e "${BLUE}=======================================${NC}"
echo -e "${GREEN}All reference repositories cloned successfully!${NC}"
echo -e "${BLUE}=======================================${NC}"

# Print instructions
echo -e "${YELLOW}Reference repositories are available in:${NC}"
echo -e "  $REFERENCE_DIR/repos"
echo -e "${YELLOW}You can use these repositories as references for DarkSwap development.${NC}"