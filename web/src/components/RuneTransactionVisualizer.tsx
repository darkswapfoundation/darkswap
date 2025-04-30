import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Divider, Chip, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, IconButton } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

// Define transaction types
interface RuneTransaction {
  id: string;
  txid: string;
  blockHeight: number | null;
  timestamp: number;
  sender: string;
  recipient: string;
  amount: string;
  fee: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  runeId: string;
  runeName: string;
  runeSymbol: string;
  runeType: 'fungible' | 'non-fungible';
  rawTransaction: string;
  inscriptionId?: string;
  inscriptionNumber?: number;
}

interface TransactionVisualizerProps {
  runeId?: string;
}

/**
 * Rune Transaction Visualizer Component
 * 
 * This component visualizes and manages rune transactions on the Bitcoin network.
 */
const RuneTransactionVisualizer: React.FC<TransactionVisualizerProps> = ({ runeId }) => {
  const { isDarkMode } = useTheme();
  const { client } = useApi();
  const { addNotification } = useNotification();
  
  // State for transactions
  const [transactions, setTransactions] = useState<RuneTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<RuneTransaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [runeFilter, setRuneFilter] = useState<string>(runeId || 'all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // State for transaction details modal
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  
  // Fetch transactions on component mount and when filters change
  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, runeFilter, timeRange, typeFilter]);
  
  // Fetch transactions from the API
  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Calculate timestamp for time range filter
      const now = Date.now();
      let startTime = 0;
      
      switch (timeRange) {
        case '1h':
          startTime = now - 60 * 60 * 1000;
          break;
        case '24h':
          startTime = now - 24 * 60 * 60 * 1000;
          break;
        case '7d':
          startTime = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case '30d':
          startTime = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case 'all':
        default:
          startTime = 0;
          break;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (runeFilter !== 'all') {
        params.append('rune_id', runeFilter);
      }
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      params.append('start_time', startTime.toString());
      
      // Fetch transactions
      const response = await client.request<RuneTransaction[]>('GET', `/rune-transactions?${params.toString()}`);
      
      if (response.error) {
        setError(`Failed to fetch transactions: ${response.error}`);
        addNotification('error', `Failed to fetch transactions: ${response.error}`);
      } else {
        setTransactions(response.data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch transactions: ${errorMessage}`);
      addNotification('error', `Failed to fetch transactions: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle transaction click
  const handleTransactionClick = (transaction: RuneTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsOpen(true);
  };
  
  // Copy transaction ID to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification('success', 'Copied to clipboard');
  };
  
  // Open transaction in block explorer
  const openInExplorer = (txid: string) => {
    window.open(`https://mempool.space/tx/${txid}`, '_blank');
  };
  
  // Open inscription in explorer
  const openInscriptionInExplorer = (inscriptionId: string) => {
    window.open(`https://ordinals.com/inscription/${inscriptionId}`, '_blank');
  };
  
  // Download raw transaction
  const downloadRawTransaction = (transaction: RuneTransaction) => {
    const element = document.createElement('a');
    const file = new Blob([transaction.rawTransaction], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${transaction.txid}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
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
  
  // Format address for display
  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };
  
  // Render transaction details
  const renderTransactionDetails = () => {
    if (!selectedTransaction) return null;
    
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3,
          backgroundColor: isDarkMode ? '#1e1e2f' : '#ffffff',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: '800px',
          maxHeight: '80vh',
          overflow: 'auto',
          zIndex: 1000,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Transaction Details</Typography>
          <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Transaction ID:</Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ wordBreak: 'break-all' }}>{selectedTransaction.txid}</Typography>
              <IconButton size="small" onClick={() => copyToClipboard(selectedTransaction.txid)}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => openInExplorer(selectedTransaction.txid)}>
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Status:</Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Chip 
              label={selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)} 
              color={getStatusColor(selectedTransaction.status) as 'success' | 'warning' | 'error' | 'default'} 
              size="small" 
            />
            {selectedTransaction.status === 'confirmed' && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Confirmations: {selectedTransaction.confirmations}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Timestamp:</Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography>{formatTimestamp(selectedTransaction.timestamp)}</Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Block Height:</Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography>{selectedTransaction.blockHeight || 'Pending'}</Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Rune:</Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography>{selectedTransaction.runeName} ({selectedTransaction.runeSymbol})</Typography>
            <Typography variant="body2" color="textSecondary">ID: {selectedTransaction.runeId}</Typography>
            <Typography variant="body2" color="textSecondary">Type: {selectedTransaction.runeType === 'fungible' ? 'Fungible' : 'Non-Fungible'}</Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Amount:</Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography>{selectedTransaction.amount} {selectedTransaction.runeSymbol}</Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Fee:</Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography>{selectedTransaction.fee} BTC</Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Sender:</Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ wordBreak: 'break-all' }}>{selectedTransaction.sender}</Typography>
              <IconButton size="small" onClick={() => copyToClipboard(selectedTransaction.sender)}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Recipient:</Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ wordBreak: 'break-all' }}>{selectedTransaction.recipient}</Typography>
              <IconButton size="small" onClick={() => copyToClipboard(selectedTransaction.recipient)}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
          
          {selectedTransaction.inscriptionId && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">Inscription:</Typography>
              </Grid>
              <Grid item xs={12} sm={9}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ wordBreak: 'break-all' }}>{selectedTransaction.inscriptionId}</Typography>
                  <IconButton size="small" onClick={() => copyToClipboard(selectedTransaction.inscriptionId!)}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => openInscriptionInExplorer(selectedTransaction.inscriptionId!)}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Box>
                {selectedTransaction.inscriptionNumber !== undefined && (
                  <Typography variant="body2" color="textSecondary">
                    Inscription Number: {selectedTransaction.inscriptionNumber}
                  </Typography>
                )}
              </Grid>
            </>
          )}
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Raw Transaction:</Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {selectedTransaction.rawTransaction.substring(0, 50)}...
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => downloadRawTransaction(selectedTransaction)}
              >
                Download
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
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
      <Typography variant="h5" gutterBottom>
        Rune Transactions
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        View and manage rune transactions on the Bitcoin network. This component shows transactions for runes, including their status, amount, and inscription information.
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="rune-filter-label">Rune</InputLabel>
              <Select
                labelId="rune-filter-label"
                value={runeFilter}
                onChange={(e) => setRuneFilter(e.target.value)}
                label="Rune"
              >
                <MenuItem value="all">All Runes</MenuItem>
                <MenuItem value="rune-1">Rune 1</MenuItem>
                <MenuItem value="rune-2">Rune 2</MenuItem>
                <MenuItem value="rune-3">Rune 3</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="type-filter-label">Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="fungible">Fungible</MenuItem>
                <MenuItem value="non-fungible">Non-Fungible</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="time-range-label">Time Range</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchTransactions}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : transactions.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No transactions found. Try adjusting your filters or create a new rune transaction.
        </Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Rune</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Sender</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>{formatTimestamp(transaction.timestamp)}</TableCell>
                  <TableCell>
                    <Tooltip title={transaction.txid}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">{formatAddress(transaction.txid)}</Typography>
                        <IconButton size="small" onClick={() => copyToClipboard(transaction.txid)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{transaction.runeSymbol}</TableCell>
                  <TableCell>
                    <Chip 
                      label={transaction.runeType === 'fungible' ? 'Fungible' : 'NFT'} 
                      color={transaction.runeType === 'fungible' ? 'primary' : 'secondary'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>
                    <Tooltip title={transaction.sender}>
                      <Typography variant="body2">{formatAddress(transaction.sender)}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={transaction.recipient}>
                      <Typography variant="body2">{formatAddress(transaction.recipient)}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)} 
                      color={getStatusColor(transaction.status) as 'success' | 'warning' | 'error' | 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <IconButton size="small" onClick={() => handleTransactionClick(transaction)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => openInExplorer(transaction.txid)}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                      {transaction.inscriptionId && (
                        <IconButton size="small" onClick={() => openInscriptionInExplorer(transaction.inscriptionId!)}>
                          <CompareArrowsIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {isDetailsOpen && renderTransactionDetails()}
    </Paper>
  );
};

export default RuneTransactionVisualizer;