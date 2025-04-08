import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { Balance } from '../types';
import '../styles/Vault.css';

const Vault: React.FC = () => {
  const { theme } = useTheme();
  const { api } = useApi();
  const { addNotification } = useNotification();
  
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  
  // Fetch balances
  const fetchBalances = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await api.getBalances();
      setBalances(data);
      
      // Set default selected asset
      if (data.length > 0 && !selectedAsset) {
        setSelectedAsset(data[0].symbol);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setError('Failed to fetch balances. Please try again later.');
      setIsLoading(false);
    }
  }, [api, selectedAsset]);
  
  // Fetch deposit address
  const fetchDepositAddress = useCallback(async (asset: string) => {
    try {
      const address = await api.getDepositAddress(asset);
      setDepositAddress(address);
    } catch (error) {
      console.error('Failed to fetch deposit address:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch deposit address. Please try again later.',
      });
    }
  }, [api, addNotification]);
  
  // Handle asset change
  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const asset = e.target.value;
    setSelectedAsset(asset);
    
    if (activeTab === 'deposit') {
      fetchDepositAddress(asset);
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab: 'deposit' | 'withdraw') => {
    setActiveTab(tab);
    
    if (tab === 'deposit' && selectedAsset) {
      fetchDepositAddress(selectedAsset);
    }
  };
  
  // Handle withdraw address change
  const handleWithdrawAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWithdrawAddress(e.target.value);
    setWithdrawError(null);
  };
  
  // Handle withdraw amount change
  const handleWithdrawAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWithdrawAmount(e.target.value);
    setWithdrawError(null);
  };
  
  // Handle withdraw
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!withdrawAddress) {
      setWithdrawError('Please enter a withdrawal address.');
      return;
    }
    
    if (!withdrawAmount) {
      setWithdrawError('Please enter a withdrawal amount.');
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid amount.');
      return;
    }
    
    const selectedBalance = balances.find(balance => balance.symbol === selectedAsset);
    if (!selectedBalance) {
      setWithdrawError('Selected asset not found.');
      return;
    }
    
    const availableAmount = parseFloat(selectedBalance.available);
    if (amount > availableAmount) {
      setWithdrawError(`Insufficient balance. Available: ${availableAmount} ${selectedAsset}`);
      return;
    }
    
    try {
      setIsWithdrawing(true);
      
      const success = await api.withdraw(selectedAsset, withdrawAddress, withdrawAmount);
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Withdrawal Initiated',
          message: `Your withdrawal of ${withdrawAmount} ${selectedAsset} has been initiated.`,
        });
        
        // Reset form
        setWithdrawAddress('');
        setWithdrawAmount('');
        
        // Refresh balances
        fetchBalances();
      } else {
        setWithdrawError('Failed to initiate withdrawal. Please try again later.');
      }
    } catch (error) {
      console.error('Failed to withdraw:', error);
      setWithdrawError('Failed to initiate withdrawal. Please try again later.');
    } finally {
      setIsWithdrawing(false);
    }
  };
  
  // Copy deposit address to clipboard
  const copyDepositAddress = () => {
    navigator.clipboard.writeText(depositAddress).then(() => {
      addNotification({
        type: 'success',
        title: 'Address Copied',
        message: 'Deposit address copied to clipboard.',
        duration: 3000,
      });
    });
  };
  
  // Format number with appropriate decimal places
  const formatNumber = (value: string, precision: number = 8): string => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return '0';
    }
    return num.toFixed(precision);
  };
  
  // Fetch balances on mount
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);
  
  // Fetch deposit address when selected asset changes
  useEffect(() => {
    if (selectedAsset && activeTab === 'deposit') {
      fetchDepositAddress(selectedAsset);
    }
  }, [selectedAsset, activeTab, fetchDepositAddress]);
  
  return (
    <div className={`vault vault-${theme}`}>
      <div className="vault-header">
        <h1>Vault</h1>
        <p className="vault-subtitle">
          Manage your assets securely in the DarkSwap Vault
        </p>
      </div>
      
      {isLoading ? (
        <div className="vault-loading">
          <div className="spinner"></div>
          <p>Loading balances...</p>
        </div>
      ) : error ? (
        <div className="vault-error">
          <p>{error}</p>
          <button onClick={fetchBalances}>Retry</button>
        </div>
      ) : (
        <div className="vault-content">
          <div className="vault-balances">
            <h2>Your Balances</h2>
            <div className="vault-balances-table-container">
              <table className="vault-balances-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Locked</th>
                    <th>Value (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="vault-empty">No balances found.</td>
                    </tr>
                  ) : (
                    balances.map(balance => (
                      <tr key={balance.symbol}>
                        <td className="vault-asset">
                          <span className="vault-asset-symbol">{balance.symbol}</span>
                          <span className="vault-asset-name">{balance.name}</span>
                        </td>
                        <td>{formatNumber(balance.total)}</td>
                        <td>{formatNumber(balance.available)}</td>
                        <td>{formatNumber(balance.locked)}</td>
                        <td>${formatNumber(balance.usdValue, 2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="vault-actions">
            <div className="vault-tabs">
              <button
                className={`vault-tab ${activeTab === 'deposit' ? 'active' : ''}`}
                onClick={() => handleTabChange('deposit')}
              >
                Deposit
              </button>
              <button
                className={`vault-tab ${activeTab === 'withdraw' ? 'active' : ''}`}
                onClick={() => handleTabChange('withdraw')}
              >
                Withdraw
              </button>
            </div>
            
            <div className="vault-tab-content">
              <div className="vault-asset-selector">
                <label htmlFor="assetSelect">Select Asset:</label>
                <select
                  id="assetSelect"
                  value={selectedAsset}
                  onChange={handleAssetChange}
                >
                  {balances.map(balance => (
                    <option key={balance.symbol} value={balance.symbol}>
                      {balance.symbol} - {balance.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {activeTab === 'deposit' ? (
                <div className="vault-deposit">
                  <h3>Deposit {selectedAsset}</h3>
                  <p className="vault-info">
                    Send {selectedAsset} to the address below to deposit funds into your DarkSwap Vault.
                  </p>
                  
                  <div className="vault-address-container">
                    <div className="vault-address">
                      {depositAddress || 'Loading address...'}
                    </div>
                    <button
                      className="vault-copy-button"
                      onClick={copyDepositAddress}
                      disabled={!depositAddress}
                    >
                      Copy
                    </button>
                  </div>
                  
                  <div className="vault-qr-code">
                    {/* QR code would be generated here */}
                  </div>
                  
                  <p className="vault-warning">
                    Important: Only send {selectedAsset} to this address. Sending any other asset may result in permanent loss.
                  </p>
                </div>
              ) : (
                <div className="vault-withdraw">
                  <h3>Withdraw {selectedAsset}</h3>
                  <p className="vault-info">
                    Withdraw {selectedAsset} from your DarkSwap Vault to an external address.
                  </p>
                  
                  <form onSubmit={handleWithdraw}>
                    <div className="vault-form-group">
                      <label htmlFor="withdrawAddress">Withdrawal Address:</label>
                      <input
                        id="withdrawAddress"
                        type="text"
                        value={withdrawAddress}
                        onChange={handleWithdrawAddressChange}
                        placeholder={`Enter ${selectedAsset} address`}
                      />
                    </div>
                    
                    <div className="vault-form-group">
                      <label htmlFor="withdrawAmount">Amount:</label>
                      <div className="vault-amount-input">
                        <input
                          id="withdrawAmount"
                          type="text"
                          value={withdrawAmount}
                          onChange={handleWithdrawAmountChange}
                          placeholder="0.00"
                        />
                        <button
                          type="button"
                          className="vault-max-button"
                          onClick={() => {
                            const selectedBalance = balances.find(balance => balance.symbol === selectedAsset);
                            if (selectedBalance) {
                              setWithdrawAmount(selectedBalance.available);
                            }
                          }}
                        >
                          MAX
                        </button>
                      </div>
                      <div className="vault-balance-info">
                        Available: {balances.find(balance => balance.symbol === selectedAsset)?.available || '0'} {selectedAsset}
                      </div>
                    </div>
                    
                    {withdrawError && (
                      <div className="vault-error-message">
                        {withdrawError}
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      className="vault-withdraw-button"
                      disabled={isWithdrawing}
                    >
                      {isWithdrawing ? 'Processing...' : `Withdraw ${selectedAsset}`}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vault;