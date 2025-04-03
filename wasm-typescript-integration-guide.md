# WebAssembly and TypeScript Library Integration Guide

This document provides guidance for integrating the DarkSwap WebAssembly (WASM) bindings with the TypeScript library, enabling the Rust SDK to run in web browsers.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Application                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    React Components                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      React Hooks                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   TypeScript Library                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  WebAssembly Bindings                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Rust SDK                               │
└─────────────────────────────────────────────────────────────┘
```

## Integration Components

### 1. WebAssembly Bindings

The WebAssembly bindings expose the Rust SDK functionality to JavaScript:

```rust
// In darkswap-web-sys/src/lib.rs
use wasm_bindgen::prelude::*;
use darkswap_sdk::{DarkSwap, config::Config, p2p::PeerId};

#[wasm_bindgen]
pub struct DarkSwapWasm {
    inner: DarkSwap,
    callback: js_sys::Function,
}

#[wasm_bindgen]
impl DarkSwapWasm {
    #[wasm_bindgen(constructor)]
    pub fn new(config_json: &str, callback: js_sys::Function) -> Result<DarkSwapWasm, JsValue> {
        // Parse configuration and create DarkSwap instance
        let config: Config = serde_json::from_str(config_json)?;
        let (tx, mut rx) = tokio::sync::mpsc::channel(100);
        let darkswap = DarkSwap::new(config, tx)?;
        
        // Create wrapper and handle events
        let wrapper = DarkSwapWasm { inner: darkswap, callback };
        
        // Event handling code...
        
        Ok(wrapper)
    }
    
    // Core methods
    pub async fn start(&mut self) -> Result<(), JsValue> { /* ... */ }
    pub async fn stop(&mut self) -> Result<(), JsValue> { /* ... */ }
    pub fn local_peer_id(&self) -> String { /* ... */ }
    
    // Relay methods
    pub async fn connect_to_peer(&mut self, peer_id: &str) -> Result<(), JsValue> { /* ... */ }
    pub async fn connect_via_relay(&mut self, peer_id: &str) -> Result<String, JsValue> { /* ... */ }
    pub async fn send_via_relay(&mut self, peer_id: &str, relay_id: &str, data: &[u8]) -> Result<(), JsValue> { /* ... */ }
    pub async fn close_relay(&mut self, relay_id: &str) -> Result<(), JsValue> { /* ... */ }
}
```

### 2. TypeScript Library

The TypeScript library provides a more idiomatic JavaScript API:

```typescript
// In darkswap-lib/src/index.ts
import { DarkSwapWasm } from 'darkswap-web-sys';

export interface DarkSwapConfig {
  p2p: {
    listen_addresses: string[];
    bootstrap_peers: string[];
    relay_servers: string[];
  };
}

export class DarkSwap {
  private wasm: DarkSwapWasm | null = null;
  private config: DarkSwapConfig;
  private eventCallbacks: EventCallback[] = [];
  private isStarted = false;

  constructor(config: DarkSwapConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    const configJson = JSON.stringify(this.config);
    this.wasm = new DarkSwapWasm(configJson, this.handleEvent.bind(this));
    await this.wasm.start();
    this.isStarted = true;
  }

  async stop(): Promise<void> { /* ... */ }
  getLocalPeerId(): string { /* ... */ }
  
  // Relay methods
  async connectToPeer(peerId: string): Promise<void> { /* ... */ }
  async connectViaRelay(peerId: string): Promise<string> { /* ... */ }
  async sendViaRelay(peerId: string, relayId: string, data: Uint8Array): Promise<void> { /* ... */ }
  async closeRelay(relayId: string): Promise<void> { /* ... */ }
  
  // Event handling
  addEventListener(callback: EventCallback): void { /* ... */ }
  removeEventListener(callback: EventCallback): void { /* ... */ }
  private handleEvent(eventJson: string): void { /* ... */ }
}
```

### 3. React Hooks

Create React hooks for easy integration with React applications:

```typescript
// In darkswap-lib/src/react/hooks.ts
import { useEffect, useState, useCallback, useContext } from 'react';
import { DarkSwap, DarkSwapEvent } from '../index';
import { DarkSwapContext } from './context';

export function useDarkSwap(): DarkSwap {
  const darkswap = useContext(DarkSwapContext);
  if (!darkswap) throw new Error('useDarkSwap must be used within a DarkSwapProvider');
  return darkswap;
}

export function useLocalPeerId(): string {
  const darkswap = useDarkSwap();
  const [peerId, setPeerId] = useState<string>('');
  
  useEffect(() => {
    try {
      setPeerId(darkswap.getLocalPeerId());
    } catch (error) {
      console.error('Failed to get local peer ID:', error);
    }
  }, [darkswap]);
  
  return peerId;
}

export function useConnectToPeer(): (peerId: string) => Promise<void> { /* ... */ }
export function useConnectViaRelay(): (peerId: string) => Promise<string> { /* ... */ }
export function useSendViaRelay(): (peerId: string, relayId: string, data: Uint8Array) => Promise<void> { /* ... */ }
export function useCloseRelay(): (relayId: string) => Promise<void> { /* ... */ }
export function useEvent<T>(eventType: string, handler: (payload: T) => void): void { /* ... */ }
export function usePeerConnections(): string[] { /* ... */ }
export function useRelayConnections(): { peerId: string, relayId: string }[] { /* ... */ }
```

### 4. Context Provider

Create a context provider for the DarkSwap instance:

```typescript
// In darkswap-lib/src/react/context.tsx
import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { DarkSwap, DarkSwapConfig } from '../index';

export const DarkSwapContext = createContext<DarkSwap | null>(null);

interface DarkSwapProviderProps {
  config: DarkSwapConfig;
  children: ReactNode;
}

export function DarkSwapProvider({ config, children }: DarkSwapProviderProps): JSX.Element {
  const [darkswap, setDarkswap] = useState<DarkSwap | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const init = async () => {
      try {
        const instance = new DarkSwap(config);
        await instance.init();
        setDarkswap(instance);
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize DarkSwap:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    init();
    
    return () => {
      if (darkswap) darkswap.stop().catch(console.error);
    };
  }, [config]);
  
  if (error) return <div className="darkswap-error"><h2>Failed to initialize DarkSwap</h2><p>{error.message}</p></div>;
  if (!isInitialized) return <div className="darkswap-loading"><p>Initializing DarkSwap...</p></div>;
  
  return <DarkSwapContext.Provider value={darkswap}>{children}</DarkSwapContext.Provider>;
}
```

## Integration Steps

1. **Build the WebAssembly Bindings**
   ```bash
   wasm-pack build --target web
   ```

2. **Link the WebAssembly Bindings to the TypeScript Library**
   ```json
   {
     "dependencies": {
       "darkswap-web-sys": "file:../darkswap-web-sys/pkg"
     }
   }
   ```

3. **Create TypeScript Definitions**
4. **Implement Event Handling**
5. **Create React Components**
6. **Set Up Testing**

## Common Issues and Solutions

1. **WebAssembly Loading Issues**
   - Ensure proper MIME type (`application/wasm`)
   - Configure webpack correctly for `.wasm` files

2. **Memory Management**
   - Clean up resources when components unmount
   - Use `useEffect` cleanup functions

3. **Async Operations**
   - Use React's `useEffect` and `useState` hooks
   - Implement proper loading and error states

4. **TypeScript Type Safety**
   - Create comprehensive type definitions
   - Use TypeScript's strict mode

## Next Steps

1. **Complete TypeScript Definitions**
   - Create comprehensive TypeScript definitions for all WASM exports
   - Add JSDoc comments for better IDE integration

2. **Enhance Event System**
   - Improve event propagation between WASM and TypeScript
   - Add filtering capabilities for events

3. **Create React Integration**
   - Develop more React hooks for common operations
   - Create reusable components for common UI elements

4. **Add Testing**
   - Create unit tests for the TypeScript library
   - Implement integration tests for React components
