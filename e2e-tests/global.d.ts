// Global type definitions for e2e tests

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request?: (params: any) => Promise<any>;
    on?: (event: string, callback: any) => void;
    removeListener?: (event: string, callback: any) => void;
  };
  
  // Mock data for tests
  mockOrdersData?: any[];
  
  // Mock fetch function
  fetchMock?: (url: string, options?: any) => Promise<any>;
  
  // Original fetch function
  originalFetch?: typeof fetch;
  
  // Mock clipboard text
  mockClipboardText?: string;
}

interface Navigator {
  /**
   * Network information
   */
  connection?: {
    /**
     * Download speed in Mbps
     */
    downlink?: number;
    
    /**
     * Round-trip time in ms
     */
    rtt?: number;
    
    /**
     * Whether the connection is metered
     */
    saveData?: boolean;
    
    /**
     * Connection type
     */
    type?: string;
  };
  
  /**
   * Mozilla network information
   */
  mozConnection?: Navigator['connection'];
  
  /**
   * WebKit network information
   */
  webkitConnection?: Navigator['connection'];
  
  /**
   * Device memory in GB
   */
  deviceMemory?: number;
  
  /**
   * Get battery information
   */
  getBattery?: () => Promise<{
    /**
     * Battery level (0-1)
     */
    level: number;
    
    /**
     * Whether the device is charging
     */
    charging: boolean;
  }>;
}

interface WebAssembly {
  /**
   * Validate a WebAssembly module
   */
  validate?: (bufferSource: BufferSource) => boolean;
}