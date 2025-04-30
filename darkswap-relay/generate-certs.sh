#!/bin/bash

# DarkSwap Relay Server Certificate Generator
# This script generates certificates for WebRTC

set -e

# Configuration
CERT_DIR=${CERT_DIR:-certs}
CERT_FILE=${CERT_FILE:-cert.pem}
KEY_FILE=${KEY_FILE:-key.pem}
DAYS=${DAYS:-365}
COUNTRY=${COUNTRY:-US}
STATE=${STATE:-CA}
LOCALITY=${LOCALITY:-San Francisco}
ORGANIZATION=${ORGANIZATION:-DarkSwap}
COMMON_NAME=${COMMON_NAME:-localhost}

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
        --cert-dir)
            CERT_DIR=$2
            shift 2
            ;;
        --cert-file)
            CERT_FILE=$2
            shift 2
            ;;
        --key-file)
            KEY_FILE=$2
            shift 2
            ;;
        --days)
            DAYS=$2
            shift 2
            ;;
        --country)
            COUNTRY=$2
            shift 2
            ;;
        --state)
            STATE=$2
            shift 2
            ;;
        --locality)
            LOCALITY=$2
            shift 2
            ;;
        --organization)
            ORGANIZATION=$2
            shift 2
            ;;
        --common-name)
            COMMON_NAME=$2
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --cert-dir DIR       Directory to store certificates (default: certs)"
            echo "  --cert-file FILE     Certificate file name (default: cert.pem)"
            echo "  --key-file FILE      Key file name (default: key.pem)"
            echo "  --days DAYS          Certificate validity in days (default: 365)"
            echo "  --country CODE       Country code (default: US)"
            echo "  --state STATE        State or province (default: CA)"
            echo "  --locality LOCALITY  Locality (default: San Francisco)"
            echo "  --organization ORG   Organization (default: DarkSwap)"
            echo "  --common-name NAME   Common name (default: localhost)"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create the certificate directory if it doesn't exist
mkdir -p $CERT_DIR

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null; then
    log_error "OpenSSL is not installed. Please install OpenSSL and try again."
    exit 1
fi

# Generate the certificate
log_info "Generating certificate for $COMMON_NAME"
log_info "Certificate will be valid for $DAYS days"
log_info "Certificate will be stored in $CERT_DIR/$CERT_FILE"
log_info "Key will be stored in $CERT_DIR/$KEY_FILE"

# Create the OpenSSL configuration
cat > $CERT_DIR/openssl.cnf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = $COUNTRY
ST = $STATE
L = $LOCALITY
O = $ORGANIZATION
CN = $COMMON_NAME

[v3_req]
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth

[alt_names]
DNS.1 = $COMMON_NAME
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF

# Generate the certificate
openssl req -x509 -nodes -days $DAYS -newkey rsa:2048 \
    -keyout $CERT_DIR/$KEY_FILE \
    -out $CERT_DIR/$CERT_FILE \
    -config $CERT_DIR/openssl.cnf

# Clean up
rm $CERT_DIR/openssl.cnf

# Set permissions
chmod 600 $CERT_DIR/$KEY_FILE
chmod 644 $CERT_DIR/$CERT_FILE

log_info "Certificate generation complete"