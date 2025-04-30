import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Dashboard page component
const DashboardPage: React.FC = () => {
  const { api, loading, error } = useApi();
  const { connected } = useWebSocket();
  const [walletStatus, setWalletStatus] = useState<any>(null);
  const [networkStatus, setNetworkStatus] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [priceData, setPriceData] = useState<any>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      // Fetch wallet status
      const walletResponse = await api.get('/api/bridge/wallet/status');
      setWalletStatus(walletResponse.data);

      // Fetch network status
      const networkResponse = await api.get('/api/bridge/network/status');
      setNetworkStatus(networkResponse.data);

      // Fetch system status
      const systemResponse = await api.get('/api/bridge/system/status');
      setSystemStatus(systemResponse.data);

      // Fetch orders
      const ordersResponse = await api.get('/api/bridge/orders');
      setOrders(ordersResponse.data.orders || []);

      // Fetch trades
      const tradesResponse = await api.get('/api/bridge/trades');
      setTrades(tradesResponse.data.trades || []);

      // Fetch price data (mock data for now)
      setPriceData({
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [
          {
            label: 'BTC/USD',
            data: [65000, 68000, 72000, 69000, 74000, 76000, 78000],
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
          {
            label: 'RUNE/USD',
            data: [2.5, 2.8, 3.2, 3.0, 3.5, 3.8, 4.0],
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchData();
  };

  return (
    <Container>
      <h1 className="mb-4">Dashboard</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={4}>
          <Card>
            <Card.Header>Wallet Status</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading...</p>
              ) : walletStatus ? (
                <>
                  <p>
                    <strong>Connected:</strong> {walletStatus.connected ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Open:</strong> {walletStatus.open ? 'Yes' : 'No'}
                  </p>
                  {walletStatus.name && (
                    <p>
                      <strong>Name:</strong> {walletStatus.name}
                    </p>
                  )}
                </>
              ) : (
                <p>No data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>Network Status</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading...</p>
              ) : networkStatus ? (
                <>
                  <p>
                    <strong>Connected:</strong> {networkStatus.connected ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Peer Count:</strong> {networkStatus.peer_count}
                  </p>
                  <p>
                    <strong>WebSocket:</strong> {connected ? 'Connected' : 'Disconnected'}
                  </p>
                </>
              ) : (
                <p>No data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>System Status</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading...</p>
              ) : systemStatus ? (
                <>
                  <p>
                    <strong>Status:</strong> {systemStatus.status}
                  </p>
                  <p>
                    <strong>Uptime:</strong> {systemStatus.uptime} seconds
                  </p>
                  <p>
                    <strong>Version:</strong> {systemStatus.version}
                  </p>
                </>
              ) : (
                <p>No data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Price Chart</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading...</p>
              ) : priceData ? (
                <Line data={priceData} />
              ) : (
                <p>No data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>Recent Orders</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading...</p>
              ) : orders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Sell</th>
                        <th>Buy</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id}>
                          <td>{order.id.substring(0, 8)}...</td>
                          <td>{order.order_type}</td>
                          <td>
                            {order.sell_amount} {order.sell_asset}
                          </td>
                          <td>
                            {order.buy_amount} {order.buy_asset}
                          </td>
                          <td>{order.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No orders available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>Recent Trades</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading...</p>
              ) : trades.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Order ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.slice(0, 5).map((trade) => (
                        <tr key={trade.id}>
                          <td>{trade.id.substring(0, 8)}...</td>
                          <td>{trade.order_id.substring(0, 8)}...</td>
                          <td>{trade.amount}</td>
                          <td>{trade.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No trades available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-center mb-4">
        <Button variant="primary" onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
    </Container>
  );
};

export default DashboardPage;