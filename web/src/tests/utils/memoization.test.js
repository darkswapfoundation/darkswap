import { useMemoizedValue, useDeepComparison, useRenderTracker } from '../../utils/memoization';
import { renderHook, act } from '@testing-library/react-hooks';

describe('Memoization Utilities', () => {
  describe('useMemoizedValue', () => {
    test('should return memoized value', () => {
      // Setup
      const fn = jest.fn(() => 'test value');
      
      // Execute
      const { result, rerender } = renderHook(() => useMemoizedValue(fn, []));
      
      // Verify
      expect(result.current).toBe('test value');
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Rerender should not call the function again
      rerender();
      expect(fn).toHaveBeenCalledTimes(1);
    });
    
    test('should recompute when dependencies change', () => {
      // Setup
      const fn = jest.fn((value) => `test ${value}`);
      let dependency = 'a';
      
      // Execute
      const { result, rerender } = renderHook(() => useMemoizedValue(() => fn(dependency), [dependency]));
      
      // Verify
      expect(result.current).toBe('test a');
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Change dependency and rerender
      dependency = 'b';
      rerender();
      
      // Verify recomputation
      expect(result.current).toBe('test b');
      expect(fn).toHaveBeenCalledTimes(2);
    });
    
    test('should handle complex objects as dependencies', () => {
      // Setup
      const fn = jest.fn((obj) => obj.value);
      let dependency = { value: 'test' };
      
      // Execute
      const { result, rerender } = renderHook(() => useMemoizedValue(() => fn(dependency), [dependency]));
      
      // Verify
      expect(result.current).toBe('test');
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Rerender with same object reference
      rerender();
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Change object reference but keep same value
      dependency = { value: 'test' };
      rerender();
      
      // Should recompute because reference changed
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('useDeepComparison', () => {
    test('should not recompute when object values are the same', () => {
      // Setup
      const fn = jest.fn((obj) => obj.value);
      let dependency = { value: 'test', nested: { prop: 42 } };
      
      // Execute
      const { result, rerender } = renderHook(() => 
        useDeepComparison(() => fn(dependency), [dependency])
      );
      
      // Verify
      expect(result.current).toBe('test');
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Change object reference but keep same values
      dependency = { value: 'test', nested: { prop: 42 } };
      rerender();
      
      // Should not recompute because values are the same
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Change a value
      dependency = { value: 'test', nested: { prop: 43 } };
      rerender();
      
      // Should recompute because value changed
      expect(fn).toHaveBeenCalledTimes(2);
    });
    
    test('should handle arrays correctly', () => {
      // Setup
      const fn = jest.fn((arr) => arr.join(','));
      let dependency = [1, 2, 3];
      
      // Execute
      const { result, rerender } = renderHook(() => 
        useDeepComparison(() => fn(dependency), [dependency])
      );
      
      // Verify
      expect(result.current).toBe('1,2,3');
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Change array reference but keep same values
      dependency = [1, 2, 3];
      rerender();
      
      // Should not recompute because values are the same
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Change array values
      dependency = [1, 2, 3, 4];
      rerender();
      
      // Should recompute because values changed
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('useRenderTracker', () => {
    test('should track renders', () => {
      // Mock console.log
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // Setup
      const { rerender } = renderHook(() => useRenderTracker('TestComponent'));
      
      // Verify
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent rendered'),
        expect.any(Number)
      );
      
      // Reset mock
      console.log.mockClear();
      
      // Rerender
      rerender();
      
      // Verify second render
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent rendered'),
        expect.any(Number)
      );
      
      // Restore console.log
      console.log = originalConsoleLog;
    });
    
    test('should track render count', () => {
      // Mock console.log
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // Setup
      const { rerender } = renderHook(() => useRenderTracker('TestComponent'));
      
      // First render
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent rendered 1 times'),
        expect.any(Number)
      );
      
      // Reset mock
      console.log.mockClear();
      
      // Rerender multiple times
      rerender();
      rerender();
      
      // Verify render count
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent rendered 3 times'),
        expect.any(Number)
      );
      
      // Restore console.log
      console.log = originalConsoleLog;
    });
  });
});