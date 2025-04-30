import React from 'react';
import SharedMemoryDarkSwapDemo from '../components/SharedMemoryDarkSwapDemo';
import '../styles/DarkSwapDemo.css';

/**
 * Shared Memory DarkSwap Demo page
 */
const SharedMemoryDarkSwapDemoPage: React.FC = () => {
  return (
    <div className="shared-memory-darkswap-demo-page">
      <h1>Shared Memory DarkSwap Demo</h1>
      <p>
        This page demonstrates the DarkSwap SDK running in the browser using WebAssembly with shared memory.
        Shared memory allows the main thread and Web Workers to share memory using Shared Array Buffers,
        which can significantly improve performance for certain operations.
      </p>
      <p>
        Modern browsers like Chrome, Firefox, and Safari support Shared Array Buffers, which
        enable efficient communication between the main thread and Web Workers. This can be
        particularly useful for applications that need to process large amounts of data or
        perform complex calculations.
      </p>
      <p>
        The demo will automatically detect if your browser supports Shared Array Buffers and use them if available.
        If Shared Array Buffers are not supported, it will fall back to regular WebAssembly.
      </p>
      <p>
        You can configure the memory options for the shared memory, including the initial and maximum
        memory size. The memory size is specified in pages, where each page is 64KB.
      </p>
      <p>
        Click the "Create Instance" button to create a DarkSwap instance, then click the "Start DarkSwap" button to
        start the DarkSwap client. You can then interact with the DarkSwap protocol just like in the regular WebAssembly demo.
      </p>
      <p>
        The performance metrics section shows the time it takes to initialize the client, create the DarkSwap instance,
        start the client, and perform various operations. This helps you understand the performance benefits of shared memory.
      </p>
      <SharedMemoryDarkSwapDemo />
    </div>
  );
};

export default SharedMemoryDarkSwapDemoPage;