import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  testID
}) => {
  const { theme, isDark } = useTheme();
  
  // Get button colors based on variant and theme
  const getButtonColors = () => {
    const colors = {
      backgroundColor: '',
      textColor: '',
      borderColor: ''
    };
    
    switch (variant) {
      case 'primary':
        colors.backgroundColor = isDark ? '#3f51b5' : '#2196f3';
        colors.textColor = '#ffffff';
        colors.borderColor = 'transparent';
        break;
      case 'secondary':
        colors.backgroundColor = isDark ? '#424242' : '#f5f5f5';
        colors.textColor = isDark ? '#ffffff' : '#212121';
        colors.borderColor = 'transparent';
        break;
      case 'outline':
        colors.backgroundColor = 'transparent';
        colors.textColor = isDark ? '#3f51b5' : '#2196f3';
        colors.borderColor = isDark ? '#3f51b5' : '#2196f3';
        break;
      case 'text':
        colors.backgroundColor = 'transparent';
        colors.textColor = isDark ? '#3f51b5' : '#2196f3';
        colors.borderColor = 'transparent';
        break;
      case 'danger':
        colors.backgroundColor = isDark ? '#b71c1c' : '#f44336';
        colors.textColor = '#ffffff';
        colors.borderColor = 'transparent';
        break;
      case 'success':
        colors.backgroundColor = isDark ? '#1b5e20' : '#4caf50';
        colors.textColor = '#ffffff';
        colors.borderColor = 'transparent';
        break;
      default:
        colors.backgroundColor = isDark ? '#3f51b5' : '#2196f3';
        colors.textColor = '#ffffff';
        colors.borderColor = 'transparent';
    }
    
    // Adjust colors for disabled state
    if (disabled) {
      colors.backgroundColor = isDark ? '#424242' : '#e0e0e0';
      colors.textColor = isDark ? '#757575' : '#9e9e9e';
      colors.borderColor = 'transparent';
    }
    
    return colors;
  };
  
  // Get button size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          fontSize: 12,
          iconSize: 16
        };
      case 'large':
        return {
          paddingVertical: 14,
          paddingHorizontal: 24,
          fontSize: 16,
          iconSize: 24
        };
      case 'medium':
      default:
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          fontSize: 14,
          iconSize: 20
        };
    }
  };
  
  const colors = getButtonColors();
  const sizeStyles = getSizeStyles();
  
  // Button container styles
  const buttonStyles = [
    styles.button,
    {
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal
    },
    fullWidth && styles.fullWidth,
    style
  ];
  
  // Button text styles
  const buttonTextStyles = [
    styles.buttonText,
    {
      color: colors.textColor,
      fontSize: sizeStyles.fontSize
    },
    textStyle
  ];
  
  // Render loading spinner
  if (loading) {
    return (
      <TouchableOpacity
        style={buttonStyles}
        disabled={true}
        testID={testID}
      >
        <ActivityIndicator size="small" color={colors.textColor} />
      </TouchableOpacity>
    );
  }
  
  // Render button with icon
  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      {icon && iconPosition === 'left' && (
        <Icon
          name={icon}
          size={sizeStyles.iconSize}
          color={colors.textColor}
          style={styles.iconLeft}
        />
      )}
      <Text style={buttonTextStyles}>{title}</Text>
      {icon && iconPosition === 'right' && (
        <Icon
          name={icon}
          size={sizeStyles.iconSize}
          color={colors.textColor}
          style={styles.iconRight}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center'
  },
  fullWidth: {
    width: '100%'
  },
  iconLeft: {
    marginRight: 8
  },
  iconRight: {
    marginLeft: 8
  }
});

export default Button;