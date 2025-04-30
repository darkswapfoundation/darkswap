#!/bin/bash

# Exit on error
set -e

echo "Optimizing WebAssembly size for DarkSwap..."

# Check if wasm-opt is installed
if ! command -v wasm-opt &> /dev/null; then
    echo "wasm-opt not found. Installing binaryen..."
    npm install -g binaryen
fi

# Check if wasm-snip is installed
if ! command -v wasm-snip &> /dev/null; then
    echo "wasm-snip not found. Installing wasm-snip..."
    cargo install wasm-snip
fi

# Create directory for optimized wasm files
mkdir -p wasm-optimized

# Find all wasm files
WASM_FILES=$(find . -name "*.wasm")

# Analyze and optimize each wasm file
for wasm_file in $WASM_FILES; do
    echo "Processing $wasm_file..."
    
    # Get file size before optimization
    original_size=$(stat -c%s "$wasm_file")
    echo "Original size: $original_size bytes"
    
    # Create output file path
    filename=$(basename "$wasm_file")
    output_file="wasm-optimized/$filename"
    
    # Analyze the wasm file
    echo "Analyzing $wasm_file..."
    wasm-opt --metrics "$wasm_file"
    
    # Optimize the wasm file
    echo "Optimizing $wasm_file..."
    wasm-opt -Oz "$wasm_file" -o "$output_file"
    
    # Get file size after optimization
    optimized_size=$(stat -c%s "$output_file")
    echo "Optimized size: $optimized_size bytes"
    
    # Calculate size reduction
    reduction=$((original_size - optimized_size))
    reduction_percent=$(echo "scale=2; 100 * $reduction / $original_size" | bc)
    echo "Size reduction: $reduction bytes ($reduction_percent%)"
    
    # Use wasm-snip to remove unused functions
    echo "Removing unused functions from $output_file..."
    wasm-snip "$output_file" -o "$output_file.snipped" --snip-rust-fmt-code --snip-rust-panicking-code
    
    # Optimize again after snipping
    echo "Optimizing after snipping..."
    wasm-opt -Oz "$output_file.snipped" -o "$output_file"
    rm "$output_file.snipped"
    
    # Get final file size
    final_size=$(stat -c%s "$output_file")
    echo "Final size: $final_size bytes"
    
    # Calculate total size reduction
    total_reduction=$((original_size - final_size))
    total_reduction_percent=$(echo "scale=2; 100 * $total_reduction / $original_size" | bc)
    echo "Total size reduction: $total_reduction bytes ($total_reduction_percent%)"
    
    echo "Optimization complete for $wasm_file"
    echo "-----------------------------------"
done

echo "WebAssembly optimization complete!"
echo "Optimized files are in the wasm-optimized directory"