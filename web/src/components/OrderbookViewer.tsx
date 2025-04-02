import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, FormControl, InputLabel, Select, MenuItem, Grid, Divider, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, IconButton, Tabs, Tab } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SwapVertIcon from '@mui/icons-material/SwapVert';

// Define orderbook types
interface OrderbookEntry {
  price: string;
  amount: string;
  total: string;
  count: number;
}

interface Orderbook {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  spread: string;
  spreadPercentage: string;
  timestamp: number;
  baseAsset: string;
  quoteAsset: string;
}

interface AssetPair {
  baseAsset: string;
  baseAssetName: string;
  baseAssetSymbol: string;
  quoteAsset: string;
  quoteAssetName: string;
  quoteAssetSymbol: string;
  lastPrice: string;
  priceChange24h: string;
  priceChangePercentage24h: string;
  volume24h: string;
}

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
      id={`orderbook-tabpanel-${index}`}
      aria-labelledby={`orderbook-tab-${index}`}
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

/**
 * Orderbook Viewer Component
 * 
 * This component displays the orderbook for a selected asset pair.
 */
const OrderbookViewer: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { client } = useApi();
  const { addNotification } = useNotification();
  const { isConnected, send } = useWebSocket();
  
  // State for orderbook
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [assetPairs, setAssetPairs] = useState<AssetPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [orderbookDepth, setOrderbookDepth] = useState<number>(20);
  
  // Fetch asset pairs on component mount
  useEffect(() => {
    fetchAssetPairs();
  }, []);
  
  // Fetch orderbook when selected pair changes
  useEffect(() => {
    if (selectedPair) {
      fetchOrderbook();
    }
  }, [selectedPair, orderbookDepth]);
  
  // Subscribe to orderbook updates when connected
  useEffect(() => {
    if (isConnected && selectedPair) {
      // Subscribe to orderbook updates
      send('subscribe', {
        channel: 'orderbook',
        pair: selectedPair,
      });
      
      // Unsubscribe when component unmounts or selected pair changes
      return () => {
        send('unsubscribe', {
          channel: 'orderbook',
          pair: selectedPair,
        });
      };
    }
  }, [isConnected, selectedPair]);
  
  // Fetch asset pairs from the API
  const fetchAssetPairs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use mock data
      const mockAssetPairs: AssetPair[] = [
        {
          baseAsset: 'rune-1',
          baseAssetName: 'Rune One',
          baseAssetSymbol: 'RUNE1',
          quoteAsset: 'btc',
          quoteAssetName: 'Bitcoin',
          quoteAssetSymbol: 'BTC',
          lastPrice: '0.00001234',
          priceChange24h: '0.00000123',
          priceChangePercentage24h: '11.08',
          volume24h: '1.23456789',
        },
        {
          baseAsset: 'alkane-1',
          baseAssetName: 'Alkane One',
          baseAssetSymbol: 'ALK1',
          quoteAsset: 'btc',
          quoteAssetName: 'Bitcoin',
          quoteAssetSymbol: 'BTC',
          lastPrice: '0.00002345',
          priceChange24h: '-0.00000234',
          priceChangePercentage24h: '-9.07',
          volume24h: '2.34567890',
        },
        {
          baseAsset: 'rune-2',
          baseAssetName: 'Rune Two',
          baseAssetSymbol: 'RUNE2',
          quoteAsset: 'btc',
          quoteAssetName: 'Bitcoin',
          quoteAssetSymbol: 'BTC',
          lastPrice: '0.00003456',
          priceChange24h: '0.00000345',
          priceChangePercentage24h: '11.08',
          volume24h: '3.45678901',
        },
        {
          baseAsset: 'alkane-2',
          baseAssetName: 'Alkane Two',
          baseAssetSymbol: 'ALK2',
          quoteAsset: 'btc',
          quoteAssetName: 'Bitcoin',
          quoteAssetSymbol: 'BTC',
          lastPrice: '0.00004567',
          priceChange24h: '-0.00000456',
          priceChangePercentage24h: '-9.07',
          volume24h: '4.56789012',
        },
        {
          baseAsset: 'rune-1',
          baseAssetName: 'Rune One',
          baseAssetSymbol: 'RUNE1',
          quoteAsset: 'alkane-1',
          quoteAssetName: 'Alkane One',
          quoteAssetSymbol: 'ALK1',
          lastPrice: '0.12345678',
          priceChange24h: '0.01234567',
          priceChangePercentage24h: '11.08',
          volume24h: '123.45678901',
        },
      ];
      
      setAssetPairs(mockAssetPairs);
      
      // Set default selected pair
      if (mockAssetPairs.length > 0 && !selectedPair) {
        setSelectedPair(`${mockAssetPairs[0].baseAsset}/${mockAssetPairs[0].quoteAsset}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch asset pairs: ${errorMessage}`);
      addNotification('error', `Failed to fetch asset pairs: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch orderbook from the API
  const fetchOrderbook = async () => {
    if (!selectedPair) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse selected pair
      const [baseAsset, quoteAsset] = selectedPair.split('/');
      
      // In a real implementation, this would fetch from the API
      // For now, we'll generate mock data
      const mockOrderbook: Orderbook = {
        bids: [],
        asks: [],
        spread: '0.00000123',
        spreadPercentage: '0.12',
        timestamp: Date.now(),
        baseAsset,
        quoteAsset,
      };
      
      // Generate mock bids
      const basePrice = 0.00001234;
      let totalBids = 0;
      
      for (let i = 0; i < orderbookDepth; i++) {
        const price = (basePrice - (i * 0.00000001)).toFixed(8);
        const amount = (Math.random() * 10 + 1).toFixed(4);
        const total = (parseFloat(price) * parseFloat(amount)).toFixed(8);
        totalBids += parseFloat(total);
        
        mockOrderbook.bids.push({
          price,
          amount,
          total: totalBids.toFixed(8),
          count: Math.floor(Math.random() * 5) + 1,
        });
      }
      
      // Generate mock asks
      const baseAskPrice = 0.00001357;
      let totalAsks = 0;
      
      for (let i = 0; i < orderbookDepth; i++) {
        const price = (baseAskPrice + (i * 0.00000001)).toFixed(8);
        const amount = (Math.random() * 10 + 1).toFixed(4);
        const total = (parseFloat(price) * parseFloat(amount)).toFixed(8);
        totalAsks += parseFloat(total);
        
        mockOrderbook.asks.push({
          price,
          amount,
          total: totalAsks.toFixed(8),
          count: Math.floor(Math.random() * 5) + 1,
        });
      }
      
      setOrderbook(mockOrderbook);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch orderbook: ${errorMessage}`);
      addNotification('error', `Failed to fetch orderbook: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle depth change
  const handleDepthChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setOrderbookDepth(event.target.value as number);
  };
  
  // Format price with color based on change
  const formatPriceWithColor = (price: string, change: string) => {
    const color = parseFloat(change) >= 0 ? 'success.main' : 'error.main';
    return <Typography color={color}>{price}</Typography>;
  };
  
  // Format percentage with color and icon
  const formatPercentageWithColor = (percentage: string) => {
    const isPositive = parseFloat(percentage) >= 0;
    const color = isPositive ? 'success.main' : 'error.main';
    const icon = isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color }}>
        {icon}
        <Typography variant="body2" sx={{ ml: 0.5 }}>
          {isPositive ? '+' : ''}{percentage}%
        </Typography>
      </Box>
    );
  };
  
  // Get selected pair info
  const getSelectedPairInfo = () => {
    if (!selectedPair) return null;
    
    const [baseAsset, quoteAsset] = selectedPair.split('/');
    return assetPairs.find(pair => pair.baseAsset === baseAsset && pair.quoteAsset === quoteAsset);
  };
  
  // Render asset pair selector
  const renderAssetPairSelector = () => {
    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel id="asset-pair-label">Asset Pair</InputLabel>
              <Select
                labelId="asset-pair-label"
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value as string)}
                label="Asset Pair"
              >
                {assetPairs.map((pair) => (
                  <MenuItem key={`${pair.baseAsset}/${pair.quoteAsset}`} value={`${pair.baseAsset}/${pair.quoteAsset}`}>
                    {pair.baseAssetSymbol}/{pair.quoteAssetSymbol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel id="depth-label">Depth</InputLabel>
              <Select
                labelId="depth-label"
                value={orderbookDepth}
                onChange={handleDepthChange}
                label="Depth"
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOrderbook}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render asset pair info
  const renderAssetPairInfo = () => {
    const pairInfo = getSelectedPairInfo();
    
    if (!pairInfo) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, backgroundColor: isDarkMode ? '#1e1e2f' : '#ffffff' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">
                {pairInfo.baseAssetSymbol}/{pairInfo.quoteAssetSymbol}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {pairInfo.baseAssetName}/{pairInfo.quoteAssetName}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Typography variant="h6">
                {formatPriceWithColor(pairInfo.lastPrice, pairInfo.priceChange24h)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                  24h Change:
                </Typography>
                {formatPercentageWithColor(pairInfo.priceChangePercentage24h)}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                24h Volume:
              </Typography>
              <Typography>
                {pairInfo.volume24h} {pairInfo.quoteAssetSymbol}
              </Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                24h Change:
              </Typography>
              <Typography>
                {pairInfo.priceChange24h} {pairInfo.quoteAssetSymbol}
              </Typography>
            </Grid>
            
            {orderbook && (
              <>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Spread:
                  </Typography>
                  <Typography>
                    {orderbook.spread} {pairInfo.quoteAssetSymbol}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Spread %:
                  </Typography>
                  <Typography>
                    {orderbook.spreadPercentage}%
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </Paper>
      </Box>
    );
  };
  
  // Render orderbook
  const renderOrderbook = () => {
    if (!orderbook) return null;
    
    const pairInfo = getSelectedPairInfo();
    if (!pairInfo) return null;
    
    return (
      <Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="orderbook tabs"
            textColor="primary"
            indicatorColor="primary"
            variant="fullWidth"
          >
            <Tab label="Order Book" id="orderbook-tab-0" aria-controls="orderbook-tabpanel-0" />
            <Tab label="Bids" id="orderbook-tab-1" aria-controls="orderbook-tabpanel-1" />
            <Tab label="Asks" id="orderbook-tab-2" aria-controls="orderbook-tabpanel-2" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'success.main' }}>
                Bids
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Price ({pairInfo.quoteAssetSymbol})</TableCell>
                      <TableCell align="right">Amount ({pairInfo.baseAssetSymbol})</TableCell>
                      <TableCell align="right">Total ({pairInfo.quoteAssetSymbol})</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderbook.bids.map((bid, index) => (
                      <TableRow key={index} hover>
                        <TableCell sx={{ color: 'success.main' }}>{bid.price}</TableCell>
                        <TableCell align="right">{bid.amount}</TableCell>
                        <TableCell align="right">{bid.total}</TableCell>
                        <TableCell align="right">{bid.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'error.main' }}>
                Asks
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Price ({pairInfo.quoteAssetSymbol})</TableCell>
                      <TableCell align="right">Amount ({pairInfo.baseAssetSymbol})</TableCell>
                      <TableCell align="right">Total ({pairInfo.quoteAssetSymbol})</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderbook.asks.map((ask, index) => (
                      <TableRow key={index} hover>
                        <TableCell sx={{ color: 'error.main' }}>{ask.price}</TableCell>
                        <TableCell align="right">{ask.amount}</TableCell>
                        <TableCell align="right">{ask.total}</TableCell>
                        <TableCell align="right">{ask.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: 'success.main' }}>
            Bids
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Price ({pairInfo.quoteAssetSymbol})</TableCell>
                  <TableCell align="right">Amount ({pairInfo.baseAssetSymbol})</TableCell>
                  <TableCell align="right">Total ({pairInfo.quoteAssetSymbol})</TableCell>
                  <TableCell align="right">Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderbook.bids.map((bid, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={{ color: 'success.main' }}>{bid.price}</TableCell>
                    <TableCell align="right">{bid.amount}</TableCell>
                    <TableCell align="right">{bid.total}</TableCell>
                    <TableCell align="right">{bid.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: 'error.main' }}>
            Asks
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Price ({pairInfo.quoteAssetSymbol})</TableCell>
                  <TableCell align="right">Amount ({pairInfo.baseAssetSymbol})</TableCell>
                  <TableCell align="right">Total ({pairInfo.quoteAssetSymbol})</TableCell>
                  <TableCell align="right">Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderbook.asks.map((ask, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={{ color: 'error.main' }}>{ask.price}</TableCell>
                    <TableCell align="right">{ask.amount}</TableCell>
                    <TableCell align="right">{ask.total}</TableCell>
                    <TableCell align="right">{ask.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Box>
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
        Orderbook
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        View the orderbook for different asset pairs. The orderbook shows the current buy and sell orders for a specific asset pair.
      </Typography>
      
      {renderAssetPairSelector()}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
          {renderAssetPairInfo()}
          {renderOrderbook()}
        </>
      )}
    </Paper>
  );
};

export default OrderbookViewer;