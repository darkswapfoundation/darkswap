import React, { useState } from 'react';
import '../styles/Trade.css';
import { TradeForm } from '../components/TradeForm';
import { PeerStatus } from '../components/PeerStatus';
import { TradeList } from '../components/TradeList';
import { TradeHistory } from '../components/TradeHistory';
import { PriceChart } from '../components/PriceChart';
import { WalletBalance } from '../components/WalletBalance';

export const Trade: React.FC = () => {
  // State for notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // Handle trade offer creation success
  const handleTradeOfferSuccess = (offerId: string) => {
    setNotification({
      type: 'success',
      message: `Trade offer created successfully! Offer ID: ${offerId}`,
    });
    
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };
  
  // Handle trade offer creation error
  const handleTradeOfferError = (error: Error) => {
    setNotification({
      type: 'error',
      message: `Failed to create trade offer: ${error.message}`,
    });
    
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };
  
  // Handle trade offer acceptance success
  const handleAcceptSuccess = (offerId: string) => {
    setNotification({
      type: 'success',
      message: `Trade offer accepted successfully! Offer ID: ${offerId}`,
    });
    
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };
  
  // Handle trade offer acceptance error
  const handleAcceptError = (error: Error) => {
    setNotification({
      type: 'error',
      message: `Failed to accept trade offer: ${error.message}`,
    });
    
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };
  
  return (
    <div className="trade-page">
      <h1>Trade</h1>
      
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="trade-layout">
        <div className="trade-layout-left">
          <PeerStatus />
          
          <WalletBalance
            runeIds={['rune1', 'rune2']}
            alkaneIds={['alkane1', 'alkane2']}
          />
        </div>
        
        <div className="trade-layout-right">
          <PriceChart assetType="bitcoin" />
          
          <TradeForm
            onSuccess={handleTradeOfferSuccess}
            onError={handleTradeOfferError}
          />
          
          <TradeList
            onAcceptSuccess={handleAcceptSuccess}
            onAcceptError={handleAcceptError}
          />
          
          <TradeHistory />
        </div>
      </div>
      
      {/* Styles are in Trade.css */}
    </div>
  );
};