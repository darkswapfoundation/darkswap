import React, { useState, useEffect } from 'react';
import { useWebRtc } from '../contexts/WebRtcContext';

interface WebRtcTradeProps {
  assetId?: string;
  amount?: string;
  price?: string;
}

/**
 * WebRTC Trade component for peer-to-peer trading
 */
const WebRtcTrade: React.FC<WebRtcTradeProps> = ({ assetId, amount, price }) => {
  // WebRTC context
  const {
    isConnected,
    isConnecting,
    error,
    localPeerId,
    connectedPeers,
    connect,
    disconnect,
    sendString,
    onMessage,
    offMessage,
  } = useWebRtc();

  // State
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  const [tradeAssetId, setTradeAssetId] = useState<string>(assetId || '');
  const [tradeAmount, setTradeAmount] = useState<string>(amount || '');
  const [tradePrice, setTradePrice] = useState<string>(price || '');
  const [tradeStatus, setTradeStatus] = useState<string>('');
  const [trades, setTrades] = useState<any[]>([]);

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (peerId: string, data: any) => {
      try {
        // Parse the message
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Handle different message types
        switch (message.type) {
          case 'trade_request':
            handleTradeRequest(peerId, message);
            break;
          case 'trade_response':
            handleTradeResponse(peerId, message);
            break;
          case 'trade_confirmation':
            handleTradeConfirmation(peerId, message);
            break;
          case 'trade_execution':
            handleTradeExecution(peerId, message);
            break;
          case 'trade_completion':
            handleTradeCompletion(peerId, message);
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    onMessage(handleMessage);

    return () => {
      offMessage(handleMessage);
    };
  }, [onMessage, offMessage]);

  // Handle trade request
  const handleTradeRequest = (peerId: string, message: any) => {
    // Add the trade request to the list
    setTrades((prev) => [
      ...prev,
      {
        id: message.tradeId,
        peerId,
        assetId: message.assetId,
        amount: message.amount,
        price: message.price,
        status: 'requested',
        direction: 'incoming',
        timestamp: new Date().toISOString(),
      },
    ]);

    // Show notification
    setTradeStatus(`Received trade request from ${peerId}`);
  };

  // Handle trade response
  const handleTradeResponse = (peerId: string, message: any) => {
    // Update the trade status
    setTrades((prev) =>
      prev.map((trade) =>
        trade.id === message.tradeId
          ? {
              ...trade,
              status: message.accepted ? 'accepted' : 'rejected',
            }
          : trade
      )
    );

    // Show notification
    setTradeStatus(
      `Trade ${message.accepted ? 'accepted' : 'rejected'} by ${peerId}`
    );
  };

  // Handle trade confirmation
  const handleTradeConfirmation = (peerId: string, message: any) => {
    // Update the trade status
    setTrades((prev) =>
      prev.map((trade) =>
        trade.id === message.tradeId
          ? {
              ...trade,
              status: 'confirmed',
            }
          : trade
      )
    );

    // Show notification
    setTradeStatus(`Trade confirmed by ${peerId}`);
  };

  // Handle trade execution
  const handleTradeExecution = (peerId: string, message: any) => {
    // Update the trade status
    setTrades((prev) =>
      prev.map((trade) =>
        trade.id === message.tradeId
          ? {
              ...trade,
              status: 'executing',
              txid: message.txid,
            }
          : trade
      )
    );

    // Show notification
    setTradeStatus(`Trade executing with transaction ID: ${message.txid}`);
  };

  // Handle trade completion
  const handleTradeCompletion = (peerId: string, message: any) => {
    // Update the trade status
    setTrades((prev) =>
      prev.map((trade) =>
        trade.id === message.tradeId
          ? {
              ...trade,
              status: 'completed',
            }
          : trade
      )
    );

    // Show notification
    setTradeStatus(`Trade completed with ${peerId}`);
  };

  // Connect to a peer
  const handleConnect = async () => {
    if (!targetPeerId) return;

    try {
      await connect(targetPeerId);
      setTradeStatus(`Connected to ${targetPeerId}`);
    } catch (err) {
      console.error('Failed to connect:', err);
      setTradeStatus(`Failed to connect to ${targetPeerId}`);
    }
  };

  // Disconnect from a peer
  const handleDisconnect = (peerId: string) => {
    disconnect(peerId);
    setTradeStatus(`Disconnected from ${peerId}`);
  };

  // Send a trade request
  const handleSendTradeRequest = (peerId: string) => {
    if (!tradeAssetId || !tradeAmount || !tradePrice) {
      setTradeStatus('Please fill in all trade details');
      return;
    }

    // Create a trade ID
    const tradeId = `trade-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create the trade request message
    const message = {
      type: 'trade_request',
      tradeId,
      assetId: tradeAssetId,
      amount: tradeAmount,
      price: tradePrice,
      timestamp: new Date().toISOString(),
    };

    // Send the message
    sendString(peerId, JSON.stringify(message));

    // Add the trade to the list
    setTrades((prev) => [
      ...prev,
      {
        id: tradeId,
        peerId,
        assetId: tradeAssetId,
        amount: tradeAmount,
        price: tradePrice,
        status: 'requested',
        direction: 'outgoing',
        timestamp: new Date().toISOString(),
      },
    ]);

    // Show notification
    setTradeStatus(`Trade request sent to ${peerId}`);
  };

  // Accept a trade request
  const handleAcceptTrade = (tradeId: string) => {
    // Find the trade
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;

    // Create the trade response message
    const message = {
      type: 'trade_response',
      tradeId,
      accepted: true,
      timestamp: new Date().toISOString(),
    };

    // Send the message
    sendString(trade.peerId, JSON.stringify(message));

    // Update the trade status
    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId
          ? {
              ...t,
              status: 'accepted',
            }
          : t
      )
    );

    // Show notification
    setTradeStatus(`Trade accepted`);
  };

  // Reject a trade request
  const handleRejectTrade = (tradeId: string) => {
    // Find the trade
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;

    // Create the trade response message
    const message = {
      type: 'trade_response',
      tradeId,
      accepted: false,
      timestamp: new Date().toISOString(),
    };

    // Send the message
    sendString(trade.peerId, JSON.stringify(message));

    // Update the trade status
    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId
          ? {
              ...t,
              status: 'rejected',
            }
          : t
      )
    );

    // Show notification
    setTradeStatus(`Trade rejected`);
  };

  // Confirm a trade
  const handleConfirmTrade = (tradeId: string) => {
    // Find the trade
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;

    // Create the trade confirmation message
    const message = {
      type: 'trade_confirmation',
      tradeId,
      timestamp: new Date().toISOString(),
    };

    // Send the message
    sendString(trade.peerId, JSON.stringify(message));

    // Update the trade status
    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId
          ? {
              ...t,
              status: 'confirmed',
            }
          : t
      )
    );

    // Show notification
    setTradeStatus(`Trade confirmed`);
  };

  // Execute a trade
  const handleExecuteTrade = (tradeId: string) => {
    // Find the trade
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;

    // Create a dummy transaction ID
    const txid = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create the trade execution message
    const message = {
      type: 'trade_execution',
      tradeId,
      txid,
      timestamp: new Date().toISOString(),
    };

    // Send the message
    sendString(trade.peerId, JSON.stringify(message));

    // Update the trade status
    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId
          ? {
              ...t,
              status: 'executing',
              txid,
            }
          : t
      )
    );

    // Show notification
    setTradeStatus(`Trade executing with transaction ID: ${txid}`);

    // Simulate trade completion after 3 seconds
    setTimeout(() => {
      // Create the trade completion message
      const completionMessage = {
        type: 'trade_completion',
        tradeId,
        timestamp: new Date().toISOString(),
      };

      // Send the message
      sendString(trade.peerId, JSON.stringify(completionMessage));

      // Update the trade status
      setTrades((prev) =>
        prev.map((t) =>
          t.id === tradeId
            ? {
                ...t,
                status: 'completed',
              }
            : t
        )
      );

      // Show notification
      setTradeStatus(`Trade completed`);
    }, 3000);
  };

  return (
    <div className="webrtc-trade">
      <h2>P2P Trading</h2>

      {/* Connection status */}
      <div className="status-section">
        <p>
          Status: {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
        </p>
        {error && (
          <p className="error">
            Error: {error.message}
          </p>
        )}
        <p>Local Peer ID: {localPeerId}</p>
        {tradeStatus && <p className="trade-status">{tradeStatus}</p>}
      </div>

      {/* Connect to peer */}
      <div className="connect-section">
        <input
          type="text"
          placeholder="Peer ID"
          value={targetPeerId}
          onChange={(e) => setTargetPeerId(e.target.value)}
          className="peer-input"
        />
        <button 
          onClick={handleConnect} 
          disabled={!targetPeerId || isConnecting}
          className="connect-button"
        >
          Connect
        </button>
      </div>

      {/* Connected peers */}
      {connectedPeers.length > 0 && (
        <div className="peers-section">
          <h3>Connected Peers</h3>
          <ul className="peer-list">
            {connectedPeers.map((peerId) => (
              <li key={peerId} className="peer-item">
                <span>{peerId}</span>
                <div className="peer-actions">
                  <button 
                    onClick={() => handleSendTradeRequest(peerId)}
                    className="trade-button"
                  >
                    Send Trade
                  </button>
                  <button 
                    onClick={() => handleDisconnect(peerId)}
                    className="disconnect-button"
                  >
                    Disconnect
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trade form */}
      {connectedPeers.length > 0 && (
        <div className="trade-form">
          <h3>Create Trade</h3>
          <div className="form-group">
            <label>Asset ID:</label>
            <input
              type="text"
              value={tradeAssetId}
              onChange={(e) => setTradeAssetId(e.target.value)}
              placeholder="Asset ID (e.g., rune:DANK)"
            />
          </div>
          <div className="form-group">
            <label>Amount:</label>
            <input
              type="text"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              placeholder="Amount"
            />
          </div>
          <div className="form-group">
            <label>Price (sats):</label>
            <input
              type="text"
              value={tradePrice}
              onChange={(e) => setTradePrice(e.target.value)}
              placeholder="Price in sats"
            />
          </div>
        </div>
      )}

      {/* Trades */}
      {trades.length > 0 && (
        <div className="trades-section">
          <h3>Trades</h3>
          <ul className="trade-list">
            {trades.map((trade) => (
              <li key={trade.id} className={`trade-item ${trade.direction} ${trade.status}`}>
                <div className="trade-header">
                  <span className="trade-direction">
                    {trade.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                  </span>
                  <span className="trade-status">{trade.status}</span>
                </div>
                <div className="trade-details">
                  <p>Asset: {trade.assetId}</p>
                  <p>Amount: {trade.amount}</p>
                  <p>Price: {trade.price} sats</p>
                  <p>Peer: {trade.peerId}</p>
                  {trade.txid && <p>Transaction: {trade.txid}</p>}
                </div>
                <div className="trade-actions">
                  {trade.direction === 'incoming' && trade.status === 'requested' && (
                    <>
                      <button onClick={() => handleAcceptTrade(trade.id)}>Accept</button>
                      <button onClick={() => handleRejectTrade(trade.id)}>Reject</button>
                    </>
                  )}
                  {trade.direction === 'outgoing' && trade.status === 'accepted' && (
                    <button onClick={() => handleConfirmTrade(trade.id)}>Confirm</button>
                  )}
                  {trade.status === 'confirmed' && (
                    <button onClick={() => handleExecuteTrade(trade.id)}>Execute</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WebRtcTrade;