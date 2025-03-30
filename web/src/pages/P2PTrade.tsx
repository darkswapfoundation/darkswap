import React from 'react';
import WebRtcWalletIntegration from '../components/WebRtcWalletIntegration';

/**
 * P2P Trade page
 * Displays the WebRTC wallet integration component for P2P trading
 */
const P2PTrade: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Peer-to-Peer Trading</h1>
      <p className="mb-6">
        Trade directly with other users using WebRTC peer-to-peer technology. No intermediaries, no central servers.
        Your trades are executed directly between you and your trading partner.
      </p>
      
      <WebRtcWalletIntegration />
      
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">How P2P Trading Works</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Connect your wallet using the button above</li>
          <li>Select a peer from the dropdown menu</li>
          <li>Enter the details of your trade offer</li>
          <li>Send the trade request to your peer</li>
          <li>Wait for them to accept or reject your offer</li>
          <li>If accepted, the trade will be executed automatically</li>
          <li>The transaction will be signed and broadcast to the Bitcoin network</li>
          <li>Once confirmed, the trade is complete</li>
        </ol>
        
        <h2 className="text-xl font-bold mt-6 mb-4">Security Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>End-to-end encrypted communication using WebRTC</li>
          <li>Direct peer-to-peer connection with no intermediaries</li>
          <li>All transactions are signed locally with your private key</li>
          <li>Your private keys never leave your device</li>
          <li>All trades are executed on the Bitcoin blockchain for maximum security</li>
        </ul>
      </div>
    </div>
  );
};

export default P2PTrade;