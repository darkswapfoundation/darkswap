// Mock modules that cause issues in tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock react-native modules that use native code
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock useColorScheme
  RN.useColorScheme = jest.fn(() => 'light');
  
  // Mock Settings
  RN.Settings = {
    get: jest.fn(() => null),
    set: jest.fn(),
    watchKeys: jest.fn(() => ({ remove: jest.fn() })),
  };
  
  // Mock other problematic modules
  RN.NativeModules = {
    ...RN.NativeModules,
    SettingsManager: {
      getConstants: () => ({
        settings: {}
      }),
      setValues: jest.fn(),
      deleteValues: jest.fn(),
    },
    StatusBarManager: {
      getConstants: () => ({
        height: 44,
        statusBarHeight: 44,
      }),
      setStyle: jest.fn(),
      setHidden: jest.fn(),
      setNetworkActivityIndicatorVisible: jest.fn(),
    },
  };
  
  return RN;
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
  multiRemove: jest.fn(() => Promise.resolve(null)),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useIsFocused: () => true,
  };
});

// Mock @react-navigation/stack
jest.mock('@react-navigation/stack', () => {
  return {
    createStackNavigator: jest.fn().mockReturnValue({
      Navigator: 'MockStackNavigator',
      Screen: 'MockStackScreen',
    }),
  };
});

// Mock @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => {
  return {
    createBottomTabNavigator: jest.fn().mockReturnValue({
      Navigator: 'MockTabNavigator',
      Screen: 'MockTabScreen',
    }),
  };
});

// Global setup
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    headers: {
      get: jest.fn(),
      map: {},
    },
  })
);

// Console error and warn mocks to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Ignore specific React Native warnings
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || 
     args[0].includes('ReactNative:') ||
     args[0].includes('Animated:') ||
     args[0].includes('TurboModuleRegistry') ||
     args[0].includes('SettingsManager'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Ignore specific React Native warnings
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || 
     args[0].includes('ReactNative:') ||
     args[0].includes('Animated:') ||
     args[0].includes('Clipboard') ||
     args[0].includes('ProgressBar') ||
     args[0].includes('PushNotification') ||
     args[0].includes('NativeEventEmitter'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};