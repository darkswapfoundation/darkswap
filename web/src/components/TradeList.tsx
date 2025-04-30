import React, { useState } from 'react';
import { useTradeOffers, TradeOffer, AssetType } from '../hooks/useDarkSwap';
import { useAcceptTradeOffer } from '../hooks/useTradeHooks';

interface TradeListProps {
  onAcceptSuccess?: (offerId: string) => void;
  onAcceptError?: (error: Error) => void;
}

export const TradeList: React.FC<TradeListProps> = ({ onAcceptSuccess, onAcceptError }) => {
  // Get trade offers
  const { tradeOffers, isLoading: isLoadingOffers } = useTradeOffers();
  
  // Get the accept trade offer function
  const { accept } = useAcceptTradeOffer();
  
  // Loading state
  const [loadingOffers, setLoadingOffers] = useState<Record<string, boolean>>({});
  
  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Handle accepting a trade offer
  const handleAcceptOffer = async (offerId: string) => {
    // Set loading state
    setLoadingOffers(prev => ({ ...prev, [offerId]: true }));
    
    // Clear error
    setErrors(prev => ({ ...prev, [offerId]: '' }));
    
    try {
      // Accept the offer
      await accept(offerId);
      
      // Call onAcceptSuccess callback
      if (onAcceptSuccess) {
        onAcceptSuccess(offerId);
      }
    } catch (err) {
      console.error(`Failed to accept trade offer ${offerId}:`, err);
      
      // Set error
      setErrors(prev => ({ ...prev, [offerId]: err instanceof Error ? err.message : String(err) }));
      
      // Call onAcceptError callback
      if (onAcceptError && err instanceof Error) {
        onAcceptError(err);
      }
    } finally {
      // Clear loading state
      setLoadingOffers(prev => ({ ...prev, [offerId]: false }));
    }
  };
  
  // Format asset type
  const formatAssetType = (assetType: AssetType): string => {
    switch (assetType.type) {
      case 'bitcoin':
        return 'BTC';
      case 'rune':
        return `RUNE (${assetType.id})`;
      case 'alkane':
        return `ALKANE (${assetType.id})`;
    }
  };
  
  // Format amount
  const formatAmount = (amount: number, assetType: AssetType): string => {
    switch (assetType.type) {
      case 'bitcoin':
        // Convert satoshis to BTC
        return `${(amount / 100000000).toFixed(8)} BTC`;
      case 'rune':
        return `${amount} RUNE`;
      case 'alkane':
        return `${amount} ALKANE`;
    }
  };
  
  // Format expiration
  const formatExpiration = (expiration: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiration - now;
    
    if (remaining <= 0) {
      return 'Expired';
    }
    
    if (remaining < 60) {
      return `${remaining}s`;
    }
    
    if (remaining < 3600) {
      return `${Math.floor(remaining / 60)}m ${remaining % 60}s`;
    }
    
    if (remaining < 86400) {
      return `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m`;
    }
    
    return `${Math.floor(remaining / 86400)}d ${Math.floor((remaining % 86400) / 3600)}h`;
  };
  
  // Check if an offer is expired
  const isExpired = (offer: TradeOffer): boolean => {
    const now = Math.floor(Date.now() / 1000);
    return offer.expiry <= now;
  };
  
  return (
    <div className="trade-list">
      <h2>Trade Offers</h2>
      {tradeOffers.length === 0 ? (
        <p>No trade offers available</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Maker</th>
              <th>You Send</th>
              <th>You Receive</th>
              <th>Expiration</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tradeOffers.map(offer => (
              <tr key={offer.id} className={isExpired(offer) ? 'expired' : ''}>
                <td>{offer.maker.substring(0, 8)}...</td>
                <td>{formatAmount(offer.takerAmount, offer.takerAsset)}</td>
                <td>{formatAmount(offer.makerAmount, offer.makerAsset)}</td>
                <td>{formatExpiration(offer.expiry)}</td>
                <td>
                  {errors[offer.id] && (
                    <div className="error">{errors[offer.id]}</div>
                  )}
                  <button
                    onClick={() => handleAcceptOffer(offer.id)}
                    disabled={loadingOffers[offer.id] || isExpired(offer)}
                  >
                    {loadingOffers[offer.id] ? 'Accepting...' : 'Accept'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};