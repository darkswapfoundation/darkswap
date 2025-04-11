import React, { useState, useEffect } from 'react';
import { 
  PerformanceOptimizer, 
  OptimizationContext, 
  OptimizationResult, 
  OperationType,
  OptimizationType,
  OptimizationLevel
} from '../utils/PerformanceOptimizer';
import '../styles/PerformanceOptimizationDemo.css';

/**
 * Performance optimization demo props
 */
interface PerformanceOptimizationDemoProps {
  /**
   * WebAssembly module URL
   */
  moduleUrl: string;
  
  /**
   * WebAssembly module size in bytes
   */
  moduleSize: number;
  
  /**
   * Operation type
   */
  operationType: OperationType;
  
  /**
   * Benchmark function
   */
  benchmarkFn?: (result: OptimizationResult) => Promise<number>;
}

/**
 * Performance optimization demo component
 * @param props Component props
 * @returns Component
 */
const PerformanceOptimizationDemo: React.FC<PerformanceOptimizationDemoProps> = ({
  moduleUrl,
  moduleSize,
  operationType,
  benchmarkFn,
}) => {
  // State
  const [browserCapability, setBrowserCapability] = useState<any>(null);
  const [networkCondition, setNetworkCondition] = useState<any>(null);
  const [systemResource, setSystemResource] = useState<any>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [benchmarkResults, setBenchmarkResults] = useState<{ result: OptimizationResult; time: number }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Initialize
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get browser capability
        const browserCapability = await PerformanceOptimizer.getBrowserCapability();
        setBrowserCapability(browserCapability);
        
        // Get network condition
        const networkCondition = await PerformanceOptimizer.getNetworkCondition();
        setNetworkCondition(networkCondition);
        
        // Get system resource
        const systemResource = await PerformanceOptimizer.getSystemResource();
        setSystemResource(systemResource);
        
        // Create optimization context
        const context: OptimizationContext = {
          browserCapability,
          networkCondition,
          systemResource,
          operationType,
          moduleSize,
        };
        
        // Optimize performance
        const result = PerformanceOptimizer.optimizePerformance(context);
        setOptimizationResult(result);
        
        // Run benchmarks if benchmark function is provided
        if (benchmarkFn) {
          // Create optimization results with different optimization levels
          const optimizationResults: OptimizationResult[] = [
            // No optimization
            {
              optimizationTypes: [],
              optimizationLevel: OptimizationLevel.None,
              chunkCount: 1,
              chunkSize: moduleSize,
              useSimd: false,
              useSharedMemory: false,
              useWebWorkers: false,
              useStreamingCompilation: false,
            },
            // Lazy loading only
            {
              optimizationTypes: [OptimizationType.LazyLoading],
              optimizationLevel: OptimizationLevel.Low,
              chunkCount: 1,
              chunkSize: moduleSize,
              useSimd: false,
              useSharedMemory: false,
              useWebWorkers: false,
              useStreamingCompilation: false,
            },
            // Streaming compilation
            {
              optimizationTypes: [OptimizationType.LazyLoading, OptimizationType.StreamingCompilation],
              optimizationLevel: OptimizationLevel.Low,
              chunkCount: 1,
              chunkSize: moduleSize,
              useSimd: false,
              useSharedMemory: false,
              useWebWorkers: false,
              useStreamingCompilation: true,
            },
            // Web Worker loading
            {
              optimizationTypes: [OptimizationType.LazyLoading, OptimizationType.WebWorkerLoading],
              optimizationLevel: OptimizationLevel.Medium,
              chunkCount: 1,
              chunkSize: moduleSize,
              useSimd: false,
              useSharedMemory: false,
              useWebWorkers: true,
              useStreamingCompilation: false,
            },
            // Code splitting
            {
              optimizationTypes: [OptimizationType.LazyLoading, OptimizationType.CodeSplitting],
              optimizationLevel: OptimizationLevel.Medium,
              chunkCount: 4,
              chunkSize: Math.ceil(moduleSize / 4),
              useSimd: false,
              useSharedMemory: false,
              useWebWorkers: false,
              useStreamingCompilation: false,
            },
            // SIMD instructions
            {
              optimizationTypes: [OptimizationType.LazyLoading, OptimizationType.SimdInstructions],
              optimizationLevel: OptimizationLevel.High,
              chunkCount: 1,
              chunkSize: moduleSize,
              useSimd: true,
              useSharedMemory: false,
              useWebWorkers: false,
              useStreamingCompilation: false,
            },
            // Shared memory
            {
              optimizationTypes: [OptimizationType.LazyLoading, OptimizationType.SharedMemory],
              optimizationLevel: OptimizationLevel.High,
              chunkCount: 1,
              chunkSize: moduleSize,
              useSimd: false,
              useSharedMemory: true,
              useWebWorkers: false,
              useStreamingCompilation: false,
            },
            // Combined optimizations
            result,
          ];
          
          // Benchmark each optimization result
          const benchmarks: { result: OptimizationResult; time: number }[] = [];
          
          for (const result of optimizationResults) {
            try {
              // Run the benchmark function
              const time = await benchmarkFn(result);
              
              // Add the result to the benchmarks
              benchmarks.push({ result, time });
            } catch (error) {
              console.error('Failed to benchmark optimization result:', error);
            }
          }
          
          // Sort benchmarks by time (ascending)
          benchmarks.sort((a, b) => a.time - b.time);
          
          // Set benchmark results
          setBenchmarkResults(benchmarks);
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Failed to initialize performance optimization demo:', error);
        setError(error.message || 'Failed to initialize performance optimization demo');
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [moduleUrl, moduleSize, operationType, benchmarkFn]);
  
  /**
   * Format optimization types
   * @param types Optimization types
   * @returns Formatted optimization types
   */
  const formatOptimizationTypes = (types: OptimizationType[]): string => {
    if (types.length === 0) {
      return 'None';
    }
    
    return types.map(type => {
      return type
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }).join(', ');
  };
  
  /**
   * Format optimization level
   * @param level Optimization level
   * @returns Formatted optimization level
   */
  const formatOptimizationLevel = (level: OptimizationLevel): string => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };
  
  /**
   * Format file size
   * @param size Size in bytes
   * @returns Formatted size
   */
  const formatFileSize = (size: number): string => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  };
  
  /**
   * Format time
   * @param time Time in milliseconds
   * @returns Formatted time
   */
  const formatTime = (time: number): string => {
    if (time < 1) {
      return `${(time * 1000).toFixed(2)} µs`;
    } else if (time < 1000) {
      return `${time.toFixed(2)} ms`;
    } else {
      return `${(time / 1000).toFixed(2)} s`;
    }
  };
  
  /**
   * Format boolean
   * @param value Boolean value
   * @returns Formatted boolean
   */
  const formatBoolean = (value: boolean): string => {
    return value ? 'Yes' : 'No';
  };
  
  /**
   * Render browser capability
   */
  const renderBrowserCapability = () => {
    if (!browserCapability) {
      return null;
    }
    
    return (
      <div className="performance-optimization-section">
        <h3>Browser Capability</h3>
        <table className="performance-optimization-table">
          <tbody>
            <tr>
              <td>WebAssembly</td>
              <td>{formatBoolean(browserCapability.webAssembly)}</td>
            </tr>
            <tr>
              <td>Streaming Compilation</td>
              <td>{formatBoolean(browserCapability.streamingCompilation)}</td>
            </tr>
            <tr>
              <td>Web Workers</td>
              <td>{formatBoolean(browserCapability.webWorkers)}</td>
            </tr>
            <tr>
              <td>SIMD Instructions</td>
              <td>{formatBoolean(browserCapability.simdInstructions)}</td>
            </tr>
            <tr>
              <td>Shared Memory</td>
              <td>{formatBoolean(browserCapability.sharedMemory)}</td>
            </tr>
            <tr>
              <td>IndexedDB</td>
              <td>{formatBoolean(browserCapability.indexedDb)}</td>
            </tr>
            <tr>
              <td>WebRTC</td>
              <td>{formatBoolean(browserCapability.webRtc)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };
  
  /**
   * Render network condition
   */
  const renderNetworkCondition = () => {
    if (!networkCondition) {
      return null;
    }
    
    return (
      <div className="performance-optimization-section">
        <h3>Network Condition</h3>
        <table className="performance-optimization-table">
          <tbody>
            <tr>
              <td>Download Speed</td>
              <td>{formatFileSize(networkCondition.downloadSpeed)}/s</td>
            </tr>
            <tr>
              <td>Upload Speed</td>
              <td>{formatFileSize(networkCondition.uploadSpeed)}/s</td>
            </tr>
            <tr>
              <td>Round-Trip Time</td>
              <td>{networkCondition.rtt} ms</td>
            </tr>
            <tr>
              <td>Metered</td>
              <td>{formatBoolean(networkCondition.metered)}</td>
            </tr>
            <tr>
              <td>Connection Type</td>
              <td>{networkCondition.connectionType}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };
  
  /**
   * Render system resource
   */
  const renderSystemResource = () => {
    if (!systemResource) {
      return null;
    }
    
    return (
      <div className="performance-optimization-section">
        <h3>System Resource</h3>
        <table className="performance-optimization-table">
          <tbody>
            <tr>
              <td>Available Memory</td>
              <td>{formatFileSize(systemResource.availableMemory)}</td>
            </tr>
            <tr>
              <td>CPU Cores</td>
              <td>{systemResource.cpuCores}</td>
            </tr>
            <tr>
              <td>CPU Utilization</td>
              <td>{(systemResource.cpuUtilization * 100).toFixed(2)}%</td>
            </tr>
            <tr>
              <td>Battery Level</td>
              <td>{(systemResource.batteryLevel * 100).toFixed(2)}%</td>
            </tr>
            <tr>
              <td>Charging</td>
              <td>{formatBoolean(systemResource.charging)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };
  
  /**
   * Render optimization result
   */
  const renderOptimizationResult = () => {
    if (!optimizationResult) {
      return null;
    }
    
    return (
      <div className="performance-optimization-section">
        <h3>Optimization Result</h3>
        <table className="performance-optimization-table">
          <tbody>
            <tr>
              <td>Optimization Types</td>
              <td>{formatOptimizationTypes(optimizationResult.optimizationTypes)}</td>
            </tr>
            <tr>
              <td>Optimization Level</td>
              <td>{formatOptimizationLevel(optimizationResult.optimizationLevel)}</td>
            </tr>
            <tr>
              <td>Chunk Count</td>
              <td>{optimizationResult.chunkCount}</td>
            </tr>
            <tr>
              <td>Chunk Size</td>
              <td>{formatFileSize(optimizationResult.chunkSize)}</td>
            </tr>
            <tr>
              <td>Use SIMD</td>
              <td>{formatBoolean(optimizationResult.useSimd)}</td>
            </tr>
            <tr>
              <td>Use Shared Memory</td>
              <td>{formatBoolean(optimizationResult.useSharedMemory)}</td>
            </tr>
            <tr>
              <td>Use Web Workers</td>
              <td>{formatBoolean(optimizationResult.useWebWorkers)}</td>
            </tr>
            <tr>
              <td>Use Streaming Compilation</td>
              <td>{formatBoolean(optimizationResult.useStreamingCompilation)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };
  
  /**
   * Render benchmark results
   */
  const renderBenchmarkResults = () => {
    if (benchmarkResults.length === 0) {
      return null;
    }
    
    return (
      <div className="performance-optimization-section">
        <h3>Benchmark Results</h3>
        <table className="performance-optimization-table">
          <thead>
            <tr>
              <th>Optimization Types</th>
              <th>Time</th>
              <th>Speedup</th>
            </tr>
          </thead>
          <tbody>
            {benchmarkResults.map((benchmark, index) => {
              const speedup = benchmarkResults[benchmarkResults.length - 1].time / benchmark.time;
              
              return (
                <tr key={index}>
                  <td>{formatOptimizationTypes(benchmark.result.optimizationTypes)}</td>
                  <td>{formatTime(benchmark.time)}</td>
                  <td>{speedup.toFixed(2)}x</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  
  /**
   * Render loading state
   */
  const renderLoading = () => {
    return (
      <div className="performance-optimization-loading">
        <div className="performance-optimization-spinner"></div>
        <p>Loading performance optimization demo...</p>
      </div>
    );
  };
  
  /**
   * Render error state
   */
  const renderError = () => {
    return (
      <div className="performance-optimization-error">
        <p>Error: {error}</p>
      </div>
    );
  };
  
  // If loading, show loading state
  if (isLoading) {
    return renderLoading();
  }
  
  // If error, show error state
  if (error) {
    return renderError();
  }
  
  return (
    <div className="performance-optimization-demo">
      <h2>Performance Optimization Demo</h2>
      
      <div className="performance-optimization-content">
        {renderBrowserCapability()}
        {renderNetworkCondition()}
        {renderSystemResource()}
        {renderOptimizationResult()}
        {renderBenchmarkResults()}
      </div>
    </div>
  );
};

export default PerformanceOptimizationDemo;