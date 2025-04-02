import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Grid, Divider, Chip, CircularProgress, Alert, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * TabPanel Component
 * 
 * Renders the content of a tab panel.
 */
const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wallet-tabpanel-${index}`}
      aria-labelledby={`wallet-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Define transaction types
interface Transaction {
  id: string;
  txid: string;
  type: 'send' | 'receive' | 'swap';
  amount: string;
  fee: string;
  timestamp: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  address: string;
  memo: string;
  asset: {
    id: string;
    name: string;
    symbol: string;
    type: 'btc' | 'rune' | 'alkane';
  };
}

/**
 * Wallet Manager Component
 * 
 * This component allows users to view and manage their wallet.
 */
const WalletManager: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { client } = useApi();
  const { addNotification } = useNotification();
  
  // State for UI
  const [tabValue, setTabValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
  
  // State for send dialog
  const [isSendDialogOpen, setIsSendDialogOpen] = useState<boolean>(false);
  const [sendAddress, setSendAddress] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [sendAsset, setSendAsset] = useState<string>('btc');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  
  // State for receive dialog
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState<boolean>(false);
  
  // Load wallet data on component mount
  useEffect(() => {
    loadWalletData();
  }, []);
  
  // Connect wallet
  const connect = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would connect to the wallet
      // For now, we'll just simulate a successful connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(true);
      loadWalletData();
      addNotification('success', 'Wallet connected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to connect wallet: ${errorMessage}`);
      addNotification('error', `Failed to connect wallet: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Disconnect wallet
  const disconnect = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would disconnect from the wallet
      // For now, we'll just simulate a successful disconnection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(false);
      setTransactions([]);
      setAssets([]);
      addNotification('success', 'Wallet disconnected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to disconnect wallet: ${errorMessage}`);
      addNotification('error', `Failed to disconnect wallet: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load wallet data
  const loadWalletData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use mock data
      
      // Mock transactions
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          txid: '1a2b3c4d5e6f7g8h9i0j',
          type: 'receive',
          amount: '0.01',
          fee: '0.0001',
          timestamp: Date.now() - 3600000,
          confirmations: 3,
          status: 'confirmed',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          memo: 'Payment for services',
          asset: {
            id: 'btc',
            name: 'Bitcoin',
            symbol: 'BTC',
            type: 'btc',
          },
        },
        {
          id: '2',
          txid: '2b3c4d5e6f7g8h9i0j1k',
          type: 'send',
          amount: '0.005',
          fee: '0.0001',
          timestamp: Date.now() - 86400000,
          confirmations: 10,
          status: 'confirmed',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          memo: 'Rent payment',
          asset: {
            id: 'btc',
            name: 'Bitcoin',
            symbol: 'BTC',
            type: 'btc',
          },
        },
        {
          id: '3',
          txid: '3c4d5e6f7g8h9i0j1k2l',
          type: 'swap',
          amount: '100',
          fee: '0.0001',
          timestamp: Date.now() - 172800000,
          confirmations: 20,
          status: 'confirmed',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          memo: 'Swap BTC for RUNE1',
          asset: {
            id: 'rune-1',
            name: 'Rune One',
            symbol: 'RUNE1',
            type: 'rune',
          },
        },
      ];
      
      // Mock assets
      const mockAssets = [
        {
          id: 'btc',
          name: 'Bitcoin',
          symbol: 'BTC',
          type: 'btc',
          balance: '0.01234',
          value: 12345.67,
          price: 1000000.00,
          change24h: 2.5,
        },
        {
          id: 'rune-1',
          name: 'Rune One',
          symbol: 'RUNE1',
          type: 'rune',
          balance: '100',
          value: 100.00,
          price: 1.00,
          change24h: 5.0,
        },
        {
          id: 'alkane-1',
          name: 'Alkane One',
          symbol: 'ALK1',
          type: 'alkane',
          balance: '50',
          value: 250.00,
          price: 5.00,
          change24h: 10.0,
        },
      ];
      
      setTransactions(mockTransactions);
      setAssets(mockAssets);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load wallet data: ${errorMessage}`);
      addNotification('error', `Failed to load wallet data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle send dialog open
  const handleSendDialogOpen = () => {
    setIsSendDialogOpen(true);
    setSendError(null);
  };
  
  // Handle send dialog close
  const handleSendDialogClose = () => {
    setIsSendDialogOpen(false);
    setSendAddress('');
    setSendAmount('');
    setSendAsset('btc');
    setSendError(null);
  };
  
  // Handle send transaction
  const handleSendTransaction = async () => {
    setSendError(null);
    setIsSending(true);
    
    try {
      // Validate input
      if (!sendAddress) {
        throw new Error('Please enter a valid address');
      }
      
      if (!sendAmount || parseFloat(sendAmount) <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      // In a real implementation, this would send the transaction
      // For now, we'll just simulate a successful transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add the transaction to the list
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substring(2, 11),
        txid: Math.random().toString(36).substring(2, 36),
        type: 'send',
        amount: sendAmount,
        fee: '0.0001',
        timestamp: Date.now(),
        confirmations: 0,
        status: 'pending',
        address: sendAddress,
        memo: '',
        asset: {
          id: sendAsset,
          name: assets.find(asset => asset.id === sendAsset)?.name || '',
          symbol: assets.find(asset => asset.id === sendAsset)?.symbol || '',
          type: assets.find(asset => asset.id === sendAsset)?.type || 'btc',
        },
      };
      
      setTransactions([newTransaction, ...transactions]);
      
      // Close the dialog
      handleSendDialogClose();
      
      // Show success notification
      addNotification('success', 'Transaction sent successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSendError(errorMessage);
      addNotification('error', `Failed to send transaction: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle receive dialog open
  const handleReceiveDialogOpen = () => {
    setIsReceiveDialogOpen(true);
  };
  
  // Handle receive dialog close
  const handleReceiveDialogClose = () => {
    setIsReceiveDialogOpen(false);
  };
  
  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification('success', 'Copied to clipboard');
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Get transaction status color
  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Get transaction type color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'receive':
        return 'success';
      case 'send':
        return 'error';
      case 'swap':
        return 'info';
      default:
        return 'default';
    }
  };
  
  // Format address for display
  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };
  
  // Format amount with sign
  const formatAmountWithSign = (amount: string, type: string) => {
    if (type === 'receive') {
      return `+${amount}`;
    } else if (type === 'send') {
      return `-${amount}`;
    } else {
      return amount;
    }
  };
  
  // Format price change
  const formatPriceChange = (change: number) => {
    return change >= 0 ? `+${change}%` : `${change}%`;
  };
  
  // Get price change color
  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'success' : 'error';
  };
  
  // Calculate total balance in USD
  const calculateTotalBalance = () => {
    return assets.reduce((total, asset) => total + asset.value, 0).toFixed(2);
  };
  
  // Render assets
  const renderAssets = () => {
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Asset</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell align="right">Value (USD)</TableCell>
              <TableCell align="right">Price (USD)</TableCell>
              <TableCell align="right">24h Change</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: asset.type === 'btc' ? '#f7931a' : asset.type === 'rune' ? '#6f42c1' : '#20c997',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        {asset.symbol.charAt(0)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2">{asset.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{asset.symbol}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {showBalance ? asset.balance : '***'} {asset.symbol}
                </TableCell>
                <TableCell align="right">
                  ${showBalance ? asset.value.toFixed(2) : '***'}
                </TableCell>
                <TableCell align="right">
                  ${asset.price.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <Typography color={getPriceChangeColor(asset.change24h)}>
                    {formatPriceChange(asset.change24h)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSendAsset(asset.id);
                        handleSendDialogOpen();
                      }}
                    >
                      Send
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleReceiveDialogOpen}
                      sx={{ ml: 1 }}
                    >
                      Receive
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Render transactions
  const renderTransactions = () => {
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Asset</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} hover>
                <TableCell>{formatTimestamp(transaction.timestamp)}</TableCell>
                <TableCell>
                  <Chip
                    label={transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    color={getTransactionTypeColor(transaction.type) as 'success' | 'error' | 'info' | 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography color={transaction.type === 'receive' ? 'success.main' : transaction.type === 'send' ? 'error.main' : 'info.main'}>
                    {formatAmountWithSign(transaction.amount, transaction.type)} {transaction.asset.symbol}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: transaction.asset.type === 'btc' ? '#f7931a' : transaction.asset.type === 'rune' ? '#6f42c1' : '#20c997',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem' }}>
                        {transaction.asset.symbol.charAt(0)}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{transaction.asset.symbol}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatAddress(transaction.address)}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)} ${transaction.confirmations > 0 ? `(${transaction.confirmations})` : ''}`}
                    color={getTransactionStatusColor(transaction.status) as 'success' | 'warning' | 'error' | 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Render send dialog
  const renderSendDialog = () => {
    return (
      <Dialog open={isSendDialogOpen} onClose={handleSendDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Send {assets.find(asset => asset.id === sendAsset)?.symbol || ''}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {sendError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {sendError}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recipient Address"
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  placeholder="Enter recipient address"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="Enter amount"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <Box component="span" sx={{ ml: 1 }}>
                        {assets.find(asset => asset.id === sendAsset)?.symbol || ''}
                      </Box>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="send-asset-label">Asset</InputLabel>
                  <Select
                    labelId="send-asset-label"
                    value={sendAsset}
                    onChange={(e) => setSendAsset(e.target.value)}
                    label="Asset"
                  >
                    {assets.map((asset) => (
                      <MenuItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.symbol})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSendDialogClose}>Cancel</Button>
          <Button
            onClick={handleSendTransaction}
            variant="contained"
            color="primary"
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Render receive dialog
  const renderReceiveDialog = () => {
    return (
      <Dialog open={isReceiveDialogOpen} onClose={handleReceiveDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Receive</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              sx={{
                width: 200,
                height: 200,
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Typography>QR Code Placeholder</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Your Address"
                  value={address}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Button
                        onClick={() => copyToClipboard(address)}
                      >
                        Copy
                      </Button>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReceiveDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3,
        backgroundColor: isDarkMode ? '#1e1e2f' : '#ffffff',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Wallet
        </Typography>
        
        <Box>
          {isConnected ? (
            <>
              <Button
                variant="outlined"
                onClick={() => setShowBalance(!showBalance)}
                sx={{ mr: 1 }}
              >
                {showBalance ? 'Hide Balance' : 'Show Balance'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={connect}
              disabled={isLoading}
            >
              Connect Wallet
            </Button>
          )}
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {isConnected ? (
        <>
          <Box sx={{ mb: 3 }}>
            <Paper sx={{ p: 2, backgroundColor: isDarkMode ? '#2a2a3c' : '#f5f5f5' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Total Balance
                  </Typography>
                  <Typography variant="h4">
                    ${showBalance ? calculateTotalBalance() : '***'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendDialogOpen}
                    sx={{ mr: 1 }}
                  >
                    Send
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleReceiveDialogOpen}
                  >
                    Receive
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="wallet tabs">
              <Tab label="Assets" id="wallet-tab-0" aria-controls="wallet-tabpanel-0" />
              <Tab label="Transactions" id="wallet-tab-1" aria-controls="wallet-tabpanel-1" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              renderAssets()
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              renderTransactions()
            )}
          </TabPanel>
          
          {renderSendDialog()}
          {renderReceiveDialog()}
        </>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Connect your wallet to view your assets and transactions
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={connect}
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Connect Wallet'}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default WalletManager;
