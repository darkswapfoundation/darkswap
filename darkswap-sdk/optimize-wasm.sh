#!/bin/bash

# Script to analyze and optimize WebAssembly binary size for DarkSwap SDK

# Exit on error
set -e

# Print commands
set -x

# Check if wasm-opt is installed
if ! command -v wasm-opt &> /dev/null; then
    echo "wasm-opt not found. Installing binaryen..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y binaryen
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install binaryen
    else
        echo "Unsupported OS. Please install binaryen manually: https://github.com/WebAssembly/binaryen"
        exit 1
    fi
fi

# Check if wasm-snip is installed
if ! command -v wasm-snip &> /dev/null; then
    echo "wasm-snip not found. Installing..."
    cargo install wasm-snip
fi

# Check if twiggy is installed
if ! command -v twiggy &> /dev/null; then
    echo "twiggy not found. Installing..."
    cargo install twiggy
fi

# Create output directory
mkdir -p target/wasm-analysis

# Build the WebAssembly module in release mode
echo "Building WebAssembly module in release mode..."
RUSTFLAGS="-C link-arg=-s" \
wasm-pack build \
    --target web \
    --release \
    --out-dir target/wasm-release \
    -- \
    --features "wasm" \
    --no-default-features

# Analyze the original WebAssembly binary size
echo "Analyzing original WebAssembly binary size..."
ORIGINAL_SIZE=$(stat -c %s target/wasm-release/darkswap_sdk_bg.wasm 2>/dev/null || stat -f %z target/wasm-release/darkswap_sdk_bg.wasm)
echo "Original size: $ORIGINAL_SIZE bytes"

# Analyze the WebAssembly binary with twiggy
echo "Analyzing WebAssembly binary with twiggy..."
twiggy top -n 20 target/wasm-release/darkswap_sdk_bg.wasm > target/wasm-analysis/twiggy-top.txt
twiggy paths target/wasm-release/darkswap_sdk_bg.wasm > target/wasm-analysis/twiggy-paths.txt
twiggy dominators target/wasm-release/darkswap_sdk_bg.wasm > target/wasm-analysis/twiggy-dominators.txt

# Create a copy of the original WebAssembly binary
cp target/wasm-release/darkswap_sdk_bg.wasm target/wasm-release/darkswap_sdk_bg.original.wasm

# Optimize the WebAssembly binary with wasm-opt
echo "Optimizing WebAssembly binary with wasm-opt..."
wasm-opt \
    -Oz \
    --enable-mutable-globals \
    --enable-bulk-memory \
    --enable-sign-ext \
    --enable-threads \
    --enable-reference-types \
    --enable-exception-handling \
    --enable-tail-call \
    --enable-simd \
    --enable-nontrapping-float-to-int \
    --enable-multivalue \
    --inline-functions-with-loops \
    --inlining-optimizing \
    --intrinsic-lowering \
    --local-cse \
    --code-folding \
    --merge-blocks \
    --merge-locals \
    --optimize-instructions \
    --optimize-stack-ir \
    --precompute \
    --precompute-propagate \
    --remove-unused-brs \
    --remove-unused-names \
    --remove-unused-module-elements \
    --reorder-functions \
    --reorder-locals \
    --simplify-globals \
    --simplify-locals \
    --vacuum \
    -o target/wasm-release/darkswap_sdk_bg.wasm \
    target/wasm-release/darkswap_sdk_bg.wasm

# Analyze the optimized WebAssembly binary size
echo "Analyzing optimized WebAssembly binary size..."
OPTIMIZED_SIZE=$(stat -c %s target/wasm-release/darkswap_sdk_bg.wasm 2>/dev/null || stat -f %z target/wasm-release/darkswap_sdk_bg.wasm)
echo "Optimized size: $OPTIMIZED_SIZE bytes"

# Calculate the size reduction
SIZE_REDUCTION=$((ORIGINAL_SIZE - OPTIMIZED_SIZE))
PERCENTAGE_REDUCTION=$(echo "scale=2; 100 * $SIZE_REDUCTION / $ORIGINAL_SIZE" | bc)
echo "Size reduction: $SIZE_REDUCTION bytes ($PERCENTAGE_REDUCTION%)"

# Try to further optimize by removing unused functions with wasm-snip
echo "Attempting to further optimize by removing unused functions with wasm-snip..."

# Create a list of functions to snip (this is just an example, you'll need to customize this)
# You can use the twiggy analysis to identify functions that are safe to remove
cat > target/wasm-analysis/snip-list.txt << EOL
console_log
console_error
console_warn
console_info
console_debug
EOL

# Snip the unused functions
wasm-snip \
    --snip-rust-fmt-code \
    --snip-rust-panicking-code \
    --input target/wasm-release/darkswap_sdk_bg.wasm \
    --output target/wasm-release/darkswap_sdk_bg.snipped.wasm \
    $(cat target/wasm-analysis/snip-list.txt)

# Optimize the snipped WebAssembly binary with wasm-opt
echo "Optimizing snipped WebAssembly binary with wasm-opt..."
wasm-opt \
    -Oz \
    --enable-mutable-globals \
    --enable-bulk-memory \
    --enable-sign-ext \
    --enable-threads \
    --enable-reference-types \
    --enable-exception-handling \
    --enable-tail-call \
    --enable-simd \
    --enable-nontrapping-float-to-int \
    --enable-multivalue \
    --inline-functions-with-loops \
    --inlining-optimizing \
    --intrinsic-lowering \
    --local-cse \
    --code-folding \
    --merge-blocks \
    --merge-locals \
    --optimize-instructions \
    --optimize-stack-ir \
    --precompute \
    --precompute-propagate \
    --remove-unused-brs \
    --remove-unused-names \
    --remove-unused-module-elements \
    --reorder-functions \
    --reorder-locals \
    --simplify-globals \
    --simplify-locals \
    --vacuum \
    -o target/wasm-release/darkswap_sdk_bg.snipped.wasm \
    target/wasm-release/darkswap_sdk_bg.snipped.wasm

# Analyze the snipped WebAssembly binary size
echo "Analyzing snipped WebAssembly binary size..."
SNIPPED_SIZE=$(stat -c %s target/wasm-release/darkswap_sdk_bg.snipped.wasm 2>/dev/null || stat -f %z target/wasm-release/darkswap_sdk_bg.snipped.wasm)
echo "Snipped size: $SNIPPED_SIZE bytes"

# Calculate the size reduction
SIZE_REDUCTION=$((ORIGINAL_SIZE - SNIPPED_SIZE))
PERCENTAGE_REDUCTION=$(echo "scale=2; 100 * $SIZE_REDUCTION / $ORIGINAL_SIZE" | bc)
echo "Size reduction from original: $SIZE_REDUCTION bytes ($PERCENTAGE_REDUCTION%)"

# Use the snipped version if it's smaller
if [ "$SNIPPED_SIZE" -lt "$OPTIMIZED_SIZE" ]; then
    echo "Using snipped version as it's smaller..."
    cp target/wasm-release/darkswap_sdk_bg.snipped.wasm target/wasm-release/darkswap_sdk_bg.wasm
    FINAL_SIZE=$SNIPPED_SIZE
else
    echo "Using optimized version as it's smaller..."
    FINAL_SIZE=$OPTIMIZED_SIZE
fi

# Generate a report
echo "Generating optimization report..."
cat > target/wasm-analysis/optimization-report.md << EOL
# WebAssembly Optimization Report

## Size Analysis

- Original size: $ORIGINAL_SIZE bytes
- Optimized size: $OPTIMIZED_SIZE bytes
- Snipped size: $SNIPPED_SIZE bytes
- Final size: $FINAL_SIZE bytes
- Size reduction: $((ORIGINAL_SIZE - FINAL_SIZE)) bytes ($(echo "scale=2; 100 * ($ORIGINAL_SIZE - $FINAL_SIZE) / $ORIGINAL_SIZE" | bc)%)

## Optimization Steps

1. Built WebAssembly module in release mode with \`wasm-pack\`
2. Analyzed the WebAssembly binary with \`twiggy\`
3. Optimized the WebAssembly binary with \`wasm-opt -Oz\`
4. Removed unused functions with \`wasm-snip\`
5. Further optimized the snipped WebAssembly binary with \`wasm-opt -Oz\`

## Top 20 Functions by Size

\`\`\`
$(cat target/wasm-analysis/twiggy-top.txt)
\`\`\`

## Recommendations for Further Optimization

1. Review the top functions by size and consider if they can be simplified or removed
2. Consider using feature flags to exclude unnecessary functionality
3. Implement code splitting to load only the required functionality
4. Use tree-shaking to remove unused code
5. Consider using a different approach for error handling to reduce the size of error messages
EOL

echo "WebAssembly optimization complete. See target/wasm-analysis/optimization-report.md for details."