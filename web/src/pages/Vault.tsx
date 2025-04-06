/**
 * Vault - Wallet and transaction management page
 * 
 * This page allows users to manage their wallet, view transaction history,
 * and perform wallet operations.
 */

import React, { useState, useEffect } from 'react';
import { useWalletContext } from '../contexts/WalletContext';
import WalletConnect from '../components/WalletConnect';
import { Card } from '../components/MemoizedComponents';
import { Transaction, TransactionOutput } from '../wallet/BitcoinWallet';

/**
 * Vault component
 */
const Vault: React.FC = () => {
  // Wallet context
  const { 
    isConnected, 
    transactions, 
    isLoadingTransactions, 
    transactionError, 
    getTransactionHistory,
    createTransaction,
    broadcastTransaction,
    getAddress,
    getBalance,
  } = useWalletContext();
  
  // Send form state
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [fee, setFee] = useState<string>('0.0001');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<Error | null>(null);
  const [txid, setTxid] = useState<string | null>(null);
  
  // Load transaction history
  useEffect(() => {
    if (isConnected) {
      getTransactionHistory().catch(console.error);
    }
  }, [isConnected, getTransactionHistory]);
  
  // Handle send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setSendError(new Error('Wallet not connected'));
      return;
    }
    
    if (!recipient || !amount || !fee) {
      setSendError(new Error('Please fill in all fields'));
      return;
    }
    
    setIsSending(true);
    setSendError(null);
    setTxid(null);
    
    try {
      // Create transaction outputs
      const outputs: TransactionOutput[] = [
        {
          address: recipient,
          amount,
        },
      ];
      
      // Create transaction
      const txHex = await createTransaction(outputs, fee);
      
      // Broadcast transaction
      const txid = await broadcastTransaction(txHex);
      
      // Set transaction ID
      setTxid(txid);
      
      // Reset form
      setRecipient('');
      setAmount('');
      
      // Reload transaction history
      await getTransactionHistory();
    } catch (err) {
      setSendError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSending(false);
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  return (
    <div className="vault-page">
      <h1>Vault</h1>
      
      <div className="vault-page-content">
        <div className="vault-page-left">
          <WalletConnect />
          
          {isConnected && (
            <Card className="send-form">
              <h2>Send Bitcoin</h2>
              
              <form onSubmit={handleSend}>
                <div className="form-group">
                  <label htmlFor="recipient">Recipient Address</label>
                  <input
                    type="text"
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={isSending}
                    placeholder="Enter recipient address"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="amount">Amount (BTC)</label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isSending}
                    placeholder="0.00000000"
                    step="0.00000001"
                    min="0.00000001"
                    max={getBalance()}
                  />
                  <div className="balance-info">
                    Available: {getBalance()} BTC
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="fee">Fee (BTC)</label>
                  <input
                    type="number"
                    id="fee"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    disabled={isSending}
                    placeholder="0.0001"
                    step="0.00000001"
                    min="0.00000001"
                  />
                </div>
                
                {sendError && (
                  <div className="error-message">
                    {sendError.message}
                  </div>
                )}
                
                {txid && (
                  <div className="success-message">
                    Transaction sent successfully!<br />
                    Transaction ID: {txid}
                  </div>
                )}
                
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSending || !isConnected}
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </Card>
          )}
        </div>
        
        <div className="vault-page-right">
          <Card className="transaction-history">
            <h2>Transaction History</h2>
            
            {isLoadingTransactions && (
              <div className="loading">Loading transactions...</div>
            )}
            
            {transactionError && (
              <div className="error-message">
                {transactionError.message}
              </div>
            )}
            
            {isConnected && transactions.length > 0 ? (
              <div className="transactions">
                <div className="transactions-header">
                  <div className="txid">Transaction ID</div>
                  <div className="amount">Amount</div>
                  <div className="fee">Fee</div>
                  <div className="status">Status</div>
                  <div className="timestamp">Timestamp</div>
                </div>
                
                {transactions.map((tx: Transaction) => (
                  <div key={tx.txid} className="transaction">
                    <div className="txid">{tx.txid}</div>
                    <div className="amount">
                      {tx.outputs.reduce((sum, output) => sum + parseFloat(output.amount), 0).toFixed(8)} BTC
                    </div>
                    <div className="fee">{tx.fee} BTC</div>
                    <div className="status">{tx.status}</div>
                    <div className="timestamp">{formatTimestamp(tx.timestamp)}</div>
                  </div>
                ))}
              </div>
            ) : isConnected ? (
              <div className="no-transactions">No transactions found</div>
            ) : (
              <div className="not-connected">Connect your wallet to view transaction history</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Vault;