import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { RootNavigator } from './navigation';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ApiProvider } from './contexts/ApiContext';
import { WalletProvider } from './contexts/WalletContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Main app content with theme context
const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();
  
  return (
    <>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.background} 
      />
      <ApiProvider>
        <WalletProvider>
          <NotificationProvider>
            <RootNavigator />
          </NotificationProvider>
        </WalletProvider>
      </ApiProvider>
    </>
  );
};

// Main app component
const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;