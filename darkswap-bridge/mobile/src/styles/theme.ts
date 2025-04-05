import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Define custom colors
const customColors = {
  primary: '#007bff',
  secondary: '#6c757d',
  accent: '#28a745',
  background: '#f8f9fa',
  surface: '#ffffff',
  error: '#dc3545',
  text: '#212529',
  onSurface: '#212529',
  disabled: '#6c757d',
  placeholder: '#6c757d',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  notification: '#dc3545',
  success: '#28a745',
  warning: '#ffc107',
  info: '#17a2b8',
  border: '#dee2e6',
};

// Define custom dark colors
const customDarkColors = {
  primary: '#0d6efd',
  secondary: '#6c757d',
  accent: '#20c997',
  background: '#121212',
  surface: '#1e1e1e',
  error: '#dc3545',
  text: '#f8f9fa',
  onSurface: '#f8f9fa',
  disabled: '#6c757d',
  placeholder: '#6c757d',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  notification: '#dc3545',
  success: '#20c997',
  warning: '#ffc107',
  info: '#0dcaf0',
  border: '#343a40',
};

// Define custom fonts
const customFonts = {
  regular: {
    fontFamily: 'System',
    fontWeight: 'normal' as 'normal',
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500' as '500',
  },
  light: {
    fontFamily: 'System',
    fontWeight: '300' as '300',
  },
  thin: {
    fontFamily: 'System',
    fontWeight: '100' as '100',
  },
};

// Create light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...customColors,
  },
  fonts: customFonts,
  roundness: 8,
};

// Create dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...customDarkColors,
  },
  fonts: customFonts,
  roundness: 8,
};

// Define spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Define typography
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold' as 'bold',
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: 'bold' as 'bold',
    lineHeight: 24,
  },
  h5: {
    fontSize: 16,
    fontWeight: 'bold' as 'bold',
    lineHeight: 22,
  },
  h6: {
    fontSize: 14,
    fontWeight: 'bold' as 'bold',
    lineHeight: 20,
  },
  subtitle1: {
    fontSize: 16,
    fontWeight: '500' as '500',
    lineHeight: 22,
  },
  subtitle2: {
    fontSize: 14,
    fontWeight: '500' as '500',
    lineHeight: 20,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal' as 'normal',
    lineHeight: 22,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal' as 'normal',
    lineHeight: 20,
  },
  button: {
    fontSize: 14,
    fontWeight: '500' as '500',
    lineHeight: 20,
    textTransform: 'uppercase' as 'uppercase',
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as 'normal',
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: '500' as '500',
    lineHeight: 14,
    textTransform: 'uppercase' as 'uppercase',
  },
};

// Define shadows
export const shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 8,
  },
};

// Export theme
export default {
  lightTheme,
  darkTheme,
  spacing,
  typography,
  shadows,
};