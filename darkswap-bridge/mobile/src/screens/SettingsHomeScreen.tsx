import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Divider, Switch, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { SettingsStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define navigation prop type
type SettingsHomeScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

// Settings home screen component
const SettingsHomeScreen: React.FC = () => {
  const navigation = useNavigation<SettingsHomeScreenNavigationProp>();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useAppTheme();
  const theme = useTheme();

  // Handle navigation
  const navigateTo = (screen: keyof SettingsStackParamList) => {
    navigation.navigate(screen);
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Settings</Text>

        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title="Profile"
            description="Manage your profile information"
            left={props => <List.Icon {...props} icon="account" />}
            onPress={() => navigateTo('Profile')}
          />
          <Divider />
          <List.Item
            title="Security"
            description="Manage security settings"
            left={props => <List.Icon {...props} icon="shield-account" />}
            onPress={() => navigateTo('Security')}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Dark Mode"
            description="Toggle dark mode"
            left={props => <List.Icon {...props} icon={isDark ? 'weather-night' : 'white-balance-sunny'} />}
            right={() => (
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                color={theme.colors.primary}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Appearance Settings"
            description="Customize app appearance"
            left={props => <List.Icon {...props} icon="palette" />}
            onPress={() => navigateTo('Appearance')}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Notifications</List.Subheader>
          <List.Item
            title="Notification Settings"
            description="Manage notification preferences"
            left={props => <List.Icon {...props} icon="bell" />}
            onPress={() => navigateTo('Notifications')}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="About DarkSwap"
            description="Learn more about DarkSwap"
            left={props => <List.Icon {...props} icon="information" />}
            onPress={() => navigateTo('About')}
          />
        </List.Section>

        <List.Section>
          <List.Item
            title="Logout"
            description="Sign out of your account"
            left={props => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
            onPress={handleLogout}
            titleStyle={{ color: theme.colors.error }}
          />
        </List.Section>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  versionText: {
    opacity: 0.5,
  },
});

export default SettingsHomeScreen;