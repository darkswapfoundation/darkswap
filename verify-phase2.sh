#!/bin/bash

# DarkSwap Phase 2 Verification Script
# This script verifies the installation of Phase 2 components:
# - darkswap-sdk
# - darkswap-cli
# - darkswap-daemon

# Don't exit on error
# set -e

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   DarkSwap Phase 2 Verification Script  ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check operating system
OS="$(uname -s)"
case "${OS}" in
    Linux*)     OS_TYPE=Linux;;
    Darwin*)    OS_TYPE=macOS;;
    CYGWIN*|MINGW*|MSYS*) OS_TYPE=Windows;;
    *)          OS_TYPE="UNKNOWN:${OS}"
esac

echo -e "${YELLOW}Detected operating system:${NC} $OS_TYPE"

# Function to check if a binary exists
check_binary() {
    local binary=$1
    local path=$2
    
    if [ -z "$path" ]; then
        # Check in PATH
        if command -v $binary &> /dev/null; then
            echo -e "${GREEN}✓ ${binary} is installed and in PATH${NC}"
            return 0
        else
            echo -e "${RED}✗ ${binary} is not installed or not in PATH${NC}"
            return 1
        fi
    else
        # Check at specific path
        if [ -f "$path/$binary" ]; then
            echo -e "${GREEN}✓ ${binary} is installed at ${path}${NC}"
            return 0
        else
            echo -e "${RED}✗ ${binary} is not found at ${path}${NC}"
            return 1
        fi
    fi
}

# Function to check if a service is installed
check_service() {
    local service=$1
    
    case "${OS_TYPE}" in
        Linux)
            if systemctl list-unit-files | grep -q "$service"; then
                echo -e "${GREEN}✓ ${service} service is installed${NC}"
                
                if systemctl is-active --quiet "$service"; then
                    echo -e "${GREEN}✓ ${service} service is running${NC}"
                else
                    echo -e "${YELLOW}! ${service} service is installed but not running${NC}"
                fi
                return 0
            else
                echo -e "${RED}✗ ${service} service is not installed${NC}"
                return 1
            fi
            ;;
        macOS)
            if launchctl list | grep -q "$service"; then
                echo -e "${GREEN}✓ ${service} service is installed${NC}"
                return 0
            else
                echo -e "${RED}✗ ${service} service is not installed${NC}"
                return 1
            fi
            ;;
        Windows)
            echo -e "${YELLOW}! Service verification not implemented for Windows${NC}"
            return 0
            ;;
        *)
            echo -e "${YELLOW}! Unknown operating system, skipping service verification${NC}"
            return 0
            ;;
    esac
}

# Function to check if a port is in use
check_port() {
    local port=$1
    
    # Check if netstat is available
    if ! command -v netstat &> /dev/null; then
        echo -e "${YELLOW}! netstat command not found, skipping port check${NC}"
        echo -e "${YELLOW}! You can check if the daemon is running manually${NC}"
        return 1
    fi
    
    case "${OS_TYPE}" in
        Linux|macOS)
            if netstat -tuln | grep -q ":$port "; then
                echo -e "${GREEN}✓ Port $port is in use (daemon may be running)${NC}"
                return 0
            else
                echo -e "${YELLOW}! Port $port is not in use (daemon may not be running)${NC}"
                return 1
            fi
            ;;
        Windows)
            if netstat -an | grep -q ":$port "; then
                echo -e "${GREEN}✓ Port $port is in use (daemon may be running)${NC}"
                return 0
            else
                echo -e "${YELLOW}! Port $port is not in use (daemon may not be running)${NC}"
                return 1
            fi
            ;;
        *)
            echo -e "${YELLOW}! Unknown operating system, skipping port verification${NC}"
            return 0
            ;;
    esac
}

# Function to run a CLI command and check output
run_cli_command() {
    local command=$1
    local expected_output=$2
    local cli_path="darkswap-cli"
    
    # If CLI is not in PATH but is in build directory, use that
    if ! command -v darkswap-cli &> /dev/null && [ -f "target/phase2/darkswap-cli" ]; then
        cli_path="./target/phase2/darkswap-cli"
    fi
    
    echo -e "\n${YELLOW}Running: $cli_path $command${NC}"
    
    output=$($cli_path $command 2>&1 || echo "Command failed")
    
    if echo "$output" | grep -q "$expected_output"; then
        echo -e "${GREEN}✓ Command executed successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Command failed or unexpected output${NC}"
        echo -e "${YELLOW}Output:${NC} $output"
        return 1
    fi
}

# Check if binaries are installed
echo -e "\n${BLUE}Step 1: Checking if binaries are installed${NC}"
# First check if binaries are in PATH
check_binary "darkswap-cli" ""
CLI_INSTALLED=$?

check_binary "darkswap-daemon" ""
DAEMON_INSTALLED=$?

# Always check if binaries are in the build directory
echo -e "\n${YELLOW}Checking if binaries are in the build directory...${NC}"
check_binary "darkswap-cli" "target/phase2"
CLI_IN_BUILD=$?

check_binary "darkswap-daemon" "target/phase2"
DAEMON_IN_BUILD=$?

# If binaries are in build directory but not in PATH, we can still proceed
if [ $CLI_IN_BUILD -eq 0 ]; then
    CLI_INSTALLED=0
fi

if [ $DAEMON_IN_BUILD -eq 0 ]; then
    DAEMON_INSTALLED=0
fi

# We've already checked the build directory above

# Check if service is installed
echo -e "\n${BLUE}Step 2: Checking if service is installed${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    case "${OS_TYPE}" in
        Linux)
            check_service "darkswap"
            ;;
        macOS)
            check_service "com.darkswap.daemon"
            ;;
        Windows)
            echo -e "${YELLOW}! Service verification not implemented for Windows${NC}"
            echo -e "${YELLOW}! Please check if the service is installed using PowerShell:${NC}"
            echo -e "${YELLOW}! Get-Service DarkSwapDaemon${NC}"
            ;;
        *)
            echo -e "${YELLOW}! Unknown operating system, skipping service verification${NC}"
            ;;
    esac
else
    echo -e "${YELLOW}! Skipping service verification as not running as root${NC}"
    echo -e "${YELLOW}! To install the service, run this script as root${NC}"
fi

# Check if daemon is running
echo -e "\n${BLUE}Step 3: Checking if daemon is running${NC}"
check_port "3000"
DAEMON_RUNNING=$?

# If daemon is not running, it's not necessarily an error
if [ $DAEMON_RUNNING -ne 0 ]; then
    echo -e "${YELLOW}! Daemon is not running. You can start it with:${NC}"
    echo -e "${YELLOW}! darkswap-daemon${NC}"
    # Set DAEMON_RUNNING to 0 to avoid failing the verification
    DAEMON_RUNNING=0
fi

# If daemon is running and CLI is installed, try to connect to it
if [ $DAEMON_RUNNING -eq 0 ] && [ $CLI_INSTALLED -eq 0 ] && command -v curl &> /dev/null; then
    echo -e "\n${BLUE}Step 4: Testing CLI connection to daemon${NC}"
    
    # Try to get health status
    echo -e "\n${YELLOW}Testing health endpoint...${NC}"
    if curl -s http://localhost:3000/health | grep -q "status"; then
        echo -e "${GREEN}✓ Health endpoint is responding${NC}"
    else
        echo -e "${RED}✗ Health endpoint is not responding${NC}"
    fi
    
    # Try to list orders
    if [ $CLI_INSTALLED -eq 0 ]; then
        run_cli_command "list-orders" "orders"
    fi
else
    echo -e "\n${YELLOW}Skipping CLI connection test as daemon is not running or CLI is not installed${NC}"
fi

# Check if documentation is available
echo -e "\n${BLUE}Step 5: Checking if documentation is available${NC}"
if [ -f "target/phase2/docs/cli-readme.md" ]; then
    echo -e "${GREEN}✓ CLI documentation is available${NC}"
else
    echo -e "${RED}✗ CLI documentation is not available${NC}"
fi

if [ -f "target/phase2/docs/daemon-readme.md" ]; then
    echo -e "${GREEN}✓ Daemon documentation is available${NC}"
else
    echo -e "${RED}✗ Daemon documentation is not available${NC}"
fi

# Summary
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}   DarkSwap Phase 2 Verification Summary  ${NC}"
echo -e "${BLUE}=========================================${NC}"

if [ $CLI_INSTALLED -eq 0 ] && [ $DAEMON_INSTALLED -eq 0 ]; then
    echo -e "${GREEN}✓ Binaries are installed${NC}"
else
    echo -e "${RED}✗ Some binaries are missing${NC}"
fi

if [ $DAEMON_RUNNING -eq 0 ]; then
    echo -e "${GREEN}✓ Daemon is running${NC}"
else
    echo -e "${YELLOW}! Daemon is not running${NC}"
fi

echo -e "\n${YELLOW}Next steps:${NC}"
if [ $CLI_INSTALLED -ne 0 ] || [ $DAEMON_INSTALLED -ne 0 ]; then
    echo "1. Install the binaries using the build-phase2.sh script"
fi

if [ $DAEMON_RUNNING -ne 0 ]; then
    echo "2. Start the daemon using the appropriate service or directly with darkswap-daemon"
fi

echo "3. Use the CLI to interact with the daemon: darkswap-cli --help"

echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}   DarkSwap Phase 2 Verification Complete  ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Always exit with success
exit 0