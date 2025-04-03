#!/bin/bash

# DarkSwap Security Tests Runner
# This script runs all the tests for the security enhancements

# Exit on error
set -e

# Print commands
set -x

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running DarkSwap Security Tests${NC}"
echo "=================================="

# Run frontend tests
echo -e "${YELLOW}Running Frontend Tests${NC}"
cd web
npm test -- --testPathPattern=validation
cd ..
echo -e "${GREEN}Frontend Tests Passed${NC}"
echo ""

# Run backend tests
echo -e "${YELLOW}Running Backend Tests${NC}"
cd darkswap-daemon

# Run middleware tests
echo -e "${YELLOW}Running Middleware Tests${NC}"
cargo test --package darkswap-daemon --lib middleware::tests::auth_tests
cargo test --package darkswap-daemon --lib middleware::tests::error_handler_tests
cargo test --package darkswap-daemon --lib middleware::tests::logger_tests
cargo test --package darkswap-daemon --lib middleware::tests::rate_limiter_tests
echo -e "${GREEN}Middleware Tests Passed${NC}"
echo ""

# Run controller tests
echo -e "${YELLOW}Running Controller Tests${NC}"
cargo test --package darkswap-daemon --lib controllers::tests::auth_tests
cargo test --package darkswap-daemon --lib controllers::tests::health_tests
echo -e "${GREEN}Controller Tests Passed${NC}"
echo ""

cd ..
echo -e "${GREEN}All Security Tests Passed${NC}"
echo "=================================="

# Run security audit
echo -e "${YELLOW}Running Security Audit${NC}"
cd web
npm audit
cd ..
cd darkswap-daemon
cargo audit
cd ..
echo -e "${GREEN}Security Audit Completed${NC}"
echo "=================================="

echo -e "${GREEN}All Tests and Audits Completed Successfully${NC}"