import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { RuneBalance, RuneTransaction } from '../utils/RunesUtils';
import { useNotification } from '../contexts/NotificationContext';

/**
 * Runes Display component
 * Displays information about the user's runes
 */
const RunesDisplay: React.FC = () => {
  // Contexts
  const {
    isConnected,
    address,
    runes,
    getRunes,
    getRuneTransactions,
  } = useWallet();

  const { addNotification } = useNotification();

  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<RuneTransaction[]>([]);
  const [selectedRune, setSelectedRune] = useState<string | null>(null);

  // Load runes when wallet is connected
  useEffect(() => {
    if (isConnected) {
      loadRunes();
      loadTransactions();
    }
  }, [isConnected]);

  // Load runes
  const loadRunes = async () => {
    if (!isConnected) return;

    try {
      setIsLoading(true);
      await getRunes();
    } catch (error) {
      console.error('Error loading runes:', error);
      addNotification('error', `Error loading runes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load transactions
  const loadTransactions = async () => {
    if (!isConnected) return;

    try {
      setIsLoading(true);
      const runeTransactions = await getRuneTransactions();
      setTransactions(runeTransactions);
    } catch (error) {
      console.error('Error loading rune transactions:', error);
      addNotification('error', `Error loading rune transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format amount
  const formatAmount = (amount: string): string => {
    // Format with commas
    return parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    });
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Get transactions for a rune
  const getRuneTransactionsForRune = (runeId: string): RuneTransaction[] => {
    return transactions.filter((tx) => tx.runeId === runeId);
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>My Runes</h2>

      {!isConnected ? (
        <p>Please connect your wallet to view your runes.</p>
      ) : isLoading ? (
        <p>Loading runes...</p>
      ) : runes.length === 0 ? (
        <p>You don't have any runes yet.</p>
      ) : (
        <div>
          {/* Runes list */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}>
            {runes.map((rune) => (
              <div
                key={rune.runeId}
                style={{
                  backgroundColor: selectedRune === rune.runeId ? '#2a2a4e' : '#16213e',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onClick={() => setSelectedRune(rune.runeId === selectedRune ? null : rune.runeId)}
              >
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>
                  {rune.ticker}
                </div>
                <div style={{ color: '#ccc', fontSize: '14px', marginBottom: '8px' }}>
                  {rune.name}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {formatAmount(rune.balance)}
                </div>
              </div>
            ))}
          </div>

          {/* Selected rune details */}
          {selectedRune && (
            <div style={{
              backgroundColor: '#16213e',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
            }}>
              <h3>Transactions</h3>
              
              {getRuneTransactionsForRune(selectedRune).length === 0 ? (
                <p>No transactions found for this rune.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Type</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Amount</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>From/To</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getRuneTransactionsForRune(selectedRune).map((tx) => (
                        <tr key={tx.txid}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                            {tx.from === address ? 'Sent' : 'Received'}
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                            {formatAmount(tx.amount)} {tx.ticker}
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                            {tx.from === address ? tx.to : tx.from}
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                            {formatDate(tx.timestamp)}
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                            <span style={{
                              color: tx.confirmed ? '#90be6d' : '#f8961e',
                              fontWeight: 'bold',
                            }}>
                              {tx.confirmed ? 'Confirmed' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Refresh button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button
              onClick={() => {
                loadRunes();
                loadTransactions();
              }}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: isLoading ? '#333' : '#4cc9f0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunesDisplay;