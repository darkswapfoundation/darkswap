#!/bin/bash

# build-wasm-optimized.sh - Script for building and optimizing the WebAssembly module
#
# This script builds the WebAssembly module with optimizations for size and performance.
# It uses wasm-opt from the binaryen toolkit to optimize the WebAssembly binary.

set -e

# Print usage information
function print_usage {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --release         Build in release mode (default: debug)"
  echo "  --target DIR      Target directory for output (default: web/src/wasm-bindings)"
  echo "  --features LIST   Comma-separated list of features to enable"
  echo "  --no-opt          Skip optimization step"
  echo "  --help            Print this help message"
}

# Parse command line arguments
RELEASE=""
TARGET_DIR="web/src/wasm-bindings"
FEATURES=""
SKIP_OPT=0

while [[ $# -gt 0 ]]; do
  case $1 in
    --release)
      RELEASE="--release"
      shift
      ;;
    --target)
      TARGET_DIR="$2"
      shift 2
      ;;
    --features)
      FEATURES="--features $2"
      shift 2
      ;;
    --no-opt)
      SKIP_OPT=1
      shift
      ;;
    --help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      exit 1
      ;;
  esac
done

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
  echo "Error: wasm-pack is not installed"
  echo "Please install it with: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
  exit 1
fi

# Check if wasm-opt is installed
if ! command -v wasm-opt &> /dev/null && [ $SKIP_OPT -eq 0 ]; then
  echo "Warning: wasm-opt is not installed, optimization will be skipped"
  echo "Please install binaryen: https://github.com/WebAssembly/binaryen"
  SKIP_OPT=1
fi

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

echo "Building WebAssembly module..."

# Build WebAssembly module
wasm-pack build darkswap-wasm \
  --target web \
  --out-dir "../$TARGET_DIR" \
  $RELEASE \
  $FEATURES \
  -- \
  -Z build-std=std,panic_abort \
  -Z build-std-features=panic_immediate_abort

# Optimize WebAssembly binary if not skipped
if [ $SKIP_OPT -eq 0 ]; then
  echo "Optimizing WebAssembly binary..."
  
  # Backup original wasm file
  cp "$TARGET_DIR/darkswap_wasm_bg.wasm" "$TARGET_DIR/darkswap_wasm_bg.wasm.bak"
  
  # Optimize for size
  wasm-opt \
    --enable-bulk-memory \
    -Oz \
    --enable-mutable-globals \
    --enable-threads \
    --enable-reference-types \
    --enable-simd \
    --enable-tail-call \
    --inline-functions-with-loops \
    --inlining-optimizing \
    --flatten \
    --rse \
    --vacuum \
    --dce \
    --memory-packing \
    --strip-debug \
    --strip-producers \
    -o "$TARGET_DIR/darkswap_wasm_bg.wasm" \
    "$TARGET_DIR/darkswap_wasm_bg.wasm.bak"
  
  # Get file sizes
  ORIGINAL_SIZE=$(stat -c%s "$TARGET_DIR/darkswap_wasm_bg.wasm.bak")
  OPTIMIZED_SIZE=$(stat -c%s "$TARGET_DIR/darkswap_wasm_bg.wasm")
  
  # Calculate size reduction
  REDUCTION=$((ORIGINAL_SIZE - OPTIMIZED_SIZE))
  REDUCTION_PERCENT=$((REDUCTION * 100 / ORIGINAL_SIZE))
  
  echo "Original size: $(numfmt --to=iec-i --suffix=B $ORIGINAL_SIZE)"
  echo "Optimized size: $(numfmt --to=iec-i --suffix=B $OPTIMIZED_SIZE)"
  echo "Reduction: $(numfmt --to=iec-i --suffix=B $REDUCTION) ($REDUCTION_PERCENT%)"
  
  # Remove backup file
  rm "$TARGET_DIR/darkswap_wasm_bg.wasm.bak"
fi

echo "Creating JavaScript loader..."

# Create JavaScript loader for streaming compilation
cat > "$TARGET_DIR/darkswap_wasm_loader.js" << EOL
/**
 * darkswap_wasm_loader.js - Loader for the DarkSwap WebAssembly module
 * 
 * This file provides utilities for loading the DarkSwap WebAssembly module
 * with streaming compilation and other optimizations.
 */

import * as darkswap from './darkswap_wasm.js';

/**
 * Load the DarkSwap WebAssembly module with streaming compilation
 * @param {string} url - URL of the WebAssembly module
 * @returns {Promise<typeof darkswap>} - Promise that resolves to the DarkSwap module
 */
export async function loadDarkSwapWasm(url = 'darkswap_wasm_bg.wasm') {
  // Check if streaming compilation is supported
  if (WebAssembly.instantiateStreaming) {
    try {
      // Use streaming compilation
      const { instance, module } = await WebAssembly.instantiateStreaming(
        fetch(url),
        darkswap.__wbg_get_imports()
      );
      
      // Initialize the module
      darkswap.__wbg_init(instance, module);
      
      return darkswap;
    } catch (e) {
      console.warn('Streaming compilation failed, falling back to ArrayBuffer instantiation:', e);
    }
  }
  
  // Fall back to ArrayBuffer instantiation
  const response = await fetch(url);
  const bytes = await response.arrayBuffer();
  const { instance, module } = await WebAssembly.instantiate(bytes, darkswap.__wbg_get_imports());
  
  // Initialize the module
  darkswap.__wbg_init(instance, module);
  
  return darkswap;
}

/**
 * Preload the DarkSwap WebAssembly module
 * @param {string} url - URL of the WebAssembly module
 * @returns {Promise<void>} - Promise that resolves when the module is preloaded
 */
export function preloadDarkSwapWasm(url = 'darkswap_wasm_bg.wasm') {
  // Create a link element for preloading
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = 'fetch';
  link.crossOrigin = 'anonymous';
  link.type = 'application/wasm';
  
  // Add the link element to the head
  document.head.appendChild(link);
}

/**
 * Initialize the DarkSwap WebAssembly module with memory management optimizations
 * @param {Object} options - Initialization options
 * @param {number} options.initialMemory - Initial memory size in pages (64KB per page)
 * @param {number} options.maximumMemory - Maximum memory size in pages (64KB per page)
 * @param {boolean} options.sharedMemory - Whether to use shared memory
 * @returns {Promise<typeof darkswap>} - Promise that resolves to the DarkSwap module
 */
export async function initDarkSwapWasm(options = {}) {
  const {
    initialMemory = 16, // 1MB
    maximumMemory = 256, // 16MB
    sharedMemory = false,
  } = options;
  
  // Create memory
  const memory = new WebAssembly.Memory({
    initial: initialMemory,
    maximum: maximumMemory,
    shared: sharedMemory,
  });
  
  // Set memory
  darkswap.__wbg_set_memory(memory);
  
  return darkswap;
}

/**
 * Default export
 */
export default {
  loadDarkSwapWasm,
  preloadDarkSwapWasm,
  initDarkSwapWasm,
};
EOL

echo "Creating TypeScript type definitions..."

# Create TypeScript type definitions for the loader
cat > "$TARGET_DIR/darkswap_wasm_loader.d.ts" << EOL
/**
 * darkswap_wasm_loader.d.ts - TypeScript type definitions for the DarkSwap WebAssembly module loader
 */

import * as darkswap from './darkswap_wasm';

/**
 * Load the DarkSwap WebAssembly module with streaming compilation
 * @param url - URL of the WebAssembly module
 * @returns Promise that resolves to the DarkSwap module
 */
export function loadDarkSwapWasm(url?: string): Promise<typeof darkswap>;

/**
 * Preload the DarkSwap WebAssembly module
 * @param url - URL of the WebAssembly module
 * @returns Promise that resolves when the module is preloaded
 */
export function preloadDarkSwapWasm(url?: string): void;

/**
 * Initialization options for the DarkSwap WebAssembly module
 */
export interface InitOptions {
  /**
   * Initial memory size in pages (64KB per page)
   * @default 16 (1MB)
   */
  initialMemory?: number;
  
  /**
   * Maximum memory size in pages (64KB per page)
   * @default 256 (16MB)
   */
  maximumMemory?: number;
  
  /**
   * Whether to use shared memory
   * @default false
   */
  sharedMemory?: boolean;
}

/**
 * Initialize the DarkSwap WebAssembly module with memory management optimizations
 * @param options - Initialization options
 * @returns Promise that resolves to the DarkSwap module
 */
export function initDarkSwapWasm(options?: InitOptions): Promise<typeof darkswap>;

/**
 * Default export
 */
declare const _default: {
  loadDarkSwapWasm: typeof loadDarkSwapWasm;
  preloadDarkSwapWasm: typeof preloadDarkSwapWasm;
  initDarkSwapWasm: typeof initDarkSwapWasm;
};

export default _default;
EOL

echo "Done! WebAssembly module built and optimized."
echo "Output directory: $TARGET_DIR"
