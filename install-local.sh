#!/bin/bash

# DarkSwap Local Installation Script
# This script installs the DarkSwap binaries to ~/.local/bin/

set -e  # Exit on any error

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   DarkSwap Local Installation Script    ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if binaries exist
if [ ! -f "target/phase2/darkswap-cli" ]; then
    echo -e "${RED}Error: darkswap-cli binary not found in target/phase2/${NC}"
    echo -e "${YELLOW}Please run build-phase2.sh first${NC}"
    exit 1
fi

if [ ! -f "target/phase2/darkswap-daemon" ]; then
    echo -e "${RED}Error: darkswap-daemon binary not found in target/phase2/${NC}"
    echo -e "${YELLOW}Please run build-phase2.sh first${NC}"
    exit 1
fi

# Create local bin directory if it doesn't exist
echo -e "\n${BLUE}Step 1: Creating ~/.local/bin/ directory${NC}"
mkdir -p ~/.local/bin/

# Copy binaries to ~/.local/bin/
echo -e "\n${BLUE}Step 2: Copying binaries to ~/.local/bin/${NC}"
cp target/phase2/darkswap-cli ~/.local/bin/
cp target/phase2/darkswap-daemon ~/.local/bin/

# Make binaries executable
echo -e "\n${BLUE}Step 3: Making binaries executable${NC}"
chmod +x ~/.local/bin/darkswap-cli
chmod +x ~/.local/bin/darkswap-daemon

# Create configuration directory
echo -e "\n${BLUE}Step 4: Creating configuration directory${NC}"
mkdir -p ~/.config/darkswap

# Create data and log directories
echo -e "\n${BLUE}Step 5: Creating data and log directories${NC}"
mkdir -p ~/.local/share/darkswap
mkdir -p ~/.local/share/darkswap/logs

# Add ~/.local/bin to PATH if it's not already there
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo -e "\n${BLUE}Step 6: Adding ~/.local/bin to PATH${NC}"
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    echo -e "${YELLOW}Note: You'll need to restart your terminal or run 'source ~/.bashrc' for the PATH changes to take effect${NC}"
else
    echo -e "\n${BLUE}Step 6: ~/.local/bin is already in PATH${NC}"
fi

echo -e "\n${GREEN}Installation completed successfully!${NC}"
echo -e "${YELLOW}To start the daemon:${NC} darkswap-daemon"
echo -e "${YELLOW}To use the CLI:${NC} darkswap-cli --help"

echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}   DarkSwap Installation Complete        ${NC}"
echo -e "${BLUE}=========================================${NC}"