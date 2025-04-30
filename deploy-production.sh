#!/bin/bash
# DarkSwap Production Deployment Script

set -e

# Configuration
PRODUCTION_SERVER="darkswap.io"
SSH_USER="deploy"
SSH_KEY="~/.ssh/darkswap_deploy_key"
REMOTE_DIR="/var/www/darkswap-production"
S3_BUCKET="s3://darkswap-web"
CLOUDFRONT_DISTRIBUTION_ID="F1G2H3I4J5K6L"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}   DarkSwap Production Deployment Script  ${NC}"
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
        --skip-confirmation)
            SKIP_CONFIRMATION=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--web] [--backend] [--all] [--version VERSION] [--skip-confirmation]"
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

# Check if version is provided
if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Version must be specified for production deployment${NC}"
    echo "Usage: $0 [--web] [--backend] [--all] --version VERSION [--skip-confirmation]"
    exit 1
fi

# Confirm deployment to production
if [ "$SKIP_CONFIRMATION" != true ]; then
    echo -e "${YELLOW}You are about to deploy version $VERSION to PRODUCTION.${NC}"
    echo -e "${YELLOW}This will affect real users. Are you sure? (y/n)${NC}"
    read -r confirmation
    if [[ ! "$confirmation" =~ ^[yY]$ ]]; then
        echo -e "${RED}Deployment cancelled.${NC}"
        exit 1
    fi
fi

# Check if the version exists as a git tag
if ! git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo -e "${RED}Error: Version $VERSION does not exist as a git tag or commit${NC}"
    exit 1
fi

# Checkout the specified version
echo -e "${GREEN}Checking out version $VERSION...${NC}"
git checkout "$VERSION"

# Build web app
if [ "$DEPLOY_WEB" = true ]; then
    echo -e "${GREEN}Building web app...${NC}"
    cd web
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm ci
    echo -e "${YELLOW}Building for production environment...${NC}"
    REACT_APP_ENV=production REACT_APP_VERSION=$VERSION npm run build
    cd ..
    
    echo -e "${GREEN}Optimizing WebAssembly...${NC}"
    ./darkswap-bridge/optimize-wasm.sh
    
    echo -e "${GREEN}Running tests...${NC}"
    cd web
    npm test -- --watchAll=false
    cd ..
    
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
    
    echo -e "${YELLOW}Running tests...${NC}"
    cargo test --release --all
    
    echo -e "${GREEN}Deploying backend to production server...${NC}"
    echo -e "${YELLOW}Creating deployment package...${NC}"
    mkdir -p deploy
    cp target/release/darkswap-daemon deploy/
    cp target/release/darkswap-cli deploy/
    cp -r target/wasm32-unknown-unknown/release/*.wasm deploy/
    cp -r config/production.js deploy/config.js
    
    echo -e "${YELLOW}Creating version file...${NC}"
    echo "$VERSION" > deploy/VERSION
    
    echo -e "${YELLOW}Compressing deployment package...${NC}"
    tar -czf deploy.tar.gz -C deploy .
    
    echo -e "${YELLOW}Uploading to production server...${NC}"
    scp -i $(eval echo $SSH_KEY) deploy.tar.gz $SSH_USER@$PRODUCTION_SERVER:/tmp/
    
    echo -e "${YELLOW}Deploying on production server...${NC}"
    ssh -i $(eval echo $SSH_KEY) $SSH_USER@$PRODUCTION_SERVER << EOF
        set -e
        echo "Creating backup..."
        BACKUP_DIR="$REMOTE_DIR-backup-\$(date +%Y%m%d-%H%M%S)"
        sudo cp -r $REMOTE_DIR \$BACKUP_DIR
        
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

# Create git tag if it doesn't exist
if ! git rev-parse "v$VERSION" >/dev/null 2>&1; then
    echo -e "${GREEN}Creating git tag v$VERSION...${NC}"
    git tag -a "v$VERSION" -m "Production release v$VERSION"
    git push origin "v$VERSION"
fi

# Create GitHub release
echo -e "${GREEN}Creating GitHub release...${NC}"
gh release create "v$VERSION" --title "DarkSwap v$VERSION" --notes "Production release of DarkSwap v$VERSION"

# Verify deployment
echo -e "${GREEN}Verifying deployment...${NC}"

if [ "$DEPLOY_WEB" = true ]; then
    echo -e "${YELLOW}Checking web app...${NC}"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://darkswap.io)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}Web app is up and running!${NC}"
    else
        echo -e "${RED}Web app returned HTTP status $HTTP_STATUS${NC}"
    fi
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    echo -e "${YELLOW}Checking backend services...${NC}"
    ssh -i $(eval echo $SSH_KEY) $SSH_USER@$PRODUCTION_SERVER << EOF
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

# Send notification
echo -e "${GREEN}Sending deployment notification...${NC}"
curl -X POST -H "Content-Type: application/json" -d "{\"text\":\"DarkSwap v$VERSION has been deployed to production.\"}" $SLACK_WEBHOOK_URL

echo -e "${GREEN}Deployment to production completed successfully!${NC}"
echo -e "${YELLOW}Version: $VERSION${NC}"
echo -e "${YELLOW}Timestamp: $(date)${NC}"