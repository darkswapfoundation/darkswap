import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { AuthStackParamList } from '../navigation/types';
import { validateRequired, validatePassword } from '../utils/validators';

// Define navigation prop type
type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

// Login screen component
const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, loading, error, clearError } = useAuth();
  const theme = useTheme();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  // Handle login
  const handleLogin = async () => {
    try {
      // Clear previous errors
      clearError();
      
      // Validate inputs
      const usernameValidation = validateRequired(username, 'Username');
      const passwordValidation = validateRequired(password, 'Password');
      
      if (!usernameValidation.isValid || !passwordValidation.isValid) {
        setValidationErrors({
          username: !usernameValidation.isValid ? usernameValidation.message : undefined,
          password: !passwordValidation.isValid ? passwordValidation.message : undefined,
        });
        return;
      }
      
      // Clear validation errors
      setValidationErrors({});
      
      // Login
      await login(username, password);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Handle register navigation
  const handleRegisterNavigation = () => {
    navigation.navigate('Register');
  };

  // Handle forgot password navigation
  const handleForgotPasswordNavigation = () => {
    navigation.navigate('ForgotPassword');
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
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: theme.colors.primary }]}>DarkSwap Bridge</Text>
            <Text style={styles.subtitle}>Login to your account</Text>

            {error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}

            <TextInput
              label="Username"
              value={username}
              onChangeText={(text) => {
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
              onChangeText={(text) => {
                setPassword(text);
                if (validationErrors.password) {
                  setValidationErrors({ ...validationErrors, password: undefined });
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

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Login
            </Button>

            <View style={styles.links}>
              <Button
                mode="text"
                onPress={handleForgotPasswordNavigation}
                style={styles.link}
              >
                Forgot Password?
              </Button>
              <Button
                mode="text"
                onPress={handleRegisterNavigation}
                style={styles.link}
              >
                Create Account
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
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
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
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  link: {
    marginHorizontal: 8,
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

export default LoginScreen;