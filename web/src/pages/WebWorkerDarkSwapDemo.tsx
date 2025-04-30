import React from 'react';
import WebWorkerDarkSwapDemo from '../components/WebWorkerDarkSwapDemo';
import '../styles/DarkSwapDemo.css';

/**
 * Web Worker DarkSwap Demo page
 */
const WebWorkerDarkSwapDemoPage: React.FC = () => {
  return (
    <div className="web-worker-darkswap-demo-page">
      <h1>Web Worker DarkSwap Demo</h1>
      <p>
        This page demonstrates the DarkSwap SDK running in the browser using WebAssembly with Web Workers.
        Web Workers allow the WebAssembly module to be loaded and compiled in a background thread, which
        keeps the main thread free for user interactions and improves the responsiveness of the application.
      </p>
      <p>
        Click the "Create Instance" button to create a DarkSwap instance, then click the "Start DarkSwap" button to
        start the DarkSwap client. You can then interact with the DarkSwap protocol just like in the regular WebAssembly demo.
      </p>
      <p>
        The performance metrics section shows the time it takes to initialize the client, create the DarkSwap instance,
        start the client, and perform various operations. This helps you understand the performance benefits of using Web Workers.
      </p>
      <p>
        Note that Web Workers are only supported in modern browsers. If your browser doesn't support Web Workers,
        the demo will fall back to regular initialization.
      </p>
      <WebWorkerDarkSwapDemo />
    </div>
  );
};

export default WebWorkerDarkSwapDemoPage;