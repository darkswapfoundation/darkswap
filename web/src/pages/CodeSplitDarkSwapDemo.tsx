import React from 'react';
import CodeSplitDarkSwapDemo from '../components/CodeSplitDarkSwapDemo';
import '../styles/DarkSwapDemo.css';

/**
 * Code Split DarkSwap Demo page
 */
const CodeSplitDarkSwapDemoPage: React.FC = () => {
  return (
    <div className="code-split-darkswap-demo-page">
      <h1>Code Split DarkSwap Demo</h1>
      <p>
        This page demonstrates the DarkSwap SDK running in the browser using WebAssembly with code splitting.
        Code splitting can significantly improve the initial page load time by splitting large WebAssembly
        modules into smaller chunks that are loaded on demand.
      </p>
      <p>
        You can configure the number of chunks to split the WebAssembly module into. More chunks means
        smaller initial download size, but more HTTP requests. The optimal number of chunks depends on
        the size of the WebAssembly module and the network conditions.
      </p>
      <p>
        Click the "Create Instance" button to create a DarkSwap instance, then click the "Start DarkSwap" button to
        start the DarkSwap client. You can then interact with the DarkSwap protocol just like in the regular WebAssembly demo.
      </p>
      <p>
        The performance metrics section shows the time it takes to initialize the client, create the DarkSwap instance,
        start the client, and perform various operations. This helps you understand the performance benefits of code splitting.
      </p>
      <CodeSplitDarkSwapDemo />
    </div>
  );
};

export default CodeSplitDarkSwapDemoPage;