import {
  createValidator,
  required,
  minLength,
  maxLength,
  pattern,
  email,
  numeric,
  decimal,
  min,
  max,
  bitcoinAddress,
  runeId,
  alkaneId,
  orderSide,
  orderAmount,
  orderPrice,
  orderExpiry,
  createOrderValidator,
  createTradeValidator,
  createWalletConnectionValidator,
  createTransferValidator,
  OrderData,
  TradeData,
  WalletConnectionData,
  TransferData,
} from '../validation';

describe('Validation Utilities', () => {
  describe('Basic Validators', () => {
    test('required validator', () => {
      expect(required('value', 'field')).toBeNull();
      expect(required('', 'field')).toEqual({
        field: 'field',
        message: 'field is required',
      });
      expect(required(null as any, 'field')).toEqual({
        field: 'field',
        message: 'field is required',
      });
      expect(required(undefined as any, 'field')).toEqual({
        field: 'field',
        message: 'field is required',
      });
    });

    test('minLength validator', () => {
      const validator = minLength(3);
      expect(validator('abc', 'field')).toBeNull();
      expect(validator('abcd', 'field')).toBeNull();
      expect(validator('ab', 'field')).toEqual({
        field: 'field',
        message: 'field must be at least 3 characters',
      });
      expect(validator('', 'field')).toEqual({
        field: 'field',
        message: 'field must be at least 3 characters',
      });
    });

    test('maxLength validator', () => {
      const validator = maxLength(3);
      expect(validator('abc', 'field')).toBeNull();
      expect(validator('ab', 'field')).toBeNull();
      expect(validator('abcd', 'field')).toEqual({
        field: 'field',
        message: 'field must be at most 3 characters',
      });
    });

    test('pattern validator', () => {
      const validator = pattern(/^[a-z]+$/, 'field must contain only lowercase letters');
      expect(validator('abc', 'field')).toBeNull();
      expect(validator('ABC', 'field')).toEqual({
        field: 'field',
        message: 'field must contain only lowercase letters',
      });
      expect(validator('abc123', 'field')).toEqual({
        field: 'field',
        message: 'field must contain only lowercase letters',
      });
    });

    test('email validator', () => {
      expect(email('test@example.com', 'field')).toBeNull();
      expect(email('invalid-email', 'field')).toEqual({
        field: 'field',
        message: 'field must be a valid email address',
      });
    });

    test('numeric validator', () => {
      expect(numeric('123', 'field')).toBeNull();
      expect(numeric('123.45', 'field')).toEqual({
        field: 'field',
        message: 'field must be numeric',
      });
      expect(numeric('abc', 'field')).toEqual({
        field: 'field',
        message: 'field must be numeric',
      });
    });

    test('decimal validator', () => {
      expect(decimal('123', 'field')).toBeNull();
      expect(decimal('123.45', 'field')).toBeNull();
      expect(decimal('abc', 'field')).toEqual({
        field: 'field',
        message: 'field must be a decimal number',
      });
    });

    test('min validator', () => {
      const validator = min(10);
      expect(validator('10', 'field')).toBeNull();
      expect(validator('15', 'field')).toBeNull();
      expect(validator(10, 'field')).toBeNull();
      expect(validator(15, 'field')).toBeNull();
      expect(validator('5', 'field')).toEqual({
        field: 'field',
        message: 'field must be at least 10',
      });
      expect(validator(5, 'field')).toEqual({
        field: 'field',
        message: 'field must be at least 10',
      });
    });

    test('max validator', () => {
      const validator = max(10);
      expect(validator('10', 'field')).toBeNull();
      expect(validator('5', 'field')).toBeNull();
      expect(validator(10, 'field')).toBeNull();
      expect(validator(5, 'field')).toBeNull();
      expect(validator('15', 'field')).toEqual({
        field: 'field',
        message: 'field must be at most 10',
      });
      expect(validator(15, 'field')).toEqual({
        field: 'field',
        message: 'field must be at most 10',
      });
    });
  });

  describe('Domain-Specific Validators', () => {
    test('bitcoinAddress validator', () => {
      // P2PKH addresses
      expect(bitcoinAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', 'field')).toBeNull();
      expect(bitcoinAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', 'field')).toBeNull();
      
      // Bech32 addresses
      expect(bitcoinAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'field')).toBeNull();
      expect(bitcoinAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', 'field')).toBeNull();
      
      // Invalid addresses
      expect(bitcoinAddress('invalid-address', 'field')).toEqual({
        field: 'field',
        message: 'field must be a valid Bitcoin address',
      });
      expect(bitcoinAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'field')).toEqual({
        field: 'field',
        message: 'field must be a valid Bitcoin address',
      });
    });

    test('runeId validator', () => {
      expect(runeId('RUNE123', 'field')).toBeNull();
      expect(runeId('123456789012345', 'field')).toBeNull();
      expect(runeId('RUNE123!', 'field')).toEqual({
        field: 'field',
        message: 'field must be a valid rune ID',
      });
      expect(runeId('12345678901234567', 'field')).toEqual({
        field: 'field',
        message: 'field must be a valid rune ID',
      });
    });

    test('alkaneId validator', () => {
      expect(alkaneId('ALKANE123', 'field')).toBeNull();
      expect(alkaneId('123456789012345', 'field')).toBeNull();
      expect(alkaneId('ALKANE123!', 'field')).toEqual({
        field: 'field',
        message: 'field must be a valid alkane ID',
      });
      expect(alkaneId('12345678901234567', 'field')).toEqual({
        field: 'field',
        message: 'field must be a valid alkane ID',
      });
    });

    test('orderSide validator', () => {
      expect(orderSide('buy', 'field')).toBeNull();
      expect(orderSide('sell', 'field')).toBeNull();
      expect(orderSide('invalid', 'field')).toEqual({
        field: 'field',
        message: "field must be either 'buy' or 'sell'",
      });
    });

    test('orderAmount validator', () => {
      expect(orderAmount('0.1', 'field')).toBeNull();
      expect(orderAmount('10', 'field')).toBeNull();
      expect(orderAmount('0', 'field')).toEqual({
        field: 'field',
        message: 'field must be a positive decimal number',
      });
      expect(orderAmount('-1', 'field')).toEqual({
        field: 'field',
        message: 'field must be a positive decimal number',
      });
      expect(orderAmount('abc', 'field')).toEqual({
        field: 'field',
        message: 'field must be a positive decimal number',
      });
    });

    test('orderPrice validator', () => {
      expect(orderPrice('0.1', 'field')).toBeNull();
      expect(orderPrice('10', 'field')).toBeNull();
      expect(orderPrice('0', 'field')).toEqual({
        field: 'field',
        message: 'field must be a positive decimal number',
      });
      expect(orderPrice('-1', 'field')).toEqual({
        field: 'field',
        message: 'field must be a positive decimal number',
      });
      expect(orderPrice('abc', 'field')).toEqual({
        field: 'field',
        message: 'field must be a positive decimal number',
      });
    });

    test('orderExpiry validator', () => {
      expect(orderExpiry(3600, 'field')).toBeNull();
      expect(orderExpiry(0, 'field')).toEqual({
        field: 'field',
        message: 'field must be a positive number',
      });
      expect(orderExpiry(-1, 'field')).toEqual({
        field: 'field',
        message: 'field must be a positive number',
      });
      expect(orderExpiry(NaN, 'field')).toEqual({
        field: 'field',
        message: 'field must be a positive number',
      });
    });
  });

  describe('Composite Validators', () => {
    test('createValidator', () => {
      interface TestData {
        name: string;
        email: string;
        age: number;
      }

      const validator = createValidator<TestData>({
        name: [required as any, minLength(3), maxLength(10)],
        email: [required as any, email],
        age: [required as any, min(18), max(100)],
      });

      // Valid data
      const validData: TestData = {
        name: 'John',
        email: 'john@example.com',
        age: 25,
      };
      const validResult = validator(validData);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toEqual([]);

      // Invalid data
      const invalidData: TestData = {
        name: 'J',
        email: 'invalid-email',
        age: 15,
      };
      const invalidResult = validator(invalidData);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toHaveLength(3);
      expect(invalidResult.errors).toContainEqual({
        field: 'name',
        message: 'name must be at least 3 characters',
      });
      expect(invalidResult.errors).toContainEqual({
        field: 'email',
        message: 'email must be a valid email address',
      });
      expect(invalidResult.errors).toContainEqual({
        field: 'age',
        message: 'age must be at least 18',
      });
    });

    test('createOrderValidator', () => {
      const validator = createOrderValidator();

      // Valid order
      const validOrder: OrderData = {
        baseAsset: 'BTC',
        quoteAsset: 'RUNE:123',
        side: 'buy',
        amount: '0.1',
        price: '20000',
        expiry: 3600,
      };
      const validResult = validator(validOrder);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toEqual([]);

      // Invalid order
      const invalidOrder: OrderData = {
        baseAsset: '',
        quoteAsset: '',
        side: 'invalid',
        amount: '0',
        price: '-1',
        expiry: 0,
      };
      const invalidResult = validator(invalidOrder);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('createTradeValidator', () => {
      const validator = createTradeValidator();

      // Valid trade
      const validTrade: TradeData = {
        orderId: 'order-123',
        amount: '0.1',
      };
      const validResult = validator(validTrade);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toEqual([]);

      // Invalid trade
      const invalidTrade: TradeData = {
        orderId: '',
        amount: '0',
      };
      const invalidResult = validator(invalidTrade);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('createWalletConnectionValidator', () => {
      const validator = createWalletConnectionValidator();

      // Valid wallet connection
      const validWalletConnection: WalletConnectionData = {
        walletType: 'simple',
        privateKey: 'private-key',
      };
      const validResult = validator(validWalletConnection);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toEqual([]);

      // Invalid wallet connection
      const invalidWalletConnection: WalletConnectionData = {
        walletType: '',
      };
      const invalidResult = validator(invalidWalletConnection);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('createTransferValidator', () => {
      const validator = createTransferValidator();

      // Valid transfer
      const validTransfer: TransferData = {
        assetType: 'rune',
        assetId: 'RUNE123',
        amount: '10',
        recipient: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
      };
      const validResult = validator(validTransfer);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toEqual([]);

      // Invalid transfer
      const invalidTransfer: TransferData = {
        assetType: '',
        amount: '0',
        recipient: 'invalid-address',
      };
      const invalidResult = validator(invalidTransfer);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });
});