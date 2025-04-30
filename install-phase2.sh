#!/bin/bash

# DarkSwap Phase 2 Installation Script
# This script installs the Phase 2 components:
# - darkswap-cli
# - darkswap-daemon
# And sets up the appropriate service files for the operating system.

set -e  # Exit on any error

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   DarkSwap Phase 2 Installation Script  ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if running as root/administrator
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}Error: This script must be run as root or with sudo.${NC}"
        exit 1
    fi
}

# Check operating system
OS="$(uname -s)"
case "${OS}" in
    Linux*)     OS_TYPE=Linux;;
    Darwin*)    OS_TYPE=macOS;;
    CYGWIN*|MINGW*|MSYS*) OS_TYPE=Windows;;
    *)          OS_TYPE="UNKNOWN:${OS}"
esac

echo -e "${YELLOW}Detected operating system:${NC} $OS_TYPE"

# Set installation paths based on OS
case "${OS_TYPE}" in
    Linux)
        BIN_DIR="/usr/local/bin"
        SERVICE_DIR="/etc/systemd/system"
        CONFIG_DIR="/etc/darkswap"
        DATA_DIR="/var/lib/darkswap"
        LOG_DIR="/var/log/darkswap"
        ;;
    macOS)
        BIN_DIR="/usr/local/bin"
        SERVICE_DIR="/Library/LaunchDaemons"
        CONFIG_DIR="/usr/local/etc/darkswap"
        DATA_DIR="/usr/local/var/darkswap"
        LOG_DIR="/usr/local/var/log/darkswap"
        ;;
    Windows)
        BIN_DIR="C:\\Program Files\\DarkSwap"
        SERVICE_DIR="$BIN_DIR"
        CONFIG_DIR="$BIN_DIR\\config"
        DATA_DIR="$BIN_DIR\\data"
        LOG_DIR="$BIN_DIR\\logs"
        ;;
    *)
        echo -e "${RED}Error: Unsupported operating system: $OS_TYPE${NC}"
        exit 1
        ;;
esac

# Check if binaries exist in the build directory
if [ ! -f "target/phase2/darkswap-cli" ] || [ ! -f "target/phase2/darkswap-daemon" ]; then
    echo -e "${RED}Error: Binaries not found in target/phase2/ directory.${NC}"
    echo -e "${YELLOW}Please run build-phase2.sh first.${NC}"
    exit 1
fi

# Install binaries
install_binaries() {
    echo -e "\n${BLUE}Step 1: Installing binaries${NC}"
    
    case "${OS_TYPE}" in
        Linux|macOS)
            check_root
            
            # Create directories if they don't exist
            mkdir -p "$BIN_DIR"
            mkdir -p "$CONFIG_DIR"
            mkdir -p "$DATA_DIR"
            mkdir -p "$LOG_DIR"
            
            # Copy binaries
            cp "target/phase2/darkswap-cli" "$BIN_DIR/"
            cp "target/phase2/darkswap-daemon" "$BIN_DIR/"
            
            # Set permissions
            chmod 755 "$BIN_DIR/darkswap-cli"
            chmod 755 "$BIN_DIR/darkswap-daemon"
            
            echo -e "${GREEN}✓ Binaries installed to $BIN_DIR${NC}"
            ;;
        Windows)
            # Create directories if they don't exist
            mkdir -p "$BIN_DIR"
            mkdir -p "$CONFIG_DIR"
            mkdir -p "$DATA_DIR"
            mkdir -p "$LOG_DIR"
            
            # Copy binaries
            cp "target/phase2/darkswap-cli.exe" "$BIN_DIR/"
            cp "target/phase2/darkswap-daemon.exe" "$BIN_DIR/"
            
            echo -e "${GREEN}✓ Binaries installed to $BIN_DIR${NC}"
            ;;
    esac
}

# Install service files
install_service() {
    echo -e "\n${BLUE}Step 2: Installing service files${NC}"
    
    case "${OS_TYPE}" in
        Linux)
            check_root
            
            # Copy service file
            cp "target/phase2/service-files/darkswap.service" "$SERVICE_DIR/"
            
            # Reload systemd
            systemctl daemon-reload
            
            echo -e "${GREEN}✓ Service file installed to $SERVICE_DIR${NC}"
            echo -e "${YELLOW}To start the service, run:${NC} sudo systemctl enable --now darkswap"
            ;;
        macOS)
            check_root
            
            # Copy service file
            cp "target/phase2/service-files/com.darkswap.daemon.plist" "$SERVICE_DIR/"
            
            # Load the service
            launchctl load "$SERVICE_DIR/com.darkswap.daemon.plist"
            
            echo -e "${GREEN}✓ Service file installed to $SERVICE_DIR${NC}"
            echo -e "${YELLOW}To start the service, run:${NC} sudo launchctl start com.darkswap.daemon"
            ;;
        Windows)
            # Copy service script
            cp "target/phase2/service-files/darkswap-service.ps1" "$SERVICE_DIR/"
            
            echo -e "${GREEN}✓ Service script installed to $SERVICE_DIR${NC}"
            echo -e "${YELLOW}To install the service, run PowerShell as Administrator and execute:${NC}"
            echo -e "${YELLOW}$SERVICE_DIR\\darkswap-service.ps1${NC}"
            ;;
    esac
}

# Create default configuration
create_config() {
    echo -e "\n${BLUE}Step 3: Creating default configuration${NC}"
    
    # Create default config file if it doesn't exist
    if [ ! -f "$CONFIG_DIR/config.json" ]; then
        cat > "$CONFIG_DIR/config.json" << EOF
{
  "bitcoin": {
    "network": "testnet"
  },
  "p2p": {
    "listen_addresses": ["/ip4/0.0.0.0/tcp/9000"],
    "bootstrap_peers": [],
    "relay_servers": []
  },
  "api": {
    "listen_address": "127.0.0.1:3000"
  },
  "wallet": {
    "wallet_type": "simple"
  }
}
EOF
        echo -e "${GREEN}✓ Default configuration created at $CONFIG_DIR/config.json${NC}"
    else
        echo -e "${YELLOW}! Configuration file already exists at $CONFIG_DIR/config.json${NC}"
    fi
    
    # Set permissions
    case "${OS_TYPE}" in
        Linux|macOS)
            chmod 644 "$CONFIG_DIR/config.json"
            ;;
    esac
}

# Copy documentation
copy_docs() {
    echo -e "\n${BLUE}Step 4: Copying documentation${NC}"
    
    # Create docs directory if it doesn't exist
    mkdir -p "$CONFIG_DIR/docs"
    
    # Copy documentation
    cp "target/phase2/docs/cli-readme.md" "$CONFIG_DIR/docs/"
    cp "target/phase2/docs/daemon-readme.md" "$CONFIG_DIR/docs/"
    
    echo -e "${GREEN}✓ Documentation copied to $CONFIG_DIR/docs/${NC}"
}

# Main installation process
echo -e "\n${YELLOW}Installing DarkSwap Phase 2 components for $OS_TYPE...${NC}"

install_binaries
install_service
create_config
copy_docs

# Final instructions
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}   DarkSwap Phase 2 Installation Complete  ${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "\n${YELLOW}Installation Summary:${NC}"
echo -e "Binaries installed to: ${GREEN}$BIN_DIR${NC}"
echo -e "Service files installed to: ${GREEN}$SERVICE_DIR${NC}"
echo -e "Configuration directory: ${GREEN}$CONFIG_DIR${NC}"
echo -e "Data directory: ${GREEN}$DATA_DIR${NC}"
echo -e "Log directory: ${GREEN}$LOG_DIR${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"

case "${OS_TYPE}" in
    Linux)
        echo "1. Start the daemon: sudo systemctl enable --now darkswap"
        echo "2. Check daemon status: sudo systemctl status darkswap"
        echo "3. Use the CLI: darkswap-cli --help"
        ;;
    macOS)
        echo "1. Start the daemon: sudo launchctl start com.darkswap.daemon"
        echo "2. Check daemon status: sudo launchctl list | grep com.darkswap.daemon"
        echo "3. Use the CLI: darkswap-cli --help"
        ;;
    Windows)
        echo "1. Install the service: Run PowerShell as Administrator and execute $SERVICE_DIR\\darkswap-service.ps1"
        echo "2. Check service status: Get-Service DarkSwapDaemon"
        echo "3. Use the CLI: $BIN_DIR\\darkswap-cli.exe --help"
        ;;
esac

echo -e "\n${GREEN}Thank you for installing DarkSwap Phase 2!${NC}"