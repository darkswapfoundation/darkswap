import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../navigation/types';
import { validateRequired, isValidEmail } from '../utils/validators';
import axios from 'axios';
import { API_URL } from '@env';

// Define navigation prop type
type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

// Forgot password screen component
const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const theme = useTheme();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handle reset password
  const handleResetPassword = async () => {
    try {
      // Validate email
      if (!email) {
        setValidationError('Email is required');
        return;
      }

      if (!isValidEmail(email)) {
        setValidationError('Please enter a valid email address');
        return;
      }

      // Clear validation error
      setValidationError(null);
      
      // Set loading state
      setLoading(true);
      setError(null);

      // Send reset password request
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      
      // Set success state
      setSuccess(true);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send reset password email');
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle login navigation
  const handleLoginNavigation = () => {
    navigation.navigate('Login');
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
            <Text style={[styles.title, { color: theme.colors.primary }]}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password
            </Text>

            {error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}

            <TextInput
              label="Email"
              value={email}
              onChangeText={(text: string) => {
                setEmail(text);
                if (validationError) {
                  setValidationError(null);
                }
              }}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              mode="outlined"
              error={!!validationError}
              disabled={success}
            />
            {validationError && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {validationError}
              </Text>
            )}

            {success ? (
              <View style={styles.successContainer}>
                <Text style={[styles.successText, { color: theme.colors.primary }]}>
                  Reset password link sent! Check your email.
                </Text>
                <Button
                  mode="contained"
                  onPress={handleLoginNavigation}
                  style={styles.button}
                >
                  Back to Login
                </Button>
              </View>
            ) : (
              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                Reset Password
              </Button>
            )}

            {!success && (
              <Button
                mode="text"
                onPress={handleLoginNavigation}
                style={styles.backButton}
              >
                Back to Login
              </Button>
            )}
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={success}
        onDismiss={() => {}}
        duration={5000}
        action={{
          label: 'OK',
          onPress: () => {},
        }}
      >
        Reset password link sent! Check your email.
      </Snackbar>
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
    justifyContent: 'center',
    padding: 16,
  },
  surface: {
    padding: 24,
    borderRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.7,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 8,
  },
  button: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
  },
  backButton: {
    marginTop: 8,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  successContainer: {
    width: '100%',
    alignItems: 'center',
  },
  successText: {
    marginVertical: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;