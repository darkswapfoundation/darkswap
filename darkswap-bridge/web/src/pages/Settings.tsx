import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { useApi } from '../contexts/ApiContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';

// Define settings type
interface Settings {
  theme: string;
  language: string;
  notifications_enabled: boolean;
  auto_connect: boolean;
  auto_start: boolean;
  api_url: string;
  websocket_url: string;
}

// Settings page component
const SettingsPage: React.FC = () => {
  const { api, loading, error } = useApi();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { addNotification } = useNotification();
  const [settings, setSettings] = useState<Settings>({
    theme: theme,
    language: 'en',
    notifications_enabled: true,
    auto_connect: true,
    auto_start: true,
    api_url: process.env.REACT_APP_API_URL || '/api',
    websocket_url: process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
  });
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/bridge/system/settings');
      setSettings({
        ...settings,
        ...response.data,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Save settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post('/api/bridge/system/settings', settings);

      setActionSuccess('Settings saved successfully');
      addNotification('success', 'Settings saved successfully');

      // Update theme if changed
      if (settings.theme !== theme) {
        setTheme(settings.theme as 'light' | 'dark');
      }
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to save settings');
      addNotification('error', error.response?.data?.message || 'Failed to save settings');
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setActionError('New passwords do not match');
      return;
    }

    try {
      await api.post('/api/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });

      setActionSuccess('Password changed successfully');
      addNotification('success', 'Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to change password');
      addNotification('error', error.response?.data?.message || 'Failed to change password');
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      await api.delete('/api/auth/account');

      setActionSuccess('Account deleted successfully');
      addNotification('success', 'Account deleted successfully');
      logout();
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to delete account');
      addNotification('error', error.response?.data?.message || 'Failed to delete account');
    }
  };

  return (
    <Container>
      <h1 className="mb-4">Settings</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}
      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Application Settings</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSaveSettings}>
                <Form.Group className="mb-3">
                  <Form.Label>Theme</Form.Label>
                  <Form.Control
                    as="select"
                    value={settings.theme}
                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </Form.Control>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Language</Form.Label>
                  <Form.Control
                    as="select"
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </Form.Control>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Enable Notifications"
                    checked={settings.notifications_enabled}
                    onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Auto Connect to Network"
                    checked={settings.auto_connect}
                    onChange={(e) => setSettings({ ...settings, auto_connect: e.target.checked })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Auto Start Wallet"
                    checked={settings.auto_start}
                    onChange={(e) => setSettings({ ...settings, auto_start: e.target.checked })}
                  />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={loading}>
                  Save Settings
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Advanced Settings</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSaveSettings}>
                <Form.Group className="mb-3">
                  <Form.Label>API URL</Form.Label>
                  <Form.Control
                    type="text"
                    value={settings.api_url}
                    onChange={(e) => setSettings({ ...settings, api_url: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>WebSocket URL</Form.Label>
                  <Form.Control
                    type="text"
                    value={settings.websocket_url}
                    onChange={(e) => setSettings({ ...settings, websocket_url: e.target.value })}
                  />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={loading}>
                  Save Settings
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Account Settings</Card.Header>
            <Card.Body>
              <p>
                <strong>Username:</strong> {user?.username}
              </p>
              <Form onSubmit={handleChangePassword}>
                <Form.Group className="mb-3">
                  <Form.Label>Old Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={loading}>
                  Change Password
                </Button>
              </Form>
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <Button variant="danger" onClick={handleDeleteAccount} disabled={loading}>
                  Delete Account
                </Button>
                <Button variant="secondary" onClick={logout} disabled={loading}>
                  Logout
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SettingsPage;