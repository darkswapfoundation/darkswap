import React, { useState } from 'react';
import WebRtcDemo from '../components/WebRtcDemo';
import WebRtcTrade from '../components/WebRtcTrade';
import WebRtcNetworkStatus from '../components/WebRtcNetworkStatus';
import WebRtcOrderbook from '../components/WebRtcOrderbook';
import WebRtcPeerDiscovery from '../components/WebRtcPeerDiscovery';
import WebRtcSettings from '../components/WebRtcSettings';
import WebRtcGroupChat from '../components/WebRtcGroupChat';
import WebRtcFileSharing from '../components/WebRtcFileSharing';
import WebRtcAudioVideoChat from '../components/WebRtcAudioVideoChat';

interface WebRtcPageProps {
  isWalletConnected?: boolean;
  isSDKInitialized?: boolean;
  apiClient?: any;
  isApiLoading?: boolean;
}

const WebRtcPage: React.FC<WebRtcPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'demo' | 'trade' | 'network' | 'orderbook' | 'discovery' | 'settings' | 'group' | 'files' | 'call'>('demo');
  return (
    <div className="webrtc-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>WebRTC P2P Communication</h1>
      <p>
        This page demonstrates peer-to-peer communication using WebRTC. You can connect to other peers
        and exchange messages directly without going through a server.
      </p>
      
      <h2>How it works</h2>
      <ol>
        <li>Your browser connects to a signaling server to exchange connection information</li>
        <li>When you connect to another peer, WebRTC establishes a direct connection</li>
        <li>Messages are sent directly between peers without going through a server</li>
        <li>The connection is secure and encrypted using DTLS</li>
      </ol>
      
      <h2>Try it out</h2>
      <p>
        To test the WebRTC functionality, open this page in two different browser windows or devices.
        Copy the Peer ID from one window and paste it into the other window to establish a connection.
      </p>
      
      {/* Tab navigation */}
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #333' }}>
        <button
          onClick={() => setActiveTab('demo')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'demo' ? '#4361ee' : 'transparent',
            color: activeTab === 'demo' ? 'white' : '#ccc',
            border: 'none',
            borderBottom: activeTab === 'demo' ? '2px solid #4361ee' : 'none',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Basic Demo
        </button>
        <button
          onClick={() => setActiveTab('call')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'call' ? '#4361ee' : 'transparent',
            color: activeTab === 'call' ? 'white' : '#ccc',
            border: 'none',
            borderBottom: activeTab === 'call' ? '2px solid #4361ee' : 'none',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          Audio/Video
        </button>
        <button
          onClick={() => setActiveTab('files')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'files' ? '#4361ee' : 'transparent',
            color: activeTab === 'files' ? 'white' : '#ccc',
            border: 'none',
            borderBottom: activeTab === 'files' ? '2px solid #4361ee' : 'none',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          File Sharing
        </button>
        <button
          onClick={() => setActiveTab('group')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'group' ? '#4361ee' : 'transparent',
            color: activeTab === 'group' ? 'white' : '#ccc',
            border: 'none',
            borderBottom: activeTab === 'group' ? '2px solid #4361ee' : 'none',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          Group Chat
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'settings' ? '#4361ee' : 'transparent',
            color: activeTab === 'settings' ? 'white' : '#ccc',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '2px solid #4361ee' : 'none',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('discovery')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'discovery' ? '#4361ee' : 'transparent',
            color: activeTab === 'discovery' ? 'white' : '#ccc',
            border: 'none',
            borderBottom: activeTab === 'discovery' ? '2px solid #4361ee' : 'none',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          Peer Discovery
        </button>
        <button
          onClick={() => setActiveTab('trade')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'trade' ? '#4361ee' : 'transparent',
            color: activeTab === 'trade' ? 'white' : '#ccc',
            border: 'none',
            borderBottom: activeTab === 'trade' ? '2px solid #4361ee' : 'none',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          P2P Trading
        </button>
        <button
          onClick={() => setActiveTab('orderbook')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'orderbook' ? '#4361ee' : 'transparent',
            color: activeTab === 'orderbook' ? 'white' : '#ccc',
            border: 'none',
            borderBottom: activeTab === 'orderbook' ? '2px solid #4361ee' : 'none',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          P2P Orderbook
        </button>
        <button
          onClick={() => setActiveTab('network')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'network' ? '#4361ee' : 'transparent',
            color: activeTab === 'network' ? 'white' : '#ccc',
            border: 'none',
            borderBottom: activeTab === 'network' ? '2px solid #4361ee' : 'none',
            cursor: 'pointer'
          }}
        >
          Network Status
        </button>
      </div>
      
      {/* Tab content */}
      {/* Always show network status at the top */}
      {activeTab === 'network' && <WebRtcNetworkStatus />}
      
      {/* Tab content */}
      {activeTab === 'demo' ? (
        <WebRtcDemo />
      ) : activeTab === 'trade' ? (
        <WebRtcTrade />
      ) : activeTab === 'orderbook' ? (
        <WebRtcOrderbook />
      ) : activeTab === 'discovery' ? (
        <WebRtcPeerDiscovery />
      ) : activeTab === 'settings' ? (
        <WebRtcSettings />
      ) : activeTab === 'group' ? (
        <WebRtcGroupChat />
      ) : activeTab === 'files' ? (
        <WebRtcFileSharing />
      ) : activeTab === 'call' ? (
        <WebRtcAudioVideoChat />
      ) : null}
      
      <h2>Technical Details</h2>
      <p>
        This implementation uses the following technologies:
      </p>
      <ul>
        <li>WebRTC for peer-to-peer communication</li>
        <li>WebSocket for signaling</li>
        <li>STUN servers for NAT traversal</li>
        <li>React for the user interface</li>
      </ul>
      
      <p>
        The WebRTC implementation is part of the DarkSwap P2P networking layer, which enables
        direct peer-to-peer trading without intermediaries.
      </p>
    </div>
  );
};

export default WebRtcPage;