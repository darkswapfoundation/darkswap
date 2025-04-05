/**
 * Validation utilities for DarkSwap Mobile
 * 
 * This module provides utilities for validating various types of data.
 */

/**
 * Validate a required field
 * @param value - Value to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validateRequired = (value: any): string => {
  if (value === undefined || value === null || value === '') {
    return 'This field is required';
  }
  return '';
};

/**
 * Validate a number
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Error message if invalid, empty string if valid
 */
export const validateNumber = (
  value: any,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
    allowZero?: boolean;
  } = {}
): string => {
  const { required = false, min, max, integer = false, positive = false, allowZero = true } = options;
  
  // Check if required
  if (required && (value === undefined || value === null || value === '')) {
    return 'This field is required';
  }
  
  // Allow empty value if not required
  if (!required && (value === undefined || value === null || value === '')) {
    return '';
  }
  
  // Convert to number
  const num = Number(value);
  
  // Check if valid number
  if (isNaN(num)) {
    return 'Please enter a valid number';
  }
  
  // Check if integer
  if (integer && !Number.isInteger(num)) {
    return 'Please enter a whole number';
  }
  
  // Check if positive
  if (positive && num < 0) {
    return 'Please enter a positive number';
  }
  
  // Check if zero is allowed
  if (!allowZero && num === 0) {
    return 'Please enter a non-zero number';
  }
  
  // Check min value
  if (min !== undefined && num < min) {
    return `Please enter a number greater than or equal to ${min}`;
  }
  
  // Check max value
  if (max !== undefined && num > max) {
    return `Please enter a number less than or equal to ${max}`;
  }
  
  return '';
};

/**
 * Validate a positive number
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Error message if invalid, empty string if valid
 */
export const validatePositiveNumber = (
  value: any,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    allowZero?: boolean;
  } = {}
): string => {
  return validateNumber({ ...options, positive: true }, value);
};

/**
 * Validate a string
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Error message if invalid, empty string if valid
 */
export const validateString = (
  value: any,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  } = {}
): string => {
  const { required = false, minLength, maxLength, pattern, patternMessage } = options;
  
  // Check if required
  if (required && (value === undefined || value === null || value === '')) {
    return 'This field is required';
  }
  
  // Allow empty value if not required
  if (!required && (value === undefined || value === null || value === '')) {
    return '';
  }
  
  // Convert to string
  const str = String(value);
  
  // Check min length
  if (minLength !== undefined && str.length < minLength) {
    return `Please enter at least ${minLength} characters`;
  }
  
  // Check max length
  if (maxLength !== undefined && str.length > maxLength) {
    return `Please enter no more than ${maxLength} characters`;
  }
  
  // Check pattern
  if (pattern && !pattern.test(str)) {
    return patternMessage || 'Please enter a valid value';
  }
  
  return '';
};

/**
 * Validate an email address
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Error message if invalid, empty string if valid
 */
export const validateEmail = (
  value: any,
  options: {
    required?: boolean;
  } = {}
): string => {
  const { required = false } = options;
  
  // Check if required
  if (required && (value === undefined || value === null || value === '')) {
    return 'Email is required';
  }
  
  // Allow empty value if not required
  if (!required && (value === undefined || value === null || value === '')) {
    return '';
  }
  
  // Convert to string
  const str = String(value);
  
  // Check email pattern
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(str)) {
    return 'Please enter a valid email address';
  }
  
  return '';
};

/**
 * Validate a password
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Error message if invalid, empty string if valid
 */
export const validatePassword = (
  value: any,
  options: {
    required?: boolean;
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {}
): string => {
  const {
    required = false,
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true
  } = options;
  
  // Check if required
  if (required && (value === undefined || value === null || value === '')) {
    return 'Password is required';
  }
  
  // Allow empty value if not required
  if (!required && (value === undefined || value === null || value === '')) {
    return '';
  }
  
  // Convert to string
  const str = String(value);
  
  // Check min length
  if (str.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }
  
  // Check uppercase
  if (requireUppercase && !/[A-Z]/.test(str)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  // Check lowercase
  if (requireLowercase && !/[a-z]/.test(str)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  // Check numbers
  if (requireNumbers && !/[0-9]/.test(str)) {
    return 'Password must contain at least one number';
  }
  
  // Check special characters
  if (requireSpecialChars && !/[^A-Za-z0-9]/.test(str)) {
    return 'Password must contain at least one special character';
  }
  
  return '';
};

/**
 * Validate a Bitcoin address
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Error message if invalid, empty string if valid
 */
export const validateBitcoinAddress = (
  value: any,
  options: {
    required?: boolean;
    network?: 'mainnet' | 'testnet' | 'both';
  } = {}
): string => {
  const { required = false, network = 'both' } = options;
  
  // Check if required
  if (required && (value === undefined || value === null || value === '')) {
    return 'Bitcoin address is required';
  }
  
  // Allow empty value if not required
  if (!required && (value === undefined || value === null || value === '')) {
    return '';
  }
  
  // Convert to string
  const str = String(value);
  
  // Check address pattern
  // This is a simplified validation, in a real app you would use a Bitcoin library
  const mainnetPattern = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
  const testnetPattern = /^(m|n|2|tb1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
  
  if (network === 'mainnet' && !mainnetPattern.test(str)) {
    return 'Please enter a valid Bitcoin mainnet address';
  }
  
  if (network === 'testnet' && !testnetPattern.test(str)) {
    return 'Please enter a valid Bitcoin testnet address';
  }
  
  if (network === 'both' && !mainnetPattern.test(str) && !testnetPattern.test(str)) {
    return 'Please enter a valid Bitcoin address';
  }
  
  return '';
};

/**
 * Validate a date
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Error message if invalid, empty string if valid
 */
export const validateDate = (
  value: any,
  options: {
    required?: boolean;
    minDate?: Date;
    maxDate?: Date;
  } = {}
): string => {
  const { required = false, minDate, maxDate } = options;
  
  // Check if required
  if (required && (value === undefined || value === null || value === '')) {
    return 'Date is required';
  }
  
  // Allow empty value if not required
  if (!required && (value === undefined || value === null || value === '')) {
    return '';
  }
  
  // Convert to Date
  const date = value instanceof Date ? value : new Date(value);
  
  // Check if valid date
  if (isNaN(date.getTime())) {
    return 'Please enter a valid date';
  }
  
  // Check min date
  if (minDate && date < minDate) {
    return `Date must be on or after ${minDate.toLocaleDateString()}`;
  }
  
  // Check max date
  if (maxDate && date > maxDate) {
    return `Date must be on or before ${maxDate.toLocaleDateString()}`;
  }
  
  return '';
};

/**
 * Validate a URL
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Error message if invalid, empty string if valid
 */
export const validateUrl = (
  value: any,
  options: {
    required?: boolean;
    protocols?: string[];
  } = {}
): string => {
  const { required = false, protocols = ['http', 'https'] } = options;
  
  // Check if required
  if (required && (value === undefined || value === null || value === '')) {
    return 'URL is required';
  }
  
  // Allow empty value if not required
  if (!required && (value === undefined || value === null || value === '')) {
    return '';
  }
  
  // Convert to string
  const str = String(value);
  
  try {
    // Parse URL
    const url = new URL(str);
    
    // Check protocol
    if (protocols.length > 0 && !protocols.includes(url.protocol.replace(':', ''))) {
      return `URL must use one of the following protocols: ${protocols.join(', ')}`;
    }
  } catch (error) {
    return 'Please enter a valid URL';
  }
  
  return '';
};

/**
 * Validate a form field
 * @param value - Value to validate
 * @param validators - Array of validator functions
 * @returns Error message if invalid, empty string if valid
 */
export const validateField = (
  value: any,
  validators: Array<(value: any) => string>
): string => {
  for (const validator of validators) {
    const error = validator(value);
    if (error) {
      return error;
    }
  }
  return '';
};

/**
 * Validate a form
 * @param values - Form values
 * @param validations - Validation functions for each field
 * @returns Object with error messages for each field
 */
export const validateForm = (
  values: Record<string, any>,
  validations: Record<string, Array<(value: any) => string>>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  for (const field in validations) {
    const value = values[field];
    const validators = validations[field];
    
    const error = validateField(value, validators);
    if (error) {
      errors[field] = error;
    }
  }
  
  return errors;
};

/**
 * Check if a form is valid
 * @param errors - Form errors
 * @returns True if form is valid, false otherwise
 */
export const isFormValid = (errors: Record<string, string>): boolean => {
  return Object.values(errors).every(error => !error);
};

/**
 * Validate a phone number
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Error message if invalid, empty string if valid
 */
export const validatePhoneNumber = (
  value: any,
  options: {
    required?: boolean;
    countryCode?: string;
  } = {}
): string => {
  const { required = false, countryCode = 'US' } = options;
  
  // Check if required
  if (required && (value === undefined || value === null || value === '')) {
    return 'Phone number is required';
  }
  
  // Allow empty value if not required
  if (!required && (value === undefined || value === null || value === '')) {
    return '';
  }
  
  // Convert to string
  const str = String(value);
  
  // Simple phone number validation (this should be replaced with a proper library in a real app)
  const phonePattern = /^\+?[0-9]{10,15}$/;
  if (!phonePattern.test(str.replace(/[\s()-]/g, ''))) {
    return 'Please enter a valid phone number';
  }
  
  return '';
};