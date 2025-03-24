import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

// Icons
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  BellIcon,
  CogIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface SettingsProps {
  isWalletConnected: boolean;
  isSDKInitialized: boolean;
}

interface SettingsOption {
  id: string;
  name: string;
  description: string;
  options: {
    value: string;
    label: string;
    icon?: JSX.Element;
  }[];
  value: string;
}

interface ToggleOption {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

type ThemeMode = 'light' | 'dark' | 'system';

const Settings: React.FC<SettingsProps> = () => {
  const { mode, toggleMode } = useTheme();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [settingsOptions, setSettingsOptions] = useState<SettingsOption[]>([
    {
      id: 'theme',
      name: 'Theme',
      description: 'Choose your preferred theme for the application',
      options: [
        { value: 'light', label: 'Light', icon: <SunIcon className="w-5 h-5" /> },
        { value: 'dark', label: 'Dark', icon: <MoonIcon className="w-5 h-5" /> },
        { value: 'system', label: 'System', icon: <ComputerDesktopIcon className="w-5 h-5" /> },
      ],
      value: mode || 'dark',
    },
    {
      id: 'currency',
      name: 'Display Currency',
      description: 'Choose your preferred currency for displaying values',
      options: [
        { value: 'usd', label: 'USD ($)' },
        { value: 'eur', label: 'EUR (€)' },
        { value: 'gbp', label: 'GBP (£)' },
        { value: 'jpy', label: 'JPY (¥)' },
        { value: 'btc', label: 'BTC (₿)' },
      ],
      value: 'usd',
    },
    {
      id: 'network',
      name: 'Network',
      description: 'Choose which network to connect to',
      options: [
        { value: 'mainnet', label: 'Bitcoin Mainnet' },
        { value: 'testnet', label: 'Bitcoin Testnet' },
        { value: 'regtest', label: 'Regtest' },
      ],
      value: 'mainnet',
    },
  ]);

  const [toggleOptions, setToggleOptions] = useState<ToggleOption[]>([
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Receive notifications for trades, orders, and other important events',
      enabled: true,
    },
    {
      id: 'sounds',
      name: 'Sound Effects',
      description: 'Play sound effects for trades, orders, and other important events',
      enabled: false,
    },
    {
      id: 'advanced_mode',
      name: 'Advanced Mode',
      description: 'Enable advanced trading features and options',
      enabled: false,
    },
    {
      id: 'auto_connect',
      name: 'Auto-Connect Wallet',
      description: 'Automatically connect to your wallet when the application loads',
      enabled: true,
    },
    {
      id: 'privacy_mode',
      name: 'Enhanced Privacy Mode',
      description: 'Hide sensitive information and use additional privacy features',
      enabled: false,
    },
  ]);

  // Handle option change
  const handleOptionChange = (id: string, value: string) => {
    setSettingsOptions(
      settingsOptions.map((option) =>
        option.id === id ? { ...option, value } : option
      )
    );

    // Special handling for theme
    if (id === 'theme' && toggleMode) {
      toggleMode(value as ThemeMode);
    }
  };

  // Handle toggle change
  const handleToggleChange = (id: string) => {
    setToggleOptions(
      toggleOptions.map((option) =>
        option.id === id ? { ...option, enabled: !option.enabled } : option
      )
    );
  };

  // Save settings
  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(null);

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(null);
      }, 3000);
    }, 1000);
  };

  // Reset settings
  const handleReset = () => {
    // Reset to default values
    setSettingsOptions([
      {
        id: 'theme',
        name: 'Theme',
        description: 'Choose your preferred theme for the application',
        options: [
          { value: 'light', label: 'Light', icon: <SunIcon className="w-5 h-5" /> },
          { value: 'dark', label: 'Dark', icon: <MoonIcon className="w-5 h-5" /> },
          { value: 'system', label: 'System', icon: <ComputerDesktopIcon className="w-5 h-5" /> },
        ],
        value: 'dark',
      },
      {
        id: 'currency',
        name: 'Display Currency',
        description: 'Choose your preferred currency for displaying values',
        options: [
          { value: 'usd', label: 'USD ($)' },
          { value: 'eur', label: 'EUR (€)' },
          { value: 'gbp', label: 'GBP (£)' },
          { value: 'jpy', label: 'JPY (¥)' },
          { value: 'btc', label: 'BTC (₿)' },
        ],
        value: 'usd',
      },
      {
        id: 'network',
        name: 'Network',
        description: 'Choose which network to connect to',
        options: [
          { value: 'mainnet', label: 'Bitcoin Mainnet' },
          { value: 'testnet', label: 'Bitcoin Testnet' },
          { value: 'regtest', label: 'Regtest' },
        ],
        value: 'mainnet',
      },
    ]);

    setToggleOptions([
      {
        id: 'notifications',
        name: 'Notifications',
        description: 'Receive notifications for trades, orders, and other important events',
        enabled: true,
      },
      {
        id: 'sounds',
        name: 'Sound Effects',
        description: 'Play sound effects for trades, orders, and other important events',
        enabled: false,
      },
      {
        id: 'advanced_mode',
        name: 'Advanced Mode',
        description: 'Enable advanced trading features and options',
        enabled: false,
      },
      {
        id: 'auto_connect',
        name: 'Auto-Connect Wallet',
        description: 'Automatically connect to your wallet when the application loads',
        enabled: true,
      },
      {
        id: 'privacy_mode',
        name: 'Enhanced Privacy Mode',
        description: 'Hide sensitive information and use additional privacy features',
        enabled: false,
      },
    ]);

    // Update theme if needed
    if (toggleMode && mode !== 'dark') {
      toggleMode('dark');
    }
  };

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">
          <span className="text-white">Settings</span>
        </h1>
        <p className="text-gray-400 mt-1">
          Customize your DarkSwap experience
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-6"
        >
          <h2 className="text-xl font-display font-bold mb-6 flex items-center">
            <CogIcon className="w-6 h-6 text-twilight-neon-blue mr-2" />
            Appearance & Preferences
          </h2>

          <div className="space-y-6">
            {settingsOptions.map((option) => (
              <div key={option.id} className="border-b border-twilight-dark pb-6 last:border-0 last:pb-0">
                <div className="mb-2">
                  <h3 className="font-medium">{option.name}</h3>
                  <p className="text-sm text-gray-400">{option.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {option.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleOptionChange(option.id, opt.value)}
                      className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                        option.value === opt.value
                          ? 'bg-twilight-primary text-white'
                          : 'bg-twilight-darker text-gray-400 hover:bg-twilight-dark hover:text-white'
                      }`}
                    >
                      {opt.icon && <span className="mr-2">{opt.icon}</span>}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Toggle Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card p-6"
        >
          <h2 className="text-xl font-display font-bold mb-6 flex items-center">
            <BellIcon className="w-6 h-6 text-twilight-neon-purple mr-2" />
            Notifications & Features
          </h2>

          <div className="space-y-6">
            {toggleOptions.map((option) => (
              <div key={option.id} className="flex justify-between items-center border-b border-twilight-dark pb-6 last:border-0 last:pb-0">
                <div>
                  <h3 className="font-medium">{option.name}</h3>
                  <p className="text-sm text-gray-400">{option.description}</p>
                </div>
                <button
                  onClick={() => handleToggleChange(option.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    option.enabled ? 'bg-twilight-neon-green' : 'bg-twilight-dark'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      option.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card p-6"
        >
          <h2 className="text-xl font-display font-bold mb-6 flex items-center">
            <ShieldCheckIcon className="w-6 h-6 text-twilight-neon-green mr-2" />
            Security
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium">Session Timeout</h3>
              <p className="text-sm text-gray-400 mb-4">
                Automatically disconnect your wallet after a period of inactivity
              </p>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 rounded-lg bg-twilight-primary text-white">
                  15 minutes
                </button>
                <button className="px-4 py-2 rounded-lg bg-twilight-darker text-gray-400 hover:bg-twilight-dark hover:text-white">
                  30 minutes
                </button>
                <button className="px-4 py-2 rounded-lg bg-twilight-darker text-gray-400 hover:bg-twilight-dark hover:text-white">
                  1 hour
                </button>
                <button className="px-4 py-2 rounded-lg bg-twilight-darker text-gray-400 hover:bg-twilight-dark hover:text-white">
                  Never
                </button>
              </div>
            </div>

            <div className="border-t border-twilight-dark pt-6">
              <h3 className="font-medium">Clear Data</h3>
              <p className="text-sm text-gray-400 mb-4">
                Clear all local data including settings, cached orders, and trade history
              </p>
              <button className="btn btn-error">
                Clear All Data
              </button>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleReset}
            className="btn btn-secondary"
          >
            Reset to Defaults
          </button>
          <div className="flex items-center space-x-4">
            {saveSuccess === true && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center text-green-400"
              >
                <CheckIcon className="w-5 h-5 mr-1" />
                <span>Settings saved</span>
              </motion.div>
            )}
            {saveSuccess === false && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center text-red-400"
              >
                <XMarkIcon className="w-5 h-5 mr-1" />
                <span>Failed to save</span>
              </motion.div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;