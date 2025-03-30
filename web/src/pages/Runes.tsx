import React from 'react';
import RunesDisplay from '../components/RunesDisplay';
import { useWallet } from '../contexts/WalletContext';

interface RunesPageProps {
  isWalletConnected: boolean;
  isSDKInitialized: boolean;
  apiClient: any;
  isApiLoading: boolean;
}

/**
 * Runes page
 * Displays information about the user's runes
 */
const Runes: React.FC<RunesPageProps> = ({
  isWalletConnected,
  isSDKInitialized,
  apiClient,
  isApiLoading,
}) => {
  // Display loading state if API is loading
  if (isApiLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Bitcoin Runes</h1>
        <p>Loading...</p>
      </div>
    );
  }
  
  // Display connection message if wallet is not connected
  if (!isWalletConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Bitcoin Runes</h1>
        <p className="mb-6">Please connect your wallet to view your runes.</p>
        
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">About Runes</h2>
          <p>
            Runes are a new type of digital asset that uses the Bitcoin blockchain for security and immutability.
            Connect your wallet to view and manage your runes.
          </p>
        </div>
      </div>
    );
  }
  
  // Display initialization message if SDK is not initialized
  if (!isSDKInitialized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Bitcoin Runes</h1>
        <p className="mb-6">Initializing SDK...</p>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bitcoin Runes</h1>
      <p className="mb-6">
        Bitcoin Runes are digital assets that live on the Bitcoin blockchain. They are similar to NFTs but with some key differences.
        Runes are created using the Runes protocol, which allows for the creation of fungible and non-fungible tokens on Bitcoin.
      </p>
      
      <RunesDisplay />
      
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">About Runes</h2>
        <p className="mb-4">
          Runes are a new type of digital asset that uses the Bitcoin blockchain for security and immutability.
          They are created using the Runes protocol, which is a layer on top of Bitcoin that allows for the creation
          of tokens without requiring changes to the Bitcoin protocol.
        </p>
        
        <h3 className="text-lg font-bold mt-6 mb-2">Key Features</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Secured by Bitcoin's proof-of-work</li>
          <li>No new blockchain or token required</li>
          <li>Compatible with existing Bitcoin wallets</li>
          <li>Low transaction fees</li>
          <li>Decentralized and permissionless</li>
        </ul>
        
        <h3 className="text-lg font-bold mt-6 mb-2">How to Use Runes</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Connect your Bitcoin wallet</li>
          <li>View your rune balances</li>
          <li>Send and receive runes</li>
          <li>Trade runes with other users</li>
          <li>Create your own runes (coming soon)</li>
        </ol>
        
        <h3 className="text-lg font-bold mt-6 mb-2">Trading Runes</h3>
        <p className="mb-4">
          You can trade runes with other users using DarkSwap's P2P trading functionality.
          Simply go to the P2P Trade page, select a peer, and create a trade offer.
          You can offer Bitcoin for runes, runes for Bitcoin, or even runes for other runes.
        </p>
        
        <div className="mt-6 p-4 bg-yellow-900 bg-opacity-30 rounded-lg">
          <h4 className="text-yellow-500 font-bold mb-2">Note</h4>
          <p>
            Runes are a new technology and are still in development. Use at your own risk.
            Always verify the rune ID and ticker before trading to avoid scams.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Runes;