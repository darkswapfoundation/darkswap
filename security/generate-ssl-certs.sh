#!/bin/bash

# DarkSwap SSL Certificate Generator
# This script generates self-signed SSL certificates for development and staging environments.
# For production, you should use certificates from a trusted certificate authority.

# Exit on error
set -e

# Default values
CERT_DIR="./certs"
DAYS_VALID=365
KEY_SIZE=2048
COUNTRY="US"
STATE="California"
LOCALITY="San Francisco"
ORGANIZATION="DarkSwap"
ORGANIZATIONAL_UNIT="Engineering"
COMMON_NAME="localhost"
EMAIL="admin@darkswap.io"
ENVIRONMENT="development"
DOMAINS=("localhost" "127.0.0.1")

# Help function
function show_help {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help                 Show this help message"
    echo "  -d, --cert-dir DIR         Directory to store certificates (default: ./certs)"
    echo "  -v, --days DAYS            Days the certificate is valid (default: 365)"
    echo "  -k, --key-size SIZE        Key size in bits (default: 2048)"
    echo "  -c, --country CODE         Country code (default: US)"
    echo "  -s, --state STATE          State or province (default: California)"
    echo "  -l, --locality LOCALITY    Locality or city (default: San Francisco)"
    echo "  -o, --org ORG              Organization (default: DarkSwap)"
    echo "  -u, --unit UNIT            Organizational unit (default: Engineering)"
    echo "  -n, --name NAME            Common name (default: localhost)"
    echo "  -e, --email EMAIL          Email address (default: admin@darkswap.io)"
    echo "  -E, --env ENVIRONMENT      Environment (development, staging, production) (default: development)"
    echo "  -D, --domains DOMAINS      Comma-separated list of domains (default: localhost,127.0.0.1)"
    echo ""
    echo "Example:"
    echo "  $0 --cert-dir ./certs --days 365 --env staging --domains 'staging.darkswap.io,api.staging.darkswap.io'"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--cert-dir)
            CERT_DIR="$2"
            shift
            shift
            ;;
        -v|--days)
            DAYS_VALID="$2"
            shift
            shift
            ;;
        -k|--key-size)
            KEY_SIZE="$2"
            shift
            shift
            ;;
        -c|--country)
            COUNTRY="$2"
            shift
            shift
            ;;
        -s|--state)
            STATE="$2"
            shift
            shift
            ;;
        -l|--locality)
            LOCALITY="$2"
            shift
            shift
            ;;
        -o|--org)
            ORGANIZATION="$2"
            shift
            shift
            ;;
        -u|--unit)
            ORGANIZATIONAL_UNIT="$2"
            shift
            shift
            ;;
        -n|--name)
            COMMON_NAME="$2"
            shift
            shift
            ;;
        -e|--email)
            EMAIL="$2"
            shift
            shift
            ;;
        -E|--env)
            ENVIRONMENT="$2"
            shift
            shift
            ;;
        -D|--domains)
            IFS=',' read -ra DOMAINS <<< "$2"
            shift
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Create certificate directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Set file names based on environment
KEY_FILE="$CERT_DIR/$ENVIRONMENT.key"
CERT_FILE="$CERT_DIR/$ENVIRONMENT.crt"
CSR_FILE="$CERT_DIR/$ENVIRONMENT.csr"
CONFIG_FILE="$CERT_DIR/$ENVIRONMENT.cnf"
DHPARAM_FILE="$CERT_DIR/dhparam.pem"

echo "Generating SSL certificates for $ENVIRONMENT environment..."
echo "Certificates will be stored in $CERT_DIR"

# Create OpenSSL config file with SAN
cat > "$CONFIG_FILE" << EOF
[req]
default_bits = $KEY_SIZE
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = $COUNTRY
ST = $STATE
L = $LOCALITY
O = $ORGANIZATION
OU = $ORGANIZATIONAL_UNIT
CN = $COMMON_NAME
emailAddress = $EMAIL

[req_ext]
subjectAltName = @alt_names

[alt_names]
EOF

# Add domains to config file
for i in "${!DOMAINS[@]}"; do
    echo "DNS.$((i+1)) = ${DOMAINS[$i]}" >> "$CONFIG_FILE"
done

# Generate private key
echo "Generating private key..."
openssl genrsa -out "$KEY_FILE" $KEY_SIZE

# Generate CSR
echo "Generating certificate signing request..."
openssl req -new -key "$KEY_FILE" -out "$CSR_FILE" -config "$CONFIG_FILE"

# Generate self-signed certificate
echo "Generating self-signed certificate..."
openssl x509 -req -in "$CSR_FILE" -signkey "$KEY_FILE" -out "$CERT_FILE" \
    -days $DAYS_VALID -sha256 -extensions req_ext -extfile "$CONFIG_FILE"

# Generate DH parameters for improved security (this may take a while)
echo "Generating DH parameters (this may take a while)..."
openssl dhparam -out "$DHPARAM_FILE" 2048

# Set appropriate permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"
chmod 644 "$DHPARAM_FILE"

# Clean up CSR and config file
rm "$CSR_FILE"
rm "$CONFIG_FILE"

echo "Certificate generation complete!"
echo "Private key: $KEY_FILE"
echo "Certificate: $CERT_FILE"
echo "DH parameters: $DHPARAM_FILE"

# Verify the certificate
echo ""
echo "Certificate information:"
openssl x509 -in "$CERT_FILE" -text -noout | grep -E 'Subject:|Issuer:|Not Before:|Not After:|DNS:'

echo ""
echo "To use these certificates with your web server, configure it to use:"
echo "  - Certificate file: $CERT_FILE"
echo "  - Private key file: $KEY_FILE"
echo "  - DH parameters file: $DHPARAM_FILE"

if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo "WARNING: This is a self-signed certificate generated for the production environment."
    echo "For production use, you should obtain a certificate from a trusted certificate authority."
fi