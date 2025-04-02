import React, { useState } from 'react';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { useNotification } from '../contexts/NotificationContext';
import WasmWalletConnector from '../components/WasmWalletConnector';

// Icons
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const WasmWalletDemo: React.FC = () => {
  // Contexts
  const {
    isInitialized,
    isConnected,
    address,
    balance,
    error,
    signMessage,
    signTransaction,
    createPsbt,
    signPsbt,
    finalizePsbt,
    extractTx,
    broadcastTx,
    refreshBalance,
  } = useWasmWallet();
  const { addNotification } = useNotification();
  
  // State
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Hello, DarkSwap!');
  const [signature, setSignature] = useState<string | null>(null);
  const [txHex, setTxHex] = useState<string>('');
  const [signedTx, setSignedTx] = useState<string | null>(null);
  const [psbtBase64, setPsbtBase64] = useState<string | null>(null);
  const [signedPsbt, setSignedPsbt] = useState<string | null>(null);
  const [finalizedPsbt, setFinalizedPsbt] = useState<string | null>(null);
  const [extractedTx, setExtractedTx] = useState<string | null>(null);
  const [txid, setTxid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<{
    signMessage: boolean;
    signTx: boolean;
    createPsbt: boolean;
    signPsbt: boolean;
    finalizePsbt: boolean;
    extractTx: boolean;
    broadcastTx: boolean;
  }>({
    signMessage: false,
    signTx: false,
    createPsbt: false,
    signPsbt: false,
    finalizePsbt: false,
    extractTx: false,
    broadcastTx: false,
  });
  
  // Handle refresh balance
  const handleRefreshBalance = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshBalance();
      addNotification('success', 'Balance refreshed');
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      addNotification('error', `Failed to refresh balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle sign message
  const handleSignMessage = async () => {
    if (!isConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }
    
    if (!message) {
      addNotification('error', 'Please enter a message to sign');
      return;
    }
    
    setIsLoading({ ...isLoading, signMessage: true });
    try {
      const sig = await signMessage(message);
      setSignature(sig);
      if (sig) {
        addNotification('success', 'Message signed successfully');
      }
    } catch (error) {
      console.error('Failed to sign message:', error);
      addNotification('error', `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading({ ...isLoading, signMessage: false });
    }
  };
  
  // Handle sign transaction
  const handleSignTransaction = async () => {
    if (!isConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }
    
    if (!txHex) {
      addNotification('error', 'Please enter a transaction hex to sign');
      return;
    }
    
    setIsLoading({ ...isLoading, signTx: true });
    try {
      const signed = await signTransaction(txHex);
      setSignedTx(signed);
      if (signed) {
        addNotification('success', 'Transaction signed successfully');
      }
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      addNotification('error', `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading({ ...isLoading, signTx: false });
    }
  };
  
  // Handle create PSBT
  const handleCreatePsbt = async () => {
    if (!isConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }
    
    setIsLoading({ ...isLoading, createPsbt: true });
    try {
      // Example inputs and outputs
      const inputs = [
        {
          txid: '7a9f5e9e5b5e5c5d5e5f5e5d5c5b5a5b5c5d5e5f5e5d5c5b5a5b5c5d5e5f',
          vout: 0,
          value: 10000000, // 0.1 BTC
        },
      ];
      
      const outputs = [
        {
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          value: 5000000, // 0.05 BTC
        },
        {
          address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
          value: 4990000, // 0.0499 BTC (0.1 - 0.05 - 0.0001 fee)
        },
      ];
      
      const psbt = await createPsbt(inputs, outputs);
      setPsbtBase64(psbt);
      if (psbt) {
        addNotification('success', 'PSBT created successfully');
      }
    } catch (error) {
      console.error('Failed to create PSBT:', error);
      addNotification('error', `Failed to create PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading({ ...isLoading, createPsbt: false });
    }
  };
  
  // Handle sign PSBT
  const handleSignPsbt = async () => {
    if (!isConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }
    
    if (!psbtBase64) {
      addNotification('error', 'Please create a PSBT first');
      return;
    }
    
    setIsLoading({ ...isLoading, signPsbt: true });
    try {
      const signed = await signPsbt(psbtBase64);
      setSignedPsbt(signed);
      if (signed) {
        addNotification('success', 'PSBT signed successfully');
      }
    } catch (error) {
      console.error('Failed to sign PSBT:', error);
      addNotification('error', `Failed to sign PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading({ ...isLoading, signPsbt: false });
    }
  };
  
  // Handle finalize PSBT
  const handleFinalizePsbt = async () => {
    if (!isConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }
    
    if (!signedPsbt) {
      addNotification('error', 'Please sign the PSBT first');
      return;
    }
    
    setIsLoading({ ...isLoading, finalizePsbt: true });
    try {
      const finalized = await finalizePsbt(signedPsbt);
      setFinalizedPsbt(finalized);
      if (finalized) {
        addNotification('success', 'PSBT finalized successfully');
      }
    } catch (error) {
      console.error('Failed to finalize PSBT:', error);
      addNotification('error', `Failed to finalize PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading({ ...isLoading, finalizePsbt: false });
    }
  };
  
  // Handle extract transaction
  const handleExtractTx = async () => {
    if (!isConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }
    
    if (!finalizedPsbt) {
      addNotification('error', 'Please finalize the PSBT first');
      return;
    }
    
    setIsLoading({ ...isLoading, extractTx: true });
    try {
      const extracted = await extractTx(finalizedPsbt);
      setExtractedTx(extracted);
      if (extracted) {
        addNotification('success', 'Transaction extracted successfully');
      }
    } catch (error) {
      console.error('Failed to extract transaction:', error);
      addNotification('error', `Failed to extract transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading({ ...isLoading, extractTx: false });
    }
  };
  
  // Handle broadcast transaction
  const handleBroadcastTx = async () => {
    if (!isConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }
    
    if (!extractedTx) {
      addNotification('error', 'Please extract the transaction first');
      return;
    }
    
    setIsLoading({ ...isLoading, broadcastTx: true });
    try {
      const id = await broadcastTx(extractedTx);
      setTxid(id);
      if (id) {
        addNotification('success', 'Transaction broadcasted successfully');
      }
    } catch (error) {
      console.error('Failed to broadcast transaction:', error);
      addNotification('error', `Failed to broadcast transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading({ ...isLoading, broadcastTx: false });
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        addNotification('success', `${label} copied to clipboard`);
      },
      (err) => {
        console.error('Failed to copy:', err);
        addNotification('error', `Failed to copy ${label.toLowerCase()}`);
      }
    );
  };
  
  // Format BTC amount
  const formatBtc = (amount: string): string => {
    try {
      const num = parseFloat(amount);
      if (isNaN(num)) return '0.00000000';
      return num.toFixed(8);
    } catch (e) {
      return '0.00000000';
    }
  };
  
  // Truncate string
  const truncate = (str: string, n: number = 10): string => {
    if (!str) return '';
    return str.length > n * 2 ? `${str.substring(0, n)}...${str.substring(str.length - n)}` : str;
  };
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">
          <span className="text-white">WebAssembly Wallet Demo</span>
        </h1>
        <p className="text-gray-400 mt-1">
          Test the WebAssembly wallet functionality
        </p>
      </div>
      
      {/* Wallet Connection */}
      <div className="card p-6">
        <h2 className="text-xl font-display font-medium mb-4">Wallet Connection</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Status</div>
            <div className="flex items-center">
              {isInitialized ? (
                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-400 mr-2" />
              )}
              <span>Initialized</span>
            </div>
            <div className="flex items-center mt-2">
              {isConnected ? (
                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-400 mr-2" />
              )}
              <span>Connected</span>
            </div>
          </div>
          
          <WasmWalletConnector />
        </div>
      </div>
      
      {/* Wallet Information */}
      {isConnected && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-medium">Wallet Information</h2>
            <button
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
              className="btn btn-sm btn-secondary flex items-center"
            >
              <ArrowPathIcon className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            <div>
              <div className="text-sm text-gray-400 mb-1">Address</div>
              <div className="flex items-center">
                <div className="bg-twilight-darker p-2 rounded flex-1 font-mono text-sm truncate">
                  {address}
                </div>
                <button
                  onClick={() => copyToClipboard(address, 'Address')}
                  className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                >
                  <DocumentDuplicateIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Balance */}
            <div>
              <div className="text-sm text-gray-400 mb-1">Balance</div>
              {balance ? (
                <div>
                  <div className="flex justify-between items-center mb-2 bg-twilight-darker p-2 rounded">
                    <div className="font-medium">BTC</div>
                    <div>{formatBtc(balance.btc)} BTC</div>
                  </div>
                  
                  {balance.runes.length > 0 && (
                    <div className="mb-2">
                      <div className="text-sm text-gray-400 mb-1">Runes</div>
                      <div className="max-h-24 overflow-y-auto bg-twilight-darker p-2 rounded">
                        {balance.runes.map((rune) => (
                          <div key={rune.id} className="flex justify-between items-center text-sm">
                            <div>{rune.ticker}</div>
                            <div>{rune.amount}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {balance.alkanes.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Alkanes</div>
                      <div className="max-h-24 overflow-y-auto bg-twilight-darker p-2 rounded">
                        {balance.alkanes.map((alkane) => (
                          <div key={alkane.id} className="flex justify-between items-center text-sm">
                            <div>{alkane.ticker}</div>
                            <div>{alkane.amount}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">Loading balance...</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Sign Message */}
      {isConnected && (
        <div className="card p-6">
          <h2 className="text-xl font-display font-medium mb-4">Sign Message</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-input w-full h-24"
                placeholder="Enter a message to sign"
              />
            </div>
            
            <div>
              <button
                onClick={handleSignMessage}
                disabled={isLoading.signMessage || !message}
                className="btn btn-primary"
              >
                {isLoading.signMessage ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                )}
                Sign Message
              </button>
            </div>
            
            {signature && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Signature</div>
                <div className="flex items-center">
                  <div className="bg-twilight-darker p-2 rounded flex-1 font-mono text-sm truncate">
                    {signature}
                  </div>
                  <button
                    onClick={() => copyToClipboard(signature, 'Signature')}
                    className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                  >
                    <DocumentDuplicateIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* PSBT Workflow */}
      {isConnected && (
        <div className="card p-6">
          <h2 className="text-xl font-display font-medium mb-4">PSBT Workflow</h2>
          <div className="space-y-6">
            {/* Step 1: Create PSBT */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">1. Create PSBT</h3>
                <button
                  onClick={handleCreatePsbt}
                  disabled={isLoading.createPsbt}
                  className="btn btn-sm btn-primary"
                >
                  {isLoading.createPsbt ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Create PSBT
                </button>
              </div>
              
              {psbtBase64 && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">PSBT Base64</div>
                  <div className="flex items-center">
                    <div className="bg-twilight-darker p-2 rounded flex-1 font-mono text-sm truncate">
                      {truncate(psbtBase64, 20)}
                    </div>
                    <button
                      onClick={() => copyToClipboard(psbtBase64, 'PSBT')}
                      className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                    >
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Step 2: Sign PSBT */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">2. Sign PSBT</h3>
                <button
                  onClick={handleSignPsbt}
                  disabled={isLoading.signPsbt || !psbtBase64}
                  className="btn btn-sm btn-primary"
                >
                  {isLoading.signPsbt ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Sign PSBT
                </button>
              </div>
              
              {signedPsbt && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Signed PSBT</div>
                  <div className="flex items-center">
                    <div className="bg-twilight-darker p-2 rounded flex-1 font-mono text-sm truncate">
                      {truncate(signedPsbt, 20)}
                    </div>
                    <button
                      onClick={() => copyToClipboard(signedPsbt, 'Signed PSBT')}
                      className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                    >
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Step 3: Finalize PSBT */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">3. Finalize PSBT</h3>
                <button
                  onClick={handleFinalizePsbt}
                  disabled={isLoading.finalizePsbt || !signedPsbt}
                  className="btn btn-sm btn-primary"
                >
                  {isLoading.finalizePsbt ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Finalize PSBT
                </button>
              </div>
              
              {finalizedPsbt && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Finalized PSBT</div>
                  <div className="flex items-center">
                    <div className="bg-twilight-darker p-2 rounded flex-1 font-mono text-sm truncate">
                      {truncate(finalizedPsbt, 20)}
                    </div>
                    <button
                      onClick={() => copyToClipboard(finalizedPsbt, 'Finalized PSBT')}
                      className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                    >
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Step 4: Extract Transaction */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">4. Extract Transaction</h3>
                <button
                  onClick={handleExtractTx}
                  disabled={isLoading.extractTx || !finalizedPsbt}
                  className="btn btn-sm btn-primary"
                >
                  {isLoading.extractTx ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Extract Transaction
                </button>
              </div>
              
              {extractedTx && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Transaction Hex</div>
                  <div className="flex items-center">
                    <div className="bg-twilight-darker p-2 rounded flex-1 font-mono text-sm truncate">
                      {truncate(extractedTx, 20)}
                    </div>
                    <button
                      onClick={() => copyToClipboard(extractedTx, 'Transaction Hex')}
                      className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                    >
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Step 5: Broadcast Transaction */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">5. Broadcast Transaction</h3>
                <button
                  onClick={handleBroadcastTx}
                  disabled={isLoading.broadcastTx || !extractedTx}
                  className="btn btn-sm btn-primary"
                >
                  {isLoading.broadcastTx ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Broadcast Transaction
                </button>
              </div>
              
              {txid && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Transaction ID</div>
                  <div className="flex items-center">
                    <div className="bg-twilight-darker p-2 rounded flex-1 font-mono text-sm truncate">
                      {txid}
                    </div>
                    <button
                      onClick={() => copyToClipboard(txid, 'Transaction ID')}
                      className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                    >
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </button>
                    <a
                      href={`https://mempool.space/tx/${txid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                    >
                      <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="card p-6 border-red-500">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-red-500">Error</h3>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasmWalletDemo;