import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { WalletStackParamList } from '../navigation/types';

// Define navigation prop type
type CreateWalletScreenNavigationProp = StackNavigationProp<WalletStackParamList, 'CreateWallet'>;

// Create wallet screen component
const CreateWalletScreen: React.FC = () => {
  const navigation = useNavigation<CreateWalletScreenNavigationProp>();
  const { api, loading, error } = useApi();
  const { addNotification } = useNotification();
  const theme = useTheme();
  const [walletName, setWalletName] = useState<string>('');
  const [passphrase, setPassphrase] = useState<string>('');
  const [confirmPassphrase, setConfirmPassphrase] = useState<string>('');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [showConfirmPassphrase, setShowConfirmPassphrase] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate form
  const validateForm = (): boolean => {
    // Validate wallet name
    if (!walletName.trim()) {
      setValidationError('Wallet name is required');
      return false;
    }

    // Validate passphrase
    if (!passphrase) {
      setValidationError('Passphrase is required');
      return false;
    }

    // Validate passphrase length
    if (passphrase.length < 8) {
      setValidationError('Passphrase must be at least 8 characters long');
      return false;
    }

    // Validate passphrase match
    if (passphrase !== confirmPassphrase) {
      setValidationError('Passphrases do not match');
      return false;
    }

    // Clear validation error
    setValidationError(null);
    return true;
  };

  // Handle create wallet
  const handleCreateWallet = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      // Create wallet
      await api.post('/bridge/wallet', {
        command: 'CreateWallet',
        name: walletName,
        passphrase: passphrase,
      });

      // Show success notification
      addNotification('success', 'Wallet created successfully');

      // Navigate back to wallet home
      navigation.navigate('WalletHome');
    } catch (error: any) {
      // Show error notification
      setValidationError(error.response?.data?.message || 'Failed to create wallet');
      addNotification('error', error.response?.data?.message || 'Failed to create wallet');
    }
  };

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
            <Text style={[styles.title, { color: theme.colors.primary }]}>Create New Wallet</Text>
            <Text style={styles.subtitle}>
              Create a new wallet to store your Bitcoin, Runes, and Alkanes
            </Text>

            {error && <Text style={styles.error}>{error}</Text>}
            {validationError && <Text style={styles.error}>{validationError}</Text>}

            <TextInput
              label="Wallet Name"
              value={walletName}
              onChangeText={setWalletName}
              style={styles.input}
              mode="outlined"
            />
            <HelperText type="info">
              Choose a name to identify your wallet
            </HelperText>

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
            />
            <HelperText type="info">
              Your passphrase must be at least 8 characters long
            </HelperText>

            <TextInput
              label="Confirm Passphrase"
              value={confirmPassphrase}
              onChangeText={setConfirmPassphrase}
              secureTextEntry={!showConfirmPassphrase}
              right={
                <TextInput.Icon
                  icon={showConfirmPassphrase ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
                />
              }
              style={styles.input}
              mode="outlined"
            />
            <HelperText type="info">
              Re-enter your passphrase to confirm
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
                onPress={handleCreateWallet}
                style={styles.button}
                loading={loading}
                disabled={loading}
              >
                Create Wallet
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
});

export default CreateWalletScreen;