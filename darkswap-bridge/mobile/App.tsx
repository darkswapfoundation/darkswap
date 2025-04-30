import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { RootNavigator } from './src/navigation';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ApiProvider } from './src/contexts/ApiContext';
import { WalletProvider } from './src/contexts/WalletContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ApiProvider>
          <WalletProvider>
            <NotificationProvider>
              <RootNavigator />
            </NotificationProvider>
          </WalletProvider>
        </ApiProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;