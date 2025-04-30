import React, { useState, useEffect } from 'react';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import { useLedger } from '../contexts/LedgerContext';
import { useTrezor } from '../contexts/TrezorContext';
import MetaMaskConnect from '../components/MetaMaskConnect';
import WalletConnectButton from '../components/WalletConnectButton';
import LedgerConnect from '../components/LedgerConnect';
import TrezorConnect from '../components/TrezorConnect';
import '../styles/Vault.css';

/**
 * Asset type
 */
enum AssetType {
  Bitcoin = 'Bitcoin',
  Rune = 'Rune',
  Alkane = 'Alkane',
  Ethereum = 'Ethereum',
  ERC20 = 'ERC20',
}

/**
 * Asset interface
 */
interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: AssetType;
  balance: string;
  value: number;
  icon: string;
}

/**
 * Wallet type
 */
enum WalletType {
  MetaMask = 'MetaMask',
  WalletConnect = 'WalletConnect',
  Ledger = 'Ledger',
  Trezor = 'Trezor',
  None = 'None',
}

/**
 * Vault page
 */
const Vault: React.FC = () => {
  // MetaMask context
  const { isConnected: isMetaMaskConnected, address: metaMaskAddress, networkName: metaMaskNetworkName, balance: metaMaskBalance } = useMetaMask();
  
  // WalletConnect context
  const { isConnected: isWalletConnectConnected, address: walletConnectAddress, networkName: walletConnectNetworkName, balance: walletConnectBalance } = useWalletConnect();
  
  // Ledger context
  const { isConnected: isLedgerConnected, address: ledgerAddress, networkName: ledgerNetworkName, balance: ledgerBalance } = useLedger();
  
  // Trezor context
  const { isConnected: isTrezorConnected, address: trezorAddress, networkName: trezorNetworkName, balance: trezorBalance } = useTrezor();
  
  // Combined wallet state
  const isConnected = isMetaMaskConnected || isWalletConnectConnected || isLedgerConnected || isTrezorConnected;
  
  // Determine which wallet is connected
  const connectedWalletType = isMetaMaskConnected 
    ? WalletType.MetaMask 
    : isWalletConnectConnected 
      ? WalletType.WalletConnect 
      : isLedgerConnected 
        ? WalletType.Ledger 
        : isTrezorConnected
          ? WalletType.Trezor
          : WalletType.None;
  
  // Get address, network name, and balance based on connected wallet
  const address = metaMaskAddress || walletConnectAddress || ledgerAddress || trezorAddress;
  const networkName = isMetaMaskConnected 
    ? metaMaskNetworkName 
    : isWalletConnectConnected 
      ? walletConnectNetworkName 
      : isLedgerConnected 
        ? ledgerNetworkName 
        : isTrezorConnected
          ? trezorNetworkName
          : 'Unknown';
  const balance = isMetaMaskConnected 
    ? metaMaskBalance 
    : isWalletConnectConnected 
      ? walletConnectBalance 
      : isLedgerConnected 
        ? ledgerBalance 
        : isTrezorConnected
          ? trezorBalance
          : null;
  
  // Assets state
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Selected asset state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  // Total value state
  const [totalValue, setTotalValue] = useState<number>(0);
  
  /**
   * Load assets
   */
  useEffect(() => {
    const loadAssets = async () => {
      if (!isConnected || !address) {
        setAssets([]);
        setTotalValue(0);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Simulate loading assets from API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock assets
        const mockAssets: Asset[] = [
          {
            id: 'btc',
            name: 'Bitcoin',
            symbol: 'BTC',
            type: AssetType.Bitcoin,
            balance: '0.05',
            value: 2500,
            icon: '/images/bitcoin.svg',
          },
          {
            id: 'eth',
            name: 'Ethereum',
            symbol: 'ETH',
            type: AssetType.Ethereum,
            balance: balance ? (parseInt(balance, 16) / 1e18).toFixed(4) : '0',
            value: balance ? (parseInt(balance, 16) / 1e18) * 2000 : 0,
            icon: '/images/ethereum.svg',
          },
          {
            id: 'rune-1',
            name: 'Rune #1',
            symbol: 'RUNE1',
            type: AssetType.Rune,
            balance: '100',
            value: 500,
            icon: '/images/rune.svg',
          },
          {
            id: 'rune-2',
            name: 'Rune #2',
            symbol: 'RUNE2',
            type: AssetType.Rune,
            balance: '50',
            value: 250,
            icon: '/images/rune.svg',
          },
          {
            id: 'alkane-1',
            name: 'Alkane #1',
            symbol: 'ALK1',
            type: AssetType.Alkane,
            balance: '1000',
            value: 1000,
            icon: '/images/alkane.svg',
          },
          {
            id: 'alkane-2',
            name: 'Alkane #2',
            symbol: 'ALK2',
            type: AssetType.Alkane,
            balance: '500',
            value: 500,
            icon: '/images/alkane.svg',
          },
          {
            id: 'usdc',
            name: 'USD Coin',
            symbol: 'USDC',
            type: AssetType.ERC20,
            balance: '1000',
            value: 1000,
            icon: '/images/usdc.svg',
          },
          {
            id: 'usdt',
            name: 'Tether',
            symbol: 'USDT',
            type: AssetType.ERC20,
            balance: '1000',
            value: 1000,
            icon: '/images/usdt.svg',
          },
        ];
        
        // Set assets
        setAssets(mockAssets);
        
        // Calculate total value
        const total = mockAssets.reduce((sum, asset) => sum + asset.value, 0);
        setTotalValue(total);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load assets:', error);
        setIsLoading(false);
      }
    };
    
    loadAssets();
  }, [isConnected, address, balance]);
  
  /**
   * Handle asset click
   * @param asset Asset to select
   */
  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
  };
  
  /**
   * Handle deposit click
   */
  const handleDepositClick = () => {
    // TODO: Implement deposit functionality
    console.log('Deposit clicked');
  };
  
  /**
   * Handle withdraw click
   */
  const handleWithdrawClick = () => {
    // TODO: Implement withdraw functionality
    console.log('Withdraw clicked');
  };
  
  /**
   * Handle trade click
   */
  const handleTradeClick = () => {
    // TODO: Implement trade functionality
    console.log('Trade clicked');
  };
  
  /**
   * Format value
   * @param value Value to format
   * @returns Formatted value
   */
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  /**
   * Render asset list
   */
  const renderAssetList = () => {
    if (isLoading) {
      return (
        <div className="vault-loading">
          <div className="vault-loading-spinner" />
          <p>Loading assets...</p>
        </div>
      );
    }
    
    if (assets.length === 0) {
      return (
        <div className="vault-empty">
          <p>No assets found.</p>
        </div>
      );
    }
    
    return (
      <div className="vault-assets">
        {assets.map(asset => (
          <div
            key={asset.id}
            className={`vault-asset ${selectedAsset?.id === asset.id ? 'vault-asset-selected' : ''}`}
            onClick={() => handleAssetClick(asset)}
          >
            <div className="vault-asset-icon">
              <img src={asset.icon} alt={asset.name} />
            </div>
            <div className="vault-asset-info">
              <div className="vault-asset-name">{asset.name}</div>
              <div className="vault-asset-balance">{asset.balance} {asset.symbol}</div>
            </div>
            <div className="vault-asset-value">{formatValue(asset.value)}</div>
          </div>
        ))}
      </div>
    );
  };
  
  /**
   * Render asset details
   */
  const renderAssetDetails = () => {
    if (!selectedAsset) {
      return (
        <div className="vault-details-empty">
          <p>Select an asset to view details.</p>
        </div>
      );
    }
    
    return (
      <div className="vault-details">
        <div className="vault-details-header">
          <div className="vault-details-icon">
            <img src={selectedAsset.icon} alt={selectedAsset.name} />
          </div>
          <div className="vault-details-info">
            <h2>{selectedAsset.name}</h2>
            <p>{selectedAsset.balance} {selectedAsset.symbol}</p>
            <p>{formatValue(selectedAsset.value)}</p>
          </div>
        </div>
        
        <div className="vault-details-actions">
          <button className="vault-action-button" onClick={handleDepositClick}>
            Deposit
          </button>
          <button className="vault-action-button" onClick={handleWithdrawClick}>
            Withdraw
          </button>
          <button className="vault-action-button" onClick={handleTradeClick}>
            Trade
          </button>
        </div>
        
        <div className="vault-details-section">
          <h3>Asset Information</h3>
          <div className="vault-details-row">
            <div className="vault-details-label">Type</div>
            <div className="vault-details-value">{selectedAsset.type}</div>
          </div>
          <div className="vault-details-row">
            <div className="vault-details-label">Symbol</div>
            <div className="vault-details-value">{selectedAsset.symbol}</div>
          </div>
          <div className="vault-details-row">
            <div className="vault-details-label">Balance</div>
            <div className="vault-details-value">{selectedAsset.balance}</div>
          </div>
          <div className="vault-details-row">
            <div className="vault-details-label">Value</div>
            <div className="vault-details-value">{formatValue(selectedAsset.value)}</div>
          </div>
        </div>
        
        <div className="vault-details-section">
          <h3>Recent Transactions</h3>
          <div className="vault-transactions">
            <div className="vault-transaction">
              <div className="vault-transaction-type vault-transaction-type-deposit">Deposit</div>
              <div className="vault-transaction-amount">+0.01 {selectedAsset.symbol}</div>
              <div className="vault-transaction-date">2025-04-08 14:32:15</div>
            </div>
            <div className="vault-transaction">
              <div className="vault-transaction-type vault-transaction-type-withdraw">Withdraw</div>
              <div className="vault-transaction-amount">-0.005 {selectedAsset.symbol}</div>
              <div className="vault-transaction-date">2025-04-07 10:15:42</div>
            </div>
            <div className="vault-transaction">
              <div className="vault-transaction-type vault-transaction-type-trade">Trade</div>
              <div className="vault-transaction-amount">-0.02 {selectedAsset.symbol}</div>
              <div className="vault-transaction-date">2025-04-05 16:48:30</div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="vault-page">
      <h1>Vault</h1>
      
      {!isConnected ? (
        <div className="vault-connect">
          <p>Connect your wallet to view your assets.</p>
          <div className="vault-connect-buttons">
            <MetaMaskConnect size="large" />
            <WalletConnectButton size="large" />
            <LedgerConnect size="large" />
            <TrezorConnect size="large" />
          </div>
        </div>
      ) : (
        <>
          <div className="vault-summary">
            <div className="vault-summary-item">
              <div className="vault-summary-label">Total Value</div>
              <div className="vault-summary-value">{formatValue(totalValue)}</div>
            </div>
            <div className="vault-summary-item">
              <div className="vault-summary-label">Assets</div>
              <div className="vault-summary-value">{assets.length}</div>
            </div>
            <div className="vault-summary-item">
              <div className="vault-summary-label">Network</div>
              <div className="vault-summary-value">{networkName}</div>
            </div>
            <div className="vault-summary-item">
              <div className="vault-summary-label">Connected With</div>
              <div className="vault-summary-value">
                {connectedWalletType}
              </div>
            </div>
          </div>
          
          <div className="vault-content">
            <div className="vault-sidebar">
              <h2>Assets</h2>
              {renderAssetList()}
            </div>
            
            <div className="vault-main">
              <h2>Asset Details</h2>
              {renderAssetDetails()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Vault;