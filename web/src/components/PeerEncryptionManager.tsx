import React, { useState, useEffect } from 'react';
import { usePeerEncryption } from '../contexts/PeerEncryptionContext';
import { PeerKeyInfo } from '../services/PeerEncryptionService';

// Icons
import {
  KeyIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

export interface PeerEncryptionManagerProps {
  className?: string;
  compact?: boolean;
}

const PeerEncryptionManager: React.FC<PeerEncryptionManagerProps> = ({
  className = '',
  compact = false,
}) => {
  // Contexts
  const {
    isInitialized,
    peerKeys,
    initialize,
    addPeerPublicKey,
    removePeerPublicKey,
    getPublicKey,
    clear,
  } = usePeerEncryption();
  
  // State
  const [newPeerId, setNewPeerId] = useState<string>('');
  const [newPeerKey, setNewPeerKey] = useState<string>('');
  const [isAddingKey, setIsAddingKey] = useState<boolean>(false);
  const [myPublicKey, setMyPublicKey] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Load public key
  useEffect(() => {
    if (isInitialized) {
      loadMyPublicKey();
    }
  }, [isInitialized]);
  
  // Load my public key
  const loadMyPublicKey = async () => {
    try {
      const publicKey = await getPublicKey();
      if (publicKey) {
        setMyPublicKey(JSON.stringify(publicKey));
      }
    } catch (error) {
      console.error('Failed to load public key:', error);
    }
  };
  
  // Handle initialize
  const handleInitialize = async () => {
    setIsLoading(true);
    try {
      await initialize();
      await loadMyPublicKey();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle reset
  const handleReset = async () => {
    setIsLoading(true);
    try {
      clear();
      await initialize(true);
      await loadMyPublicKey();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle add peer key
  const handleAddPeerKey = () => {
    if (!newPeerId || !newPeerKey) return;
    
    setIsAddingKey(true);
    try {
      // Parse the key
      const publicKeyJwk = JSON.parse(newPeerKey);
      
      // Add the key
      const success = addPeerPublicKey(newPeerId, publicKeyJwk, false);
      
      if (success) {
        setNewPeerId('');
        setNewPeerKey('');
      }
    } catch (error) {
      console.error('Failed to add peer key:', error);
    } finally {
      setIsAddingKey(false);
    }
  };
  
  // Handle remove peer key
  const handleRemovePeerKey = (peerId: string) => {
    removePeerPublicKey(peerId);
  };
  
  // Handle copy public key
  const handleCopyPublicKey = () => {
    navigator.clipboard.writeText(myPublicKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Render compact view
  if (compact) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="flex items-center mr-2">
          <KeyIcon className="w-5 h-5 mr-1 text-gray-400" />
          <span className="text-sm">{peerKeys.length}</span>
        </div>
        
        <button
          onClick={isInitialized ? handleReset : handleInitialize}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          title={isInitialized ? 'Reset Keys' : 'Initialize Encryption'}
        >
          {isLoading ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowPathIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    );
  }
  
  // Render full view
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium flex items-center">
          <KeyIcon className="w-5 h-5 mr-2" />
          Peer Encryption
        </h2>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {peerKeys.length} keys
          </span>
          
          <button
            onClick={isInitialized ? handleReset : handleInitialize}
            className={`btn btn-sm ${
              isInitialized ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
            disabled={isLoading}
          >
            {isLoading ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <ArrowPathIcon className="w-4 h-4 mr-1" />
            )}
            {isInitialized ? 'Reset Keys' : 'Initialize'}
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {/* My Public Key */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <h3 className="text-md font-medium">My Public Key</h3>
          </div>
          
          {isInitialized ? (
            <div className="relative">
              <div className="bg-twilight-darker p-3 rounded-lg font-mono text-xs break-all">
                {myPublicKey || 'No public key available'}
              </div>
              
              <button
                onClick={handleCopyPublicKey}
                className="absolute top-2 right-2 p-1 rounded-lg bg-twilight-dark hover:bg-twilight-darker transition-colors duration-200"
                title="Copy to clipboard"
              >
                {isCopied ? (
                  <ClipboardDocumentCheckIcon className="w-5 h-5 text-green-400" />
                ) : (
                  <ClipboardDocumentIcon className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              Initialize encryption to generate keys
            </div>
          )}
        </div>
        
        {/* Add Peer Key */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <h3 className="text-md font-medium">Add Peer Key</h3>
          </div>
          
          <div className="space-y-2">
            <input
              type="text"
              value={newPeerId}
              onChange={(e) => setNewPeerId(e.target.value)}
              placeholder="Peer ID"
              className="form-input w-full"
              disabled={!isInitialized}
            />
            
            <textarea
              value={newPeerKey}
              onChange={(e) => setNewPeerKey(e.target.value)}
              placeholder="Peer Public Key (JSON)"
              className="form-textarea w-full h-24"
              disabled={!isInitialized}
            />
            
            <button
              onClick={handleAddPeerKey}
              disabled={!isInitialized || !newPeerId || !newPeerKey || isAddingKey}
              className="btn btn-primary w-full"
            >
              {isAddingKey ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <PlusIcon className="w-4 h-4 mr-1" />
              )}
              Add Peer Key
            </button>
          </div>
        </div>
        
        {/* Peer Keys */}
        <div>
          <div className="flex items-center mb-2">
            <h3 className="text-md font-medium">Peer Keys</h3>
          </div>
          
          {peerKeys.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              No peer keys added
            </div>
          ) : (
            <div className="overflow-y-auto max-h-64">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-2">Peer ID</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Last Used</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {peerKeys.map((key) => (
                    <tr key={key.peerId} className="border-t border-twilight-dark">
                      <td className="py-2 font-mono text-sm">
                        {key.peerId}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center">
                          {key.trusted ? (
                            <ShieldCheckIcon className="w-4 h-4 text-green-400 mr-1" />
                          ) : (
                            <ShieldExclamationIcon className="w-4 h-4 text-yellow-400 mr-1" />
                          )}
                          <span className="text-sm">
                            {key.trusted ? 'Trusted' : 'Untrusted'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-sm">
                        {formatDate(key.lastUsed)}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleRemovePeerKey(key.peerId)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeerEncryptionManager;