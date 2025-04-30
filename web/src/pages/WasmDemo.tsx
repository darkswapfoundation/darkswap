import React from 'react';
import DarkSwapDemo from '../components/DarkSwapDemo';
import '../styles/WasmDemo.css';

/**
 * WebAssembly Demo page
 */
const WasmDemo: React.FC = () => {
  return (
    <div className="wasm-demo-page">
      <h1>WebAssembly Demo</h1>
      <p>
        This page demonstrates the DarkSwap SDK running in the browser using WebAssembly.
        It shows how to use the DarkSwap client to interact with the DarkSwap protocol.
      </p>
      <DarkSwapDemo />
    </div>
  );
};

export default WasmDemo;