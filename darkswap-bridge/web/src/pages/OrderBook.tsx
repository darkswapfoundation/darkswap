import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Table, Badge, Modal } from 'react-bootstrap';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';

// Define order type
interface Order {
  id: string;
  order_type: 'Buy' | 'Sell';
  sell_asset: string;
  sell_amount: number;
  buy_asset: string;
  buy_amount: number;
  peer_id: string;
  timestamp: number;
  status: 'Open' | 'Filled' | 'Cancelled';
}

// OrderBook page component
const OrderBookPage: React.FC = () => {
  const { api, loading, error } = useApi();
  const { connected } = useWebSocket();
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showTakeModal, setShowTakeModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderType, setOrderType] = useState<'Buy' | 'Sell'>('Buy');
  const [sellAsset, setSellAsset] = useState<string>('BTC');
  const [sellAmount, setSellAmount] = useState<string>('');
  const [buyAsset, setBuyAsset] = useState<string>('RUNE');
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [filterAsset, setFilterAsset] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders when filter changes
  useEffect(() => {
    filterOrders();
  }, [orders, filterAsset, filterType]);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/bridge/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Filter orders
  const filterOrders = () => {
    let filtered = [...orders];

    if (filterAsset) {
      filtered = filtered.filter(
        (order) => order.sell_asset === filterAsset || order.buy_asset === filterAsset
      );
    }

    if (filterType) {
      filtered = filtered.filter((order) => order.order_type === filterType);
    }

    setFilteredOrders(filtered);
  };

  // Create order
  const handleCreateOrder = async () => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const sellAmountValue = parseFloat(sellAmount);
      const buyAmountValue = parseFloat(buyAmount);

      if (isNaN(sellAmountValue) || sellAmountValue <= 0) {
        setActionError('Invalid sell amount');
        return;
      }

      if (isNaN(buyAmountValue) || buyAmountValue <= 0) {
        setActionError('Invalid buy amount');
        return;
      }

      await api.post('/api/bridge/orders', {
        order_type: orderType,
        sell_asset: sellAsset,
        sell_amount: Math.floor(sellAmountValue * 100000000), // Convert to satoshis
        buy_asset: buyAsset,
        buy_amount: Math.floor(buyAmountValue * 100000000), // Convert to satoshis
      });

      setActionSuccess('Order created successfully');
      addNotification('success', 'Order created successfully');
      fetchOrders();
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to create order');
      addNotification('error', error.response?.data?.message || 'Failed to create order');
    }
  };

  // Take order
  const handleTakeOrder = async () => {
    if (!selectedOrder) return;

    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post(`/api/bridge/orders/${selectedOrder.id}/take`);

      setActionSuccess('Order taken successfully');
      addNotification('success', 'Order taken successfully');
      fetchOrders();
      setShowTakeModal(false);
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to take order');
      addNotification('error', error.response?.data?.message || 'Failed to take order');
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.delete(`/api/bridge/orders/${orderId}`);

      setActionSuccess('Order cancelled successfully');
      addNotification('success', 'Order cancelled successfully');
      fetchOrders();
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to cancel order');
      addNotification('error', error.response?.data?.message || 'Failed to cancel order');
    }
  };

  // Reset form
  const resetForm = () => {
    setOrderType('Buy');
    setSellAsset('BTC');
    setSellAmount('');
    setBuyAsset('RUNE');
    setBuyAmount('');
  };

  // Format satoshis as BTC
  const formatAmount = (satoshis: number) => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Format timestamp as date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Open take order modal
  const openTakeOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setShowTakeModal(true);
  };

  return (
    <Container>
      <h1 className="mb-4">Order Book</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}
      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>Filter Orders</Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Asset</Form.Label>
                      <Form.Control
                        as="select"
                        value={filterAsset}
                        onChange={(e) => setFilterAsset(e.target.value)}
                      >
                        <option value="">All Assets</option>
                        <option value="BTC">BTC</option>
                        <option value="RUNE">RUNE</option>
                        <option value="ETH">ETH</option>
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Type</Form.Label>
                      <Form.Control
                        as="select"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="Buy">Buy</option>
                        <option value="Sell">Sell</option>
                      </Form.Control>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="d-flex align-items-center justify-content-end">
          <Button variant="primary" onClick={() => setShowCreateModal(true)} className="me-2">
            Create Order
          </Button>
          <Button variant="secondary" onClick={fetchOrders} disabled={loading}>
            Refresh
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Orders</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading...</p>
              ) : filteredOrders.length > 0 ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Sell</th>
                        <th>Buy</th>
                        <th>Rate</th>
                        <th>Peer</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.id.substring(0, 8)}...</td>
                          <td>
                            <Badge bg={order.order_type === 'Buy' ? 'success' : 'danger'}>
                              {order.order_type}
                            </Badge>
                          </td>
                          <td>
                            {formatAmount(order.sell_amount)} {order.sell_asset}
                          </td>
                          <td>
                            {formatAmount(order.buy_amount)} {order.buy_asset}
                          </td>
                          <td>
                            {(order.buy_amount / order.sell_amount).toFixed(8)}{' '}
                            {order.buy_asset}/{order.sell_asset}
                          </td>
                          <td>{order.peer_id === 'local' ? 'You' : order.peer_id.substring(0, 8)}</td>
                          <td>{formatDate(order.timestamp)}</td>
                          <td>
                            <Badge
                              bg={
                                order.status === 'Open'
                                  ? 'success'
                                  : order.status === 'Filled'
                                  ? 'primary'
                                  : 'secondary'
                              }
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td>
                            {order.status === 'Open' && (
                              <>
                                {order.peer_id === 'local' ? (
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleCancelOrder(order.id)}
                                    disabled={loading}
                                  >
                                    Cancel
                                  </Button>
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => openTakeOrderModal(order)}
                                    disabled={loading}
                                  >
                                    Take
                                  </Button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p>No orders available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Order Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Order Type</Form.Label>
              <Form.Control
                as="select"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as 'Buy' | 'Sell')}
              >
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sell Asset</Form.Label>
              <Form.Control
                as="select"
                value={sellAsset}
                onChange={(e) => setSellAsset(e.target.value)}
              >
                <option value="BTC">BTC</option>
                <option value="RUNE">RUNE</option>
                <option value="ETH">ETH</option>
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sell Amount</Form.Label>
              <Form.Control
                type="number"
                step="0.00000001"
                min="0.00000001"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Buy Asset</Form.Label>
              <Form.Control
                as="select"
                value={buyAsset}
                onChange={(e) => setBuyAsset(e.target.value)}
              >
                <option value="BTC">BTC</option>
                <option value="RUNE">RUNE</option>
                <option value="ETH">ETH</option>
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Buy Amount</Form.Label>
              <Form.Control
                type="number"
                step="0.00000001"
                min="0.00000001"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateOrder} disabled={loading}>
            Create Order
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Take Order Modal */}
      <Modal show={showTakeModal} onHide={() => setShowTakeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Take Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <p>
                <strong>Order Type:</strong>{' '}
                <Badge bg={selectedOrder.order_type === 'Buy' ? 'success' : 'danger'}>
                  {selectedOrder.order_type}
                </Badge>
              </p>
              <p>
                <strong>Sell:</strong> {formatAmount(selectedOrder.sell_amount)} {selectedOrder.sell_asset}
              </p>
              <p>
                <strong>Buy:</strong> {formatAmount(selectedOrder.buy_amount)} {selectedOrder.buy_asset}
              </p>
              <p>
                <strong>Rate:</strong> {(selectedOrder.buy_amount / selectedOrder.sell_amount).toFixed(8)}{' '}
                {selectedOrder.buy_asset}/{selectedOrder.sell_asset}
              </p>
              <p>
                <strong>Peer:</strong> {selectedOrder.peer_id.substring(0, 8)}...
              </p>
              <p>
                <strong>Date:</strong> {formatDate(selectedOrder.timestamp)}
              </p>
              <Alert variant="info">
                Are you sure you want to take this order? This will initiate a trade with the peer.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTakeModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleTakeOrder} disabled={loading}>
            Take Order
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrderBookPage;