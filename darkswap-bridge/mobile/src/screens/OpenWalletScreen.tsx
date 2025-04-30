import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, FlatList } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, HelperText, List, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { WalletStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define navigation prop type
type OpenWalletScreenNavigationProp = StackNavigationProp<WalletStackParamList, 'OpenWallet'>;

// Define wallet info type
interface WalletInfo {
  name: string;
  created_at: number;
  last_used: number;
}

// Open wallet screen component
const OpenWalletScreen: React.FC = () => {
  const navigation = useNavigation<OpenWalletScreenNavigationProp>();
  const { api, loading, error } = useApi();
  const { addNotification } = useNotification();
  const theme = useTheme();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState<string>('');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loadingWallets, setLoadingWallets] = useState<boolean>(false);

  // Fetch wallets on mount
  useEffect(() => {
    fetchWallets();
  }, []);

  // Fetch wallets
  const fetchWallets = async () => {
    try {
      setLoadingWallets(true);
      const response = await api.get('/bridge/wallets');
      setWallets(response.data.wallets || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      addNotification('error', 'Failed to fetch wallets');
    } finally {
      setLoadingWallets(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    // Validate wallet selection
    if (!selectedWallet) {
      setValidationError('Please select a wallet');
      return false;
    }

    // Validate passphrase
    if (!passphrase) {
      setValidationError('Passphrase is required');
      return false;
    }

    // Clear validation error
    setValidationError(null);
    return true;
  };

  // Handle open wallet
  const handleOpenWallet = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      // Open wallet
      await api.post('/bridge/wallet', {
        command: 'OpenWallet',
        name: selectedWallet,
        passphrase: passphrase,
      });

      // Show success notification
      addNotification('success', 'Wallet opened successfully');

      // Navigate back to wallet home
      navigation.navigate('WalletHome');
    } catch (error: any) {
      // Show error notification
      setValidationError(error.response?.data?.message || 'Failed to open wallet');
      addNotification('error', error.response?.data?.message || 'Failed to open wallet');
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Render wallet item
  const renderWalletItem = ({ item }: { item: WalletInfo }) => (
    <List.Item
      title={item.name}
      description={`Created: ${formatDate(item.created_at)} | Last used: ${formatDate(item.last_used)}`}
      left={props => <List.Icon {...props} icon="wallet" />}
      right={props => 
        selectedWallet === item.name ? (
          <List.Icon {...props} icon="check-circle" color={theme.colors.primary} />
        ) : null
      }
      onPress={() => setSelectedWallet(item.name)}
      style={[
        styles.walletItem,
        selectedWallet === item.name && { backgroundColor: theme.colors.primary + '20' }
      ]}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.title, { color: theme.colors.primary }]}>Open Wallet</Text>
            <Text style={styles.subtitle}>
              Select a wallet to open
            </Text>

            {error && <Text style={styles.error}>{error}</Text>}
            {validationError && <Text style={styles.error}>{validationError}</Text>}

            <Text style={styles.sectionTitle}>Available Wallets</Text>
            
            {loadingWallets ? (
              <ActivityIndicator animating={true} color={theme.colors.primary} style={styles.loading} />
            ) : wallets.length > 0 ? (
              <View style={styles.walletList}>
                <FlatList
                  data={wallets}
                  renderItem={renderWalletItem}
                  keyExtractor={(item) => item.name}
                  ItemSeparatorComponent={() => <Divider />}
                  scrollEnabled={false}
                />
              </View>
            ) : (
              <Text style={styles.noWalletsText}>No wallets found</Text>
            )}

            <TextInput
              label="Passphrase"
              value={passphrase}
              onChangeText={setPassphrase}
              secureTextEntry={!showPassphrase}
              right={
                <TextInput.Icon
                  icon={showPassphrase ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassphrase(!showPassphrase)}
                />
              }
              style={styles.input}
              mode="outlined"
              disabled={!selectedWallet}
            />
            <HelperText type="info">
              Enter the passphrase for the selected wallet
            </HelperText>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.button}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleOpenWallet}
                style={styles.button}
                loading={loading}
                disabled={loading || !selectedWallet}
              >
                Open Wallet
              </Button>
            </View>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 16,
  },
  surface: {
    padding: 24,
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  walletList: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  walletItem: {
    borderRadius: 4,
  },
  input: {
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  loading: {
    marginVertical: 16,
  },
  noWalletsText: {
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
});

export default OpenWalletScreen;