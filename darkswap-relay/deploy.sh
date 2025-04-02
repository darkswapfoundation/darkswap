#!/bin/bash

# DarkSwap Relay Server Deployment Script
# This script deploys the relay server to a remote server

set -e

# Configuration
REMOTE_HOST=${REMOTE_HOST:-"example.com"}
REMOTE_USER=${REMOTE_USER:-"root"}
REMOTE_DIR=${REMOTE_DIR:-"/opt/darkswap-relay"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}
BUILD_TYPE=${BUILD_TYPE:-"release"}
CONFIG_FILE=${CONFIG_FILE:-"config.toml"}
DOCKER=${DOCKER:-"true"}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            REMOTE_HOST=$2
            shift 2
            ;;
        --user)
            REMOTE_USER=$2
            shift 2
            ;;
        --dir)
            REMOTE_DIR=$2
            shift 2
            ;;
        --key)
            SSH_KEY=$2
            shift 2
            ;;
        --release)
            BUILD_TYPE="release"
            shift
            ;;
        --debug)
            BUILD_TYPE="debug"
            shift
            ;;
        --config)
            CONFIG_FILE=$2
            shift 2
            ;;
        --docker)
            DOCKER="true"
            shift
            ;;
        --no-docker)
            DOCKER="false"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --host HOST       Remote host (default: example.com)"
            echo "  --user USER       Remote user (default: root)"
            echo "  --dir DIR         Remote directory (default: /opt/darkswap-relay)"
            echo "  --key KEY         SSH key (default: ~/.ssh/id_rsa)"
            echo "  --release         Build in release mode (default)"
            echo "  --debug           Build in debug mode"
            echo "  --config FILE     Use the specified config file (default: config.toml)"
            echo "  --docker          Deploy using Docker (default)"
            echo "  --no-docker       Deploy without Docker"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if the remote host is specified
if [ "$REMOTE_HOST" == "example.com" ]; then
    log_error "Remote host not specified. Use --host option or set REMOTE_HOST environment variable."
    exit 1
fi

# Build the relay server
if [ "$DOCKER" == "true" ]; then
    log_info "Building Docker image"
    docker build -t darkswap-relay .
    
    # Save the Docker image
    log_info "Saving Docker image"
    docker save darkswap-relay | gzip > darkswap-relay.tar.gz
    
    # Copy the Docker image to the remote server
    log_info "Copying Docker image to remote server"
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_DIR"
    scp -i "$SSH_KEY" darkswap-relay.tar.gz "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
    
    # Copy the Docker Compose file to the remote server
    log_info "Copying Docker Compose file to remote server"
    scp -i "$SSH_KEY" docker-compose.yml "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
    
    # Copy the configuration file to the remote server
    log_info "Copying configuration file to remote server"
    scp -i "$SSH_KEY" "$CONFIG_FILE" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/config.toml"
    
    # Copy the Prometheus configuration file to the remote server
    log_info "Copying Prometheus configuration file to remote server"
    scp -i "$SSH_KEY" prometheus.yml "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
    
    # Load the Docker image on the remote server
    log_info "Loading Docker image on remote server"
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker load < darkswap-relay.tar.gz"
    
    # Start the Docker containers
    log_info "Starting Docker containers"
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose up -d"
    
    # Clean up
    log_info "Cleaning up"
    rm darkswap-relay.tar.gz
else
    log_info "Building relay server in $BUILD_TYPE mode"
    if [ "$BUILD_TYPE" == "release" ]; then
        cargo build --release
        BINARY=target/release/darkswap-relay
    else
        cargo build
        BINARY=target/debug/darkswap-relay
    fi
    
    # Create the remote directory
    log_info "Creating remote directory"
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_DIR"
    
    # Copy the binary to the remote server
    log_info "Copying binary to remote server"
    scp -i "$SSH_KEY" "$BINARY" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
    
    # Copy the configuration file to the remote server
    log_info "Copying configuration file to remote server"
    scp -i "$SSH_KEY" "$CONFIG_FILE" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/config.toml"
    
    # Copy the certificate generator to the remote server
    log_info "Copying certificate generator to remote server"
    scp -i "$SSH_KEY" generate-certs.sh "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
    
    # Generate certificates on the remote server
    log_info "Generating certificates on remote server"
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && chmod +x generate-certs.sh && ./generate-certs.sh"
    
    # Copy the systemd service file to the remote server
    log_info "Copying systemd service file to remote server"
    scp -i "$SSH_KEY" darkswap-relay.service "$REMOTE_USER@$REMOTE_HOST:/etc/systemd/system/"
    
    # Reload systemd and start the service
    log_info "Reloading systemd and starting the service"
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "systemctl daemon-reload && systemctl enable darkswap-relay && systemctl restart darkswap-relay"
fi

log_info "Deployment complete"