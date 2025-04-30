import React, { useState } from 'react';
import { motion } from 'framer-motion';
import WasmWalletStatus from '../components/WasmWalletStatus';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { useNotification } from '../contexts/NotificationContext';

// Icons
import {
  ArrowPathIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const WasmWalletPage: React.FC = () => {
  // Contexts
  const {
    isInitialized,
    isConnected,
    address,
    signMessage,
    signTransaction,
    createPsbt,
    signPsbt,
    finalizePsbt,
    extractTx,
    broadcastTx,
  } = useWasmWallet();
  const { addNotification } = useNotification();
  
  // State
  const [message, setMessage] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [isSigningMessage, setIsSigningMessage] = useState<boolean>(false);
  
  const [txHex, setTxHex] = useState<string>('');
  const [signedTx, setSignedTx] = useState<string>('');
  const [isSigningTx, setIsSigningTx] = useState<boolean>(false);
  
  const [psbtInputs, setPsbtInputs] = useState<string>('[]');
  const [psbtOutputs, setPsbtOutputs] = useState<string>('[]');
  const [psbtBase64, setPsbtBase64] = useState<string>('');
  const [isCreatingPsbt, setIsCreatingPsbt] = useState<boolean>(false);
  
  const [psbtToSign, setPsbtToSign] = useState<string>('');
  const [signedPsbt, setSignedPsbt] = useState<string>('');
  const [isSigningPsbt, setIsSigningPsbt] = useState<boolean>(false);
  
  const [psbtToFinalize, setPsbtToFinalize] = useState<string>('');
  const [finalizedPsbt, setFinalizedPsbt] = useState<string>('');
  const [isFinalizingPsbt, setIsFinalizingPsbt] = useState<boolean>(false);
  
  const [psbtToExtract, setPsbtToExtract] = useState<string>('');
  const [extractedTx, setExtractedTx] = useState<string>('');
  const [isExtractingTx, setIsExtractingTx] = useState<boolean>(false);
  
  const [txToBroadcast, setTxToBroadcast] = useState<string>('');
  const [txId, setTxId] = useState<string>('');
  const [isBroadcastingTx, setIsBroadcastingTx] = useState<boolean>(false);
  
  // Handle sign message
  const handleSignMessage = async () => {
    if (!message) {
      addNotification('error', 'Please enter a message to sign');
      return;
    }
    
    setIsSigningMessage(true);
    try {
      const result = await signMessage(message);
      if (result) {
        setSignature(result);
        addNotification('success', 'Message signed successfully');
      } else {
        addNotification('error', 'Failed to sign message');
      }
    } catch (error) {
      addNotification('error', `Error signing message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSigningMessage(false);
    }
  };
  
  // Handle sign transaction
  const handleSignTransaction = async () => {
    if (!txHex) {
      addNotification('error', 'Please enter a transaction hex to sign');
      return;
    }
    
    setIsSigningTx(true);
    try {
      const result = await signTransaction(txHex);
      if (result) {
        setSignedTx(result);
        addNotification('success', 'Transaction signed successfully');
      } else {
        addNotification('error', 'Failed to sign transaction');
      }
    } catch (error) {
      addNotification('error', `Error signing transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSigningTx(false);
    }
  };
  
  // Handle create PSBT
  const handleCreatePsbt = async () => {
    try {
      const inputs = JSON.parse(psbtInputs);
      const outputs = JSON.parse(psbtOutputs);
      
      setIsCreatingPsbt(true);
      try {
        const result = await createPsbt(inputs, outputs);
        if (result) {
          setPsbtBase64(result);
          addNotification('success', 'PSBT created successfully');
        } else {
          addNotification('error', 'Failed to create PSBT');
        }
      } catch (error) {
        addNotification('error', `Error creating PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsCreatingPsbt(false);
      }
    } catch (error) {
      addNotification('error', `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle sign PSBT
  const handleSignPsbt = async () => {
    if (!psbtToSign) {
      addNotification('error', 'Please enter a PSBT to sign');
      return;
    }
    
    setIsSigningPsbt(true);
    try {
      const result = await signPsbt(psbtToSign);
      if (result) {
        setSignedPsbt(result);
        addNotification('success', 'PSBT signed successfully');
      } else {
        addNotification('error', 'Failed to sign PSBT');
      }
    } catch (error) {
      addNotification('error', `Error signing PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSigningPsbt(false);
    }
  };
  
  // Handle finalize PSBT
  const handleFinalizePsbt = async () => {
    if (!psbtToFinalize) {
      addNotification('error', 'Please enter a PSBT to finalize');
      return;
    }
    
    setIsFinalizingPsbt(true);
    try {
      const result = await finalizePsbt(psbtToFinalize);
      if (result) {
        setFinalizedPsbt(result);
        addNotification('success', 'PSBT finalized successfully');
      } else {
        addNotification('error', 'Failed to finalize PSBT');
      }
    } catch (error) {
      addNotification('error', `Error finalizing PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFinalizingPsbt(false);
    }
  };
  
  // Handle extract transaction
  const handleExtractTx = async () => {
    if (!psbtToExtract) {
      addNotification('error', 'Please enter a PSBT to extract');
      return;
    }
    
    setIsExtractingTx(true);
    try {
      const result = await extractTx(psbtToExtract);
      if (result) {
        setExtractedTx(result);
        addNotification('success', 'Transaction extracted successfully');
      } else {
        addNotification('error', 'Failed to extract transaction');
      }
    } catch (error) {
      addNotification('error', `Error extracting transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExtractingTx(false);
    }
  };
  
  // Handle broadcast transaction
  const handleBroadcastTx = async () => {
    if (!txToBroadcast) {
      addNotification('error', 'Please enter a transaction to broadcast');
      return;
    }
    
    setIsBroadcastingTx(true);
    try {
      const result = await broadcastTx(txToBroadcast);
      if (result) {
        setTxId(result);
        addNotification('success', 'Transaction broadcasted successfully');
      } else {
        addNotification('error', 'Failed to broadcast transaction');
      }
    } catch (error) {
      addNotification('error', `Error broadcasting transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBroadcastingTx(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="text-white">WebAssembly Wallet</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Test the WebAssembly wallet integration
          </p>
        </div>
      </div>
      
      {/* Wallet Status */}
      <WasmWalletStatus className="mb-6" />
      
      {/* Not Connected Warning */}
      {!isConnected && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-4 border border-ui-warning border-opacity-50 mb-6"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Connect your wallet to test the WebAssembly integration
            </span>
          </div>
        </motion.div>
      )}
      
      {/* Test Functions */}
      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sign Message */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-medium flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Sign Message
              </h2>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter a message to sign"
                  className="form-textarea w-full h-24"
                />
              </div>
              
              <button
                onClick={handleSignMessage}
                className="btn btn-primary w-full mb-4"
                disabled={isSigningMessage || !message}
              >
                {isSigningMessage ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                    Signing...
                  </>
                ) : (
                  'Sign Message'
                )}
              </button>
              
              {signature && (
                <div>
                  <label className="form-label">Signature</label>
                  <div className="bg-twilight-darker p-2 rounded-lg font-mono text-xs break-all">
                    {signature}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sign Transaction */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-medium flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Sign Transaction
              </h2>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">Transaction Hex</label>
                <textarea
                  value={txHex}
                  onChange={(e) => setTxHex(e.target.value)}
                  placeholder="Enter a transaction hex to sign"
                  className="form-textarea w-full h-24"
                />
              </div>
              
              <button
                onClick={handleSignTransaction}
                className="btn btn-primary w-full mb-4"
                disabled={isSigningTx || !txHex}
              >
                {isSigningTx ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                    Signing...
                  </>
                ) : (
                  'Sign Transaction'
                )}
              </button>
              
              {signedTx && (
                <div>
                  <label className="form-label">Signed Transaction</label>
                  <div className="bg-twilight-darker p-2 rounded-lg font-mono text-xs break-all">
                    {signedTx}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Create PSBT */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-medium flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Create PSBT
              </h2>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">Inputs (JSON)</label>
                <textarea
                  value={psbtInputs}
                  onChange={(e) => setPsbtInputs(e.target.value)}
                  placeholder="Enter inputs as JSON array"
                  className="form-textarea w-full h-24"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Outputs (JSON)</label>
                <textarea
                  value={psbtOutputs}
                  onChange={(e) => setPsbtOutputs(e.target.value)}
                  placeholder="Enter outputs as JSON array"
                  className="form-textarea w-full h-24"
                />
              </div>
              
              <button
                onClick={handleCreatePsbt}
                className="btn btn-primary w-full mb-4"
                disabled={isCreatingPsbt}
              >
                {isCreatingPsbt ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create PSBT'
                )}
              </button>
              
              {psbtBase64 && (
                <div>
                  <label className="form-label">PSBT Base64</label>
                  <div className="bg-twilight-darker p-2 rounded-lg font-mono text-xs break-all">
                    {psbtBase64}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sign PSBT */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-medium flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Sign PSBT
              </h2>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">PSBT Base64</label>
                <textarea
                  value={psbtToSign}
                  onChange={(e) => setPsbtToSign(e.target.value)}
                  placeholder="Enter a PSBT base64 string to sign"
                  className="form-textarea w-full h-24"
                />
              </div>
              
              <button
                onClick={handleSignPsbt}
                className="btn btn-primary w-full mb-4"
                disabled={isSigningPsbt || !psbtToSign}
              >
                {isSigningPsbt ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                    Signing...
                  </>
                ) : (
                  'Sign PSBT'
                )}
              </button>
              
              {signedPsbt && (
                <div>
                  <label className="form-label">Signed PSBT</label>
                  <div className="bg-twilight-darker p-2 rounded-lg font-mono text-xs break-all">
                    {signedPsbt}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Finalize PSBT */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-medium flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Finalize PSBT
              </h2>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">PSBT Base64</label>
                <textarea
                  value={psbtToFinalize}
                  onChange={(e) => setPsbtToFinalize(e.target.value)}
                  placeholder="Enter a PSBT base64 string to finalize"
                  className="form-textarea w-full h-24"
                />
              </div>
              
              <button
                onClick={handleFinalizePsbt}
                className="btn btn-primary w-full mb-4"
                disabled={isFinalizingPsbt || !psbtToFinalize}
              >
                {isFinalizingPsbt ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                    Finalizing...
                  </>
                ) : (
                  'Finalize PSBT'
                )}
              </button>
              
              {finalizedPsbt && (
                <div>
                  <label className="form-label">Finalized PSBT</label>
                  <div className="bg-twilight-darker p-2 rounded-lg font-mono text-xs break-all">
                    {finalizedPsbt}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Extract Transaction */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-medium flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Extract Transaction
              </h2>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">PSBT Base64</label>
                <textarea
                  value={psbtToExtract}
                  onChange={(e) => setPsbtToExtract(e.target.value)}
                  placeholder="Enter a PSBT base64 string to extract"
                  className="form-textarea w-full h-24"
                />
              </div>
              
              <button
                onClick={handleExtractTx}
                className="btn btn-primary w-full mb-4"
                disabled={isExtractingTx || !psbtToExtract}
              >
                {isExtractingTx ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                    Extracting...
                  </>
                ) : (
                  'Extract Transaction'
                )}
              </button>
              
              {extractedTx && (
                <div>
                  <label className="form-label">Transaction Hex</label>
                  <div className="bg-twilight-darker p-2 rounded-lg font-mono text-xs break-all">
                    {extractedTx}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Broadcast Transaction */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-medium flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Broadcast Transaction
              </h2>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">Transaction Hex</label>
                <textarea
                  value={txToBroadcast}
                  onChange={(e) => setTxToBroadcast(e.target.value)}
                  placeholder="Enter a transaction hex to broadcast"
                  className="form-textarea w-full h-24"
                />
              </div>
              
              <button
                onClick={handleBroadcastTx}
                className="btn btn-primary w-full mb-4"
                disabled={isBroadcastingTx || !txToBroadcast}
              >
                {isBroadcastingTx ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                    Broadcasting...
                  </>
                ) : (
                  'Broadcast Transaction'
                )}
              </button>
              
              {txId && (
                <div>
                  <label className="form-label">Transaction ID</label>
                  <div className="bg-twilight-darker p-2 rounded-lg font-mono text-xs break-all">
                    {txId}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasmWalletPage;