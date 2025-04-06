#!/bin/bash

# DarkSwap Security Testing Script
# This script runs various security tests on the DarkSwap application.

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TARGET_URL="http://localhost:3000"
OUTPUT_DIR="./security-reports"
SKIP_ZAP=false
SKIP_LIGHTHOUSE=false
SKIP_SSLLABS=false
SKIP_DEPENDENCY_CHECK=false
SKIP_SNYK=false
VERBOSE=false

# Help function
function show_help {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help                 Show this help message"
    echo "  -t, --target URL           Target URL to test (default: http://localhost:3000)"
    echo "  -o, --output-dir DIR       Directory to store reports (default: ./security-reports)"
    echo "  --skip-zap                 Skip OWASP ZAP tests"
    echo "  --skip-lighthouse          Skip Lighthouse security tests"
    echo "  --skip-ssllabs             Skip SSL Labs tests"
    echo "  --skip-dependency-check    Skip dependency checks"
    echo "  --skip-snyk                Skip Snyk vulnerability tests"
    echo "  -v, --verbose              Enable verbose output"
    echo ""
    echo "Example:"
    echo "  $0 --target https://staging.darkswap.io --output-dir ./reports"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--target)
            TARGET_URL="$2"
            shift
            shift
            ;;
        -o|--output-dir)
            OUTPUT_DIR="$2"
            shift
            shift
            ;;
        --skip-zap)
            SKIP_ZAP=true
            shift
            ;;
        --skip-lighthouse)
            SKIP_LIGHTHOUSE=true
            shift
            ;;
        --skip-ssllabs)
            SKIP_SSLLABS=true
            shift
            ;;
        --skip-dependency-check)
            SKIP_DEPENDENCY_CHECK=true
            shift
            ;;
        --skip-snyk)
            SKIP_SNYK=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Log function
function log {
    if [ "$VERBOSE" = true ] || [ "$2" = "important" ]; then
        case "$2" in
            "success")
                echo -e "${GREEN}[SUCCESS]${NC} $1"
                ;;
            "error")
                echo -e "${RED}[ERROR]${NC} $1"
                ;;
            "warning")
                echo -e "${YELLOW}[WARNING]${NC} $1"
                ;;
            "info"|"important")
                echo -e "${BLUE}[INFO]${NC} $1"
                ;;
            *)
                echo "$1"
                ;;
        esac
    fi
}

# Check if required tools are installed
function check_requirements {
    log "Checking requirements..." "important"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log "Docker is not installed. Please install Docker to run security tests." "error"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log "npm is not installed. Please install Node.js and npm to run security tests." "error"
        exit 1
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        log "curl is not installed. Please install curl to run security tests." "error"
        exit 1
    }
    
    log "All requirements satisfied." "success"
}

# Run OWASP ZAP tests
function run_zap_tests {
    if [ "$SKIP_ZAP" = true ]; then
        log "Skipping OWASP ZAP tests." "warning"
        return
    fi
    
    log "Running OWASP ZAP tests against $TARGET_URL..." "important"
    
    # Pull ZAP Docker image
    docker pull owasp/zap2docker-stable
    
    # Run ZAP baseline scan
    log "Running ZAP baseline scan..."
    docker run --rm -v "$OUTPUT_DIR:/zap/wrk" owasp/zap2docker-stable zap-baseline.py \
        -t "$TARGET_URL" \
        -g gen.conf \
        -r zap-baseline-report.html \
        -J zap-baseline-report.json
    
    # Run ZAP full scan if in verbose mode
    if [ "$VERBOSE" = true ]; then
        log "Running ZAP full scan (this may take a while)..."
        docker run --rm -v "$OUTPUT_DIR:/zap/wrk" owasp/zap2docker-stable zap-full-scan.py \
            -t "$TARGET_URL" \
            -g gen.conf \
            -r zap-full-scan-report.html \
            -J zap-full-scan-report.json
    fi
    
    log "OWASP ZAP tests completed. Reports saved to $OUTPUT_DIR" "success"
}

# Run Lighthouse security tests
function run_lighthouse_tests {
    if [ "$SKIP_LIGHTHOUSE" = true ]; then
        log "Skipping Lighthouse security tests." "warning"
        return
    fi
    
    log "Running Lighthouse security tests against $TARGET_URL..." "important"
    
    # Install Lighthouse if not already installed
    if ! command -v lighthouse &> /dev/null; then
        log "Installing Lighthouse..."
        npm install -g lighthouse
    fi
    
    # Run Lighthouse with security category
    lighthouse "$TARGET_URL" \
        --output html --output json \
        --output-path "$OUTPUT_DIR/lighthouse-report" \
        --only-categories=performance,accessibility,best-practices,seo,pwa
    
    log "Lighthouse tests completed. Reports saved to $OUTPUT_DIR" "success"
}

# Run SSL Labs tests
function run_ssllabs_tests {
    if [ "$SKIP_SSLLABS" = true ]; then
        log "Skipping SSL Labs tests." "warning"
        return
    fi
    
    # Only run SSL Labs tests on HTTPS URLs
    if [[ "$TARGET_URL" != https://* ]]; then
        log "SSL Labs tests can only be run on HTTPS URLs. Skipping." "warning"
        return
    fi
    
    log "Running SSL Labs tests against $TARGET_URL..." "important"
    
    # Extract domain from URL
    DOMAIN=$(echo "$TARGET_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
    
    # Run SSL Labs test
    curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN&startNew=on" > "$OUTPUT_DIR/ssllabs-report.json"
    
    # Wait for the test to complete
    while true; do
        STATUS=$(curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN" | jq -r '.status')
        if [ "$STATUS" = "READY" ] || [ "$STATUS" = "ERROR" ]; then
            break
        fi
        log "SSL Labs test in progress... (status: $STATUS)"
        sleep 10
    done
    
    # Get final results
    curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN" > "$OUTPUT_DIR/ssllabs-report.json"
    
    log "SSL Labs tests completed. Report saved to $OUTPUT_DIR/ssllabs-report.json" "success"
}

# Run dependency checks
function run_dependency_checks {
    if [ "$SKIP_DEPENDENCY_CHECK" = true ]; then
        log "Skipping dependency checks." "warning"
        return
    fi
    
    log "Running dependency checks..." "important"
    
    # Check npm dependencies
    log "Checking npm dependencies..."
    npm audit --json > "$OUTPUT_DIR/npm-audit-report.json" || true
    
    # Check Rust dependencies
    log "Checking Rust dependencies..."
    if command -v cargo-audit &> /dev/null; then
        cargo audit --json > "$OUTPUT_DIR/cargo-audit-report.json" || true
    else
        log "cargo-audit not installed. Install with: cargo install cargo-audit" "warning"
    fi
    
    log "Dependency checks completed. Reports saved to $OUTPUT_DIR" "success"
}

# Run Snyk vulnerability tests
function run_snyk_tests {
    if [ "$SKIP_SNYK" = true ]; then
        log "Skipping Snyk vulnerability tests." "warning"
        return
    fi
    
    log "Running Snyk vulnerability tests..." "important"
    
    # Check if Snyk is installed
    if ! command -v snyk &> /dev/null; then
        log "Snyk not installed. Installing..."
        npm install -g snyk
    fi
    
    # Check if authenticated with Snyk
    if ! snyk auth &> /dev/null; then
        log "Not authenticated with Snyk. Please run 'snyk auth' first." "warning"
        return
    fi
    
    # Run Snyk tests
    log "Testing npm dependencies..."
    snyk test --json > "$OUTPUT_DIR/snyk-npm-report.json" || true
    
    log "Snyk tests completed. Reports saved to $OUTPUT_DIR" "success"
}

# Generate summary report
function generate_summary {
    log "Generating summary report..." "important"
    
    SUMMARY_FILE="$OUTPUT_DIR/security-summary.md"
    
    # Create summary file
    cat > "$SUMMARY_FILE" << EOF
# DarkSwap Security Test Summary

**Date:** $(date)
**Target:** $TARGET_URL

## Overview

This report summarizes the results of security tests run against the DarkSwap application.

## Test Results
EOF
    
    # Add ZAP results if available
    if [ -f "$OUTPUT_DIR/zap-baseline-report.json" ]; then
        ALERTS=$(jq '.site[0].alerts | length' "$OUTPUT_DIR/zap-baseline-report.json")
        HIGH=$(jq '[.site[0].alerts[] | select(.riskcode >= 3)] | length' "$OUTPUT_DIR/zap-baseline-report.json")
        MEDIUM=$(jq '[.site[0].alerts[] | select(.riskcode == 2)] | length' "$OUTPUT_DIR/zap-baseline-report.json")
        LOW=$(jq '[.site[0].alerts[] | select(.riskcode == 1)] | length' "$OUTPUT_DIR/zap-baseline-report.json")
        INFO=$(jq '[.site[0].alerts[] | select(.riskcode == 0)] | length' "$OUTPUT_DIR/zap-baseline-report.json")
        
        cat >> "$SUMMARY_FILE" << EOF

### OWASP ZAP

- Total Alerts: $ALERTS
- High Risk: $HIGH
- Medium Risk: $MEDIUM
- Low Risk: $LOW
- Informational: $INFO

[Detailed Report](./zap-baseline-report.html)
EOF
    fi
    
    # Add Lighthouse results if available
    if [ -f "$OUTPUT_DIR/lighthouse-report.json" ]; then
        PERFORMANCE=$(jq '.categories.performance.score * 100' "$OUTPUT_DIR/lighthouse-report.json")
        ACCESSIBILITY=$(jq '.categories.accessibility.score * 100' "$OUTPUT_DIR/lighthouse-report.json")
        BEST_PRACTICES=$(jq '.categories["best-practices"].score * 100' "$OUTPUT_DIR/lighthouse-report.json")
        SEO=$(jq '.categories.seo.score * 100' "$OUTPUT_DIR/lighthouse-report.json")
        
        cat >> "$SUMMARY_FILE" << EOF

### Lighthouse

- Performance: $PERFORMANCE%
- Accessibility: $ACCESSIBILITY%
- Best Practices: $BEST_PRACTICES%
- SEO: $SEO%

[Detailed Report](./lighthouse-report.html)
EOF
    fi
    
    # Add SSL Labs results if available
    if [ -f "$OUTPUT_DIR/ssllabs-report.json" ]; then
        GRADE=$(jq -r '.endpoints[0].grade' "$OUTPUT_DIR/ssllabs-report.json")
        
        cat >> "$SUMMARY_FILE" << EOF

### SSL Labs

- Grade: $GRADE

[Detailed Report](./ssllabs-report.json)
EOF
    fi
    
    # Add npm audit results if available
    if [ -f "$OUTPUT_DIR/npm-audit-report.json" ]; then
        VULNERABILITIES=$(jq '.metadata.vulnerabilities.total' "$OUTPUT_DIR/npm-audit-report.json")
        HIGH=$(jq '.metadata.vulnerabilities.high' "$OUTPUT_DIR/npm-audit-report.json")
        MODERATE=$(jq '.metadata.vulnerabilities.moderate' "$OUTPUT_DIR/npm-audit-report.json")
        LOW=$(jq '.metadata.vulnerabilities.low' "$OUTPUT_DIR/npm-audit-report.json")
        
        cat >> "$SUMMARY_FILE" << EOF

### npm Audit

- Total Vulnerabilities: $VULNERABILITIES
- High: $HIGH
- Moderate: $MODERATE
- Low: $LOW

[Detailed Report](./npm-audit-report.json)
EOF
    fi
    
    # Add recommendations
    cat >> "$SUMMARY_FILE" << EOF

## Recommendations

Based on the test results, consider addressing the following:

1. Fix any high-risk vulnerabilities identified by OWASP ZAP
2. Update dependencies with known security issues
3. Improve SSL configuration if grade is below A
4. Address accessibility issues to ensure compliance with standards
EOF
    
    log "Summary report generated: $SUMMARY_FILE" "success"
}

# Main function
function main {
    log "Starting DarkSwap security tests..." "important"
    log "Target URL: $TARGET_URL" "important"
    log "Output directory: $OUTPUT_DIR" "important"
    
    # Check requirements
    check_requirements
    
    # Run tests
    run_zap_tests
    run_lighthouse_tests
    run_ssllabs_tests
    run_dependency_checks
    run_snyk_tests
    
    # Generate summary
    generate_summary
    
    log "All security tests completed. Reports saved to $OUTPUT_DIR" "success"
}

# Run main function
main