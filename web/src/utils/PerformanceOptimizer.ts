/**
 * Performance Optimizer
 * 
 * This module provides utilities for optimizing the performance of WebAssembly modules
 * based on the current browser capabilities and workload.
 */

import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * Optimization type
 */
export enum OptimizationType {
  /**
   * Lazy loading
   */
  LazyLoading = 'lazy-loading',
  
  /**
   * Streaming compilation
   */
  StreamingCompilation = 'streaming-compilation',
  
  /**
   * Web Worker background loading
   */
  WebWorkerLoading = 'web-worker-loading',
  
  /**
   * Code splitting
   */
  CodeSplitting = 'code-splitting',
  
  /**
   * SIMD instructions
   */
  SimdInstructions = 'simd-instructions',
  
  /**
   * Shared memory
   */
  SharedMemory = 'shared-memory',
  
  /**
   * Dynamic chunk sizing
   */
  DynamicChunkSizing = 'dynamic-chunk-sizing',
}

/**
 * Optimization level
 */
export enum OptimizationLevel {
  /**
   * No optimization
   */
  None = 'none',
  
  /**
   * Low optimization
   */
  Low = 'low',
  
  /**
   * Medium optimization
   */
  Medium = 'medium',
  
  /**
   * High optimization
   */
  High = 'high',
  
  /**
   * Maximum optimization
   */
  Maximum = 'maximum',
}

/**
 * Operation type
 */
export enum OperationType {
  /**
   * Order book management
   */
  OrderBookManagement = 'order-book-management',
  
  /**
   * Trade matching
   */
  TradeMatching = 'trade-matching',
  
  /**
   * Cryptographic operations
   */
  CryptographicOperations = 'cryptographic-operations',
  
  /**
   * Data serialization
   */
  DataSerialization = 'data-serialization',
  
  /**
   * Data validation
   */
  DataValidation = 'data-validation',
}

/**
 * Browser capability
 */
export interface BrowserCapability {
  /**
   * Whether WebAssembly is supported
   */
  webAssembly: boolean;
  
  /**
   * Whether streaming compilation is supported
   */
  streamingCompilation: boolean;
  
  /**
   * Whether Web Workers are supported
   */
  webWorkers: boolean;
  
  /**
   * Whether SIMD instructions are supported
   */
  simdInstructions: boolean;
  
  /**
   * Whether shared memory is supported
   */
  sharedMemory: boolean;
  
  /**
   * Whether IndexedDB is supported
   */
  indexedDb: boolean;
  
  /**
   * Whether WebRTC is supported
   */
  webRtc: boolean;
}

/**
 * Network condition
 */
export interface NetworkCondition {
  /**
   * Download speed in bytes per second
   */
  downloadSpeed: number;
  
  /**
   * Upload speed in bytes per second
   */
  uploadSpeed: number;
  
  /**
   * Round-trip time in milliseconds
   */
  rtt: number;
  
  /**
   * Whether the connection is metered
   */
  metered: boolean;
  
  /**
   * Connection type
   */
  connectionType: string;
}

/**
 * System resource
 */
export interface SystemResource {
  /**
   * Available memory in bytes
   */
  availableMemory: number;
  
  /**
   * Number of CPU cores
   */
  cpuCores: number;
  
  /**
   * CPU utilization
   */
  cpuUtilization: number;
  
  /**
   * Battery level
   */
  batteryLevel: number;
  
  /**
   * Whether the device is charging
   */
  charging: boolean;
}

/**
 * Optimization context
 */
export interface OptimizationContext {
  /**
   * Browser capability
   */
  browserCapability: BrowserCapability;
  
  /**
   * Network condition
   */
  networkCondition: NetworkCondition;
  
  /**
   * System resource
   */
  systemResource: SystemResource;
  
  /**
   * Operation type
   */
  operationType: OperationType;
  
  /**
   * WebAssembly module size in bytes
   */
  moduleSize: number;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  /**
   * Optimization types to apply
   */
  optimizationTypes: OptimizationType[];
  
  /**
   * Optimization level
   */
  optimizationLevel: OptimizationLevel;
  
  /**
   * Number of chunks for code splitting
   */
  chunkCount: number;
  
  /**
   * Chunk size in bytes
   */
  chunkSize: number;
  
  /**
   * Whether to use SIMD instructions
   */
  useSimd: boolean;
  
  /**
   * Whether to use shared memory
   */
  useSharedMemory: boolean;
  
  /**
   * Whether to use Web Workers
   */
  useWebWorkers: boolean;
  
  /**
   * Whether to use streaming compilation
   */
  useStreamingCompilation: boolean;
}

/**
 * Performance optimizer
 */
export class PerformanceOptimizer {
  /**
   * Get browser capability
   * @returns Browser capability
   */
  public static async getBrowserCapability(): Promise<BrowserCapability> {
    return tryAsync(async () => {
      // Check if WebAssembly is supported
      const webAssembly = typeof WebAssembly !== 'undefined';
      
      // Check if streaming compilation is supported
      const streamingCompilation = webAssembly && typeof WebAssembly.compileStreaming === 'function';
      
      // Check if Web Workers are supported
      const webWorkers = typeof Worker !== 'undefined';
      
      // Check if SIMD instructions are supported
      let simdInstructions = false;
      if (webAssembly) {
        try {
          const simdTest = await WebAssembly.compile(new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
            0x03, 0x02, 0x01, 0x00, 0x0a, 0x09, 0x01, 0x07, 0x00, 0xfd, 0x0f, 0x00, 0x00, 0x0b
          ]));
          simdInstructions = WebAssembly.validate ? WebAssembly.validate(simdTest as any) : false;
        } catch (error) {
          simdInstructions = false;
        }
      }
      
      // Check if shared memory is supported
      let sharedMemory = false;
      try {
        sharedMemory = typeof SharedArrayBuffer !== 'undefined' && 
                      typeof Atomics !== 'undefined';
      } catch (error) {
        sharedMemory = false;
      }
      
      // Check if IndexedDB is supported
      const indexedDb = typeof indexedDB !== 'undefined';
      
      // Check if WebRTC is supported
      const webRtc = typeof RTCPeerConnection !== 'undefined';
      
      return {
        webAssembly,
        streamingCompilation,
        webWorkers,
        simdInstructions,
        sharedMemory,
        indexedDb,
        webRtc,
      };
    }, ErrorCode.INTERNAL, 'Failed to get browser capability');
  }
  
  /**
   * Get network condition
   * @returns Network condition
   */
  public static async getNetworkCondition(): Promise<NetworkCondition> {
    return tryAsync(async () => {
      // Get connection information
      const connection = navigator.connection || 
                        navigator.mozConnection || 
                        navigator.webkitConnection;
      
      // Default values
      let downloadSpeed = 1000000; // 1 MB/s
      let uploadSpeed = 500000; // 500 KB/s
      let rtt = 100; // 100 ms
      let metered = false;
      let connectionType = 'unknown';
      
      // Get network information if available
      if (connection) {
        if (typeof connection.downlink === 'number') {
          downloadSpeed = connection.downlink * 1024 * 1024 / 8; // Convert Mbps to Bps
        }
        
        if (typeof connection.rtt === 'number') {
          rtt = connection.rtt;
        }
        
        if (typeof connection.saveData === 'boolean') {
          metered = connection.saveData;
        }
        
        if (typeof connection.type === 'string') {
          connectionType = connection.type;
        }
      }
      
      // Estimate upload speed based on download speed
      uploadSpeed = downloadSpeed / 2;
      
      return {
        downloadSpeed,
        uploadSpeed,
        rtt,
        metered,
        connectionType,
      };
    }, ErrorCode.INTERNAL, 'Failed to get network condition');
  }
  
  /**
   * Get system resource
   * @returns System resource
   */
  public static async getSystemResource(): Promise<SystemResource> {
    return tryAsync(async () => {
      // Default values
      let availableMemory = 4 * 1024 * 1024 * 1024; // 4 GB
      let cpuCores = 4;
      let cpuUtilization = 0.5;
      let batteryLevel = 1.0;
      let charging = true;
      
      // Get memory information if available
      if (navigator.deviceMemory) {
        availableMemory = navigator.deviceMemory * 1024 * 1024 * 1024;
      }
      
      // Get CPU information if available
      if (navigator.hardwareConcurrency) {
        cpuCores = navigator.hardwareConcurrency;
      }
      
      // Get battery information if available
      try {
        const battery = await navigator.getBattery?.();
        if (battery) {
          batteryLevel = battery.level;
          charging = battery.charging;
        }
      } catch (error) {
        // Ignore errors
      }
      
      return {
        availableMemory,
        cpuCores,
        cpuUtilization,
        batteryLevel,
        charging,
      };
    }, ErrorCode.INTERNAL, 'Failed to get system resource');
  }
  
  /**
   * Optimize performance
   * @param context Optimization context
   * @returns Optimization result
   */
  public static optimizePerformance(context: OptimizationContext): OptimizationResult {
    // Default optimization result
    const result: OptimizationResult = {
      optimizationTypes: [],
      optimizationLevel: OptimizationLevel.None,
      chunkCount: 1,
      chunkSize: context.moduleSize,
      useSimd: false,
      useSharedMemory: false,
      useWebWorkers: false,
      useStreamingCompilation: false,
    };
    
    // Check if WebAssembly is supported
    if (!context.browserCapability.webAssembly) {
      return result;
    }
    
    // Determine optimization level based on system resources and network conditions
    let optimizationLevel = OptimizationLevel.Low;
    
    // Check if the device has limited resources
    const isLimitedResource = context.systemResource.availableMemory < 2 * 1024 * 1024 * 1024 || // Less than 2 GB
                             context.systemResource.cpuCores < 2 || // Less than 2 cores
                             (context.systemResource.batteryLevel < 0.2 && !context.systemResource.charging); // Low battery and not charging
    
    // Check if the network is slow
    const isSlowNetwork = context.networkCondition.downloadSpeed < 500000 || // Less than 500 KB/s
                         context.networkCondition.rtt > 500; // More than 500 ms
    
    // Check if the network is metered
    const isMeteredNetwork = context.networkCondition.metered;
    
    // Determine optimization level
    if (isLimitedResource && isSlowNetwork) {
      optimizationLevel = OptimizationLevel.Maximum;
    } else if (isLimitedResource || isSlowNetwork) {
      optimizationLevel = OptimizationLevel.High;
    } else if (isMeteredNetwork) {
      optimizationLevel = OptimizationLevel.Medium;
    } else {
      optimizationLevel = OptimizationLevel.Low;
    }
    
    // Update optimization level
    result.optimizationLevel = optimizationLevel;
    
    // Add lazy loading optimization
    result.optimizationTypes.push(OptimizationType.LazyLoading);
    
    // Add streaming compilation optimization if supported
    if (context.browserCapability.streamingCompilation) {
      result.optimizationTypes.push(OptimizationType.StreamingCompilation);
      result.useStreamingCompilation = true;
    }
    
    // Add Web Worker optimization if supported and the module is large
    if (context.browserCapability.webWorkers && context.moduleSize > 1024 * 1024) {
      result.optimizationTypes.push(OptimizationType.WebWorkerLoading);
      result.useWebWorkers = true;
    }
    
    // Add code splitting optimization if the module is large
    if (context.moduleSize > 1024 * 1024) {
      result.optimizationTypes.push(OptimizationType.CodeSplitting);
      
      // Determine chunk count based on module size and optimization level
      if (optimizationLevel === OptimizationLevel.Maximum) {
        result.chunkCount = Math.max(8, Math.ceil(context.moduleSize / (256 * 1024))); // 256 KB chunks
      } else if (optimizationLevel === OptimizationLevel.High) {
        result.chunkCount = Math.max(4, Math.ceil(context.moduleSize / (512 * 1024))); // 512 KB chunks
      } else if (optimizationLevel === OptimizationLevel.Medium) {
        result.chunkCount = Math.max(2, Math.ceil(context.moduleSize / (1024 * 1024))); // 1 MB chunks
      } else {
        result.chunkCount = Math.max(1, Math.ceil(context.moduleSize / (2 * 1024 * 1024))); // 2 MB chunks
      }
      
      // Update chunk size
      result.chunkSize = Math.ceil(context.moduleSize / result.chunkCount);
    }
    
    // Add SIMD optimization if supported and the operation can benefit from it
    if (context.browserCapability.simdInstructions && 
        (context.operationType === OperationType.CryptographicOperations || 
         context.operationType === OperationType.TradeMatching)) {
      result.optimizationTypes.push(OptimizationType.SimdInstructions);
      result.useSimd = true;
    }
    
    // Add shared memory optimization if supported and the operation can benefit from it
    if (context.browserCapability.sharedMemory && 
        (context.operationType === OperationType.OrderBookManagement || 
         context.operationType === OperationType.DataSerialization)) {
      result.optimizationTypes.push(OptimizationType.SharedMemory);
      result.useSharedMemory = true;
    }
    
    // Add dynamic chunk sizing optimization if code splitting is enabled
    if (result.optimizationTypes.includes(OptimizationType.CodeSplitting)) {
      result.optimizationTypes.push(OptimizationType.DynamicChunkSizing);
    }
    
    return result;
  }
  
  /**
   * Benchmark performance
   * @param optimizationResults Optimization results to benchmark
   * @param benchmarkFn Benchmark function
   * @returns Best optimization result
   */
  public static async benchmarkPerformance(
    optimizationResults: OptimizationResult[],
    benchmarkFn: (result: OptimizationResult) => Promise<number>
  ): Promise<OptimizationResult> {
    return tryAsync(async () => {
      // Benchmark each optimization result
      const benchmarks: { result: OptimizationResult; time: number }[] = [];
      
      for (const result of optimizationResults) {
        // Run the benchmark function
        const time = await benchmarkFn(result);
        
        // Add the result to the benchmarks
        benchmarks.push({ result, time });
      }
      
      // Sort benchmarks by time (ascending)
      benchmarks.sort((a, b) => a.time - b.time);
      
      // Return the best optimization result
      return benchmarks[0].result;
    }, ErrorCode.INTERNAL, 'Failed to benchmark performance');
  }
}