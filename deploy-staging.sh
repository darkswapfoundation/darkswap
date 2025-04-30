#!/bin/bash
# DarkSwap Staging Deployment Script

set -e

# Configuration
STAGING_SERVER="staging.darkswap.io"
SSH_USER="deploy"
SSH_KEY="~/.ssh/darkswap_deploy_key"
REMOTE_DIR="/var/www/darkswap-staging"
S3_BUCKET="s3://staging-darkswap-web"
CLOUDFRONT_DISTRIBUTION_ID="E1A2B3C4D5E6F7"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}   DarkSwap Staging Deployment Script    ${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if SSH key exists
if [ ! -f $(eval echo $SSH_KEY) ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    exit 1
fi

# Parse command line arguments
DEPLOY_WEB=false
DEPLOY_BACKEND=false
DEPLOY_ALL=false

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --web)
            DEPLOY_WEB=true
            shift
            ;;
        --backend)
            DEPLOY_BACKEND=true
            shift
            ;;
        --all)
            DEPLOY_ALL=true
            shift
            ;;
        --version)
            VERSION="$2"
            shift
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--web] [--backend] [--all] [--version VERSION]"
            exit 1
            ;;
    esac
done

# If no specific deployment option is selected, deploy all
if [ "$DEPLOY_WEB" = false ] && [ "$DEPLOY_BACKEND" = false ] && [ "$DEPLOY_ALL" = false ]; then
    DEPLOY_ALL=true
fi

# If deploy all is selected, set both web and backend to true
if [ "$DEPLOY_ALL" = true ]; then
    DEPLOY_WEB=true
    DEPLOY_BACKEND=true
fi

# Set version if not provided
if [ -z "$VERSION" ]; then
    VERSION=$(git describe --tags --always)
    echo -e "${YELLOW}No version specified, using git tag/commit: $VERSION${NC}"
fi

# Build web app
if [ "$DEPLOY_WEB" = true ]; then
    echo -e "${GREEN}Building web app...${NC}"
    cd web
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm ci
    echo -e "${YELLOW}Building for staging environment...${NC}"
    REACT_APP_ENV=staging REACT_APP_VERSION=$VERSION npm run build
    cd ..
    
    echo -e "${GREEN}Optimizing WebAssembly...${NC}"
    ./darkswap-bridge/optimize-wasm.sh
    
    echo -e "${GREEN}Deploying web app to S3...${NC}"
    aws s3 sync web/build/ $S3_BUCKET --delete
    
    echo -e "${GREEN}Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
fi

# Build and deploy backend
if [ "$DEPLOY_BACKEND" = true ]; then
    echo -e "${GREEN}Building backend components...${NC}"
    
    echo -e "${YELLOW}Building SDK...${NC}"
    cd darkswap-sdk
    ./build.sh --release
    cd ..
    
    echo -e "${YELLOW}Building daemon...${NC}"
    cd darkswap-daemon
    cargo build --release
    cd ..
    
    echo -e "${YELLOW}Building CLI...${NC}"
    cd darkswap-cli
    cargo build --release
    cd ..
    
    echo -e "${GREEN}Deploying backend to staging server...${NC}"
    echo -e "${YELLOW}Creating deployment package...${NC}"
    mkdir -p deploy
    cp target/release/darkswap-daemon deploy/
    cp target/release/darkswap-cli deploy/
    cp -r target/wasm32-unknown-unknown/release/*.wasm deploy/
    cp -r config/staging.js deploy/config.js
    
    echo -e "${YELLOW}Creating version file...${NC}"
    echo "$VERSION" > deploy/VERSION
    
    echo -e "${YELLOW}Compressing deployment package...${NC}"
    tar -czf deploy.tar.gz -C deploy .
    
    echo -e "${YELLOW}Uploading to staging server...${NC}"
    scp -i $(eval echo $SSH_KEY) deploy.tar.gz $SSH_USER@$STAGING_SERVER:/tmp/
    
    echo -e "${YELLOW}Deploying on staging server...${NC}"
    ssh -i $(eval echo $SSH_KEY) $SSH_USER@$STAGING_SERVER << EOF
        set -e
        echo "Stopping services..."
        sudo systemctl stop darkswap-daemon.service || true
        
        echo "Extracting deployment package..."
        sudo mkdir -p $REMOTE_DIR
        sudo tar -xzf /tmp/deploy.tar.gz -C $REMOTE_DIR
        
        echo "Setting permissions..."
        sudo chown -R darkswap:darkswap $REMOTE_DIR
        sudo chmod +x $REMOTE_DIR/darkswap-daemon
        sudo chmod +x $REMOTE_DIR/darkswap-cli
        
        echo "Starting services..."
        sudo systemctl start darkswap-daemon.service
        
        echo "Cleaning up..."
        rm /tmp/deploy.tar.gz
EOF
    
    echo -e "${YELLOW}Cleaning up local files...${NC}"
    rm -rf deploy
    rm -f deploy.tar.gz
fi

# Verify deployment
echo -e "${GREEN}Verifying deployment...${NC}"

if [ "$DEPLOY_WEB" = true ]; then
    echo -e "${YELLOW}Checking web app...${NC}"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.darkswap.io)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}Web app is up and running!${NC}"
    else
        echo -e "${RED}Web app returned HTTP status $HTTP_STATUS${NC}"
    fi
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    echo -e "${YELLOW}Checking backend services...${NC}"
    ssh -i $(eval echo $SSH_KEY) $SSH_USER@$STAGING_SERVER << EOF
        set -e
        if systemctl is-active --quiet darkswap-daemon.service; then
            echo "Daemon is running"
            DEPLOYED_VERSION=\$(cat $REMOTE_DIR/VERSION)
            echo "Deployed version: \$DEPLOYED_VERSION"
        else
            echo "Daemon is not running"
            exit 1
        fi
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Backend services are up and running!${NC}"
    else
        echo -e "${RED}Backend services verification failed${NC}"
    fi
fi

echo -e "${GREEN}Deployment to staging completed successfully!${NC}"
echo -e "${YELLOW}Version: $VERSION${NC}"
echo -e "${YELLOW}Timestamp: $(date)${NC}"