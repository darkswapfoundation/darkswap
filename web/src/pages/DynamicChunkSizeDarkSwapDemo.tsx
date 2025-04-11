import React from 'react';
import DynamicChunkSizeDarkSwapDemo from '../components/DynamicChunkSizeDarkSwapDemo';
import '../styles/DarkSwapDemo.css';

/**
 * Dynamic Chunk Size DarkSwap Demo page
 */
const DynamicChunkSizeDarkSwapDemoPage: React.FC = () => {
  return (
    <div className="dynamic-chunk-size-darkswap-demo-page">
      <h1>Dynamic Chunk Size DarkSwap Demo</h1>
      <p>
        This page demonstrates the DarkSwap SDK running in the browser using WebAssembly with dynamic chunk sizing.
        Dynamic chunk sizing can significantly improve the initial page load time by optimizing the chunk size for
        the current network conditions.
      </p>
      <p>
        The dynamic chunk sizing algorithm measures your network speed and round-trip time, then calculates the
        optimal chunk size for your current network conditions. For slow connections, it uses fewer, larger chunks
        to reduce the overhead of multiple requests. For fast connections, it uses more, smaller chunks to increase
        parallelism.
      </p>
      <p>
        The algorithm also takes into account the round-trip time (RTT) of your connection. For high latency connections,
        it increases the chunk size to reduce the number of requests. For low latency connections, it decreases the
        chunk size to increase parallelism.
      </p>
      <p>
        The network status section shows your current download speed, round-trip time, and when the measurement was taken.
        This information is used to calculate the optimal chunk size for your network conditions.
      </p>
      <p>
        Click the "Create Instance" button to create a DarkSwap instance, then click the "Start DarkSwap" button to
        start the DarkSwap client. You can then interact with the DarkSwap protocol just like in the regular WebAssembly demo.
      </p>
      <p>
        The performance metrics section shows the time it takes to initialize the client, create the DarkSwap instance,
        start the client, and perform various operations. This helps you understand the performance benefits of dynamic chunk sizing.
      </p>
      <DynamicChunkSizeDarkSwapDemo />
    </div>
  );
};

export default DynamicChunkSizeDarkSwapDemoPage;