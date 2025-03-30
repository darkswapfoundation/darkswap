import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { AlkaneBalance, AlkaneTransaction, Alkane } from '../utils/AlkanesUtils';
import { useNotification } from '../contexts/NotificationContext';

/**
 * Alkanes Display component
 * Displays information about the user's alkanes
 */
const AlkanesDisplay: React.FC = () => {
  // Contexts
  const {
    isConnected,
    address,
    alkanes,
    getAlkanes,
    getAlkaneById,
    getAlkaneTransactions,
  } = useWallet();

  const { addNotification } = useNotification();

  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<AlkaneTransaction[]>([]);
  const [selectedAlkane, setSelectedAlkane] = useState<string | null>(null);
  const [selectedAlkaneDetails, setSelectedAlkaneDetails] = useState<Alkane | null>(null);

  // Load alkanes when wallet is connected
  useEffect(() => {
    if (isConnected) {
      loadAlkanes();
      loadTransactions();
    }
  }, [isConnected]);

  // Load alkane details when selected alkane changes
  useEffect(() => {
    if (selectedAlkane) {
      loadAlkaneDetails(selectedAlkane);
    } else {
      setSelectedAlkaneDetails(null);
    }
  }, [selectedAlkane]);

  // Load alkanes
  const loadAlkanes = async () => {
    if (!isConnected) return;

    try {
      setIsLoading(true);
      await getAlkanes();
    } catch (error) {
      console.error('Error loading alkanes:', error);
      addNotification('error', `Error loading alkanes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load transactions
  const loadTransactions = async () => {
    if (!isConnected) return;

    try {
      setIsLoading(true);
      const alkaneTransactions = await getAlkaneTransactions();
      setTransactions(alkaneTransactions);
    } catch (error) {
      console.error('Error loading alkane transactions:', error);
      addNotification('error', `Error loading alkane transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load alkane details
  const loadAlkaneDetails = async (alkaneId: string) => {
    try {
      const alkane = await getAlkaneById(alkaneId);
      setSelectedAlkaneDetails(alkane || null);
    } catch (error) {
      console.error('Error loading alkane details:', error);
      addNotification('error', `Error loading alkane details: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Get transactions for an alkane
  const getAlkaneTransactionsForAlkane = (alkaneId: string): AlkaneTransaction[] => {
    return transactions.filter((tx) => tx.alkaneId === alkaneId);
  };

  // Get alkane color based on ticker
  const getAlkaneColor = (ticker: string): string => {
    // Generate a color based on the ticker
    let hash = 0;
    for (let i = 0; i < ticker.length; i++) {
      hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a hue between 0 and 360
    const hue = hash % 360;
    
    // Return HSL color with fixed saturation and lightness
    return `hsl(${hue}, 70%, 60%)`;
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>My Alkanes</h2>

      {!isConnected ? (
        <p>Please connect your wallet to view your alkanes.</p>
      ) : isLoading ? (
        <p>Loading alkanes...</p>
      ) : alkanes.length === 0 ? (
        <p>You don't have any alkanes yet.</p>
      ) : (
        <div>
          {/* Alkanes list */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}>
            {alkanes.map((alkane) => (
              <div
                key={alkane.alkaneId}
                style={{
                  backgroundColor: selectedAlkane === alkane.alkaneId ? '#2a2a4e' : '#16213e',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  borderLeft: `4px solid ${getAlkaneColor(alkane.ticker)}`,
                }}
                onClick={() => setSelectedAlkane(alkane.alkaneId === selectedAlkane ? null : alkane.alkaneId)}
              >
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>
                  {alkane.ticker}
                </div>
                <div style={{ color: '#ccc', fontSize: '14px', marginBottom: '8px' }}>
                  {alkane.name}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {formatAmount(alkane.balance)}
                </div>
              </div>
            ))}
          </div>

          {/* Selected alkane details */}
          {selectedAlkane && selectedAlkaneDetails && (
            <div style={{
              backgroundColor: '#16213e',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              borderLeft: `4px solid ${getAlkaneColor(selectedAlkaneDetails.ticker)}`,
            }}>
              <h3>{selectedAlkaneDetails.name} ({selectedAlkaneDetails.ticker})</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <p>{selectedAlkaneDetails.description}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                  <div>
                    <strong>ID:</strong> <span style={{ fontSize: '12px', wordBreak: 'break-all' }}>{selectedAlkaneDetails.id}</span>
                  </div>
                  <div>
                    <strong>Creator:</strong> <span style={{ fontSize: '12px', wordBreak: 'break-all' }}>{selectedAlkaneDetails.creator}</span>
                  </div>
                  <div>
                    <strong>Supply:</strong> {formatAmount(selectedAlkaneDetails.supply)}
                  </div>
                  {selectedAlkaneDetails.limit && (
                    <div>
                      <strong>Limit:</strong> {formatAmount(selectedAlkaneDetails.limit)}
                    </div>
                  )}
                  <div>
                    <strong>Decimals:</strong> {selectedAlkaneDetails.decimals}
                  </div>
                  <div>
                    <strong>Created:</strong> {formatDate(selectedAlkaneDetails.timestamp)}
                  </div>
                </div>
              </div>
              
              {selectedAlkaneDetails.properties && Object.keys(selectedAlkaneDetails.properties).length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>Properties</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {Object.entries(selectedAlkaneDetails.properties).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <h4>Transactions</h4>
              {getAlkaneTransactionsForAlkane(selectedAlkane).length === 0 ? (
                <p>No transactions found for this alkane.</p>
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
                      {getAlkaneTransactionsForAlkane(selectedAlkane).map((tx) => (
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
                loadAlkanes();
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

export default AlkanesDisplay;