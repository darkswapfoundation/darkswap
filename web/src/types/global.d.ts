/**
 * Global type declarations for DarkSwap
 */

// Declare modules without type definitions
declare module 'core-js/features/promise';
declare module 'whatwg-fetch';

// Extend Window interface
interface Window {
  DARKSWAP_CONFIG?: {
    apiUrl: string;
    wsUrl: string;
    relayServers: string[];
    environment: string;
    version: string;
  };
}

// Extend CSS interface
interface CSS {
  supports(property: string, value: string): boolean;
}

// Extend WebAssembly namespace
namespace WebAssembly {
  function compileStreaming(source: Response | Promise<Response>): Promise<Module>;
  function instantiateStreaming(source: Response | Promise<Response>, importObject?: Imports): Promise<WebAssemblyInstantiatedSource>;
  function validate(bytes: BufferSource): Promise<boolean>;
}

// WebAssembly instantiated source
interface WebAssemblyInstantiatedSource {
  module: WebAssembly.Module;
  instance: WebAssembly.Instance;
}

// WebAssembly imports
interface WebAssemblyImports {
  [moduleName: string]: WebAssemblyImportValue;
}

// WebAssembly import value
type WebAssemblyImportValue = WebAssembly.Table | WebAssembly.Memory | WebAssembly.Global | Function;

// Extend NodeJS namespace
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    METRICS_ENDPOINT?: string;
    LOG_SERVER_URL?: string;
  }
}