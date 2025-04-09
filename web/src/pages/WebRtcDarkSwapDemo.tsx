import React from 'react';
import WebRtcDarkSwapDemo from '../components/WebRtcDarkSwapDemo';
import '../styles/WebRtcDarkSwapDemo.css';

/**
 * WebRTC-enabled DarkSwap Demo page
 */
const WebRtcDarkSwapDemoPage: React.FC = () => {
  return (
    <div className="webrtc-darkswap-demo-page">
      <h1>WebRTC-enabled DarkSwap Demo</h1>
      <p>
        This page demonstrates the DarkSwap SDK running in the browser using WebAssembly and WebRTC.
        It shows how to use the WebRTC-enabled DarkSwap client to interact with the DarkSwap protocol
        and communicate directly with other peers using WebRTC.
      </p>
      <WebRtcDarkSwapDemo />
    </div>
  );
};

export default WebRtcDarkSwapDemoPage;