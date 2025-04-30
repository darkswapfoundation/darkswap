import React from 'react';
import AlkanesDisplay from '../components/AlkanesDisplay';
import { useWallet } from '../contexts/WalletContext';

interface AlkanesPageProps {
  isWalletConnected: boolean;
  isSDKInitialized: boolean;
  apiClient: any;
  isApiLoading: boolean;
}

/**
 * Alkanes page
 * Displays information about the user's alkanes
 */
const Alkanes: React.FC<AlkanesPageProps> = ({
  isWalletConnected,
  isSDKInitialized,
  apiClient,
  isApiLoading,
}) => {
  // Display loading state if API is loading
  if (isApiLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Bitcoin Alkanes</h1>
        <p>Loading...</p>
      </div>
    );
  }
  
  // Display connection message if wallet is not connected
  if (!isWalletConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Bitcoin Alkanes</h1>
        <p className="mb-6">Please connect your wallet to view your alkanes.</p>
        
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">About Alkanes</h2>
          <p>
            Alkanes are a new type of digital asset that uses the Bitcoin blockchain for security and immutability.
            Connect your wallet to view and manage your alkanes.
          </p>
        </div>
      </div>
    );
  }
  
  // Display initialization message if SDK is not initialized
  if (!isSDKInitialized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Bitcoin Alkanes</h1>
        <p className="mb-6">Initializing SDK...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bitcoin Alkanes</h1>
      <p className="mb-6">
        Bitcoin Alkanes are digital assets that live on the Bitcoin blockchain. They are named after the chemical compounds
        and represent a new class of tokens with unique properties. Alkanes are created using the Alkanes protocol,
        which allows for the creation of fungible tokens with metadata on Bitcoin.
      </p>
      
      <AlkanesDisplay />
      
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">About Alkanes</h2>
        <p className="mb-4">
          Alkanes are a new type of digital asset that uses the Bitcoin blockchain for security and immutability.
          They are created using the Alkanes protocol, which is a layer on top of Bitcoin that allows for the creation
          of tokens with rich metadata without requiring changes to the Bitcoin protocol.
        </p>
        
        <h3 className="text-lg font-bold mt-6 mb-2">Key Features</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Secured by Bitcoin's proof-of-work</li>
          <li>Rich metadata support</li>
          <li>Compatible with existing Bitcoin wallets</li>
          <li>Low transaction fees</li>
          <li>Decentralized and permissionless</li>
        </ul>
        
        <h3 className="text-lg font-bold mt-6 mb-2">Alkane Properties</h3>
        <p className="mb-4">
          Each alkane has a set of properties that define its characteristics. These properties are stored on the
          Bitcoin blockchain and can be accessed by anyone. The properties include:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Formula:</strong> The chemical formula of the alkane (e.g., CH4 for methane)</li>
          <li><strong>Carbon Atoms:</strong> The number of carbon atoms in the alkane</li>
          <li><strong>Hydrogen Atoms:</strong> The number of hydrogen atoms in the alkane</li>
          <li><strong>Other Properties:</strong> Additional properties specific to each alkane</li>
        </ul>
        
        <h3 className="text-lg font-bold mt-6 mb-2">How to Use Alkanes</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Connect your Bitcoin wallet</li>
          <li>View your alkane balances</li>
          <li>Send and receive alkanes</li>
          <li>Trade alkanes with other users</li>
          <li>Create your own alkanes (coming soon)</li>
        </ol>
        
        <h3 className="text-lg font-bold mt-6 mb-2">Trading Alkanes</h3>
        <p className="mb-4">
          You can trade alkanes with other users using DarkSwap's P2P trading functionality.
          Simply go to the P2P Trade page, select a peer, and create a trade offer.
          You can offer Bitcoin for alkanes, alkanes for Bitcoin, or even alkanes for other alkanes or runes.
        </p>
        
        <div className="mt-6 p-4 bg-yellow-900 bg-opacity-30 rounded-lg">
          <h4 className="text-yellow-500 font-bold mb-2">Note</h4>
          <p>
            Alkanes are a new technology and are still in development. Use at your own risk.
            Always verify the alkane ID and ticker before trading to avoid scams.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Alkanes;