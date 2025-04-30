import React from 'react';
import StreamingDarkSwapDemo from '../components/StreamingDarkSwapDemo';
import '../styles/DarkSwapDemo.css';

/**
 * Streaming DarkSwap Demo page
 */
const StreamingDarkSwapDemoPage: React.FC = () => {
  return (
    <div className="streaming-darkswap-demo-page">
      <h1>Streaming DarkSwap Demo</h1>
      <p>
        This page demonstrates the DarkSwap SDK running in the browser using WebAssembly with streaming compilation.
        Streaming compilation can significantly improve loading times by compiling the WebAssembly module while it's
        being downloaded.
      </p>
      <p>
        Click the "Create Instance" button to create a DarkSwap instance, then click the "Start DarkSwap" button to
        start the DarkSwap client. You can then interact with the DarkSwap protocol just like in the regular WebAssembly demo.
      </p>
      <p>
        The performance metrics section shows the time it takes to initialize the client, create the DarkSwap instance,
        start the client, and perform various operations. This helps you understand the performance benefits of streaming compilation.
      </p>
      <p>
        Note that streaming compilation is only supported in modern browsers. If your browser doesn't support it,
        the demo will fall back to regular compilation.
      </p>
      <StreamingDarkSwapDemo />
    </div>
  );
};

export default StreamingDarkSwapDemoPage;