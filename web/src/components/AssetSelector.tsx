import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkSwap } from '../contexts/DarkSwapContext';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  icon?: string;
  price?: number;
  change24h?: number;
}

interface AssetSelectorProps {
  selectedAsset?: string;
  onAssetSelect: (asset: Asset) => void;
  type?: 'base' | 'quote';
  label?: string;
  disabled?: boolean;
}

const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAsset,
  onAssetSelect,
  type = 'base',
  label = 'Select Asset',
  disabled = false,
}) => {
  const { theme } = useTheme();
  const { markets } = useDarkSwap();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extract assets from markets
  useEffect(() => {
    const extractedAssets: Asset[] = [];
    const assetMap = new Map<string, Asset>();

    // Extract assets from market pairs
    Object.keys(markets).forEach(marketPair => {
      const [baseAsset, quoteAsset] = marketPair.split('/');
      const market = markets[marketPair];

      // Add base asset if not already added
      if (!assetMap.has(baseAsset)) {
        assetMap.set(baseAsset, {
          id: baseAsset.toLowerCase(),
          symbol: baseAsset,
          name: getAssetName(baseAsset),
          icon: getAssetIcon(baseAsset),
        });
      }

      // Add quote asset if not already added
      if (!assetMap.has(quoteAsset)) {
        assetMap.set(quoteAsset, {
          id: quoteAsset.toLowerCase(),
          symbol: quoteAsset,
          name: getAssetName(quoteAsset),
          icon: getAssetIcon(quoteAsset),
        });
      }

      // Update price and change for base asset
      const baseAssetData = assetMap.get(baseAsset);
      if (baseAssetData) {
        baseAssetData.price = market.lastPrice;
        baseAssetData.change24h = market.change24h;
      }
    });

    // Convert map to array
    assetMap.forEach(asset => {
      extractedAssets.push(asset);
    });

    // Sort assets by symbol
    extractedAssets.sort((a, b) => a.symbol.localeCompare(b.symbol));

    setAssets(extractedAssets);
  }, [markets]);

  // Get asset name from symbol
  const getAssetName = (symbol: string): string => {
    // Map common symbols to names
    const nameMap: Record<string, string> = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
    };

    // Check if symbol is a rune or alkane
    if (symbol.includes(':')) {
      const [type, id] = symbol.split(':');
      return `${type} #${id}`;
    }

    return nameMap[symbol] || symbol;
  };

  // Get asset icon from symbol
  const getAssetIcon = (symbol: string): string | undefined => {
    // In a real implementation, this would return the URL to the asset icon
    // For now, we'll return undefined
    return undefined;
  };

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset => {
    const searchLower = searchTerm.toLowerCase();
    return (
      asset.symbol.toLowerCase().includes(searchLower) ||
      asset.name.toLowerCase().includes(searchLower)
    );
  });

  // Get selected asset data
  const selected = assets.find(asset => asset.symbol === selectedAsset);

  // Handle asset selection
  const handleAssetSelect = (asset: Asset) => {
    onAssetSelect(asset);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
        {label}
      </label>
      <button
        className="w-full p-2 rounded border flex items-center justify-between"
        style={{
          backgroundColor: theme.background,
          color: theme.text,
          borderColor: theme.border,
          opacity: disabled ? 0.7 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {selected ? (
          <div className="flex items-center">
            {selected.icon && (
              <img
                src={selected.icon}
                alt={selected.symbol}
                className="w-6 h-6 mr-2 rounded-full"
              />
            )}
            {!selected.icon && (
              <div
                className="w-6 h-6 mr-2 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: theme.primary, color: '#FFFFFF' }}
              >
                {selected.symbol.substring(0, 2)}
              </div>
            )}
            <span>{selected.symbol}</span>
          </div>
        ) : (
          <span className="text-gray-400">Select {type === 'base' ? 'base' : 'quote'} asset</span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-10 mt-1 w-full rounded-md shadow-lg"
          style={{ backgroundColor: theme.card }}
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Search assets..."
              className="w-full p-2 rounded border mb-2"
              style={{
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredAssets.length === 0 ? (
              <div className="p-4 text-center" style={{ color: theme.text }}>
                No assets found
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-2 hover:bg-opacity-10 cursor-pointer flex items-center justify-between"
                  style={{
                    backgroundColor:
                      asset.symbol === selectedAsset
                        ? `${theme.primary}20`
                        : 'transparent',
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                  onClick={() => handleAssetSelect(asset)}
                >
                  <div className="flex items-center">
                    {asset.icon ? (
                      <img
                        src={asset.icon}
                        alt={asset.symbol}
                        className="w-6 h-6 mr-2 rounded-full"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 mr-2 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: theme.primary, color: '#FFFFFF' }}
                      >
                        {asset.symbol.substring(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium" style={{ color: theme.text }}>
                        {asset.symbol}
                      </div>
                      <div className="text-xs" style={{ color: theme.secondary }}>
                        {asset.name}
                      </div>
                    </div>
                  </div>
                  {asset.price && (
                    <div className="text-right">
                      <div style={{ color: theme.text }}>
                        ${asset.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      {asset.change24h && (
                        <div
                          className="text-xs"
                          style={{
                            color: asset.change24h >= 0 ? theme.success : theme.error,
                          }}
                        >
                          {asset.change24h >= 0 ? '+' : ''}
                          {asset.change24h.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetSelector;