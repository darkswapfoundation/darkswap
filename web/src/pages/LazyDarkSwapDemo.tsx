import React from 'react';
import LazyDarkSwapDemo from '../components/LazyDarkSwapDemo';
import '../styles/DarkSwapDemo.css';

/**
 * Lazy-loaded DarkSwap Demo page
 */
const LazyDarkSwapDemoPage: React.FC = () => {
  return (
    <div className="lazy-darkswap-demo-page">
      <h1>Lazy-loaded DarkSwap Demo</h1>
      <p>
        This page demonstrates the DarkSwap SDK running in the browser using WebAssembly with lazy loading.
        The WebAssembly module is only loaded when it's needed, which improves initial page load performance.
      </p>
      <p>
        Click the "Load Client" button to load the WebAssembly module and initialize the DarkSwap client.
        You can then interact with the DarkSwap protocol just like in the regular WebAssembly demo.
      </p>
      <p>
        The performance metrics section shows the time it takes to initialize the client, load the WebAssembly module,
        and perform various operations. This helps you understand the performance benefits of lazy loading.
      </p>
      <LazyDarkSwapDemo />
    </div>
  );
};

export default LazyDarkSwapDemoPage;