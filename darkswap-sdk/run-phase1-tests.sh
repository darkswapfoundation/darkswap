#!/bin/bash

# Script to run all Phase 1 tests and benchmarks
# This script is part of the DarkSwap Phase 1 completion

set -e  # Exit on any error

echo "===== DarkSwap Phase 1 Tests and Benchmarks ====="
echo ""

# Create directories if they don't exist
mkdir -p target/test-results
mkdir -p target/benchmark-results

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Running unit tests${NC}"
echo "----------------------------------------"

# Run network tests
echo -e "${YELLOW}Running network tests...${NC}"
cargo test --package darkswap-sdk --test network_tests -- --nocapture
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Network tests passed!${NC}"
else
    echo -e "${RED}Network tests failed!${NC}"
    exit 1
fi

# Run orderbook tests
echo -e "${YELLOW}Running orderbook tests...${NC}"
cargo test --package darkswap-sdk --test orderbook_tests -- --nocapture
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Orderbook tests passed!${NC}"
else
    echo -e "${RED}Orderbook tests failed!${NC}"
    exit 1
fi

# Run trade tests
echo -e "${YELLOW}Running trade tests...${NC}"
cargo test --package darkswap-sdk --test trade_tests -- --nocapture
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Trade tests passed!${NC}"
else
    echo -e "${RED}Trade tests failed!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Running benchmarks${NC}"
echo "----------------------------------------"

# Run network benchmarks
echo -e "${YELLOW}Running network benchmarks...${NC}"
cargo bench --package darkswap-sdk --bench network_benchmarks -- --output-format bencher | tee target/benchmark-results/network-benchmarks.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Network benchmarks completed!${NC}"
else
    echo -e "${RED}Network benchmarks failed!${NC}"
    exit 1
fi

# Run orderbook benchmarks
echo -e "${YELLOW}Running orderbook benchmarks...${NC}"
cargo bench --package darkswap-sdk --bench orderbook_benchmarks -- --output-format bencher | tee target/benchmark-results/orderbook-benchmarks.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Orderbook benchmarks completed!${NC}"
else
    echo -e "${RED}Orderbook benchmarks failed!${NC}"
    exit 1
fi

# Run trade benchmarks
echo -e "${YELLOW}Running trade benchmarks...${NC}"
cargo bench --package darkswap-sdk --bench trade_benchmarks -- --output-format bencher | tee target/benchmark-results/trade-benchmarks.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Trade benchmarks completed!${NC}"
else
    echo -e "${RED}Trade benchmarks failed!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Running examples${NC}"
echo "----------------------------------------"

# Run predicate alkanes example
echo -e "${YELLOW}Running predicate alkanes example...${NC}"
cargo run --package darkswap-sdk --example predicate_alkanes_example
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Predicate alkanes example completed!${NC}"
else
    echo -e "${RED}Predicate alkanes example failed!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 4: Generating documentation${NC}"
echo "----------------------------------------"

# Generate documentation
echo -e "${YELLOW}Generating documentation...${NC}"
cargo doc --package darkswap-sdk --no-deps
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Documentation generated!${NC}"
else
    echo -e "${RED}Documentation generation failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}===== All Phase 1 tests and benchmarks completed successfully! =====${NC}"
echo ""
echo "Summary:"
echo "- All unit tests passed"
echo "- All benchmarks completed"
echo "- Example ran successfully"
echo "- Documentation generated"
echo ""
echo "Phase 1 is now complete!"