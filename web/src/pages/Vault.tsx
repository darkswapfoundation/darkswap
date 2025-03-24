import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Icons
import {
  ArrowPathIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface VaultProps {
  isWalletConnected: boolean;
  isSDKInitialized: boolean;
}

interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: 'bitcoin' | 'rune' | 'alkane';
  balance: number;
  value: number;
  change24h: number;
  icon: string;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'trade';
  asset: string;
  amount: number;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  address: string;
  txid?: string;
}

const Vault: React.FC<VaultProps> = ({ isWalletConnected, isSDKInitialized }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [totalChange, setTotalChange] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'assets' | 'transactions'>('assets');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Generate mock data
  useEffect(() => {
    if (isSDKInitialized && isWalletConnected) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        generateMockData();
        setIsLoading(false);
      }, 1000);
    }
  }, [isSDKInitialized, isWalletConnected]);

  const generateMockData = () => {
    // Generate mock assets
    const mockAssets: Asset[] = [
      {
        id: 'btc',
        name: 'Bitcoin',
        symbol: 'BTC',
        type: 'bitcoin',
        balance: 0.45,
        value: 18450,
        change24h: 2.4,
        icon: 'bitcoin',
      },
      {
        id: 'rune:0x123',
        name: 'RUNE:0x123',
        symbol: 'RUNE',
        type: 'rune',
        balance: 1000,
        value: 5230.56,
        change24h: 5.7,
        icon: 'rune',
      },
      {
        id: 'alkane:0x456',
        name: 'ALKANE:0x456',
        symbol: 'ALKANE',
        type: 'alkane',
        balance: 500,
        value: 1750,
        change24h: -1.2,
        icon: 'alkane',
      },
      {
        id: 'rune:0x789',
        name: 'RUNE:0x789',
        symbol: 'RUNE',
        type: 'rune',
        balance: 750,
        value: 3250,
        change24h: 3.1,
        icon: 'rune',
      },
    ];
    
    // Generate mock transactions
    const mockTransactions: Transaction[] = [];
    const types: ('send' | 'receive' | 'trade')[] = ['send', 'receive', 'trade'];
    const statuses: ('completed' | 'pending' | 'failed')[] = ['completed', 'pending', 'failed'];
    
    for (let i = 0; i < 20; i++) {
      const asset = mockAssets[Math.floor(Math.random() * mockAssets.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const status = i < 2 ? 'pending' : statuses[Math.floor(Math.random() * (statuses.length - 1))];
      
      mockTransactions.push({
        id: `tx-${i}`,
        type,
        asset: asset.id,
        amount: Math.random() * (asset.type === 'bitcoin' ? 0.1 : 100),
        timestamp: Date.now() - Math.floor(Math.random() * 1000000000),
        status,
        address: `bc1q${Math.random().toString(36).substring(2, 15)}`,
        txid: status === 'completed' ? `0x${Math.random().toString(16).substring(2, 66)}` : undefined,
      });
    }
    
    // Sort transactions by timestamp (newest first)
    mockTransactions.sort((a, b) => b.timestamp - a.timestamp);
    
    // Calculate total value and change
    const total = mockAssets.reduce((sum, asset) => sum + asset.value, 0);
    const weightedChange = mockAssets.reduce((sum, asset) => sum + (asset.change24h * asset.value), 0);
    const avgChange = weightedChange / total;
    
    setAssets(mockAssets);
    setTransactions(mockTransactions);
    setTotalValue(total);
    setTotalChange(avgChange);
  };

  const handleRefresh = () => {
    if (isSDKInitialized && isWalletConnected) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        generateMockData();
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAssetName = (assetId: string): string => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return assetId;
    return asset.name;
  };

  const getAssetIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'bitcoin':
        return (
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="font-bold text-white">₿</span>
          </div>
        );
      case 'rune':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
            <span className="font-bold text-white">R</span>
          </div>
        );
      case 'alkane':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="font-bold text-white">A</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
            <span className="font-bold text-white">?</span>
          </div>
        );
    }
  };

  const getTransactionIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'send':
        return (
          <div className="w-8 h-8 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center">
            <ArrowUpIcon className="w-4 h-4 text-red-400" />
          </div>
        );
      case 'receive':
        return (
          <div className="w-8 h-8 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
            <ArrowDownIcon className="w-4 h-4 text-green-400" />
          </div>
        );
      case 'trade':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center">
            <ArrowPathIcon className="w-4 h-4 text-blue-400" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-500 bg-opacity-20 flex items-center justify-center">
            <span className="font-bold text-gray-400">?</span>
          </div>
        );
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="text-white">Personal </span>
            <span className="neon-text-green">Vault</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Securely manage your Bitcoin, runes, and alkanes
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isLoading || !isSDKInitialized || !isWalletConnected}
          className="btn btn-primary"
        >
          <ArrowPathIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
            <LockClosedIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Connect your wallet to access your vault
            </span>
          </div>
        </motion.div>
      )}

      {/* Vault Overview */}
      {isWalletConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <ShieldCheckIcon className="w-10 h-10 text-twilight-neon-green mr-4" />
              <div>
                <div className="text-sm text-gray-400">Total Value</div>
                <div className="text-3xl font-display font-bold">${totalValue.toLocaleString()}</div>
                <div className={`text-sm ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}% (24h)
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Link to="/trade" className="btn btn-neon">
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Trade
              </Link>
              <button className="btn btn-secondary">
                <ArrowUpIcon className="w-5 h-5 mr-2" />
                Send
              </button>
              <button className="btn btn-secondary">
                <ArrowDownIcon className="w-5 h-5 mr-2" />
                Receive
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      {isWalletConnected && (
        <div className="flex border-b border-twilight-dark">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'assets' ? 'text-twilight-neon-green border-b-2 border-twilight-neon-green' : 'text-gray-400'}`}
            onClick={() => setActiveTab('assets')}
          >
            Assets
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'transactions' ? 'text-twilight-neon-green border-b-2 border-twilight-neon-green' : 'text-gray-400'}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
        </div>
      )}

      {/* Content */}
      {isWalletConnected && (
        isLoading ? (
          <div className="flex justify-center items-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-twilight-neon-green animate-spin" />
          </div>
        ) : (
          <div>
            {/* Assets Tab */}
            {activeTab === 'assets' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset) => (
                  <motion.div
                    key={asset.id}
                    whileHover={{ scale: 1.02 }}
                    className="vault-item p-4 cursor-pointer"
                    onClick={() => handleAssetClick(asset)}
                  >
                    <div className="flex items-center">
                      {getAssetIcon(asset.type)}
                      <div className="ml-3">
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm text-gray-400">{asset.symbol}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-medium">{asset.balance.toFixed(asset.type === 'bitcoin' ? 8 : 2)}</div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="text-sm text-gray-400">${asset.value.toLocaleString()}</div>
                        <div className={`text-sm ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Add Asset Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="vault-item p-4 cursor-pointer border-2 border-dashed border-twilight-dark flex flex-col items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-full bg-twilight-dark bg-opacity-50 flex items-center justify-center mb-2">
                    <PlusIcon className="w-6 h-6 text-twilight-neon-green" />
                  </div>
                  <div className="font-medium text-center">Add Asset</div>
                  <div className="text-sm text-gray-400 text-center mt-1">Import tokens or NFTs</div>
                </motion.div>
              </div>
            )}
            
            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Asset</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Address</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>
                            <div className="flex items-center">
                              {getTransactionIcon(tx.type)}
                              <span className="ml-2 capitalize">{tx.type}</span>
                            </div>
                          </td>
                          <td>{formatAssetName(tx.asset)}</td>
                          <td className={tx.type === 'receive' ? 'text-green-400' : tx.type === 'send' ? 'text-red-400' : ''}>
                            {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}
                            {tx.amount.toFixed(tx.asset.includes('btc') ? 8 : 2)}
                          </td>
                          <td className={getStatusColor(tx.status)}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </td>
                          <td>{formatDate(tx.timestamp)}</td>
                          <td className="font-mono text-sm">
                            {tx.address.substring(0, 8)}...{tx.address.substring(tx.address.length - 8)}
                          </td>
                          <td>
                            {tx.txid && (
                              <a
                                href={`https://mempool.space/tx/${tx.txid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                                title="View on Explorer"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {/* Asset Details Modal */}
      {isModalOpen && selectedAsset && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full"
          >
            <div className="card-header flex justify-between items-center">
              <div className="flex items-center">
                {getAssetIcon(selectedAsset.type)}
                <h2 className="text-xl font-display font-bold ml-3">
                  {selectedAsset.name}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
              >
                <ArrowPathIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-gray-400">Balance</div>
                  <div className="text-3xl font-medium">
                    {selectedAsset.balance.toFixed(selectedAsset.type === 'bitcoin' ? 8 : 2)} {selectedAsset.symbol}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    ${selectedAsset.value.toLocaleString()}
                    <span className={`ml-2 ${selectedAsset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="btn btn-secondary">
                    <ArrowUpIcon className="w-5 h-5 mr-2" />
                    Send
                  </button>
                  <button className="btn btn-secondary">
                    <ArrowDownIcon className="w-5 h-5 mr-2" />
                    Receive
                  </button>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">Recent Transactions</div>
                  <div className="space-y-2">
                    {transactions
                      .filter(tx => tx.asset === selectedAsset.id)
                      .slice(0, 3)
                      .map(tx => (
                        <div key={tx.id} className="flex justify-between items-center p-2 bg-twilight-dark bg-opacity-50 rounded-lg">
                          <div className="flex items-center">
                            {getTransactionIcon(tx.type)}
                            <div className="ml-2">
                              <div className="text-sm capitalize">{tx.type}</div>
                              <div className="text-xs text-gray-400">{formatDate(tx.timestamp)}</div>
                            </div>
                          </div>
                          <div className={tx.type === 'receive' ? 'text-green-400' : tx.type === 'send' ? 'text-red-400' : ''}>
                            {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}
                            {tx.amount.toFixed(tx.asset.includes('btc') ? 8 : 2)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-twilight-dark">
                  <Link to="/trade" className="btn btn-neon w-full">
                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                    Trade {selectedAsset.symbol}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Vault;