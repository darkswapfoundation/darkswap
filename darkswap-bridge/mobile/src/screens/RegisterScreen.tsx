import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { AuthStackParamList } from '../navigation/types';
import { validateRequired, validatePassword } from '../utils/validators';

// Define navigation prop type
type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

// Register screen component
const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, loading, error, clearError } = useAuth();
  const theme = useTheme();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Handle register
  const handleRegister = async () => {
    try {
      // Clear previous errors
      clearError();
      
      // Validate inputs
      const usernameValidation = validateRequired(username, 'Username');
      const passwordValidation = validatePassword(password);
      const confirmPasswordValidation = { 
        isValid: password === confirmPassword, 
        message: 'Passwords do not match' 
      };
      
      if (!usernameValidation.isValid || !passwordValidation.isValid || !confirmPasswordValidation.isValid) {
        setValidationErrors({
          username: !usernameValidation.isValid ? usernameValidation.message : undefined,
          password: !passwordValidation.isValid ? passwordValidation.message : undefined,
          confirmPassword: !confirmPasswordValidation.isValid ? confirmPasswordValidation.message : undefined,
        });
        return;
      }
      
      // Clear validation errors
      setValidationErrors({});
      
      // Register
      await register(username, password);
    } catch (error) {
      console.error('Registration error:', error);
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
            <Text style={[styles.title, { color: theme.colors.primary }]}>Create Account</Text>
            <Text style={styles.subtitle}>Join DarkSwap Bridge</Text>

            {error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}

            <TextInput
              label="Username"
              value={username}
              onChangeText={(text: string) => {
                setUsername(text);
                if (validationErrors.username) {
                  setValidationErrors({ ...validationErrors, username: undefined });
                }
              }}
              style={styles.input}
              autoCapitalize="none"
              mode="outlined"
              error={!!validationErrors.username}
            />
            {validationErrors.username && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {validationErrors.username}
              </Text>
            )}

            <TextInput
              label="Password"
              value={password}
              onChangeText={(text: string) => {
                setPassword(text);
                if (validationErrors.password) {
                  setValidationErrors({ ...validationErrors, password: undefined });
                }
                if (validationErrors.confirmPassword && text === confirmPassword) {
                  setValidationErrors({ ...validationErrors, confirmPassword: undefined });
                }
              }}
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              mode="outlined"
              error={!!validationErrors.password}
            />
            {validationErrors.password && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {validationErrors.password}
              </Text>
            )}

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text: string) => {
                setConfirmPassword(text);
                if (validationErrors.confirmPassword && text === password) {
                  setValidationErrors({ ...validationErrors, confirmPassword: undefined });
                }
              }}
              secureTextEntry={!showConfirmPassword}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              style={styles.input}
              mode="outlined"
              error={!!validationErrors.confirmPassword}
            />
            {validationErrors.confirmPassword && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {validationErrors.confirmPassword}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Register
            </Button>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <Button
                mode="text"
                onPress={handleLoginNavigation}
                style={styles.loginButton}
              >
                Login
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
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loginText: {
    opacity: 0.7,
  },
  loginButton: {
    marginLeft: 8,
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
});

export default RegisterScreen;