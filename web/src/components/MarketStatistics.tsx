import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Grid, Divider, CircularProgress, Alert, Card, CardContent, CardHeader, Tabs, Tab } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import RefreshIcon from '@mui/icons-material/Refresh';

// Define market data types
interface MarketData {
  baseAsset: string;
  baseAssetName: string;
  baseAssetSymbol: string;
  quoteAsset: string;
  quoteAssetName: string;
  quoteAssetSymbol: string;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  priceChange24h: string;
  priceChangePercentage24h: string;
  marketCap: string;
  totalSupply: string;
  circulatingSupply: string;
  allTimeHigh: string;
  allTimeHighDate: number;
  allTimeLow: string;
  allTimeLowDate: number;
}

interface AssetPair {
  baseAsset: string;
  baseAssetName: string;
  baseAssetSymbol: string;
  quoteAsset: string;
  quoteAssetName: string;
  quoteAssetSymbol: string;
}

interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
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
      id={`market-tabpanel-${index}`}
      aria-labelledby={`market-tab-${index}`}
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
 * Market Statistics Component
 * 
 * This component displays market statistics and price charts for different asset pairs.
 */
const MarketStatistics: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { client } = useApi();
  const { addNotification } = useNotification();
  
  // State for market data
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [assetPairs, setAssetPairs] = useState<AssetPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  
  // Fetch asset pairs on component mount
  useEffect(() => {
    fetchAssetPairs();
  }, []);
  
  // Fetch market data when selected pair changes
  useEffect(() => {
    if (selectedPair) {
      fetchMarketData();
      fetchPriceHistory();
    }
  }, [selectedPair, timeRange]);
  
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
        },
        {
          baseAsset: 'alkane-1',
          baseAssetName: 'Alkane One',
          baseAssetSymbol: 'ALK1',
          quoteAsset: 'btc',
          quoteAssetName: 'Bitcoin',
          quoteAssetSymbol: 'BTC',
        },
        {
          baseAsset: 'rune-2',
          baseAssetName: 'Rune Two',
          baseAssetSymbol: 'RUNE2',
          quoteAsset: 'btc',
          quoteAssetName: 'Bitcoin',
          quoteAssetSymbol: 'BTC',
        },
        {
          baseAsset: 'alkane-2',
          baseAssetName: 'Alkane Two',
          baseAssetSymbol: 'ALK2',
          quoteAsset: 'btc',
          quoteAssetName: 'Bitcoin',
          quoteAssetSymbol: 'BTC',
        },
        {
          baseAsset: 'rune-1',
          baseAssetName: 'Rune One',
          baseAssetSymbol: 'RUNE1',
          quoteAsset: 'alkane-1',
          quoteAssetName: 'Alkane One',
          quoteAssetSymbol: 'ALK1',
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
  
  // Fetch market data from the API
  const fetchMarketData = async () => {
    if (!selectedPair) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse selected pair
      const [baseAsset, quoteAsset] = selectedPair.split('/');
      
      // Find pair info
      const pairInfo = assetPairs.find(pair => 
        pair.baseAsset === baseAsset && pair.quoteAsset === quoteAsset
      );
      
      if (!pairInfo) {
        throw new Error('Invalid asset pair');
      }
      
      // In a real implementation, this would fetch from the API
      // For now, we'll generate mock data
      const mockMarketData: MarketData = {
        baseAsset,
        baseAssetName: pairInfo.baseAssetName,
        baseAssetSymbol: pairInfo.baseAssetSymbol,
        quoteAsset,
        quoteAssetName: pairInfo.quoteAssetName,
        quoteAssetSymbol: pairInfo.quoteAssetSymbol,
        lastPrice: '0.00001234',
        bidPrice: '0.00001233',
        askPrice: '0.00001235',
        high24h: '0.00001300',
        low24h: '0.00001200',
        volume24h: '123.45678901',
        priceChange24h: '0.00000123',
        priceChangePercentage24h: '11.08',
        marketCap: '1234567.89',
        totalSupply: '10000000',
        circulatingSupply: '8000000',
        allTimeHigh: '0.00001500',
        allTimeHighDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        allTimeLow: '0.00000800',
        allTimeLowDate: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
      };
      
      setMarketData(mockMarketData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch market data: ${errorMessage}`);
      addNotification('error', `Failed to fetch market data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch price history from the API
  const fetchPriceHistory = async () => {
    if (!selectedPair) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse selected pair
      const [baseAsset, quoteAsset] = selectedPair.split('/');
      
      // Calculate time range
      const now = Date.now();
      let startTime = now;
      let interval = 3600000; // 1 hour in milliseconds
      
      switch (timeRange) {
        case '1h':
          startTime = now - 60 * 60 * 1000; // 1 hour ago
          interval = 60000; // 1 minute
          break;
        case '24h':
          startTime = now - 24 * 60 * 60 * 1000; // 24 hours ago
          interval = 3600000; // 1 hour
          break;
        case '7d':
          startTime = now - 7 * 24 * 60 * 60 * 1000; // 7 days ago
          interval = 6 * 3600000; // 6 hours
          break;
        case '30d':
          startTime = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
          interval = 24 * 3600000; // 1 day
          break;
        case '90d':
          startTime = now - 90 * 24 * 60 * 60 * 1000; // 90 days ago
          interval = 3 * 24 * 3600000; // 3 days
          break;
        case '1y':
          startTime = now - 365 * 24 * 60 * 60 * 1000; // 1 year ago
          interval = 7 * 24 * 3600000; // 1 week
          break;
        case 'all':
          startTime = now - 2 * 365 * 24 * 60 * 60 * 1000; // 2 years ago
          interval = 30 * 24 * 3600000; // 1 month
          break;
      }
      
      // Generate mock price history
      const mockPriceHistory: PricePoint[] = [];
      let currentTime = startTime;
      let basePrice = 0.00001234;
      let baseVolume = 100;
      
      while (currentTime <= now) {
        // Generate random price movement
        const priceChange = (Math.random() - 0.5) * 0.00000010;
        basePrice += priceChange;
        
        // Generate random volume
        const volumeChange = (Math.random() - 0.5) * 20;
        baseVolume += volumeChange;
        
        mockPriceHistory.push({
          timestamp: currentTime,
          price: basePrice,
          volume: baseVolume,
        });
        
        currentTime += interval;
      }
      
      setPriceHistory(mockPriceHistory);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch price history: ${errorMessage}`);
      addNotification('error', `Failed to fetch price history: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeRange(event.target.value as string);
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
  
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
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
              <InputLabel id="time-range-label">Time Range</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                onChange={handleTimeRangeChange}
                label="Time Range"
              >
                <MenuItem value="1h">1 Hour</MenuItem>
                <MenuItem value="24h">24 Hours</MenuItem>
                <MenuItem value="7d">7 Days</MenuItem>
                <MenuItem value="30d">30 Days</MenuItem>
                <MenuItem value="90d">90 Days</MenuItem>
                <MenuItem value="1y">1 Year</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                Last updated:
              </Typography>
              <Typography variant="body2">
                {new Date().toLocaleTimeString()}
              </Typography>
              <Box 
                component="button" 
                sx={{ 
                  ml: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'primary.main',
                  '&:hover': {
                    color: 'primary.dark',
                  }
                }}
                onClick={() => {
                  fetchMarketData();
                  fetchPriceHistory();
                }}
              >
                <RefreshIcon fontSize="small" />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render market overview
  const renderMarketOverview = () => {
    if (!marketData) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, backgroundColor: isDarkMode ? '#1e1e2f' : '#ffffff' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">
                {marketData.baseAssetSymbol}/{marketData.quoteAssetSymbol}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {marketData.baseAssetName}/{marketData.quoteAssetName}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Typography variant="h6">
                {formatPriceWithColor(marketData.lastPrice, marketData.priceChange24h)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                  24h Change:
                </Typography>
                {formatPercentageWithColor(marketData.priceChangePercentage24h)}
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
                {marketData.volume24h} {marketData.quoteAssetSymbol}
              </Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                24h High:
              </Typography>
              <Typography>
                {marketData.high24h} {marketData.quoteAssetSymbol}
              </Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                24h Low:
              </Typography>
              <Typography>
                {marketData.low24h} {marketData.quoteAssetSymbol}
              </Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="textSecondary">
                Market Cap:
              </Typography>
              <Typography>
                {marketData.marketCap} {marketData.quoteAssetSymbol}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };
  
  // Render price chart
  const renderPriceChart = () => {
    if (priceHistory.length === 0) return null;
    
    // In a real implementation, this would render a chart using a library like recharts
    // For now, we'll just show a placeholder
    return (
      <Box sx={{ mb: 3, height: 400, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          Price Chart Placeholder
        </Typography>
      </Box>
    );
  };
  
  // Render market statistics
  const renderMarketStatistics = () => {
    if (!marketData) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: isDarkMode ? '#1e1e2f' : '#ffffff' }}>
              <CardHeader title="Price Statistics" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Last Price:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {marketData.lastPrice} {marketData.quoteAssetSymbol}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      24h Change:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {formatPercentageWithColor(marketData.priceChangePercentage24h)}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      24h High:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {marketData.high24h} {marketData.quoteAssetSymbol}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      24h Low:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {marketData.low24h} {marketData.quoteAssetSymbol}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      All-Time High:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {marketData.allTimeHigh} {marketData.quoteAssetSymbol}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      All-Time High Date:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {formatDate(marketData.allTimeHighDate)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      All-Time Low:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {marketData.allTimeLow} {marketData.quoteAssetSymbol}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      All-Time Low Date:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {formatDate(marketData.allTimeLowDate)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: isDarkMode ? '#1e1e2f' : '#ffffff' }}>
              <CardHeader title="Supply Information" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Market Cap:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {marketData.marketCap} {marketData.quoteAssetSymbol}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Total Supply:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {marketData.totalSupply} {marketData.baseAssetSymbol}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Circulating Supply:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {marketData.circulatingSupply} {marketData.baseAssetSymbol}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Supply Ratio:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {(parseFloat(marketData.circulatingSupply) / parseFloat(marketData.totalSupply) * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      24h Volume:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {marketData.volume24h} {marketData.quoteAssetSymbol}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Volume/Market Cap:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      {(parseFloat(marketData.volume24h) / parseFloat(marketData.marketCap) * 100).toFixed(2)}%
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
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
        Market Statistics
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        View market statistics and price charts for different asset pairs. This component shows detailed market data, price history, and supply information.
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
          {renderMarketOverview()}
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="market tabs"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab 
                label="Price Chart" 
                id="market-tab-0" 
                aria-controls="market-tabpanel-0" 
                icon={<ShowChartIcon />} 
                iconPosition="start" 
              />
              <Tab 
                label="Market Statistics" 
                id="market-tab-1" 
                aria-controls="market-tabpanel-1" 
                icon={<BarChartIcon />} 
                iconPosition="start" 
              />
              <Tab 
                label="Price History" 
                id="market-tab-2" 
                aria-controls="market-tabpanel-2" 
                icon={<TimelineIcon />} 
                iconPosition="start" 
              />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {renderPriceChart()}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {renderMarketStatistics()}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3, height: 400, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                Price History Table Placeholder
              </Typography>
            </Box>
          </TabPanel>
        </>
      )}
    </Paper>
  );
};

export default MarketStatistics;