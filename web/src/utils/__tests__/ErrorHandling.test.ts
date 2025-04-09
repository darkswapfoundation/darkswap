/**
 * Unit tests for ErrorHandling
 */

import { 
  DarkSwapError, 
  ErrorCode, 
  createError, 
  handleError, 
  tryAsync, 
  trySync 
} from '../ErrorHandling';

describe('DarkSwapError', () => {
  it('should create a DarkSwap error', () => {
    const error = new DarkSwapError(ErrorCode.UNKNOWN_ERROR, 'Unknown error');
    expect(error).toBeInstanceOf(DarkSwapError);
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(error.message).toBe('Unknown error');
  });

  it('should create a DarkSwap error with an original error', () => {
    const originalError = new Error('Original error');
    const error = new DarkSwapError(ErrorCode.UNKNOWN_ERROR, 'Unknown error', originalError);
    expect(error).toBeInstanceOf(DarkSwapError);
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(error.message).toBe('Unknown error');
    expect(error.originalError).toBe(originalError);
  });

  it('should convert to string', () => {
    const error = new DarkSwapError(ErrorCode.UNKNOWN_ERROR, 'Unknown error');
    expect(error.toString()).toBe('DarkSwapError [UNKNOWN_ERROR]: Unknown error');
  });

  it('should convert to JSON', () => {
    const error = new DarkSwapError(ErrorCode.UNKNOWN_ERROR, 'Unknown error');
    const json = error.toJSON();
    expect(json.name).toBe('DarkSwapError');
    expect(json.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(json.message).toBe('Unknown error');
  });

  it('should convert to JSON with an original error', () => {
    const originalError = new Error('Original error');
    const error = new DarkSwapError(ErrorCode.UNKNOWN_ERROR, 'Unknown error', originalError);
    const json = error.toJSON();
    expect(json.name).toBe('DarkSwapError');
    expect(json.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(json.message).toBe('Unknown error');
    expect(json.originalError).toEqual({
      name: 'Error',
      message: 'Original error',
      stack: originalError.stack,
    });
  });
});

describe('createError', () => {
  it('should create a DarkSwap error', () => {
    const error = createError(ErrorCode.UNKNOWN_ERROR, 'Unknown error');
    expect(error).toBeInstanceOf(DarkSwapError);
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(error.message).toBe('Unknown error');
  });

  it('should create a DarkSwap error with an original error', () => {
    const originalError = new Error('Original error');
    const error = createError(ErrorCode.UNKNOWN_ERROR, 'Unknown error', originalError);
    expect(error).toBeInstanceOf(DarkSwapError);
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(error.message).toBe('Unknown error');
    expect(error.originalError).toBe(originalError);
  });
});

describe('handleError', () => {
  it('should return the error if it is a DarkSwap error', () => {
    const error = new DarkSwapError(ErrorCode.UNKNOWN_ERROR, 'Unknown error');
    const handledError = handleError(error);
    expect(handledError).toBe(error);
  });

  it('should create a DarkSwap error if the error is an Error', () => {
    const error = new Error('Error');
    const handledError = handleError(error);
    expect(handledError).toBeInstanceOf(DarkSwapError);
    expect(handledError.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(handledError.message).toBe('Error');
    expect(handledError.originalError).toBe(error);
  });

  it('should create a DarkSwap error if the error is a string', () => {
    const error = 'Error';
    const handledError = handleError(error);
    expect(handledError).toBeInstanceOf(DarkSwapError);
    expect(handledError.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(handledError.message).toBe('Error');
  });

  it('should create a DarkSwap error if the error is unknown', () => {
    const error = 123;
    const handledError = handleError(error);
    expect(handledError).toBeInstanceOf(DarkSwapError);
    expect(handledError.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(handledError.message).toBe('An unknown error occurred');
    expect(handledError.originalError).toBe(error);
  });

  it('should use the provided default code and message', () => {
    const error = 123;
    const handledError = handleError(
      error,
      ErrorCode.INITIALIZATION_FAILED,
      'Initialization failed'
    );
    expect(handledError).toBeInstanceOf(DarkSwapError);
    expect(handledError.code).toBe(ErrorCode.INITIALIZATION_FAILED);
    expect(handledError.message).toBe('Initialization failed');
    expect(handledError.originalError).toBe(error);
  });
});

describe('tryAsync', () => {
  it('should return the result if the function succeeds', async () => {
    const result = await tryAsync(
      async () => 'result',
      ErrorCode.UNKNOWN_ERROR,
      'Unknown error'
    );
    expect(result).toBe('result');
  });

  it('should throw a DarkSwap error if the function throws', async () => {
    await expect(
      tryAsync(
        async () => {
          throw new Error('Error');
        },
        ErrorCode.UNKNOWN_ERROR,
        'Unknown error'
      )
    ).rejects.toThrow(DarkSwapError);
  });
});

describe('trySync', () => {
  it('should return the result if the function succeeds', () => {
    const result = trySync(
      () => 'result',
      ErrorCode.UNKNOWN_ERROR,
      'Unknown error'
    );
    expect(result).toBe('result');
  });

  it('should throw a DarkSwap error if the function throws', () => {
    expect(() =>
      trySync(
        () => {
          throw new Error('Error');
        },
        ErrorCode.UNKNOWN_ERROR,
        'Unknown error'
      )
    ).toThrow(DarkSwapError);
  });
});