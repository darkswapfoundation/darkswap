import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../contexts/ApiContext';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { useNotification } from '../contexts/NotificationContext';
import WalletBalancesDisplay from '../components/WalletBalancesDisplay';
import TransactionHistory from '../components/TransactionHistory';
import AssetInfo from '../components/AssetInfo';

// Icons
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LockClosedIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Asset {
  id: string;
  name: string;
  ticker: string;
  balance: string;
  usdValue: number;
  type: 'btc' | 'rune' | 'alkane';
}

const Vault: React.FC = () => {
  // Get contexts
  const { client, isLoading: isApiLoading } = useApi();
  const { isConnected: isWalletConnected, isInitialized: isSDKInitialized } = useWasmWallet();
  const { addNotification } = useNotification();
  
  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [showAssetInfo, setShowAssetInfo] = useState<boolean>(false);
  
  // Fetch assets when component mounts
  useEffect(() => {
    if (isSDKInitialized && isWalletConnected && !isApiLoading) {
      fetchAssets();
    }
  }, [isSDKInitialized, isWalletConnected, isApiLoading]);
  
  // Fetch assets from API or generate mock data
  const fetchAssets = async () => {
    setIsLoading(true);
    
    try {
      if (client) {
        // Fetch Bitcoin balance
        // This would be a real API call in production
        
        // Fetch runes
        const runesResponse = await client.getRunes();
        
        // Fetch alkanes
        const alkanesResponse = await client.getAlkanes();
        
        if (runesResponse.error || alkanesResponse.error) {
          addNotification('error', `Failed to fetch assets: ${runesResponse.error || alkanesResponse.error}`);
        } else {
          const assets: Asset[] = [];
          
          // Add Bitcoin
          assets.push({
            id: 'btc',
            name: 'Bitcoin',
            ticker: 'BTC',
            balance: '0.5',
            usdValue: 0.5 * 20000,
            type: 'btc',
          });
          
          // Add runes
          if (runesResponse.data) {
            runesResponse.data.forEach(rune => {
              assets.push({
                id: rune.id,
                name: rune.name,
                ticker: rune.ticker,
                balance: (Math.random() * 1000).toFixed(2),
                usdValue: Math.random() * 1000,
                type: 'rune',
              });
            });
          }
          
          // Add alkanes
          if (alkanesResponse.data) {
            alkanesResponse.data.forEach(alkane => {
              assets.push({
                id: alkane.id,
                name: alkane.name,
                ticker: alkane.ticker,
                balance: (Math.random() * 1000).toFixed(2),
                usdValue: Math.random() * 1000,
                type: 'alkane',
              });
            });
          }
          
          setAssets(assets);
          addNotification('info', 'Assets updated successfully');
        }
      } else {
        // Generate mock data for demo
        generateMockAssets();
      }
    } catch (error) {
      addNotification('error', `Error fetching assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate mock assets for demo
  const generateMockAssets = () => {
    const mockAssets: Asset[] = [
      {
        id: 'btc',
        name: 'Bitcoin',
        ticker: 'BTC',
        balance: '0.5',
        usdValue: 0.5 * 20000,
        type: 'btc',
      },
      {
        id: 'rune-1',
        name: 'Rune One',
        ticker: 'RUNE1',
        balance: '1000',
        usdValue: 1000 * 0.5,
        type: 'rune',
      },
      {
        id: 'rune-2',
        name: 'Rune Two',
        ticker: 'RUNE2',
        balance: '500',
        usdValue: 500 * 0.2,
        type: 'rune',
      },
      {
        id: 'alkane-1',
        name: 'Alkane One',
        ticker: 'ALK1',
        balance: '750',
        usdValue: 750 * 0.3,
        type: 'alkane',
      },
      {
        id: 'alkane-2',
        name: 'Alkane Two',
        ticker: 'ALK2',
        balance: '250',
        usdValue: 250 * 0.1,
        type: 'alkane',
      },
    ];
    
    setAssets(mockAssets);
  };
  
  // Handle deposit
  const handleDeposit = () => {
    if (!selectedAsset) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update asset balance
      const updatedAssets = assets.map(asset => {
        if (asset.id === selectedAsset.id) {
          const newBalance = parseFloat(asset.balance) + parseFloat(depositAmount);
          return {
            ...asset,
            balance: newBalance.toString(),
            usdValue: newBalance * (asset.usdValue / parseFloat(asset.balance)),
          };
        }
        return asset;
      });
      
      setAssets(updatedAssets);
      setShowDepositModal(false);
      setDepositAmount('');
      setSelectedAsset(null);
      setIsLoading(false);
      
      addNotification('success', `Deposited ${depositAmount} ${selectedAsset.ticker}`);
    }, 1500);
  };
  
  // Handle withdraw
  const handleWithdraw = () => {
    if (!selectedAsset) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update asset balance
      const updatedAssets = assets.map(asset => {
        if (asset.id === selectedAsset.id) {
          const newBalance = parseFloat(asset.balance) - parseFloat(withdrawAmount);
          return {
            ...asset,
            balance: newBalance.toString(),
            usdValue: newBalance * (asset.usdValue / parseFloat(asset.balance)),
          };
        }
        return asset;
      });
      
      setAssets(updatedAssets);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setSelectedAsset(null);
      setIsLoading(false);
      
      addNotification('success', `Withdrew ${withdrawAmount} ${selectedAsset.ticker}`);
    }, 1500);
  };
  
  // Calculate total USD value
  const totalUsdValue = assets.reduce((total, asset) => total + asset.usdValue, 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="text-white">Vault</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Manage your assets securely
          </p>
        </div>
        
        <button
          onClick={fetchAssets}
          disabled={isLoading || !isSDKInitialized || !isWalletConnected}
          className="btn btn-primary"
        >
          {isLoading ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <ArrowPathIcon className="w-5 h-5 mr-2" />
          )}
          Refresh
        </button>
      </div>
      
      {/* Connection Warning */}
      {!isWalletConnected && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-4 border border-ui-warning border-opacity-50"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Connect your wallet to access your vault
            </span>
          </div>
        </motion.div>
      )}
      
      {/* SDK Warning */}
      {isWalletConnected && !isSDKInitialized && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-4 border border-ui-warning border-opacity-50"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Initializing DarkSwap SDK...
            </span>
          </div>
        </motion.div>
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Wallet Balances and Transaction History */}
        <div className="lg:col-span-4 space-y-6">
          <WalletBalancesDisplay />
          <TransactionHistory />
        </div>
        
        {/* Right Column: Assets and Total Value */}
        <div className="lg:col-span-8 space-y-6">
          {/* Total Value */}
          {isWalletConnected && isSDKInitialized && (
            <div className="card p-6">
              <div className="flex items-center">
                <LockClosedIcon className="w-8 h-8 text-twilight-neon-blue mr-4" />
                <div>
                  <h2 className="text-lg font-medium text-gray-300">Total Value</h2>
                  <p className="text-3xl font-display font-bold text-white">
                    ${totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Assets Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-medium">Your Assets</h2>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <ArrowPathIcon className="w-8 h-8 text-twilight-neon-blue animate-spin" />
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400">No assets found</p>
                </div>
              ) : (
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Balance</th>
                      <th>Value (USD)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr key={asset.id}>
                        <td>
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full ${
                              asset.type === 'btc' ? 'bg-orange-500' : 
                              asset.type === 'rune' ? 'bg-blue-500' : 'bg-green-500'
                            } flex items-center justify-center mr-2`}>
                              <span className="text-xs font-bold text-white">{asset.ticker.substring(0, 2)}</span>
                            </div>
                            <div>
                              <div className="font-medium">{asset.name}</div>
                              <div className="text-sm text-gray-400">{asset.ticker}</div>
                            </div>
                          </div>
                        </td>
                        <td>{asset.balance}</td>
                        <td>${asset.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowDepositModal(true);
                              }}
                              className="btn btn-sm btn-primary"
                              title="Deposit"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowWithdrawModal(true);
                              }}
                              className="btn btn-sm btn-secondary"
                              title="Withdraw"
                            >
                              <ArrowUpTrayIcon className="w-4 h-4" />
                            </button>
                            {asset.type !== 'btc' && (
                              <button
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setShowAssetInfo(true);
                                }}
                                className="btn btn-sm btn-tertiary"
                                title="Info"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Deposit Modal */}
      {showDepositModal && selectedAsset && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="card w-96">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-medium">Deposit {selectedAsset.name}</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="form-input pr-16"
                    step="any"
                    min="0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">{selectedAsset.ticker}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  )}
                  Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Withdraw Modal */}
      {showWithdrawModal && selectedAsset && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="card w-96">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-medium">Withdraw {selectedAsset.name}</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="form-input pr-16"
                    step="any"
                    min="0"
                    max={selectedAsset.balance}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">{selectedAsset.ticker}</span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400 mt-1">
                  Available: {selectedAsset.balance} {selectedAsset.ticker}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) <= 0 ||
                    parseFloat(withdrawAmount) > parseFloat(selectedAsset.balance) ||
                    isLoading
                  }
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                  )}
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Asset Info Modal */}
      {showAssetInfo && selectedAsset && selectedAsset.type !== 'btc' && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="card w-96">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-medium">{selectedAsset.name} Info</h3>
              <button
                onClick={() => setShowAssetInfo(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="card-body">
              <AssetInfo
                assetType={selectedAsset.type as 'rune' | 'alkane'}
                assetId={selectedAsset.id}
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowAssetInfo(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vault;