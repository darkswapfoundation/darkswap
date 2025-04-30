import React from 'react';
import PeerNetworkStatus from '../components/PeerNetworkStatus';
import CircuitRelayStatus from '../components/CircuitRelayStatus';
import PeerEncryptionManager from '../components/PeerEncryptionManager';

const P2PNetworkPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">
          <span className="text-white">P2P Network</span>
        </h1>
        <p className="text-gray-400 mt-1">
          Manage your peer-to-peer network connections
        </p>
      </div>
      
      {/* Peer Network Status */}
      <PeerNetworkStatus className="mb-8" />
      
      {/* Circuit Relay Status */}
      <CircuitRelayStatus className="mb-8" />
      
      {/* Peer Encryption Manager */}
      <PeerEncryptionManager />
      
      {/* Network Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Network Information</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium mb-2">What is P2P?</h3>
              <p className="text-gray-400">
                Peer-to-peer (P2P) networking allows DarkSwap to operate without relying on central servers.
                Instead, users connect directly to each other, creating a resilient and censorship-resistant network.
              </p>
            </div>
            <div>
              <h3 className="text-md font-medium mb-2">How it Works</h3>
              <p className="text-gray-400">
                DarkSwap uses WebRTC technology to establish direct connections between browsers.
                This enables secure, encrypted communication for trading without intermediaries.
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-md font-medium mb-2">Network Benefits</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Enhanced privacy - No central server storing your trading data</li>
              <li>Censorship resistance - Cannot be easily shut down</li>
              <li>Lower fees - No middlemen taking a cut of trades</li>
              <li>Global accessibility - Works anywhere with internet access</li>
              <li>Resilience - Network continues to function even if some peers disconnect</li>
            </ul>
          </div>
          
          <div className="mt-6">
            <h3 className="text-md font-medium mb-2">Troubleshooting</h3>
            <div className="bg-twilight-darker p-4 rounded">
              <p className="text-gray-400 mb-2">
                Having trouble connecting to peers? Try these steps:
              </p>
              <ol className="list-decimal list-inside text-gray-400 space-y-1">
                <li>Ensure your browser supports WebRTC (most modern browsers do)</li>
                <li>Check that you're not behind a restrictive firewall or VPN</li>
                <li>Try using a different network connection</li>
                <li>Restart your browser</li>
                <li>Connect to known bootstrap peers manually</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default P2PNetworkPage;