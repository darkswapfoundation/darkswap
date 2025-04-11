import React from 'react';
import SimdDarkSwapDemo from '../components/SimdDarkSwapDemo';
import '../styles/DarkSwapDemo.css';

/**
 * SIMD-enabled DarkSwap Demo page
 */
const SimdDarkSwapDemoPage: React.FC = () => {
  return (
    <div className="simd-darkswap-demo-page">
      <h1>SIMD-enabled DarkSwap Demo</h1>
      <p>
        This page demonstrates the DarkSwap SDK running in the browser using WebAssembly with SIMD support.
        SIMD (Single Instruction, Multiple Data) instructions can significantly improve performance for
        certain operations by processing multiple data points in parallel.
      </p>
      <p>
        Modern browsers like Chrome, Firefox, and Safari support SIMD instructions in WebAssembly, which
        can provide significant performance improvements for computationally intensive tasks like cryptography,
        image processing, and numerical simulations.
      </p>
      <p>
        The demo will automatically detect if your browser supports SIMD instructions and use them if available.
        If SIMD is not supported, it will fall back to regular WebAssembly.
      </p>
      <p>
        Click the "Create Instance" button to create a DarkSwap instance, then click the "Start DarkSwap" button to
        start the DarkSwap client. You can then interact with the DarkSwap protocol just like in the regular WebAssembly demo.
      </p>
      <p>
        The performance metrics section shows the time it takes to initialize the client, create the DarkSwap instance,
        start the client, and perform various operations. This helps you understand the performance benefits of SIMD.
      </p>
      <SimdDarkSwapDemo />
    </div>
  );
};

export default SimdDarkSwapDemoPage;