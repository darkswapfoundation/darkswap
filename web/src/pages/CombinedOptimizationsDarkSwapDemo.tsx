import React from 'react';
import CombinedOptimizationsDarkSwapDemo from '../components/CombinedOptimizationsDarkSwapDemo';
import '../styles/DarkSwapDemo.css';

/**
 * Combined Optimizations DarkSwap Demo page
 */
const CombinedOptimizationsDarkSwapDemoPage: React.FC = () => {
  return (
    <div className="combined-optimizations-darkswap-demo-page">
      <h1>Combined Optimizations DarkSwap Demo</h1>
      <p>
        This page demonstrates the DarkSwap SDK running in the browser using WebAssembly with combined optimizations.
        Combined optimizations include SIMD instructions, Web Workers, streaming compilation, and shared memory.
        By combining multiple optimizations, we can achieve even better performance than using each optimization
        individually.
      </p>
      <p>
        The demo automatically detects which optimizations are supported in your browser and uses them if available.
        The optimizations status section shows which optimizations are currently being used.
      </p>
      <p>
        <strong>Web Worker:</strong> Loads and compiles the WebAssembly module in a background thread, keeping the main thread free for user interactions.
      </p>
      <p>
        <strong>Streaming Compilation:</strong> Compiles the WebAssembly module while it's being downloaded, reducing the total loading time.
      </p>
      <p>
        <strong>SIMD Instructions:</strong> Uses SIMD (Single Instruction, Multiple Data) instructions to process multiple data points in parallel, which can significantly improve performance for certain operations.
      </p>
      <p>
        <strong>Shared Memory:</strong> Uses shared memory between the main thread and Web Workers, which can significantly improve performance for operations that involve large amounts of data.
      </p>
      <p>
        Click the "Create Instance" button to create a DarkSwap instance, then click the "Start DarkSwap" button to
        start the DarkSwap client. You can then interact with the DarkSwap protocol just like in the regular WebAssembly demo.
      </p>
      <p>
        The performance metrics section shows the time it takes to initialize the client, create the DarkSwap instance,
        start the client, and perform various operations. This helps you understand the performance benefits of combined optimizations.
      </p>
      <CombinedOptimizationsDarkSwapDemo />
    </div>
  );
};

export default CombinedOptimizationsDarkSwapDemoPage;