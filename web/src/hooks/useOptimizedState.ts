import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { isEqual } from 'lodash';

/**
 * useOptimizedState
 * 
 * A custom hook that provides an optimized version of useState.
 * It only updates the state if the new value is different from the current value.
 * 
 * @param initialState The initial state
 * @param isEqualFn The function to compare values (defaults to lodash's isEqual)
 * @returns A tuple with the state and a setter function
 */
export function useOptimizedState<T>(
  initialState: T | (() => T),
  isEqualFn: (a: T, b: T) => boolean = isEqual
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialState);
  
  const optimizedSetState = useCallback((newState: T | ((prevState: T) => T)) => {
    if (typeof newState === 'function') {
      setState((prevState) => {
        const nextState = (newState as ((prevState: T) => T))(prevState);
        return isEqualFn(prevState, nextState) ? prevState : nextState;
      });
    } else {
      setState((prevState) => {
        return isEqualFn(prevState, newState) ? prevState : newState;
      });
    }
  }, [isEqualFn]);
  
  return [state, optimizedSetState];
}

/**
 * useShallowState
 * 
 * A custom hook that provides a version of useState with shallow comparison.
 * 
 * @param initialState The initial state
 * @returns A tuple with the state and a setter function
 */
export function useShallowState<T extends object>(
  initialState: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  return useOptimizedState<T>(initialState, (a, b) => {
    if (a === b) return true;
    
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    
    if (aKeys.length !== bKeys.length) return false;
    
    return aKeys.every((key) => a[key as keyof T] === b[key as keyof T]);
  });
}

/**
 * useDebouncedState
 * 
 * A custom hook that provides a debounced version of useState.
 * 
 * @param initialState The initial state
 * @param delay The debounce delay in milliseconds
 * @returns A tuple with the state, a setter function, and the pending state
 */
export function useDebouncedState<T>(
  initialState: T | (() => T),
  delay: number = 300
): [T, Dispatch<SetStateAction<T>>, T] {
  const [state, setState] = useState<T>(initialState);
  const [pendingState, setPendingState] = useState<T>(
    typeof initialState === 'function' ? (initialState as () => T)() : initialState
  );
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  const debouncedSetState = useCallback((newState: T | ((prevState: T) => T)) => {
    // Update the pending state immediately
    if (typeof newState === 'function') {
      setPendingState((prevState) => (newState as ((prevState: T) => T))(prevState));
    } else {
      setPendingState(newState);
    }
    
    // Clear the previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set a new timeout
    const id = setTimeout(() => {
      if (typeof newState === 'function') {
        setState(newState);
      } else {
        setState(newState);
      }
    }, delay);
    
    setTimeoutId(id);
  }, [delay, timeoutId]);
  
  return [state, debouncedSetState, pendingState];
}

/**
 * useThrottledState
 * 
 * A custom hook that provides a throttled version of useState.
 * 
 * @param initialState The initial state
 * @param limit The throttle limit in milliseconds
 * @returns A tuple with the state, a setter function, and the pending state
 */
export function useThrottledState<T>(
  initialState: T | (() => T),
  limit: number = 300
): [T, Dispatch<SetStateAction<T>>, T] {
  const [state, setState] = useState<T>(initialState);
  const [pendingState, setPendingState] = useState<T>(
    typeof initialState === 'function' ? (initialState as () => T)() : initialState
  );
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  
  const throttledSetState = useCallback((newState: T | ((prevState: T) => T)) => {
    // Update the pending state immediately
    if (typeof newState === 'function') {
      setPendingState((prevState) => (newState as ((prevState: T) => T))(prevState));
    } else {
      setPendingState(newState);
    }
    
    const now = Date.now();
    
    if (now - lastUpdated >= limit) {
      // Update the state immediately
      if (typeof newState === 'function') {
        setState(newState);
      } else {
        setState(newState);
      }
      
      setLastUpdated(now);
    }
  }, [limit, lastUpdated]);
  
  return [state, throttledSetState, pendingState];
}

export default {
  useOptimizedState,
  useShallowState,
  useDebouncedState,
  useThrottledState,
};