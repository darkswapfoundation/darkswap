import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Container, Grid, Divider } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import P2PNetworkVisualization from '../components/P2PNetworkVisualization';
import WebRtcConnectionManager from '../components/WebRtcConnectionManager';
import AlkaneTransactionVisualizer from '../components/AlkaneTransactionVisualizer';
import RuneTransactionVisualizer from '../components/RuneTransactionVisualizer';
import TradeOfferManager from '../components/TradeOfferManager';
import OrderbookViewer from '../components/OrderbookViewer';
import MarketStatistics from '../components/MarketStatistics';
import NotificationManager from '../components/NotificationManager';
import SettingsManager from '../components/SettingsManager';
import WalletManager from '../components/WalletManager';
import PredicateAlkanesCreator from '../components/PredicateAlkanesCreator';

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
      id={`advanced-tabpanel-${index}`}
      aria-labelledby={`advanced-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

/**
 * Advanced Page
 * 
 * This page contains advanced features of the DarkSwap platform, including:
 * - P2P Network Visualization
 * - Predicate Alkanes Creator
 */
const Advanced: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          backgroundColor: isDarkMode ? '#1e1e2f' : '#ffffff',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Advanced Features
        </Typography>
        
        <Typography variant="body1" paragraph>
          This page provides access to advanced features of the DarkSwap platform, including P2P network visualization and predicate alkanes creation.
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="advanced features tabs"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            indicatorColor="primary"
          >
            <Tab label="P2P Network" id="advanced-tab-0" aria-controls="advanced-tabpanel-0" />
            <Tab label="WebRTC Connections" id="advanced-tab-1" aria-controls="advanced-tabpanel-1" />
            <Tab label="Predicate Alkanes" id="advanced-tab-2" aria-controls="advanced-tabpanel-2" />
            <Tab label="Alkane Transactions" id="advanced-tab-3" aria-controls="advanced-tabpanel-3" />
            <Tab label="Rune Transactions" id="advanced-tab-4" aria-controls="advanced-tabpanel-4" />
            <Tab label="Trade Offers" id="advanced-tab-5" aria-controls="advanced-tabpanel-5" />
            <Tab label="Orderbook" id="advanced-tab-6" aria-controls="advanced-tabpanel-6" />
            <Tab label="Market Statistics" id="advanced-tab-7" aria-controls="advanced-tabpanel-7" />
            <Tab label="Notifications" id="advanced-tab-8" aria-controls="advanced-tabpanel-8" />
            <Tab label="Settings" id="advanced-tab-9" aria-controls="advanced-tabpanel-9" />
            <Tab label="Wallet" id="advanced-tab-10" aria-controls="advanced-tabpanel-10" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              P2P Network Visualization
            </Typography>
            
            <Typography variant="body1" paragraph>
              This visualization shows your position in the DarkSwap P2P network, including direct peer connections and relay servers.
            </Typography>
          </Box>
          
          <P2PNetworkVisualization />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Alkane Transaction Visualizer
            </Typography>
            
            <Typography variant="body1" paragraph>
              View and manage alkane transactions on the Bitcoin network. This component shows transactions for alkanes, including their status, amount, and predicate information.
            </Typography>
          </Box>
          
          <AlkaneTransactionVisualizer />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Rune Transaction Visualizer
            </Typography>
            
            <Typography variant="body1" paragraph>
              View and manage rune transactions on the Bitcoin network. This component shows transactions for runes, including their status, amount, and inscription information.
            </Typography>
          </Box>
          
          <RuneTransactionVisualizer />
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Trade Offer Manager
            </Typography>
            
            <Typography variant="body1" paragraph>
              Create and manage trade offers for runes and alkanes. Trade offers allow you to exchange assets with other users on the DarkSwap network.
            </Typography>
          </Box>
          
          <TradeOfferManager />
        </TabPanel>
        
        <TabPanel value={tabValue} index={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Orderbook Viewer
            </Typography>
            
            <Typography variant="body1" paragraph>
              View the orderbook for different asset pairs. The orderbook shows the current buy and sell orders for a specific asset pair.
            </Typography>
          </Box>
          
          <OrderbookViewer />
        </TabPanel>
        
        <TabPanel value={tabValue} index={7}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Market Statistics
            </Typography>
            
            <Typography variant="body1" paragraph>
              View market statistics and price charts for different asset pairs. This component shows detailed market data, price history, and supply information.
            </Typography>
          </Box>
          
          <MarketStatistics />
        </TabPanel>
        
        <TabPanel value={tabValue} index={8}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Notification Manager
            </Typography>
            
            <Typography variant="body1" paragraph>
              View and manage notifications for the application. This component shows notifications for system events, trades, wallet activities, and P2P network events.
            </Typography>
          </Box>
          
          <NotificationManager />
        </TabPanel>
        
        <TabPanel value={tabValue} index={9}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Settings Manager
            </Typography>
            
            <Typography variant="body1" paragraph>
              Configure various aspects of the application, including general settings, network settings, wallet settings, and notification settings.
            </Typography>
          </Box>
          
          <SettingsManager />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              WebRTC Connection Manager
            </Typography>
            
            <Typography variant="body1" paragraph>
              Manage your WebRTC connections with other peers. WebRTC enables direct browser-to-browser connections for faster and more secure communication.
            </Typography>
          </Box>
          
          <WebRtcConnectionManager />
        </TabPanel>
        
        <TabPanel value={tabValue} index={10}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Wallet Manager
            </Typography>
            
            <Typography variant="body1" paragraph>
              View and manage your wallet, including sending and receiving transactions, viewing your balance, and transaction history.
            </Typography>
          </Box>
          
          <WalletManager />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Predicate Alkanes Creator
            </Typography>
            
            <Typography variant="body1" paragraph>
              Create predicate alkanes for conditional trading. Predicate alkanes allow you to create orders that execute only when specific conditions are met.
            </Typography>
          </Box>
          
          <PredicateAlkanesCreator />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Advanced;