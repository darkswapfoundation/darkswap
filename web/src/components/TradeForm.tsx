import React, { useState } from 'react';
import { useCreateTradeOffer, useBitcoinBalance, useRuneBalance, useAlkaneBalance } from '../hooks/useTradeHooks';

interface TradeFormProps {
  onSuccess?: (offerId: string) => void;
  onError?: (error: Error) => void;
}

export const TradeForm: React.FC<TradeFormProps> = ({ onSuccess, onError }) => {
  // Asset types
  const [makerAssetType, setMakerAssetType] = useState<'bitcoin' | 'rune' | 'alkane'>('bitcoin');
  const [takerAssetType, setTakerAssetType] = useState<'bitcoin' | 'rune' | 'alkane'>('rune');
  
  // Asset IDs (for runes and alkanes)
  const [makerAssetId, setMakerAssetId] = useState('');
  const [takerAssetId, setTakerAssetId] = useState('');
  
  // Amounts
  const [makerAmount, setMakerAmount] = useState('');
  const [takerAmount, setTakerAmount] = useState('');
  
  // Expiration
  const [expiration, setExpiration] = useState('3600'); // 1 hour by default
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Get balances
  const { balance: bitcoinBalance } = useBitcoinBalance();
  const runeBalance = makerAssetType === 'rune' ? useRuneBalance(makerAssetId).balance : 0;
  const alkaneBalance = makerAssetType === 'alkane' ? useAlkaneBalance(makerAssetId).balance : 0;
  
  // Get the create trade offer function
  const { create } = useCreateTradeOffer();
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!makerAmount || !takerAmount) {
      setError('Please enter both maker and taker amounts');
      return;
    }
    
    if (makerAssetType === 'rune' && !makerAssetId) {
      setError('Please enter a rune ID for the maker asset');
      return;
    }
    
    if (makerAssetType === 'alkane' && !makerAssetId) {
      setError('Please enter an alkane ID for the maker asset');
      return;
    }
    
    if (takerAssetType === 'rune' && !takerAssetId) {
      setError('Please enter a rune ID for the taker asset');
      return;
    }
    
    if (takerAssetType === 'alkane' && !takerAssetId) {
      setError('Please enter an alkane ID for the taker asset');
      return;
    }
    
    // Check balance
    const makerAmountNumber = Number(makerAmount);
    let hasEnoughBalance = false;
    
    switch (makerAssetType) {
      case 'bitcoin':
        hasEnoughBalance = bitcoinBalance >= makerAmountNumber;
        break;
      case 'rune':
        hasEnoughBalance = runeBalance >= makerAmountNumber;
        break;
      case 'alkane':
        hasEnoughBalance = alkaneBalance >= makerAmountNumber;
        break;
    }
    
    if (!hasEnoughBalance) {
      setError(`Insufficient ${makerAssetType} balance`);
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create maker asset
      let makerAsset: any = { type: makerAssetType };
      if (makerAssetType === 'rune' || makerAssetType === 'alkane') {
        makerAsset.id = makerAssetId;
      }
      
      // Create taker asset
      let takerAsset: any = { type: takerAssetType };
      if (takerAssetType === 'rune' || takerAssetType === 'alkane') {
        takerAsset.id = takerAssetId;
      }
      
      // Create trade offer
      const offerId = await create(
        makerAsset,
        makerAmountNumber,
        takerAsset,
        Number(takerAmount)
      );
      
      // Reset form
      setMakerAssetType('bitcoin');
      setTakerAssetType('rune');
      setMakerAssetId('');
      setTakerAssetId('');
      setMakerAmount('');
      setTakerAmount('');
      setExpiration('3600');
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess(offerId);
      }
    } catch (err) {
      console.error('Failed to create trade offer:', err);
      setError(err instanceof Error ? err.message : String(err));
      
      // Call onError callback
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="trade-form">
      <h2>Create Trade Offer</h2>
      {error && (
        <div className="error">{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="maker-asset-type">You Send:</label>
          <select
            id="maker-asset-type"
            value={makerAssetType}
            onChange={(e) => setMakerAssetType(e.target.value as 'bitcoin' | 'rune' | 'alkane')}
            disabled={isSubmitting}
          >
            <option value="bitcoin">Bitcoin</option>
            <option value="rune">Rune</option>
            <option value="alkane">Alkane</option>
          </select>
          {makerAssetType === 'rune' && (
            <input
              type="text"
              placeholder="Rune ID"
              value={makerAssetId}
              onChange={(e) => setMakerAssetId(e.target.value)}
              disabled={isSubmitting}
            />
          )}
          {makerAssetType === 'alkane' && (
            <input
              type="text"
              placeholder="Alkane ID"
              value={makerAssetId}
              onChange={(e) => setMakerAssetId(e.target.value)}
              disabled={isSubmitting}
            />
          )}
          <input
            type="number"
            placeholder="Amount"
            value={makerAmount}
            onChange={(e) => setMakerAmount(e.target.value)}
            disabled={isSubmitting}
            min="0"
            step="0.00000001"
          />
          <div className="balance">
            Balance: {makerAssetType === 'bitcoin' ? bitcoinBalance : makerAssetType === 'rune' ? runeBalance : alkaneBalance}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="taker-asset-type">You Receive:</label>
          <select
            id="taker-asset-type"
            value={takerAssetType}
            onChange={(e) => setTakerAssetType(e.target.value as 'bitcoin' | 'rune' | 'alkane')}
            disabled={isSubmitting}
          >
            <option value="bitcoin">Bitcoin</option>
            <option value="rune">Rune</option>
            <option value="alkane">Alkane</option>
          </select>
          {takerAssetType === 'rune' && (
            <input
              type="text"
              placeholder="Rune ID"
              value={takerAssetId}
              onChange={(e) => setTakerAssetId(e.target.value)}
              disabled={isSubmitting}
            />
          )}
          {takerAssetType === 'alkane' && (
            <input
              type="text"
              placeholder="Alkane ID"
              value={takerAssetId}
              onChange={(e) => setTakerAssetId(e.target.value)}
              disabled={isSubmitting}
            />
          )}
          <input
            type="number"
            placeholder="Amount"
            value={takerAmount}
            onChange={(e) => setTakerAmount(e.target.value)}
            disabled={isSubmitting}
            min="0"
            step="0.00000001"
          />
        </div>
        <div className="form-group">
          <label htmlFor="expiration">Expiration (seconds):</label>
          <input
            id="expiration"
            type="number"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            disabled={isSubmitting}
            min="60"
            step="60"
          />
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Offer...' : 'Create Offer'}
        </button>
      </form>
    </div>
  );
};