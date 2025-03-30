import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotification } from './NotificationContext';
import { BitcoinTransactionUtils, UTXO, TransactionInput, TransactionOutput, TransactionOptions } from '../utils/BitcoinTransactionUtils';
import { RunesUtils, Rune, RuneBalance, RuneTransaction, RuneTransferOptions } from '../utils/RunesUtils';
import { AlkanesUtils, Alkane, AlkaneBalance, AlkaneTransaction, AlkaneTransferOptions } from '../utils/AlkanesUtils';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;
  utxos: UTXO[];
  runes: RuneBalance[];
  alkanes: AlkaneBalance[];
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  signTransaction: (txHex: string) => Promise<string>;
  createTransaction: (outputs: TransactionOutput[], options?: TransactionOptions) => Promise<string>;
  sendTransaction: (txHex: string) => Promise<string>;
  getUTXOs: () => Promise<UTXO[]>;
  getRunes: () => Promise<RuneBalance[]>;
  getRuneById: (runeId: string) => Promise<Rune | undefined>;
  getRuneByTicker: (ticker: string) => Promise<Rune | undefined>;
  getRuneTransactions: () => Promise<RuneTransaction[]>;
  transferRune: (runeId: string, amount: string, toAddress: string, options?: RuneTransferOptions) => Promise<string>;
  getAlkanes: () => Promise<AlkaneBalance[]>;
  getAlkaneById: (alkaneId: string) => Promise<Alkane | undefined>;
  getAlkaneByTicker: (ticker: string) => Promise<Alkane | undefined>;
  getAlkaneTransactions: () => Promise<AlkaneTransaction[]>;
  transferAlkane: (alkaneId: string, amount: string, toAddress: string, options?: AlkaneTransferOptions) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [utxos, setUTXOs] = useState<UTXO[]>([]);
  const [runes, setRunes] = useState<RuneBalance[]>([]);
  const [alkanes, setAlkanes] = useState<AlkaneBalance[]>([]);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const { addNotification } = useNotification();

  // Check if wallet was previously connected
  useEffect(() => {
    const savedWalletState = localStorage.getItem('darkswap-wallet-connected');
    if (savedWalletState === 'true') {
      connectWallet();
    }
  }, []);

  // Connect to wallet
  const connectWallet = async () => {
    try {
      // In a real implementation, this would connect to a Bitcoin wallet
      // For now, we'll simulate a connection
      setIsConnected(true);
      
      // Generate a random address and private key
      const { privateKey: generatedKey, address: generatedAddress } = BitcoinTransactionUtils.createAddress();
      
      setAddress(generatedAddress);
      setPrivateKey(generatedKey);
      // Set a simulated balance
      setBalance('0.12345');
      
      // Set simulated UTXOs
      const simulatedUTXOs: UTXO[] = [
        {
          txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          vout: 0,
          value: 10000000, // 0.1 BTC
          scriptPubKey: '76a914' + '1234567890abcdef1234567890abcdef123456' + '88ac',
          address: generatedAddress,
          confirmations: 6,
        },
        {
          txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          vout: 1,
          value: 2345000, // 0.02345 BTC
          scriptPubKey: '76a914' + '1234567890abcdef1234567890abcdef123456' + '88ac',
          address: generatedAddress,
          confirmations: 3,
        },
      ];
      
      setUTXOs(simulatedUTXOs);
      
      // Save connection state
      localStorage.setItem('darkswap-wallet-connected', 'true');
      
      addNotification('success', 'Wallet connected successfully');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      addNotification('error', `Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Disconnect from wallet
  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setBalance('0.00');
    setUTXOs([]);
    setRunes([]);
    setAlkanes([]);
    setPrivateKey(null);
    
    // Clear connection state
    localStorage.removeItem('darkswap-wallet-connected');
    
    addNotification('info', 'Wallet disconnected');
  };

  // Sign message
  const signMessage = async (message: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // In a real implementation, this would sign a message with the wallet
      // For now, we'll simulate a signature
      const signature = `simulated_signature_${Date.now()}`;
      
      addNotification('success', 'Message signed successfully');
      
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      addNotification('error', `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  // Sign transaction
  const signTransaction = async (txHex: string): Promise<string> => {
    if (!isConnected || !privateKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Create transaction inputs with private key
      const tx = BitcoinTransactionUtils.signTransaction(
        txHex,
        utxos.map(utxo => ({
          utxo,
          privateKey,
        }))
      );
      
      addNotification('success', 'Transaction signed successfully');
      
      return tx;
    } catch (error) {
      console.error('Error signing transaction:', error);
      addNotification('error', `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Create transaction
  const createTransaction = async (outputs: TransactionOutput[], options?: TransactionOptions): Promise<string> => {
    if (!isConnected || !privateKey || !address) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Create transaction inputs with UTXOs
      const inputs: TransactionInput[] = utxos.map(utxo => ({
        utxo,
        privateKey,
      }));
      
      // Set change address if not provided
      const txOptions: TransactionOptions = {
        ...options,
        changeAddress: options?.changeAddress || address,
      };
      
      // Create the transaction
      const txHex = BitcoinTransactionUtils.createTransaction(inputs, outputs, txOptions);
      
      addNotification('success', 'Transaction created successfully');
      
      return txHex;
    } catch (error) {
      console.error('Error creating transaction:', error);
      addNotification('error', `Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Send transaction
  const sendTransaction = async (txHex: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // In a real implementation, this would broadcast the transaction to the Bitcoin network
      // For now, we'll simulate a transaction ID
      const txid = `txid_${Date.now()}`;
      
      addNotification('success', 'Transaction sent successfully');
      
      return txid;
    } catch (error) {
      console.error('Error sending transaction:', error);
      addNotification('error', `Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Get UTXOs
  const getUTXOs = async (): Promise<UTXO[]> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // In a real implementation, this would fetch UTXOs from a Bitcoin API
      // For now, we'll return the simulated UTXOs
      return utxos;
    } catch (error) {
      console.error('Error getting UTXOs:', error);
      addNotification('error', `Failed to get UTXOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Get runes
  const getRunes = async (): Promise<RuneBalance[]> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get rune balances
      const runeBalances = await RunesUtils.getRuneBalances(address);
      
      // Update state
      setRunes(runeBalances);
      
      return runeBalances;
    } catch (error) {
      console.error('Error getting runes:', error);
      addNotification('error', `Failed to get runes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Get rune by ID
  const getRuneById = async (runeId: string): Promise<Rune | undefined> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get rune
      return await RunesUtils.getRuneById(runeId);
    } catch (error) {
      console.error('Error getting rune:', error);
      addNotification('error', `Failed to get rune: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Get rune by ticker
  const getRuneByTicker = async (ticker: string): Promise<Rune | undefined> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get rune
      return await RunesUtils.getRuneByTicker(ticker);
    } catch (error) {
      console.error('Error getting rune:', error);
      addNotification('error', `Failed to get rune: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Get rune transactions
  const getRuneTransactions = async (): Promise<RuneTransaction[]> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get rune transactions
      return await RunesUtils.getRuneTransactions(address);
    } catch (error) {
      console.error('Error getting rune transactions:', error);
      addNotification('error', `Failed to get rune transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Transfer rune
  const transferRune = async (runeId: string, amount: string, toAddress: string, options?: RuneTransferOptions): Promise<string> => {
    if (!isConnected || !address || !privateKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get UTXOs
      const availableUTXOs = await getUTXOs();
      
      // Create transaction inputs
      const inputs: TransactionInput[] = availableUTXOs.map(utxo => ({
        utxo,
        privateKey,
      }));
      
      // Create rune transfer transaction
      const txHex = await RunesUtils.createRuneTransferTransaction(
        runeId,
        amount,
        address,
        toAddress,
        inputs,
        options
      );
      
      // Sign the transaction
      const signedTx = await signTransaction(txHex);
      
      // Send the transaction
      const txid = await sendTransaction(signedTx);
      
      // Update rune balances
      await getRunes();
      
      addNotification('success', `Rune transfer sent successfully`);
      
      return txid;
    } catch (error) {
      console.error('Error transferring rune:', error);
      addNotification('error', `Failed to transfer rune: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Get alkanes
  const getAlkanes = async (): Promise<AlkaneBalance[]> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get alkane balances
      const alkaneBalances = await AlkanesUtils.getAlkaneBalances(address);
      
      // Update state
      setAlkanes(alkaneBalances);
      
      return alkaneBalances;
    } catch (error) {
      console.error('Error getting alkanes:', error);
      addNotification('error', `Failed to get alkanes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Get alkane by ID
  const getAlkaneById = async (alkaneId: string): Promise<Alkane | undefined> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get alkane
      return await AlkanesUtils.getAlkaneById(alkaneId);
    } catch (error) {
      console.error('Error getting alkane:', error);
      addNotification('error', `Failed to get alkane: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Get alkane by ticker
  const getAlkaneByTicker = async (ticker: string): Promise<Alkane | undefined> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get alkane
      return await AlkanesUtils.getAlkaneByTicker(ticker);
    } catch (error) {
      console.error('Error getting alkane:', error);
      addNotification('error', `Failed to get alkane: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Get alkane transactions
  const getAlkaneTransactions = async (): Promise<AlkaneTransaction[]> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get alkane transactions
      return await AlkanesUtils.getAlkaneTransactions(address);
    } catch (error) {
      console.error('Error getting alkane transactions:', error);
      addNotification('error', `Failed to get alkane transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };
  
  // Transfer alkane
  const transferAlkane = async (alkaneId: string, amount: string, toAddress: string, options?: AlkaneTransferOptions): Promise<string> => {
    if (!isConnected || !address || !privateKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get UTXOs
      const availableUTXOs = await getUTXOs();
      
      // Create transaction inputs
      const inputs: TransactionInput[] = availableUTXOs.map(utxo => ({
        utxo,
        privateKey,
      }));
      
      // Create alkane transfer transaction
      const txHex = await AlkanesUtils.createAlkaneTransferTransaction(
        alkaneId,
        amount,
        address,
        toAddress,
        inputs,
        options
      );
      
      // Sign the transaction
      const signedTx = await signTransaction(txHex);
      
      // Send the transaction
      const txid = await sendTransaction(signedTx);
      
      // Update alkane balances
      await getAlkanes();
      
      addNotification('success', `Alkane transfer sent successfully`);
      
      return txid;
    } catch (error) {
      console.error('Error transferring alkane:', error);
      addNotification('error', `Failed to transfer alkane: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        balance,
        utxos,
        runes,
        alkanes,
        connect: connectWallet,
        disconnect: disconnectWallet,
        signMessage,
        signTransaction,
        createTransaction,
        sendTransaction,
        getUTXOs,
        getRunes,
        getRuneById,
        getRuneByTicker,
        getRuneTransactions,
        transferRune,
        getAlkanes,
        getAlkaneById,
        getAlkaneByTicker,
        getAlkaneTransactions,
        transferAlkane,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export default WalletProvider;