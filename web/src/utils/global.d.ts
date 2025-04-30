// Global type definitions for the web application

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