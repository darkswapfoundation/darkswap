import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { useNotification } from '../contexts/NotificationContext';

interface TradeFormProps {
  baseAsset: string;
  quoteAsset: string;
  currentPrice?: number;
  onSubmit?: (order: {
    type: 'buy' | 'sell';
    baseAsset: string;
    quoteAsset: string;
    amount: number;
    price: number;
    total: number;
  }) => void;
}

const TradeForm: React.FC<TradeFormProps> = ({
  baseAsset,
  quoteAsset,
  currentPrice,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const { wallet, balance } = useWallet();
  const { addNotification } = useNotification();

  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState(currentPrice ? currentPrice.toString() : '');
  const [total, setTotal] = useState('0');

  // Update price when currentPrice changes
  useEffect(() => {
    if (currentPrice) {
      setPrice(currentPrice.toString());
      updateTotal(amount, currentPrice.toString());
    }
  }, [currentPrice]);

  // Calculate total when amount or price changes
  const updateTotal = (newAmount: string, newPrice: string) => {
    if (newAmount && newPrice) {
      const calculatedTotal = parseFloat(newAmount) * parseFloat(newPrice);
      setTotal(calculatedTotal.toFixed(2));
    } else {
      setTotal('0');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    updateTotal(newAmount, price);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = e.target.value;
    setPrice(newPrice);
    updateTotal(amount, newPrice);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet) {
      addNotification({
        type: 'warning',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to place an order.',
        autoClose: true,
      });
      return;
    }

    if (!amount || !price) {
      addNotification({
        type: 'warning',
        title: 'Invalid Order',
        message: 'Please enter a valid amount and price.',
        autoClose: true,
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    const parsedPrice = parseFloat(price);
    const parsedTotal = parseFloat(total);

    // Validate balance
    if (orderType === 'buy' && balance[quoteAsset] < parsedTotal) {
      addNotification({
        type: 'error',
        title: 'Insufficient Balance',
        message: `You don't have enough ${quoteAsset} to place this order.`,
        autoClose: true,
      });
      return;
    }

    if (orderType === 'sell' && balance[baseAsset] < parsedAmount) {
      addNotification({
        type: 'error',
        title: 'Insufficient Balance',
        message: `You don't have enough ${baseAsset} to place this order.`,
        autoClose: true,
      });
      return;
    }

    if (onSubmit) {
      onSubmit({
        type: orderType,
        baseAsset,
        quoteAsset,
        amount: parsedAmount,
        price: parsedPrice,
        total: parsedTotal,
      });
    }

    // Reset form
    setAmount('');
    updateTotal('', price);
  };

  const handleSetMaxAmount = () => {
    if (!wallet) return;

    let maxAmount = '0';
    if (orderType === 'buy' && balance[quoteAsset] && price) {
      // For buy orders, max amount is balance / price
      maxAmount = (balance[quoteAsset] / parseFloat(price)).toFixed(8);
    } else if (orderType === 'sell' && balance[baseAsset]) {
      // For sell orders, max amount is the balance
      maxAmount = balance[baseAsset].toString();
    }

    setAmount(maxAmount);
    updateTotal(maxAmount, price);
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: theme.card }}>
      <div className="p-4 border-b" style={{ borderColor: theme.border }}>
        <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
          {baseAsset}/{quoteAsset} Trade
        </h2>
      </div>

      <div className="p-4">
        {/* Order Type Tabs */}
        <div className="flex mb-4 rounded-lg overflow-hidden">
          <button
            className="flex-1 py-2 text-center font-medium transition-colors"
            style={{
              backgroundColor: orderType === 'buy' ? theme.success : theme.card,
              color: orderType === 'buy' ? '#FFFFFF' : theme.text,
            }}
            onClick={() => setOrderType('buy')}
          >
            Buy
          </button>
          <button
            className="flex-1 py-2 text-center font-medium transition-colors"
            style={{
              backgroundColor: orderType === 'sell' ? theme.error : theme.card,
              color: orderType === 'sell' ? '#FFFFFF' : theme.text,
            }}
            onClick={() => setOrderType('sell')}
          >
            Sell
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
              Amount ({baseAsset})
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Enter ${baseAsset} amount`}
                className="w-full p-2 rounded border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                }}
                step="0.00000001"
                min="0"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: theme.primary,
                  color: '#FFFFFF',
                }}
                onClick={handleSetMaxAmount}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Price Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
              Price ({quoteAsset})
            </label>
            <input
              type="number"
              value={price}
              onChange={handlePriceChange}
              placeholder={`Enter price in ${quoteAsset}`}
              className="w-full p-2 rounded border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
              }}
              step="0.01"
              min="0"
            />
          </div>

          {/* Total */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
              Total ({quoteAsset})
            </label>
            <input
              type="text"
              value={total}
              readOnly
              className="w-full p-2 rounded border focus:outline-none"
              style={{
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
                opacity: 0.8,
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded font-medium transition-opacity"
            style={{
              backgroundColor: orderType === 'buy' ? theme.success : theme.error,
              color: '#FFFFFF',
              opacity: wallet ? 1 : 0.7,
            }}
            disabled={!wallet}
          >
            {wallet
              ? `${orderType === 'buy' ? 'Buy' : 'Sell'} ${baseAsset}`
              : 'Connect Wallet to Trade'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TradeForm;