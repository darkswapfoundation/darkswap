import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { ThemeType } from '../utils/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../navigation/types';

type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, isDark, themeType, setThemeType } = useTheme();
  const { wallet, disconnect } = useWallet();
  
  // State for settings
  const [notifications, setNotifications] = useState({
    trades: true,
    orders: true,
    transactions: true,
    system: true,
  });
  
  const [biometrics, setBiometrics] = useState(false);
  const [autoLock, setAutoLock] = useState(5); // minutes
  
  // Handle theme change
  const handleThemeChange = (newTheme: ThemeType) => {
    setThemeType(newTheme);
  };
  
  // Handle notification toggle
  const handleNotificationToggle = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };
  
  // Handle biometrics toggle
  const handleBiometricsToggle = () => {
    setBiometrics(prev => !prev);
  };
  
  // Handle auto lock change
  const handleAutoLockChange = (minutes: number) => {
    setAutoLock(minutes);
  };
  
  // Handle disconnect wallet
  const handleDisconnectWallet = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: disconnect,
        },
      ]
    );
  };
  
  // Handle clear cache
  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the cache? This will not affect your wallet or settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // In a real app, you would clear the cache here
            Alert.alert('Cache Cleared', 'The cache has been cleared successfully.');
          },
        },
      ]
    );
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Appearance
        </Text>
        
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.settingTitle, { color: theme.text.primary }]}>
            Theme
          </Text>
          
          <View style={styles.themeButtons}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                {
                  backgroundColor: themeType === 'light' ? theme.primary : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color: themeType === 'light' ? '#ffffff' : theme.text.primary,
                  },
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeButton,
                {
                  backgroundColor: themeType === 'dark' ? theme.primary : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color: themeType === 'dark' ? '#ffffff' : theme.text.primary,
                  },
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.themeButton,
                {
                  backgroundColor: themeType === 'system' ? theme.primary : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => handleThemeChange('system')}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color: themeType === 'system' ? '#ffffff' : theme.text.primary,
                  },
                ]}
              >
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Notifications
        </Text>
        
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingTitle, { color: theme.text.primary }]}>
              Trade Notifications
            </Text>
            <Switch
              value={notifications.trades}
              onValueChange={() => handleNotificationToggle('trades')}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingTitle, { color: theme.text.primary }]}>
              Order Notifications
            </Text>
            <Switch
              value={notifications.orders}
              onValueChange={() => handleNotificationToggle('orders')}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingTitle, { color: theme.text.primary }]}>
              Transaction Notifications
            </Text>
            <Switch
              value={notifications.transactions}
              onValueChange={() => handleNotificationToggle('transactions')}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingTitle, { color: theme.text.primary }]}>
              System Notifications
            </Text>
            <Switch
              value={notifications.system}
              onValueChange={() => handleNotificationToggle('system')}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </View>
      
      {/* Security Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Security
        </Text>
        
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingTitle, { color: theme.text.primary }]}>
              Biometric Authentication
            </Text>
            <Switch
              value={biometrics}
              onValueChange={handleBiometricsToggle}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>
          
          <Text style={[styles.settingTitle, { color: theme.text.primary }]}>
            Auto-Lock
          </Text>
          
          <View style={styles.autoLockButtons}>
            {[1, 5, 15, 30, 60].map(minutes => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.autoLockButton,
                  {
                    backgroundColor: autoLock === minutes ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => handleAutoLockChange(minutes)}
              >
                <Text
                  style={[
                    styles.autoLockButtonText,
                    {
                      color: autoLock === minutes ? '#ffffff' : theme.text.primary,
                    },
                  ]}
                >
                  {minutes} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
      {/* Wallet Section */}
      {wallet && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Wallet
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.settingTitle, { color: theme.text.primary }]}>
              Connected Wallet
            </Text>
            <Text style={[styles.walletName, { color: theme.text.secondary }]}>
              {wallet.name}
            </Text>
            
            <TouchableOpacity
              style={[styles.dangerButton, { borderColor: theme.error }]}
              onPress={handleDisconnectWallet}
            >
              <Text style={[styles.dangerButtonText, { color: theme.error }]}>
                Disconnect Wallet
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          About
        </Text>
        
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.settingTitle, { color: theme.text.primary }]}>
            Version
          </Text>
          <Text style={[styles.versionText, { color: theme.text.secondary }]}>
            DarkSwap v1.1.0
          </Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => {
              navigation.navigate('About');
            }}
          >
            <Text style={styles.buttonText}>
              About DarkSwap
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: theme.error }]}
            onPress={handleClearCache}
          >
            <Text style={[styles.dangerButtonText, { color: theme.error }]}>
              Clear Cache
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  themeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  autoLockButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  autoLockButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  autoLockButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  walletName: {
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  dangerButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 14,
    marginBottom: 16,
  },
});

export default SettingsScreen;