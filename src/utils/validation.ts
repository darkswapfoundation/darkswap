/**
 * Validation utility for DarkSwap
 * 
 * This utility provides functions for validating data in the DarkSwap application.
 */

import { logger } from './logger';

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation schema field
 */
export interface ValidationSchemaField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  validate?: (value: any) => boolean | string;
  items?: ValidationSchema; // For array type
  properties?: ValidationSchema; // For object type
}

/**
 * Validation schema
 */
export interface ValidationSchema {
  [field: string]: ValidationSchemaField;
}

/**
 * Validate data against a schema
 * 
 * @param data The data to validate
 * @param schema The validation schema
 * @returns The validation result
 */
export function validate(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate each field in the schema
  for (const field in schema) {
    const schemaField = schema[field];
    const value = data[field];
    
    // Check if the field is required
    if (schemaField.required && (value === undefined || value === null)) {
      errors.push({
        field,
        message: `${field} is required`,
      });
      continue;
    }
    
    // Skip validation if the field is not required and the value is undefined or null
    if ((value === undefined || value === null) && !schemaField.required) {
      continue;
    }
    
    // Validate the field based on its type
    switch (schemaField.type) {
      case 'string':
        validateString(field, value, schemaField, errors);
        break;
      case 'number':
        validateNumber(field, value, schemaField, errors);
        break;
      case 'boolean':
        validateBoolean(field, value, errors);
        break;
      case 'object':
        validateObject(field, value, schemaField, errors);
        break;
      case 'array':
        validateArray(field, value, schemaField, errors);
        break;
    }
    
    // Run custom validation if provided
    if (schemaField.validate) {
      const result = schemaField.validate(value);
      
      if (result !== true) {
        errors.push({
          field,
          message: typeof result === 'string' ? result : `${field} is invalid`,
        });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a string field
 * 
 * @param field The field name
 * @param value The field value
 * @param schemaField The schema field
 * @param errors The validation errors
 */
function validateString(field: string, value: any, schemaField: ValidationSchemaField, errors: ValidationError[]): void {
  // Check if the value is a string
  if (typeof value !== 'string') {
    errors.push({
      field,
      message: `${field} must be a string`,
    });
    return;
  }
  
  // Check minimum length
  if (schemaField.minLength !== undefined && value.length < schemaField.minLength) {
    errors.push({
      field,
      message: `${field} must be at least ${schemaField.minLength} characters`,
    });
  }
  
  // Check maximum length
  if (schemaField.maxLength !== undefined && value.length > schemaField.maxLength) {
    errors.push({
      field,
      message: `${field} must be at most ${schemaField.maxLength} characters`,
    });
  }
  
  // Check pattern
  if (schemaField.pattern && !schemaField.pattern.test(value)) {
    errors.push({
      field,
      message: `${field} is invalid`,
    });
  }
  
  // Check enum
  if (schemaField.enum && !schemaField.enum.includes(value)) {
    errors.push({
      field,
      message: `${field} must be one of: ${schemaField.enum.join(', ')}`,
    });
  }
}

/**
 * Validate a number field
 * 
 * @param field The field name
 * @param value The field value
 * @param schemaField The schema field
 * @param errors The validation errors
 */
function validateNumber(field: string, value: any, schemaField: ValidationSchemaField, errors: ValidationError[]): void {
  // Check if the value is a number
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field,
      message: `${field} must be a number`,
    });
    return;
  }
  
  // Check minimum value
  if (schemaField.min !== undefined && value < schemaField.min) {
    errors.push({
      field,
      message: `${field} must be at least ${schemaField.min}`,
    });
  }
  
  // Check maximum value
  if (schemaField.max !== undefined && value > schemaField.max) {
    errors.push({
      field,
      message: `${field} must be at most ${schemaField.max}`,
    });
  }
  
  // Check enum
  if (schemaField.enum && !schemaField.enum.includes(value)) {
    errors.push({
      field,
      message: `${field} must be one of: ${schemaField.enum.join(', ')}`,
    });
  }
}

/**
 * Validate a boolean field
 * 
 * @param field The field name
 * @param value The field value
 * @param errors The validation errors
 */
function validateBoolean(field: string, value: any, errors: ValidationError[]): void {
  // Check if the value is a boolean
  if (typeof value !== 'boolean') {
    errors.push({
      field,
      message: `${field} must be a boolean`,
    });
  }
}

/**
 * Validate an object field
 * 
 * @param field The field name
 * @param value The field value
 * @param schemaField The schema field
 * @param errors The validation errors
 */
function validateObject(field: string, value: any, schemaField: ValidationSchemaField, errors: ValidationError[]): void {
  // Check if the value is an object
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push({
      field,
      message: `${field} must be an object`,
    });
    return;
  }
  
  // Validate the object properties if a schema is provided
  if (schemaField.properties) {
    const result = validate(value, schemaField.properties);
    
    if (!result.valid) {
      // Add the field name as a prefix to the error field
      result.errors.forEach((error) => {
        errors.push({
          field: `${field}.${error.field}`,
          message: error.message,
        });
      });
    }
  }
}

/**
 * Validate an array field
 * 
 * @param field The field name
 * @param value The field value
 * @param schemaField The schema field
 * @param errors The validation errors
 */
function validateArray(field: string, value: any, schemaField: ValidationSchemaField, errors: ValidationError[]): void {
  // Check if the value is an array
  if (!Array.isArray(value)) {
    errors.push({
      field,
      message: `${field} must be an array`,
    });
    return;
  }
  
  // Check minimum length
  if (schemaField.minLength !== undefined && value.length < schemaField.minLength) {
    errors.push({
      field,
      message: `${field} must have at least ${schemaField.minLength} items`,
    });
  }
  
  // Check maximum length
  if (schemaField.maxLength !== undefined && value.length > schemaField.maxLength) {
    errors.push({
      field,
      message: `${field} must have at most ${schemaField.maxLength} items`,
    });
  }
  
  // Validate each item in the array if a schema is provided
  if (schemaField.items) {
    value.forEach((item: any, index: number) => {
      // For array of objects
      if (schemaField.items?.type === 'object' && schemaField.items.properties) {
        const result = validate(item, schemaField.items.properties);
        
        if (!result.valid) {
          // Add the field name and index as a prefix to the error field
          result.errors.forEach((error) => {
            errors.push({
              field: `${field}[${index}].${error.field}`,
              message: error.message,
            });
          });
        }
      }
      // For array of primitive types
      else {
        const itemField = `${field}[${index}]`;
        
        switch (schemaField.items?.type) {
          case 'string':
            validateString(itemField, item, schemaField.items, errors);
            break;
          case 'number':
            validateNumber(itemField, item, schemaField.items, errors);
            break;
          case 'boolean':
            validateBoolean(itemField, item, errors);
            break;
          case 'array':
            validateArray(itemField, item, schemaField.items, errors);
            break;
        }
      }
    });
  }
}

/**
 * Common validation schemas
 */
export const schemas = {
  /**
   * Email validation schema
   */
  email: {
    type: 'string',
    required: true,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  } as ValidationSchemaField,
  
  /**
   * Password validation schema
   */
  password: {
    type: 'string',
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  } as ValidationSchemaField,
  
  /**
   * Username validation schema
   */
  username: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  } as ValidationSchemaField,
  
  /**
   * Bitcoin address validation schema
   */
  bitcoinAddress: {
    type: 'string',
    required: true,
    validate: (value: string) => {
      // Simple validation for Bitcoin addresses
      // This is not comprehensive and should be replaced with a proper Bitcoin address validation library
      const mainnetRegex = /^(1|3|bc1)[a-zA-Z0-9]{25,39}$/;
      const testnetRegex = /^(m|n|2|tb1)[a-zA-Z0-9]{25,39}$/;
      
      return mainnetRegex.test(value) || testnetRegex.test(value) || 'Invalid Bitcoin address';
    },
  } as ValidationSchemaField,
  
  /**
   * Bitcoin amount validation schema
   */
  bitcoinAmount: {
    type: 'string',
    required: true,
    validate: (value: string) => {
      // Validate Bitcoin amount (must be a positive number with up to 8 decimal places)
      const regex = /^(?!0\d)\d*(\.\d{1,8})?$/;
      
      if (!regex.test(value)) {
        return 'Invalid Bitcoin amount';
      }
      
      const amount = parseFloat(value);
      
      if (isNaN(amount) || amount <= 0) {
        return 'Amount must be greater than 0';
      }
      
      return true;
    },
  } as ValidationSchemaField,
  
  /**
   * Order type validation schema
   */
  orderType: {
    type: 'string',
    required: true,
    enum: ['buy', 'sell'],
  } as ValidationSchemaField,
  
  /**
   * Asset symbol validation schema
   */
  assetSymbol: {
    type: 'string',
    required: true,
    pattern: /^[A-Z0-9_]{1,10}$/,
  } as ValidationSchemaField,
};

/**
 * Common validation functions
 */
export const validators = {
  /**
   * Validate an email address
   * 
   * @param email The email address to validate
   * @returns The validation result
   */
  email: (email: string): ValidationResult => {
    return validate({ email }, { email: schemas.email });
  },
  
  /**
   * Validate a password
   * 
   * @param password The password to validate
   * @returns The validation result
   */
  password: (password: string): ValidationResult => {
    return validate({ password }, { password: schemas.password });
  },
  
  /**
   * Validate a username
   * 
   * @param username The username to validate
   * @returns The validation result
   */
  username: (username: string): ValidationResult => {
    return validate({ username }, { username: schemas.username });
  },
  
  /**
   * Validate a Bitcoin address
   * 
   * @param address The Bitcoin address to validate
   * @returns The validation result
   */
  bitcoinAddress: (address: string): ValidationResult => {
    return validate({ address }, { address: schemas.bitcoinAddress });
  },
  
  /**
   * Validate a Bitcoin amount
   * 
   * @param amount The Bitcoin amount to validate
   * @returns The validation result
   */
  bitcoinAmount: (amount: string): ValidationResult => {
    return validate({ amount }, { amount: schemas.bitcoinAmount });
  },
  
  /**
   * Validate an order type
   * 
   * @param type The order type to validate
   * @returns The validation result
   */
  orderType: (type: string): ValidationResult => {
    return validate({ type }, { type: schemas.orderType });
  },
  
  /**
   * Validate an asset symbol
   * 
   * @param symbol The asset symbol to validate
   * @returns The validation result
   */
  assetSymbol: (symbol: string): ValidationResult => {
    return validate({ symbol }, { symbol: schemas.assetSymbol });
  },
};

/**
 * Validation schemas for API requests
 */
export const apiSchemas = {
  /**
   * Authentication request schema
   */
  authRequest: {
    email: schemas.email,
    password: schemas.password,
  } as ValidationSchema,
  
  /**
   * Registration request schema
   */
  registerRequest: {
    email: schemas.email,
    password: schemas.password,
    username: schemas.username,
  } as ValidationSchema,
  
  /**
   * Order request schema
   */
  orderRequest: {
    baseAsset: schemas.assetSymbol,
    quoteAsset: schemas.assetSymbol,
    price: {
      type: 'string',
      required: true,
      validate: (value: string) => {
        // Validate price (must be a positive number)
        const regex = /^(?!0\d)\d*(\.\d+)?$/;
        
        if (!regex.test(value)) {
          return 'Invalid price';
        }
        
        const price = parseFloat(value);
        
        if (isNaN(price) || price <= 0) {
          return 'Price must be greater than 0';
        }
        
        return true;
      },
    },
    amount: {
      type: 'string',
      required: true,
      validate: (value: string) => {
        // Validate amount (must be a positive number)
        const regex = /^(?!0\d)\d*(\.\d+)?$/;
        
        if (!regex.test(value)) {
          return 'Invalid amount';
        }
        
        const amount = parseFloat(value);
        
        if (isNaN(amount) || amount <= 0) {
          return 'Amount must be greater than 0';
        }
        
        return true;
      },
    },
    type: schemas.orderType,
  } as ValidationSchema,
  
  /**
   * Withdraw request schema
   */
  withdrawRequest: {
    asset: schemas.assetSymbol,
    amount: schemas.bitcoinAmount,
    address: schemas.bitcoinAddress,
  } as ValidationSchema,
};

export default {
  validate,
  schemas,
  validators,
  apiSchemas,
};