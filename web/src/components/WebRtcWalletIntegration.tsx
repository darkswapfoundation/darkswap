import React, { useState, useEffect } from 'react';
import { useWebRtc } from '../contexts/WebRtcContext';
import { useWallet } from '../contexts/WalletContext';
import { TransactionOutput } from '../utils/BitcoinTransactionUtils';
import { Rune, RuneBalance } from '../utils/RunesUtils';
import { Alkane, AlkaneBalance } from '../utils/AlkanesUtils';
import { useNotification } from '../contexts/NotificationContext';

/**
 * Message types for P2P trading
 */
enum TradeMessageType {
  TradeRequest = 'trade_request',
  TradeResponse = 'trade_response',
  TradeExecution = 'trade_execution',
  TradeCompletion = 'trade_completion',
}

/**
 * Trade status
 */
enum TradeStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Executed = 'executed',
  Completed = 'completed',
  Failed = 'failed',
}

/**
 * Trade direction
 */
enum TradeDirection {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
}

/**
 * Asset type
 */
enum AssetType {
  Bitcoin = 'bitcoin',
  Rune = 'rune',
  Alkane = 'alkane',
}

/**
 * Trade interface
 */
interface Trade {
  id: string;
  peerId: string;
  peerAddress?: string;
  direction: TradeDirection;
  status: TradeStatus;
  offerAsset: {
    type: AssetType;
    id?: string;
    amount: string;
  };
  requestAsset: {
    type: AssetType;
    id?: string;
    amount: string;
  };
  timestamp: string;
  txid?: string;
}

/**
 * WebRTC Wallet Integration component
 * @export
 * Integrates WebRTC P2P functionality with wallet functionality for decentralized trading
 */
const WebRtcWalletIntegration: React.FC = () => {
  // Contexts
  const {
    isConnected: isWebRtcConnected,
    isConnecting: isWebRtcConnecting,
    error: webRtcError,
    localPeerId,
    connectedPeers,
    sendString,
    onMessage,
    offMessage,
  } = useWebRtc();

  const {
    isConnected: isWalletConnected,
    address,
    balance,
    utxos,
    runes,
    alkanes,
    getRunes,
    getRuneById,
    transferRune,
    getAlkanes,
    getAlkaneById,
    transferAlkane,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signTransaction,
    createTransaction,
    sendTransaction,
    getUTXOs,
  } = useWallet();

  const { addNotification } = useNotification();

  // State
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<string>('');
  const [offerAssetType, setOfferAssetType] = useState<AssetType>(AssetType.Bitcoin);
  const [offerAssetId, setOfferAssetId] = useState<string>('');
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [requestAssetType, setRequestAssetType] = useState<AssetType>(AssetType.Rune);
  const [requestAssetId, setRequestAssetId] = useState<string>('');
  const [requestAmount, setRequestAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [availableRunes, setAvailableRunes] = useState<RuneBalance[]>([]);
  const [availableAlkanes, setAvailableAlkanes] = useState<AlkaneBalance[]>([]);

  // Load runes when wallet is connected
  useEffect(() => {
    if (isWalletConnected) {
      loadRunes();
      loadAlkanes();
    } else {
      setAvailableRunes([]);
    }
  }, [isWalletConnected]);
  
  // Load runes
  const loadRunes = async () => {
    try {
      const runeBalances = await getRunes();
      setAvailableRunes(runeBalances);
    } catch (error) {
      console.error('Error loading runes:', error);
      addNotification('error', `Error loading runes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Load alkanes
  const loadAlkanes = async () => {
    try {
      const alkaneBalances = await getAlkanes();
      setAvailableAlkanes(alkaneBalances);
    } catch (error) {
      console.error('Error loading alkanes:', error);
      addNotification('error', `Error loading alkanes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (peerId: string, data: any) => {
      try {
        // Parse the message
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Handle different message types
        switch (message.type) {
          case TradeMessageType.TradeRequest:
            handleTradeRequest(peerId, message);
            break;
          case TradeMessageType.TradeResponse:
            handleTradeResponse(peerId, message);
            break;
          case TradeMessageType.TradeExecution:
            handleTradeExecution(peerId, message);
            break;
          case TradeMessageType.TradeCompletion:
            handleTradeCompletion(peerId, message);
            break;
          default:
            // Ignore other message types
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    onMessage(handleMessage);

    return () => {
      offMessage(handleMessage);
    };
  }, [onMessage, offMessage, trades]);

  // Handle trade request
  const handleTradeRequest = (peerId: string, message: any) => {
    const { tradeId, offerAsset, requestAsset, peerAddress } = message;
    
    // Check if we already have this trade
    if (trades.some((t) => t.id === tradeId)) return;
    
    // Create a new trade
    const newTrade: Trade = {
      id: tradeId,
      peerId,
      peerAddress,
      direction: TradeDirection.Incoming,
      status: TradeStatus.Pending,
      offerAsset,
      requestAsset,
      timestamp: new Date().toISOString(),
    };
    
    setTrades((prev) => [...prev, newTrade]);
    addNotification('info', `New trade request from peer ${peerId}`);
  };

  // Handle trade response
  const handleTradeResponse = (peerId: string, message: any) => {
    const { tradeId, accepted } = message;
    
    // Find the trade
    const tradeIndex = trades.findIndex((t) => t.id === tradeId);
    if (tradeIndex === -1) return;
    
    // Update the trade status
    const updatedTrades = [...trades];
    updatedTrades[tradeIndex].status = accepted ? TradeStatus.Accepted : TradeStatus.Rejected;
    setTrades(updatedTrades);
    
    if (accepted) {
      addNotification('success', `Trade request accepted by peer ${peerId}`);
      
      // If this is an outgoing trade, execute it
      if (updatedTrades[tradeIndex].direction === TradeDirection.Outgoing) {
        executeTrade(tradeId);
      }
    } else {
      addNotification('error', `Trade request rejected by peer ${peerId}`);
    }
  };

  // Handle trade execution
  const handleTradeExecution = (peerId: string, message: any) => {
    const { tradeId, txid } = message;
    
    // Find the trade
    const tradeIndex = trades.findIndex((t) => t.id === tradeId);
    if (tradeIndex === -1) return;
    
    // Update the trade status
    const updatedTrades = [...trades];
    updatedTrades[tradeIndex].status = TradeStatus.Executed;
    updatedTrades[tradeIndex].txid = txid;
    setTrades(updatedTrades);
    
    addNotification('success', `Trade executed by peer ${peerId} with transaction ID ${txid}`);
    
    // Complete the trade
    completeTrade(tradeId);
  };

  // Handle trade completion
  const handleTradeCompletion = (peerId: string, message: any) => {
    const { tradeId } = message;
    
    // Find the trade
    const tradeIndex = trades.findIndex((t) => t.id === tradeId);
    if (tradeIndex === -1) return;
    
    // Update the trade status
    const updatedTrades = [...trades];
    updatedTrades[tradeIndex].status = TradeStatus.Completed;
    setTrades(updatedTrades);
    
    addNotification('success', `Trade completed with peer ${peerId}`);
  };

  // Create a trade request
  const createTradeRequest = async () => {
    if (!isWalletConnected) {
      addNotification('error', 'Please connect your wallet first');
      return;
    }
    
    if (!selectedPeer) {
      addNotification('error', 'Please select a peer to trade with');
      return;
    }
    
    if (!offerAmount || !requestAmount) {
      addNotification('error', 'Please enter offer and request amounts');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create a trade ID
      const tradeId = `trade-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a trade request message
      const message = {
        type: TradeMessageType.TradeRequest,
        tradeId,
        offerAsset: {
          type: offerAssetType,
          id: offerAssetId || undefined,
          amount: offerAmount,
        },
        requestAsset: {
          type: requestAssetType,
          id: requestAssetId || undefined,
          amount: requestAmount,
        },
        peerAddress: address,
      };
      
      // Send the trade request
      sendString(selectedPeer, JSON.stringify(message));
      
      // Create a new trade
      const newTrade: Trade = {
        id: tradeId,
        peerId: selectedPeer,
        direction: TradeDirection.Outgoing,
        status: TradeStatus.Pending,
        offerAsset: {
          type: offerAssetType,
          id: offerAssetId || undefined,
          amount: offerAmount,
        },
        requestAsset: {
          type: requestAssetType,
          id: requestAssetId || undefined,
          amount: requestAmount,
        },
        timestamp: new Date().toISOString(),
      };
      
      setTrades((prev) => [...prev, newTrade]);
      addNotification('success', `Trade request sent to peer ${selectedPeer}`);
      
      // Reset form
      // Reset form
      setOfferAssetId('');
      setOfferAmount('');
      setRequestAssetId('');
      setRequestAmount('');
    } catch (error) {
      console.error('Error creating trade request:', error);
      addNotification('error', `Error creating trade request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Respond to a trade request
  const respondToTradeRequest = async (tradeId: string, accepted: boolean) => {
    // Find the trade
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;
    
    try {
      setIsSubmitting(true);
      
      // Create a trade response message
      const message = {
        type: TradeMessageType.TradeResponse,
        tradeId,
        accepted,
      };
      
      // Send the trade response
      sendString(trade.peerId, JSON.stringify(message));
      
      // Update the trade status
      const updatedTrades = [...trades];
      const tradeIndex = updatedTrades.findIndex((t) => t.id === tradeId);
      updatedTrades[tradeIndex].status = accepted ? TradeStatus.Accepted : TradeStatus.Rejected;
      setTrades(updatedTrades);
      
      if (accepted) {
        addNotification('success', `Trade request accepted`);
      } else if (trade.offerAsset.type === AssetType.Alkane && trade.offerAsset.id && trade.peerAddress) {
        // Alkane trade
        await executeAlkaneTrade(trade);
      } else {
        addNotification('info', `Trade request rejected`);
      }
    } catch (error) {
      console.error('Error responding to trade request:', error);
      addNotification('error', `Error responding to trade request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute a trade
  const executeTrade = async (tradeId: string) => {
    // Find the trade
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;
    
    try {
      setIsSubmitting(true);
      
      // Handle different asset types
      if (trade.offerAsset.type === AssetType.Bitcoin && trade.peerAddress) {
        // Bitcoin trade
        await executeBitcoinTrade(trade);
      } else if (trade.offerAsset.type === AssetType.Rune && trade.offerAsset.id && trade.peerAddress) {
        // Rune trade
        await executeRuneTrade(trade);
      } else {
        // Simulated trade for other asset types
        await executeSimulatedTrade(tradeId);
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      addNotification('error', `Error executing trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Update the trade status
      const updatedTrades = [...trades];
      const tradeIndex = updatedTrades.findIndex((t) => t.id === trade.id);
      updatedTrades[tradeIndex].status = TradeStatus.Failed;
      setTrades(updatedTrades);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Execute a Bitcoin trade
  const executeBitcoinTrade = async (trade: Trade): Promise<void> => {
    try {
      // Create transaction outputs
      const outputs: TransactionOutput[] = [];
      
      // Add the recipient's address as an output
      outputs.push({
        address: trade.peerAddress!,
        value: parseFloat(trade.offerAsset.amount) * 100000000, // Convert BTC to satoshis
      });
      
      // Create the transaction
      const txHex = await createTransaction(outputs);
      
      // Sign the transaction
      const signedTx = await signTransaction(txHex);
      
      // Send the transaction
      const txid = await sendTransaction(signedTx);
      
      // Create a trade execution message
      const message = {
        type: TradeMessageType.TradeExecution,
        tradeId: trade.id,
        txid,
      };
      
      // Execute an Alkane trade
      const executeAlkaneTrade = async (trade: Trade): Promise<void> => {
        try {
          if (!trade.offerAsset.id || !trade.peerAddress) {
            throw new Error('Invalid trade: missing alkane ID or peer address');
          }
          
          // Transfer the alkane
          const txid = await transferAlkane(
            trade.offerAsset.id,
            trade.offerAsset.amount,
            trade.peerAddress
          );
          
          // Create a trade execution message
          const message = {
            type: TradeMessageType.TradeExecution,
            tradeId: trade.id,
            txid,
          };
          
          // Send the trade execution
          sendString(trade.peerId, JSON.stringify(message));
          
          // Update the trade status
          const updatedTrades = [...trades];
          const tradeIndex = updatedTrades.findIndex((t) => t.id === trade.id);
          updatedTrades[tradeIndex].status = TradeStatus.Executed;
          updatedTrades[tradeIndex].txid = txid;
          setTrades(updatedTrades);
          
          addNotification('success', `Trade executed with transaction ID ${txid}`);
          
          // Complete the trade
          completeTrade(trade.id);
        } catch (error) {
          console.error('Error executing Alkane trade:', error);
          throw error;
        }
      };
      
      // Send the trade execution
      sendString(trade.peerId, JSON.stringify(message));
      
      // Update the trade status
      const updatedTrades = [...trades];
      const tradeIndex = updatedTrades.findIndex((t) => t.id === trade.id);
      updatedTrades[tradeIndex].status = TradeStatus.Executed;
      updatedTrades[tradeIndex].txid = txid;
      setTrades(updatedTrades);
      
      addNotification('success', `Trade executed with transaction ID ${txid}`);
      
      // Complete the trade
      completeTrade(trade.id);
    } catch (error) {
      console.error('Error executing Bitcoin trade:', error);
      throw error;
    }
  };
  
  // Execute a Rune trade
  const executeRuneTrade = async (trade: Trade): Promise<void> => {
    try {
      if (!trade.offerAsset.id || !trade.peerAddress) {
        throw new Error('Invalid trade: missing rune ID or peer address');
      }
      
      // Transfer the rune
      const txid = await transferRune(
        trade.offerAsset.id,
        trade.offerAsset.amount,
        trade.peerAddress
      );
      
      // Create a trade execution message
      const message = {
        type: TradeMessageType.TradeExecution,
        tradeId: trade.id,
        txid,
      };
      
      // Send the trade execution
      sendString(trade.peerId, JSON.stringify(message));
      
      // Update the trade status
      const updatedTrades = [...trades];
      const tradeIndex = updatedTrades.findIndex((t) => t.id === trade.id);
      updatedTrades[tradeIndex].status = TradeStatus.Executed;
      updatedTrades[tradeIndex].txid = txid;
      setTrades(updatedTrades);
      
      addNotification('success', `Trade executed with transaction ID ${txid}`);
      
      // Complete the trade
      completeTrade(trade.id);
    } catch (error) {
      console.error('Error executing Rune trade:', error);
      throw error;
    }
  };
  
  // Execute a simulated trade (for non-Bitcoin/Rune assets or when real transactions can't be created)
  const executeSimulatedTrade = async (tradeId: string) => {
    // Find the trade
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;
    
    try {
      setIsSubmitting(true);
      
      // Simulate a transaction
      
      // Create a simulated transaction hex
      const txHex = `simulated_tx_${tradeId}_${Date.now()}`;
      
      // Simulate signing the transaction
      const signedTx = `signed_${txHex}`;
      
      // Simulate a transaction ID
      const txid = `simulated_txid_${Date.now()}`;
      
      // Create a trade execution message
      const message = {
        type: TradeMessageType.TradeExecution,
        tradeId,
        txid,
      };
      
      // Send the trade execution
      sendString(trade.peerId, JSON.stringify(message));
      
      // Update the trade status
      const updatedTrades = [...trades];
      const tradeIndex = updatedTrades.findIndex((t) => t.id === tradeId);
      updatedTrades[tradeIndex].status = TradeStatus.Executed;
      updatedTrades[tradeIndex].txid = txid;
      setTrades(updatedTrades);
      
      addNotification('success', `Trade executed with transaction ID ${txid}`);
      
      // Complete the trade
      completeTrade(tradeId);
    } catch (error) {
      console.error('Error executing trade:', error);
      addNotification('error', `Error executing trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Update the trade status
      const updatedTrades = [...trades];
      const tradeIndex = updatedTrades.findIndex((t) => t.id === tradeId);
      updatedTrades[tradeIndex].status = TradeStatus.Failed;
      setTrades(updatedTrades);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete a trade
  const completeTrade = async (tradeId: string) => {
    // Find the trade
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;
    
    try {
      // Create a trade completion message
      const message = {
        type: TradeMessageType.TradeCompletion,
        tradeId,
      };
      
      // Send the trade completion
      sendString(trade.peerId, JSON.stringify(message));
      
      // Update the trade status
      const updatedTrades = [...trades];
      const tradeIndex = updatedTrades.findIndex((t) => t.id === tradeId);
      updatedTrades[tradeIndex].status = TradeStatus.Completed;
      setTrades(updatedTrades);
      
      addNotification('success', `Trade completed`);
    } catch (error) {
      console.error('Error completing trade:', error);
      addNotification('error', `Error completing trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Format asset type
  const formatAssetType = (type: AssetType): string => {
    switch (type) {
      case AssetType.Bitcoin:
        return 'BTC';
      case AssetType.Rune:
        return 'RUNE';
      case AssetType.Alkane:
        return 'ALK';
      default:
        return type;
    }
  };

  // Format asset
  const formatAsset = (asset: { type: AssetType; id?: string; amount: string }): string => {
    return `${asset.amount} ${formatAssetType(asset.type)}${asset.id ? ` (${asset.id})` : ''}`;
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>P2P Trading with WebRTC</h2>
      
      {/* Connection status */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p>
              WebRTC: {isWebRtcConnecting ? 'Connecting...' : isWebRtcConnected ? 'Connected' : 'Disconnected'}
            </p>
            <p>Local Peer ID: {localPeerId}</p>
            <p>Connected Peers: {connectedPeers.length}</p>
          </div>
          
          <div>
            <p>
              Wallet: {isWalletConnected ? 'Connected' : 'Disconnected'}
            </p>
            {isWalletConnected && (
              <>
                <p>Address: {address}</p>
                <p>Balance: {balance} BTC</p>
                <p>UTXOs: {utxos.length}</p>
              </>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {!isWalletConnected ? (
            <button
              onClick={connectWallet}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4cc9f0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Connect Wallet
            </button>
          ) : (
            <button
              onClick={disconnectWallet}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f72585',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Disconnect Wallet
            </button>
          )}
        </div>
      </div>
      
      {/* Create trade form */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3>Create Trade</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Select Peer</label>
          <select
            value={selectedPeer}
            onChange={(e) => setSelectedPeer(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #333',
              backgroundColor: '#1a1a2e',
              color: 'white',
            }}
          >
            <option value="">Select a peer</option>
            {connectedPeers.map((peerId) => (
              <option key={peerId} value={peerId}>
                {peerId}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <h4>I Offer</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Asset Type</label>
              <select
                value={offerAssetType}
                onChange={(e) => setOfferAssetType(e.target.value as AssetType)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #333',
                  backgroundColor: '#1a1a2e',
                  color: 'white',
                }}
              >
                <option value={AssetType.Bitcoin}>Bitcoin</option>
                <option value={AssetType.Rune}>Rune</option>
                <option value={AssetType.Alkane}>Alkane</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Amount</label>
              <input
                type="text"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Amount"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #333',
                  backgroundColor: '#1a1a2e',
                  color: 'white',
                }}
              />
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <h4>I Request</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Asset Type</label>
              <select
                value={requestAssetType}
                onChange={(e) => setRequestAssetType(e.target.value as AssetType)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #333',
                  backgroundColor: '#1a1a2e',
                  color: 'white',
                }}
              >
                <option value={AssetType.Bitcoin}>Bitcoin</option>
                <option value={AssetType.Rune}>Rune</option>
                <option value={AssetType.Alkane}>Alkane</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Amount</label>
              <input
                type="text"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                placeholder="Amount"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #333',
                  backgroundColor: '#1a1a2e',
                  color: 'white',
                }}
              />
            </div>
          </div>
        </div>
        
        <button
          onClick={createTradeRequest}
          disabled={!isWalletConnected || !selectedPeer || !offerAmount || !requestAmount || isSubmitting}
          style={{
            padding: '10px 20px',
            backgroundColor: !isWalletConnected || !selectedPeer || !offerAmount || !requestAmount || isSubmitting ? '#333' : '#4cc9f0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isWalletConnected || !selectedPeer || !offerAmount || !requestAmount || isSubmitting ? 'not-allowed' : 'pointer',
            width: '100%',
          }}
        >
          {isSubmitting ? 'Creating Trade...' : 'Create Trade Request'}
        </button>
      </div>
      
      {/* Incoming trade requests */}
      {trades.filter((trade) => trade.direction === TradeDirection.Incoming && trade.status === TradeStatus.Pending).length > 0 && (
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h3>Incoming Trade Requests</h3>
          
          {trades
            .filter((trade) => trade.direction === TradeDirection.Incoming && trade.status === TradeStatus.Pending)
            .map((trade) => (
              <div
                key={trade.id}
                style={{
                  backgroundColor: '#0f0f1e',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold' }}>From: {trade.peerId}</div>
                  <div>Address: {trade.peerAddress || 'Unknown'}</div>
                  <div>Offer: {formatAsset(trade.offerAsset)}</div>
                  <div>Request: {formatAsset(trade.requestAsset)}</div>
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    {new Date(trade.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => respondToTradeRequest(trade.id, true)}
                    disabled={isSubmitting}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: isSubmitting ? '#333' : '#90be6d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Accept
                  </button>
                  
                  <button
                    onClick={() => respondToTradeRequest(trade.id, false)}
                    disabled={isSubmitting}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: isSubmitting ? '#333' : '#f94144',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
      
      {/* Trade history */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
      }}>
        <h3>Trade History</h3>
        
        {trades.filter((trade) => trade.status !== TradeStatus.Pending).length === 0 ? (
          <p>No trade history</p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {trades
              .filter((trade) => trade.status !== TradeStatus.Pending)
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((trade) => (
                <div
                  key={trade.id}
                  style={{
                    backgroundColor: '#0f0f1e',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {trade.direction === TradeDirection.Incoming ? 'From' : 'To'}: {trade.peerId}
                    </div>
                    <div>Offer: {formatAsset(trade.offerAsset)}</div>
                    <div>Request: {formatAsset(trade.requestAsset)}</div>
                    <div>Status: {trade.status}</div>
                    {trade.txid && <div>Transaction ID: {trade.txid}</div>}
                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                      {new Date(trade.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebRtcWalletIntegration;
