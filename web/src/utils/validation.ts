/**
 * Input validation utilities for DarkSwap
 */

/**
 * Validation error
 */
export interface ValidationError {
  /** The field that failed validation */
  field: string;
  /** The error message */
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** The validation errors */
  errors: ValidationError[];
}

/**
 * Validator function type
 */
export type Validator<T> = (value: T) => ValidationResult;

/**
 * Field validator function type
 */
export type FieldValidator<T> = (value: T, field: string) => ValidationError | null;

/**
 * Create a validator for an object
 * @param validators Object containing field validators
 * @returns A validator function
 */
export function createValidator<T extends Record<string, any>>(
  validators: { [K in keyof T]?: FieldValidator<T[K]>[] }
): Validator<T> {
  return (value: T): ValidationResult => {
    const errors: ValidationError[] = [];

    for (const field in validators) {
      if (Object.prototype.hasOwnProperty.call(validators, field)) {
        const fieldValidators = validators[field] || [];
        for (const validator of fieldValidators) {
          const error = validator(value[field], field as string);
          if (error) {
            errors.push(error);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };
}

/**
 * Required field validator
 * @param value The value to validate
 * @param field The field name
 * @returns A validation error or null
 */
export function required<T>(value: T, field: string): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    return {
      field,
      message: `${field} is required`,
    };
  }
  return null;
}

/**
 * Minimum length validator
 * @param min The minimum length
 * @returns A field validator function
 */
export function minLength(min: number): FieldValidator<string> {
  return (value: string, field: string): ValidationError | null => {
    if (value && value.length < min) {
      return {
        field,
        message: `${field} must be at least ${min} characters`,
      };
    }
    return null;
  };
}

/**
 * Maximum length validator
 * @param max The maximum length
 * @returns A field validator function
 */
export function maxLength(max: number): FieldValidator<string> {
  return (value: string, field: string): ValidationError | null => {
    if (value && value.length > max) {
      return {
        field,
        message: `${field} must be at most ${max} characters`,
      };
    }
    return null;
  };
}

/**
 * Pattern validator
 * @param pattern The pattern to match
 * @param message The error message
 * @returns A field validator function
 */
export function pattern(pattern: RegExp, message: string): FieldValidator<string> {
  return (value: string, field: string): ValidationError | null => {
    if (value && !pattern.test(value)) {
      return {
        field,
        message: message || `${field} is invalid`,
      };
    }
    return null;
  };
}

/**
 * Email validator
 * @param value The value to validate
 * @param field The field name
 * @returns A validation error or null
 */
export function email(value: string, field: string): ValidationError | null {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (value && !emailPattern.test(value)) {
    return {
      field,
      message: `${field} must be a valid email address`,
    };
  }
  return null;
}

/**
 * Numeric validator
 * @param value The value to validate
 * @param field The field name
 * @returns A validation error or null
 */
export function numeric(value: string, field: string): ValidationError | null {
  const numericPattern = /^[0-9]+$/;
  if (value && !numericPattern.test(value)) {
    return {
      field,
      message: `${field} must be numeric`,
    };
  }
  return null;
}

/**
 * Decimal validator
 * @param value The value to validate
 * @param field The field name
 * @returns A validation error or null
 */
export function decimal(value: string, field: string): ValidationError | null {
  const decimalPattern = /^[0-9]+(\.[0-9]+)?$/;
  if (value && !decimalPattern.test(value)) {
    return {
      field,
      message: `${field} must be a decimal number`,
    };
  }
  return null;
}

/**
 * Minimum value validator
 * @param min The minimum value
 * @returns A field validator function
 */
export function min(min: number): FieldValidator<string | number> {
  return (value: string | number, field: string): ValidationError | null => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (value !== undefined && value !== null && value !== '' && numValue < min) {
      return {
        field,
        message: `${field} must be at least ${min}`,
      };
    }
    return null;
  };
}

/**
 * Maximum value validator
 * @param max The maximum value
 * @returns A field validator function
 */
export function max(max: number): FieldValidator<string | number> {
  return (value: string | number, field: string): ValidationError | null => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (value !== undefined && value !== null && value !== '' && numValue > max) {
      return {
        field,
        message: `${field} must be at most ${max}`,
      };
    }
    return null;
  };
}

/**
 * Bitcoin address validator
 * @param value The value to validate
 * @param field The field name
 * @returns A validation error or null
 */
export function bitcoinAddress(value: string, field: string): ValidationError | null {
  // Bitcoin address patterns
  const p2pkhPattern = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const p2shPattern = /^[23][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Pattern = /^(bc|tb)1[a-zA-HJ-NP-Z0-9]{25,90}$/;

  if (value && !p2pkhPattern.test(value) && !p2shPattern.test(value) && !bech32Pattern.test(value)) {
    return {
      field,
      message: `${field} must be a valid Bitcoin address`,
    };
  }
  return null;
}

/**
 * Rune ID validator
 * @param value The value to validate
 * @param field The field name
 * @returns A validation error or null
 */
export function runeId(value: string, field: string): ValidationError | null {
  const runeIdPattern = /^[a-zA-Z0-9]{1,16}$/;
  if (value && !runeIdPattern.test(value)) {
    return {
      field,
      message: `${field} must be a valid rune ID`,
    };
  }
  return null;
}

/**
 * Alkane ID validator
 * @param value The value to validate
 * @param field The field name
 * @returns A validation error or null
 */
export function alkaneId(value: string, field: string): ValidationError | null {
  const alkaneIdPattern = /^[a-zA-Z0-9]{1,16}$/;
  if (value && !alkaneIdPattern.test(value)) {
    return {
      field,
      message: `${field} must be a valid alkane ID`,
    };
  }
  return null;
}

/**
 * Order side validator
 * @param value The value to validate
 * @param field The field name
 * @returns A validation error or null
 */
export function orderSide(value: string, field: string): ValidationError | null {
  if (value && value !== 'buy' && value !== 'sell') {
    return {
      field,
      message: `${field} must be either 'buy' or 'sell'`,
    };
  }
  return null;
}

/**
 * Order amount validator
 * @param value The value to validate
 * @param field The field name
 * @returns A validation error or null
 */
export function orderAmount(value: string, field: string): ValidationError | null {
  const decimalPattern = /^[0-9]+(\.[0-9]+)?$/;
  if (value && (!decimalPattern.test(value) || parseFloat(value) <= 0)) {
    return {
      field,
      message: `${field} must be a positive decimal number`,
    };
  }
  return null;
}

/**
 * Order price validator
 * @param value The value to validate
 * @param field The field name
 * @returns A validation error or null
 */
export function orderPrice(value: string, field: string): ValidationError | null {
  const decimalPattern = /^[0-9]+(\.[0-9]+)?$/;
  if (value && (!decimalPattern.test(value) || parseFloat(value) <= 0)) {
    return {
      field,
      message: `${field} must be a positive decimal number`,
    };
  }
  return null;
}

/**
 * Order expiry validator
 * @param value The value to validate
 * @param field The field name
 * @returns A validation error or null
 */
export function orderExpiry(value: number, field: string): ValidationError | null {
  if (value !== undefined && value !== null && (isNaN(value) || value <= 0)) {
    return {
      field,
      message: `${field} must be a positive number`,
    };
  }
  return null;
}

/**
 * Order data interface
 */
export interface OrderData {
  baseAsset: string;
  quoteAsset: string;
  side: string;
  amount: string;
  price: string;
  expiry: number;
}

/**
 * Create an order validator
 * @returns A validator function for orders
 */
export function createOrderValidator(): Validator<OrderData> {
  return createValidator<OrderData>({
    baseAsset: [required as FieldValidator<string>],
    quoteAsset: [required as FieldValidator<string>],
    side: [required as FieldValidator<string>, orderSide],
    amount: [required as FieldValidator<string>, orderAmount],
    price: [required as FieldValidator<string>, orderPrice],
    expiry: [orderExpiry],
  });
}

/**
 * Trade data interface
 */
export interface TradeData {
  orderId: string;
  amount: string;
}

/**
 * Create a trade validator
 * @returns A validator function for trades
 */
export function createTradeValidator(): Validator<TradeData> {
  return createValidator<TradeData>({
    orderId: [required as FieldValidator<string>],
    amount: [required as FieldValidator<string>, orderAmount],
  });
}

/**
 * Wallet connection data interface
 */
export interface WalletConnectionData {
  walletType: string;
  privateKey?: string;
  seedPhrase?: string;
  derivationPath?: string;
}

/**
 * Create a wallet connection validator
 * @returns A validator function for wallet connections
 */
export function createWalletConnectionValidator(): Validator<WalletConnectionData> {
  return createValidator<WalletConnectionData>({
    walletType: [required as FieldValidator<string>],
    privateKey: [],
    seedPhrase: [],
    derivationPath: [],
  });
}

/**
 * Transfer data interface
 */
export interface TransferData {
  assetType: string;
  assetId?: string;
  amount: string;
  recipient: string;
}

/**
 * Create a transfer validator
 * @returns A validator function for transfers
 */
export function createTransferValidator(): Validator<TransferData> {
  return createValidator<TransferData>({
    assetType: [required as FieldValidator<string>],
    assetId: [],
    amount: [required as FieldValidator<string>, orderAmount],
    recipient: [required as FieldValidator<string>, bitcoinAddress],
  });
}