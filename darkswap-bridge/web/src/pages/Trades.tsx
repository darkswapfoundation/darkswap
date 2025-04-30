import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Badge, Modal } from 'react-bootstrap';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';

// Define trade type
interface Trade {
  id: string;
  order_id: string;
  maker_id: string;
  taker_id: string;
  sell_asset: string;
  sell_amount: number;
  buy_asset: string;
  buy_amount: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Executed' | 'Confirmed' | 'Cancelled' | 'Failed';
  timestamp: number;
}

// Trades page component
const TradesPage: React.FC = () => {
  const { api, loading, error } = useApi();
  const { connected } = useWebSocket();
  const { addNotification } = useNotification();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch trades on mount
  useEffect(() => {
    fetchTrades();
  }, []);

  // Fetch trades
  const fetchTrades = async () => {
    try {
      const response = await api.get('/api/bridge/trades');
      setTrades(response.data.trades || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  // Accept trade
  const handleAcceptTrade = async (tradeId: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post(`/api/bridge/trades/${tradeId}/accept`);

      setActionSuccess('Trade accepted successfully');
      addNotification('success', 'Trade accepted successfully');
      fetchTrades();
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to accept trade');
      addNotification('error', error.response?.data?.message || 'Failed to accept trade');
    }
  };

  // Reject trade
  const handleRejectTrade = async (tradeId: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post(`/api/bridge/trades/${tradeId}/reject`);

      setActionSuccess('Trade rejected successfully');
      addNotification('success', 'Trade rejected successfully');
      fetchTrades();
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to reject trade');
      addNotification('error', error.response?.data?.message || 'Failed to reject trade');
    }
  };

  // Execute trade
  const handleExecuteTrade = async (tradeId: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post(`/api/bridge/trades/${tradeId}/execute`);

      setActionSuccess('Trade executed successfully');
      addNotification('success', 'Trade executed successfully');
      fetchTrades();
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to execute trade');
      addNotification('error', error.response?.data?.message || 'Failed to execute trade');
    }
  };

  // Confirm trade
  const handleConfirmTrade = async (tradeId: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post(`/api/bridge/trades/${tradeId}/confirm`);

      setActionSuccess('Trade confirmed successfully');
      addNotification('success', 'Trade confirmed successfully');
      fetchTrades();
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to confirm trade');
      addNotification('error', error.response?.data?.message || 'Failed to confirm trade');
    }
  };

  // Cancel trade
  const handleCancelTrade = async (tradeId: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post(`/api/bridge/trades/${tradeId}/cancel`);

      setActionSuccess('Trade cancelled successfully');
      addNotification('success', 'Trade cancelled successfully');
      fetchTrades();
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to cancel trade');
      addNotification('error', error.response?.data?.message || 'Failed to cancel trade');
    }
  };

  // Format satoshis as BTC
  const formatAmount = (satoshis: number) => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Format timestamp as date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Show trade details
  const showTradeDetails = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowDetailsModal(true);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Accepted':
        return 'info';
      case 'Rejected':
        return 'danger';
      case 'Executed':
        return 'primary';
      case 'Confirmed':
        return 'success';
      case 'Cancelled':
        return 'secondary';
      case 'Failed':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Render trade actions
  const renderTradeActions = (trade: Trade) => {
    const isLocal = trade.maker_id === 'local' || trade.taker_id === 'local';
    const isMaker = trade.maker_id === 'local';

    if (!isLocal) {
      return null;
    }

    switch (trade.status) {
      case 'Pending':
        return isMaker ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleCancelTrade(trade.id)}
            disabled={loading}
          >
            Cancel
          </Button>
        ) : (
          <>
            <Button
              variant="success"
              size="sm"
              onClick={() => handleAcceptTrade(trade.id)}
              disabled={loading}
              className="me-2"
            >
              Accept
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleRejectTrade(trade.id)}
              disabled={loading}
            >
              Reject
            </Button>
          </>
        );
      case 'Accepted':
        return isMaker ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExecuteTrade(trade.id)}
            disabled={loading}
          >
            Execute
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleCancelTrade(trade.id)}
            disabled={loading}
          >
            Cancel
          </Button>
        );
      case 'Executed':
        return !isMaker ? (
          <Button
            variant="success"
            size="sm"
            onClick={() => handleConfirmTrade(trade.id)}
            disabled={loading}
          >
            Confirm
          </Button>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Container>
      <h1 className="mb-4">Trades</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}
      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

      <Row className="mb-4">
        <Col className="d-flex justify-content-end">
          <Button variant="secondary" onClick={fetchTrades} disabled={loading}>
            Refresh
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Trades</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading...</p>
              ) : trades.length > 0 ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Order ID</th>
                        <th>Sell</th>
                        <th>Buy</th>
                        <th>Maker</th>
                        <th>Taker</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade) => (
                        <tr key={trade.id}>
                          <td>
                            <Button
                              variant="link"
                              onClick={() => showTradeDetails(trade)}
                              className="p-0"
                            >
                              {trade.id.substring(0, 8)}...
                            </Button>
                          </td>
                          <td>{trade.order_id.substring(0, 8)}...</td>
                          <td>
                            {formatAmount(trade.sell_amount)} {trade.sell_asset}
                          </td>
                          <td>
                            {formatAmount(trade.buy_amount)} {trade.buy_asset}
                          </td>
                          <td>
                            {trade.maker_id === 'local' ? 'You' : trade.maker_id.substring(0, 8)}
                          </td>
                          <td>
                            {trade.taker_id === 'local' ? 'You' : trade.taker_id.substring(0, 8)}
                          </td>
                          <td>{formatDate(trade.timestamp)}</td>
                          <td>
                            <Badge bg={getStatusBadgeColor(trade.status)}>{trade.status}</Badge>
                          </td>
                          <td>{renderTradeActions(trade)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p>No trades available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Trade Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Trade Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTrade && (
            <>
              <p>
                <strong>Trade ID:</strong> {selectedTrade.id}
              </p>
              <p>
                <strong>Order ID:</strong> {selectedTrade.order_id}
              </p>
              <p>
                <strong>Sell:</strong> {formatAmount(selectedTrade.sell_amount)}{' '}
                {selectedTrade.sell_asset}
              </p>
              <p>
                <strong>Buy:</strong> {formatAmount(selectedTrade.buy_amount)}{' '}
                {selectedTrade.buy_asset}
              </p>
              <p>
                <strong>Rate:</strong>{' '}
                {(selectedTrade.buy_amount / selectedTrade.sell_amount).toFixed(8)}{' '}
                {selectedTrade.buy_asset}/{selectedTrade.sell_asset}
              </p>
              <p>
                <strong>Maker:</strong>{' '}
                {selectedTrade.maker_id === 'local' ? 'You' : selectedTrade.maker_id}
              </p>
              <p>
                <strong>Taker:</strong>{' '}
                {selectedTrade.taker_id === 'local' ? 'You' : selectedTrade.taker_id}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(selectedTrade.timestamp)}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <Badge bg={getStatusBadgeColor(selectedTrade.status)}>
                  {selectedTrade.status}
                </Badge>
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedTrade && renderTradeActions(selectedTrade)}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TradesPage;