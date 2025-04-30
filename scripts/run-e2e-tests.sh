#!/bin/bash

# Run end-to-end tests for DarkSwap

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Running DarkSwap end-to-end tests...${NC}"

# Check if Playwright is installed
if ! command -v npx playwright &> /dev/null; then
    echo -e "${YELLOW}Playwright is not installed. Installing Playwright...${NC}"
    npm install -D @playwright/test
    npx playwright install
fi

# Check if test server is running
if ! curl -s http://localhost:3000 &> /dev/null; then
    echo -e "${YELLOW}Test server is not running. Starting test server...${NC}"
    npm run start:test &
    TEST_SERVER_PID=$!
    
    # Wait for the server to start
    echo -e "${YELLOW}Waiting for test server to start...${NC}"
    sleep 5
    
    # Check if the server started successfully
    if ! curl -s http://localhost:3000 &> /dev/null; then
        echo -e "${RED}Failed to start test server. Please check the logs.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Test server started successfully.${NC}"
else
    echo -e "${GREEN}Test server is already running.${NC}"
    TEST_SERVER_PID=""
fi

# Create WebAssembly test files if they don't exist
if [ ! -d "web/public/wasm" ]; then
    echo -e "${YELLOW}Creating WebAssembly test files...${NC}"
    mkdir -p web/public/wasm
    
    # Copy WebAssembly files from the build directory if they exist
    if [ -d "darkswap-wasm/build" ]; then
        cp darkswap-wasm/build/*.wasm web/public/wasm/
    else
        echo -e "${YELLOW}WebAssembly build directory not found. Creating simple test files...${NC}"
        
        # Create a simple WebAssembly module for testing
        cat > web/public/wasm/simple.wat <<EOL
(module
  (func (export "add") (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add)
)
EOL
        
        # Create a memory WebAssembly module for testing
        cat > web/public/wasm/memory.wat <<EOL
(module
  (memory (export "memory") 1)
  (func (export "allocate") (param i32) (result i32)
    i32.const 0)
  (func (export "sumArray") (param i32 i32) (result i32)
    (local $sum i32)
    (local $i i32)
    (local $end i32)
    
    ;; Calculate end pointer
    local.get 0
    local.get 1
    i32.add
    local.set $end
    
    ;; Initialize sum to 0
    i32.const 0
    local.set $sum
    
    ;; Initialize i to start pointer
    local.get 0
    local.set $i
    
    ;; Loop through the array
    (loop $loop
      ;; Check if we've reached the end
      local.get $i
      local.get $end
      i32.eq
      (if
        (then
          ;; Return the sum
          local.get $sum
          return
        )
      )
      
      ;; Add the current value to the sum
      local.get $sum
      local.get $i
      i32.load8_u
      i32.add
      local.set $sum
      
      ;; Increment i
      local.get $i
      i32.const 1
      i32.add
      local.set $i
      
      ;; Continue the loop
      br $loop
    )
    
    ;; Return the sum
    local.get $sum
  )
)
EOL
        
        # Create a large WebAssembly module for testing
        cat > web/public/wasm/large.wat <<EOL
(module
  (func (export "fibonacci") (param i32) (result i32)
    (local $i i32)
    (local $a i32)
    (local $b i32)
    (local $temp i32)
    
    ;; Handle base cases
    local.get 0
    i32.const 0
    i32.eq
    (if
      (then
        i32.const 0
        return
      )
    )
    
    local.get 0
    i32.const 1
    i32.eq
    (if
      (then
        i32.const 1
        return
      )
    )
    
    ;; Initialize variables
    i32.const 1
    local.set $i
    
    i32.const 0
    local.set $a
    
    i32.const 1
    local.set $b
    
    ;; Loop to calculate Fibonacci
    (loop $loop
      ;; Check if we've reached n
      local.get $i
      local.get 0
      i32.eq
      (if
        (then
          ;; Return b
          local.get $b
          return
        )
      )
      
      ;; Calculate next Fibonacci number
      local.get $a
      local.get $b
      i32.add
      local.set $temp
      
      ;; Update a and b
      local.get $b
      local.set $a
      
      local.get $temp
      local.set $b
      
      ;; Increment i
      local.get $i
      i32.const 1
      i32.add
      local.set $i
      
      ;; Continue the loop
      br $loop
    )
    
    ;; Return the result
    local.get $b
  )
)
EOL
        
        # Compile WebAssembly modules if wat2wasm is available
        if command -v wat2wasm &> /dev/null; then
            wat2wasm web/public/wasm/simple.wat -o web/public/wasm/simple.wasm
            wat2wasm web/public/wasm/memory.wat -o web/public/wasm/memory.wasm
            wat2wasm web/public/wasm/large.wat -o web/public/wasm/large.wasm
            
            # Remove WAT files
            rm web/public/wasm/*.wat
        else
            echo -e "${YELLOW}wat2wasm not found. WebAssembly modules will not be compiled.${NC}"
            echo -e "${YELLOW}Please install the WebAssembly Binary Toolkit (WABT) to compile WebAssembly modules.${NC}"
            echo -e "${YELLOW}Skipping WebAssembly tests...${NC}"
        fi
    fi
fi

# Run the tests
echo -e "${GREEN}Running Playwright tests...${NC}"
npx playwright test

# Kill the test server if we started it
if [ -n "$TEST_SERVER_PID" ]; then
    echo -e "${YELLOW}Stopping test server...${NC}"
    kill $TEST_SERVER_PID
    echo -e "${GREEN}Test server stopped.${NC}"
fi

echo -e "${GREEN}End-to-end tests completed.${NC}"