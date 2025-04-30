import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Divider, Chip, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormHelperText, Switch, FormControlLabel } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

// Define trade offer types
interface TradeOffer {
  id: string;
  createdAt: number;
  expiresAt: number | null;
  status: 'open' | 'filled' | 'canceled' | 'expired';
  offerType: 'buy' | 'sell';
  offerAssetType: 'rune' | 'alkane';
  offerAssetId: string;
  offerAssetName: string;
  offerAssetSymbol: string;
  offerAmount: string;
  wantAssetType: 'rune' | 'alkane' | 'btc';
  wantAssetId: string | null;
  wantAssetName: string | null;
  wantAssetSymbol: string | null;
  wantAmount: string;
  price: string;
}

interface AssetOption {
  id: string;
  name: string;
  symbol: string;
  type: 'rune' | 'alkane' | 'btc';
}

/**
 * Trade Offer Manager Component
 * 
 * This component allows users to create and manage trade offers for runes and alkanes.
 */
const TradeOfferManager: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { client } = useApi();
  const { addNotification } = useNotification();
  
  // State for trade offers
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // State for create dialog
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [offerType, setOfferType] = useState<'buy' | 'sell'>('sell');
  const [offerAsset, setOfferAsset] = useState<string>('');
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [wantAsset, setWantAsset] = useState<string>('');
  const [wantAmount, setWantAmount] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [dialogError, setDialogError] = useState<string | null>(null);
  
  // State for asset options
  const [assetOptions, setAssetOptions] = useState<AssetOption[]>([
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', type: 'btc' },
    { id: 'rune-1', name: 'Rune One', symbol: 'RUNE1', type: 'rune' },
    { id: 'rune-2', name: 'Rune Two', symbol: 'RUNE2', type: 'rune' },
    { id: 'alkane-1', name: 'Alkane One', symbol: 'ALK1', type: 'alkane' },
    { id: 'alkane-2', name: 'Alkane Two', symbol: 'ALK2', type: 'alkane' },
  ]);
  
  // Fetch offers on component mount and when filters change
  useEffect(() => {
    fetchOffers();
  }, [statusFilter, typeFilter]);
  
  // Fetch offers from the API
  const fetchOffers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use mock data
      const mockOffers: TradeOffer[] = [
        {
          id: '1',
          createdAt: Date.now() - 3600000,
          expiresAt: Date.now() + 86400000,
          status: 'open',
          offerType: 'sell',
          offerAssetType: 'rune',
          offerAssetId: 'rune-1',
          offerAssetName: 'Rune One',
          offerAssetSymbol: 'RUNE1',
          offerAmount: '100',
          wantAssetType: 'btc',
          wantAssetId: 'btc',
          wantAssetName: 'Bitcoin',
          wantAssetSymbol: 'BTC',
          wantAmount: '0.001',
          price: '0.00001',
        },
        {
          id: '2',
          createdAt: Date.now() - 7200000,
          expiresAt: Date.now() + 172800000,
          status: 'open',
          offerType: 'buy',
          offerAssetType: 'alkane',
          offerAssetId: 'alkane-1',
          offerAssetName: 'Alkane One',
          offerAssetSymbol: 'ALK1',
          offerAmount: '50',
          wantAssetType: 'rune',
          wantAssetId: 'rune-2',
          wantAssetName: 'Rune Two',
          wantAssetSymbol: 'RUNE2',
          wantAmount: '200',
          price: '4',
        },
      ];
      
      // Filter by status
      let filteredOffers = mockOffers;
      if (statusFilter !== 'all') {
        filteredOffers = filteredOffers.filter(offer => offer.status === statusFilter);
      }
      
      // Filter by type
      if (typeFilter !== 'all') {
        filteredOffers = filteredOffers.filter(offer => offer.offerType === typeFilter);
      }
      
      setOffers(filteredOffers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch offers: ${errorMessage}`);
      addNotification('error', `Failed to fetch offers: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle create offer button click
  const handleCreateOffer = () => {
    setOfferType('sell');
    setOfferAsset('');
    setOfferAmount('');
    setWantAsset('');
    setWantAmount('');
    setPrice('');
    setDialogError(null);
    setIsDialogOpen(true);
  };
  
  // Handle cancel offer button click
  const handleCancelOffer = async (offerId: string) => {
    try {
      // In a real implementation, this would call the API
      // For now, we'll just update the local state
      setOffers(offers.map(offer => 
        offer.id === offerId ? { ...offer, status: 'canceled' } : offer
      ));
      addNotification('success', 'Offer canceled successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addNotification('error', `Failed to cancel offer: ${errorMessage}`);
    }
  };
  
  // Handle dialog save button click
  const handleDialogSave = async () => {
    setDialogError(null);
    
    // Validate form
    if (!offerAsset) {
      setDialogError('Please select an offer asset');
      return;
    }
    
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      setDialogError('Please enter a valid offer amount');
      return;
    }
    
    if (!wantAsset) {
      setDialogError('Please select a want asset');
      return;
    }
    
    if (!wantAmount || parseFloat(wantAmount) <= 0) {
      setDialogError('Please enter a valid want amount');
      return;
    }
    
    if (offerAsset === wantAsset) {
      setDialogError('Offer asset and want asset cannot be the same');
      return;
    }
    
    try {
      // In a real implementation, this would call the API
      // For now, we'll just update the local state
      const offerAssetInfo = assetOptions.find(a => a.id === offerAsset);
      const wantAssetInfo = assetOptions.find(a => a.id === wantAsset);
      
      if (!offerAssetInfo || !wantAssetInfo) {
        setDialogError('Invalid asset selection');
        return;
      }
      
      const newOffer: TradeOffer = {
        id: Math.random().toString(36).substring(2, 11),
        createdAt: Date.now(),
        expiresAt: null,
        status: 'open',
        offerType,
        offerAssetType: offerAssetInfo.type as 'rune' | 'alkane',
        offerAssetId: offerAsset,
        offerAssetName: offerAssetInfo.name,
        offerAssetSymbol: offerAssetInfo.symbol,
        offerAmount,
        wantAssetType: wantAssetInfo.type,
        wantAssetId: wantAsset,
        wantAssetName: wantAssetInfo.name,
        wantAssetSymbol: wantAssetInfo.symbol,
        wantAmount,
        price,
      };
      
      setOffers([newOffer, ...offers]);
      setIsDialogOpen(false);
      addNotification('success', 'Offer created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setDialogError(`Failed to create offer: ${errorMessage}`);
    }
  };
  
  // Handle swap assets button click
  const handleSwapAssets = () => {
    const tempAsset = offerAsset;
    const tempAmount = offerAmount;
    
    setOfferAsset(wantAsset);
    setOfferAmount(wantAmount);
    setWantAsset(tempAsset);
    setWantAmount(tempAmount);
    setOfferType(offerType === 'buy' ? 'sell' : 'buy');
  };
  
  // Calculate price based on offer and want amounts
  const calculatePrice = () => {
    if (offerAmount && wantAmount && parseFloat(offerAmount) > 0) {
      const calculatedPrice = (parseFloat(wantAmount) / parseFloat(offerAmount)).toFixed(8);
      setPrice(calculatedPrice);
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Format expiry time
  const formatExpiry = (expiresAt: number | null) => {
    if (!expiresAt) return 'Never';
    
    const now = Date.now();
    if (expiresAt <= now) return 'Expired';
    
    const diff = expiresAt - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'filled':
        return 'primary';
      case 'canceled':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Render create dialog
  const renderDialog = () => {
    return (
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Trade Offer</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {dialogError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {dialogError}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="offer-type-label">Offer Type</InputLabel>
                  <Select
                    labelId="offer-type-label"
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value as 'buy' | 'sell')}
                    label="Offer Type"
                  >
                    <MenuItem value="sell">Sell</MenuItem>
                    <MenuItem value="buy">Buy</MenuItem>
                  </Select>
                  <FormHelperText>
                    {offerType === 'sell' ? 'You are selling an asset for another asset' : 'You are buying an asset with another asset'}
                  </FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth>
                  <InputLabel id="offer-asset-label">Offer Asset</InputLabel>
                  <Select
                    labelId="offer-asset-label"
                    value={offerAsset}
                    onChange={(e) => setOfferAsset(e.target.value)}
                    label="Offer Asset"
                  >
                    <MenuItem value="">Select Asset</MenuItem>
                    {assetOptions.map(asset => (
                      <MenuItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.symbol})
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {offerType === 'sell' ? 'Asset you are selling' : 'Asset you are paying with'}
                  </FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Offer Amount"
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  InputProps={{
                    inputProps: { min: 0, step: 'any' },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconButton onClick={handleSwapAssets} color="primary">
                  <SwapHorizIcon />
                </IconButton>
              </Grid>
              
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth>
                  <InputLabel id="want-asset-label">Want Asset</InputLabel>
                  <Select
                    labelId="want-asset-label"
                    value={wantAsset}
                    onChange={(e) => setWantAsset(e.target.value)}
                    label="Want Asset"
                  >
                    <MenuItem value="">Select Asset</MenuItem>
                    {assetOptions.map(asset => (
                      <MenuItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.symbol})
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {offerType === 'sell' ? 'Asset you want to receive' : 'Asset you want to buy'}
                  </FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Want Amount"
                  type="number"
                  value={wantAmount}
                  onChange={(e) => setWantAmount(e.target.value)}
                  InputProps={{
                    inputProps: { min: 0, step: 'any' },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={calculatePrice}
                >
                  Calculate
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  InputProps={{
                    inputProps: { min: 0, step: 'any' },
                  }}
                  helperText={`Price per ${offerAsset ? assetOptions.find(a => a.id === offerAsset)?.symbol || 'unit' : 'unit'} in ${wantAsset ? assetOptions.find(a => a.id === wantAsset)?.symbol || 'units' : 'units'}`}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDialogSave} variant="contained" color="primary">
            Create
          </Button>
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
      <Typography variant="h5" gutterBottom>
        Trade Offers
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Create and manage trade offers for runes and alkanes. Trade offers allow you to exchange assets with other users on the DarkSwap network.
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="filled">Filled</MenuItem>
                <MenuItem value="canceled">Canceled</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel id="type-filter-label">Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="buy">Buy</MenuItem>
                <MenuItem value="sell">Sell</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOffers}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>
          
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateOffer}
            >
              Create Offer
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
      ) : offers.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No trade offers found. Create a new offer to get started.
        </Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Offer</TableCell>
                <TableCell>Want</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id} hover>
                  <TableCell>
                    <Chip 
                      label={offer.offerType === 'sell' ? 'Sell' : 'Buy'} 
                      color={offer.offerType === 'sell' ? 'error' : 'success'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {offer.offerAmount} {offer.offerAssetSymbol}
                  </TableCell>
                  <TableCell>
                    {offer.wantAmount} {offer.wantAssetSymbol}
                  </TableCell>
                  <TableCell>
                    {offer.price} {offer.wantAssetSymbol}/{offer.offerAssetSymbol}
                  </TableCell>
                  <TableCell>
                    {formatTimestamp(offer.createdAt)}
                  </TableCell>
                  <TableCell>
                    {formatExpiry(offer.expiresAt)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={offer.status.charAt(0).toUpperCase() + offer.status.slice(1)} 
                      color={getStatusColor(offer.status) as 'success' | 'primary' | 'warning' | 'error' | 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      {offer.status === 'open' && (
                        <IconButton size="small" onClick={() => handleCancelOffer(offer.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {offer.status === 'open' && (
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
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
      
      {renderDialog()}
    </Paper>
  );
};

export default TradeOfferManager;
