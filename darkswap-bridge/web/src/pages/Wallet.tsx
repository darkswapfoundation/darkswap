import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Table, Badge } from 'react-bootstrap';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';

// Define wallet balance type
interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
}

// Define transaction type
interface Transaction {
  txid: string;
  amount: number;
  recipient: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

// Define address type
interface Address {
  address: string;
}

// Wallet page component
const WalletPage: React.FC = () => {
  const { api, loading, error } = useApi();
  const { connected } = useWebSocket();
  const { addNotification } = useNotification();
  const [walletStatus, setWalletStatus] = useState<any>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [walletName, setWalletName] = useState<string>('');
  const [walletPassphrase, setWalletPassphrase] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [sendRecipient, setSendRecipient] = useState<string>('');
  const [sendFeeRate, setSendFeeRate] = useState<string>('1.0');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchWalletStatus();
  }, []);

  // Fetch wallet status
  const fetchWalletStatus = async () => {
    try {
      const response = await api.get('/api/bridge/wallet/status');
      setWalletStatus(response.data);

      if (response.data.open) {
        fetchWalletData();
      }
    } catch (error) {
      console.error('Error fetching wallet status:', error);
    }
  };

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      // Fetch balance
      const balanceResponse = await api.get('/api/bridge/wallet/balance');
      setBalance(balanceResponse.data);

      // Fetch transactions
      const transactionsResponse = await api.get('/api/bridge/wallet/transactions');
      setTransactions(transactionsResponse.data.transactions || []);

      // Fetch addresses
      const addressesResponse = await api.get('/api/bridge/wallet/addresses');
      setAddresses(addressesResponse.data.addresses || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  // Create wallet
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post('/api/bridge/wallet', {
        command: 'CreateWallet',
        name: walletName,
        passphrase: walletPassphrase,
      });

      setActionSuccess('Wallet created successfully');
      addNotification('success', 'Wallet created successfully');
      fetchWalletStatus();
      setWalletName('');
      setWalletPassphrase('');
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to create wallet');
      addNotification('error', error.response?.data?.message || 'Failed to create wallet');
    }
  };

  // Open wallet
  const handleOpenWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post('/api/bridge/wallet', {
        command: 'OpenWallet',
        name: walletName,
        passphrase: walletPassphrase,
      });

      setActionSuccess('Wallet opened successfully');
      addNotification('success', 'Wallet opened successfully');
      fetchWalletStatus();
      setWalletName('');
      setWalletPassphrase('');
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to open wallet');
      addNotification('error', error.response?.data?.message || 'Failed to open wallet');
    }
  };

  // Close wallet
  const handleCloseWallet = async () => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post('/api/bridge/wallet', {
        command: 'CloseWallet',
      });

      setActionSuccess('Wallet closed successfully');
      addNotification('success', 'Wallet closed successfully');
      fetchWalletStatus();
      setBalance(null);
      setTransactions([]);
      setAddresses([]);
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to close wallet');
      addNotification('error', error.response?.data?.message || 'Failed to close wallet');
    }
  };

  // Create address
  const handleCreateAddress = async () => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await api.post('/api/bridge/wallet', {
        command: 'CreateAddress',
      });

      setActionSuccess('Address created successfully');
      addNotification('success', 'Address created successfully');
      fetchWalletData();
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to create address');
      addNotification('error', error.response?.data?.message || 'Failed to create address');
    }
  };

  // Send transaction
  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      const amount = parseFloat(sendAmount);
      const feeRate = parseFloat(sendFeeRate);

      if (isNaN(amount) || amount <= 0) {
        setActionError('Invalid amount');
        return;
      }

      if (isNaN(feeRate) || feeRate <= 0) {
        setActionError('Invalid fee rate');
        return;
      }

      await api.post('/api/bridge/wallet', {
        command: 'SendTransaction',
        recipient: sendRecipient,
        amount: Math.floor(amount * 100000000), // Convert to satoshis
        fee_rate: feeRate,
      });

      setActionSuccess('Transaction sent successfully');
      addNotification('success', 'Transaction sent successfully');
      fetchWalletData();
      setSendAmount('');
      setSendRecipient('');
      setSendFeeRate('1.0');
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to send transaction');
      addNotification('error', error.response?.data?.message || 'Failed to send transaction');
    }
  };

  // Format satoshis as BTC
  const formatBTC = (satoshis: number) => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Format timestamp as date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Container>
      <h1 className="mb-4">Wallet</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}
      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

      {walletStatus?.open ? (
        <>
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>Wallet Information</Card.Header>
                <Card.Body>
                  <p>
                    <strong>Name:</strong> {walletStatus.name}
                  </p>
                  <p>
                    <strong>Status:</strong> {walletStatus.connected ? 'Connected' : 'Disconnected'}
                  </p>
                  <Button variant="danger" onClick={handleCloseWallet} disabled={loading}>
                    Close Wallet
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>Balance</Card.Header>
                <Card.Body>
                  {loading ? (
                    <p>Loading...</p>
                  ) : balance ? (
                    <>
                      <p>
                        <strong>Confirmed:</strong> {formatBTC(balance.confirmed)} BTC
                      </p>
                      <p>
                        <strong>Unconfirmed:</strong> {formatBTC(balance.unconfirmed)} BTC
                      </p>
                      <p>
                        <strong>Total:</strong> {formatBTC(balance.confirmed + balance.unconfirmed)} BTC
                      </p>
                    </>
                  ) : (
                    <p>No balance data available</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>Addresses</Card.Header>
                <Card.Body>
                  {loading ? (
                    <p>Loading...</p>
                  ) : addresses.length > 0 ? (
                    <>
                      <div className="table-responsive">
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Address</th>
                            </tr>
                          </thead>
                          <tbody>
                            {addresses.map((address, index) => (
                              <tr key={index}>
                                <td>{address}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                      <Button variant="primary" onClick={handleCreateAddress} disabled={loading}>
                        Create New Address
                      </Button>
                    </>
                  ) : (
                    <>
                      <p>No addresses available</p>
                      <Button variant="primary" onClick={handleCreateAddress} disabled={loading}>
                        Create New Address
                      </Button>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>Send Transaction</Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSendTransaction}>
                    <Form.Group className="mb-3">
                      <Form.Label>Recipient Address</Form.Label>
                      <Form.Control
                        type="text"
                        value={sendRecipient}
                        onChange={(e) => setSendRecipient(e.target.value)}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Amount (BTC)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.00000001"
                        min="0.00000001"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Fee Rate (sat/byte)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={sendFeeRate}
                        onChange={(e) => setSendFeeRate(e.target.value)}
                        required
                      />
                    </Form.Group>
                    <Button variant="primary" type="submit" disabled={loading}>
                      Send
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>Transaction History</Card.Header>
                <Card.Body>
                  {loading ? (
                    <p>Loading...</p>
                  ) : transactions.length > 0 ? (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Transaction ID</th>
                            <th>Amount</th>
                            <th>Recipient</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx) => (
                            <tr key={tx.txid}>
                              <td>{tx.txid.substring(0, 8)}...</td>
                              <td>{formatBTC(tx.amount)} BTC</td>
                              <td>{tx.recipient.substring(0, 8)}...</td>
                              <td>{formatDate(tx.timestamp)}</td>
                              <td>
                                <Badge
                                  bg={
                                    tx.status === 'confirmed'
                                      ? 'success'
                                      : tx.status === 'pending'
                                      ? 'warning'
                                      : 'danger'
                                  }
                                >
                                  {tx.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <p>No transactions available</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Row className="mb-4">
          <Col md={6}>
            <Card>
              <Card.Header>Create Wallet</Card.Header>
              <Card.Body>
                <Form onSubmit={handleCreateWallet}>
                  <Form.Group className="mb-3">
                    <Form.Label>Wallet Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Passphrase</Form.Label>
                    <Form.Control
                      type="password"
                      value={walletPassphrase}
                      onChange={(e) => setWalletPassphrase(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" disabled={loading}>
                    Create Wallet
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Header>Open Wallet</Card.Header>
              <Card.Body>
                <Form onSubmit={handleOpenWallet}>
                  <Form.Group className="mb-3">
                    <Form.Label>Wallet Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Passphrase</Form.Label>
                    <Form.Control
                      type="password"
                      value={walletPassphrase}
                      onChange={(e) => setWalletPassphrase(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" disabled={loading}>
                    Open Wallet
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default WalletPage;