import React from 'react';
import { useWalletBalance } from '../contexts/WebSocketContext';

// Wallet balance props
interface WalletBalanceProps {
  className?: string;
  showZeroBalances?: boolean;
}

/**
 * Wallet balance component
 * @param props Component props
 * @returns Wallet balance component
 */
const WalletBalance: React.FC<WalletBalanceProps> = ({
  className,
  showZeroBalances = false,
}) => {
  // Get wallet balance
  const balance = useWalletBalance();
  
  // Format balance
  const formatBalance = (balance: string) => {
    return parseFloat(balance).toFixed(8);
  };
  
  // Filter assets
  const assets = Object.entries(balance)
    .filter(([_, value]) => showZeroBalances || parseFloat(value) > 0)
    .sort(([assetA], [assetB]) => assetA.localeCompare(assetB));
  
  return (
    <div className={`wallet-balance ${className || ''}`}>
      <div className="wallet-balance-header">
        <h3>Wallet Balance</h3>
      </div>
      
      <div className="wallet-balance-content">
        {assets.length > 0 ? (
          <div className="wallet-balance-list">
            <div className="wallet-balance-row wallet-balance-header-row">
              <div className="wallet-balance-cell">Asset</div>
              <div className="wallet-balance-cell">Balance</div>
            </div>
            
            {assets.map(([asset, value]) => (
              <div key={asset} className="wallet-balance-row">
                <div className="wallet-balance-cell wallet-balance-asset">{asset}</div>
                <div className="wallet-balance-cell wallet-balance-value">
                  {formatBalance(value)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="wallet-balance-empty">
            {Object.keys(balance).length === 0
              ? 'Connect your wallet to view your balance'
              : 'No assets found'}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletBalance;