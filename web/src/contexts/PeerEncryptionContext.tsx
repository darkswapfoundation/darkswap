import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import PeerEncryptionService, {
  PeerKeyInfo,
  EncryptedMessage,
} from '../services/PeerEncryptionService';
import { useNotification } from './NotificationContext';

// Context type
interface PeerEncryptionContextType {
  service: PeerEncryptionService;
  isInitialized: boolean;
  peerKeys: PeerKeyInfo[];
  initialize: (forceNewKeys?: boolean) => Promise<void>;
  addPeerPublicKey: (peerId: string, publicKeyJwk: JsonWebKey, trusted?: boolean) => boolean;
  removePeerPublicKey: (peerId: string) => void;
  encryptForPeer: (peerId: string, message: string) => Promise<EncryptedMessage | null>;
  decryptFromPeer: (peerId: string, encryptedMessage: EncryptedMessage) => Promise<string | null>;
  getPublicKey: () => Promise<JsonWebKey | null>;
  clear: () => void;
}

// Create context
const PeerEncryptionContext = createContext<PeerEncryptionContextType | undefined>(undefined);

// Provider props
interface PeerEncryptionProviderProps {
  children: ReactNode;
  keySize?: number;
  algorithm?: string;
  hashAlgorithm?: string;
  storageKey?: string;
  autoInitialize?: boolean;
}

// Provider component
export const PeerEncryptionProvider: React.FC<PeerEncryptionProviderProps> = ({
  children,
  keySize = 2048,
  algorithm = 'RSA-OAEP',
  hashAlgorithm = 'SHA-256',
  storageKey = 'darkswap-peer-encryption',
  autoInitialize = true,
}) => {
  // Get the peer encryption service
  const service = PeerEncryptionService.getInstance({
    keySize,
    algorithm,
    hashAlgorithm,
    storageKey,
  });
  const { addNotification } = useNotification();
  
  // State
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [peerKeys, setPeerKeys] = useState<PeerKeyInfo[]>([]);
  
  // Update peer keys
  const updatePeerKeys = () => {
    setPeerKeys(service.getAllPeerPublicKeys());
  };
  
  // Initialize service
  const initialize = async (forceNewKeys: boolean = false) => {
    try {
      await service.initialize(forceNewKeys);
      setIsInitialized(service.isReady());
      updatePeerKeys();
      addNotification('success', 'Peer encryption service initialized');
    } catch (error) {
      console.error('Failed to initialize peer encryption service:', error);
      addNotification('error', `Failed to initialize peer encryption service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Add peer public key
  const addPeerPublicKey = (peerId: string, publicKeyJwk: JsonWebKey, trusted: boolean = false) => {
    const result = service.addPeerPublicKey(peerId, publicKeyJwk, trusted);
    if (result) {
      updatePeerKeys();
      addNotification('success', `Added public key for peer: ${peerId}`);
    } else {
      addNotification('error', `Failed to add public key for peer: ${peerId}`);
    }
    return result;
  };
  
  // Remove peer public key
  const removePeerPublicKey = (peerId: string) => {
    service.removePeerPublicKey(peerId);
    updatePeerKeys();
    addNotification('info', `Removed public key for peer: ${peerId}`);
  };
  
  // Encrypt for peer
  const encryptForPeer = async (peerId: string, message: string) => {
    try {
      const encryptedMessage = await service.encryptForPeer(peerId, message);
      if (!encryptedMessage) {
        addNotification('error', `Failed to encrypt message for peer: ${peerId}`);
      }
      return encryptedMessage;
    } catch (error) {
      console.error(`Failed to encrypt message for peer ${peerId}:`, error);
      addNotification('error', `Failed to encrypt message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  
  // Decrypt from peer
  const decryptFromPeer = async (peerId: string, encryptedMessage: EncryptedMessage) => {
    try {
      const decryptedMessage = await service.decryptFromPeer(peerId, encryptedMessage);
      if (!decryptedMessage) {
        addNotification('error', `Failed to decrypt message from peer: ${peerId}`);
      }
      return decryptedMessage;
    } catch (error) {
      console.error(`Failed to decrypt message from peer ${peerId}:`, error);
      addNotification('error', `Failed to decrypt message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  
  // Get public key
  const getPublicKey = async () => {
    return service.getPublicKeyJwk();
  };
  
  // Clear all data
  const clear = () => {
    service.clear();
    setIsInitialized(false);
    setPeerKeys([]);
    addNotification('info', 'Peer encryption service cleared');
  };
  
  // Initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
  }, [autoInitialize]);
  
  return (
    <PeerEncryptionContext.Provider
      value={{
        service,
        isInitialized,
        peerKeys,
        initialize,
        addPeerPublicKey,
        removePeerPublicKey,
        encryptForPeer,
        decryptFromPeer,
        getPublicKey,
        clear,
      }}
    >
      {children}
    </PeerEncryptionContext.Provider>
  );
};

// Hook for using the peer encryption context
export const usePeerEncryption = (): PeerEncryptionContextType => {
  const context = useContext(PeerEncryptionContext);
  if (context === undefined) {
    throw new Error('usePeerEncryption must be used within a PeerEncryptionProvider');
  }
  return context;
};

export default PeerEncryptionProvider;