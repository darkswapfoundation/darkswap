import React from 'react';
import { useBitcoinBalance, useRuneBalance, useAlkaneBalance } from '../hooks/useTradeHooks';

interface WalletBalanceProps {
  runeIds?: string[];
  alkaneIds?: string[];
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ runeIds = [], alkaneIds = [] }) => {
  // Get Bitcoin balance
  const { balance: bitcoinBalance } = useBitcoinBalance();
  
  // Format Bitcoin balance
  const formattedBitcoinBalance = (bitcoinBalance / 100000000).toFixed(8);
  
  return (
    <div className="wallet-balance">
      <h2>Wallet Balance</h2>
      <div className="balance-item">
        <div className="balance-label">Bitcoin</div>
        <div className="balance-value">{formattedBitcoinBalance} BTC</div>
        <div className="balance-value-usd">${(bitcoinBalance / 100000000 * 65000).toFixed(2)}</div>
      </div>
      
      {runeIds.length > 0 && (
        <>
          <h3>Runes</h3>
          {runeIds.map(runeId => (
            <RuneBalanceItem key={runeId} runeId={runeId} />
          ))}
        </>
      )}
      
      {alkaneIds.length > 0 && (
        <>
          <h3>Alkanes</h3>
          {alkaneIds.map(alkaneId => (
            <AlkaneBalanceItem key={alkaneId} alkaneId={alkaneId} />
          ))}
        </>
      )}
    </div>
  );
};

interface RuneBalanceItemProps {
  runeId: string;
}

const RuneBalanceItem: React.FC<RuneBalanceItemProps> = ({ runeId }) => {
  // Get rune balance
  const { balance: runeBalance } = useRuneBalance(runeId);
  
  return (
    <div className="balance-item">
      <div className="balance-label">{runeId}</div>
      <div className="balance-value">{runeBalance} RUNE</div>
    </div>
  );
};

interface AlkaneBalanceItemProps {
  alkaneId: string;
}

const AlkaneBalanceItem: React.FC<AlkaneBalanceItemProps> = ({ alkaneId }) => {
  // Get alkane balance
  const { balance: alkaneBalance } = useAlkaneBalance(alkaneId);
  
  return (
    <div className="balance-item">
      <div className="balance-label">{alkaneId}</div>
      <div className="balance-value">{alkaneBalance} ALKANE</div>
    </div>
  );
};