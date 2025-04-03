/**
 * Memoization utilities for DarkSwap
 */
import { memo, useMemo, useCallback, DependencyList, ComponentType, MemoExoticComponent } from 'react';
import isEqual from 'lodash/isEqual';

/**
 * Custom equality function for React.memo
 * Uses lodash's isEqual for deep comparison
 * @param prevProps Previous props
 * @param nextProps Next props
 * @returns True if the props are equal, false otherwise
 */
export const deepEqual = <P extends object>(prevProps: P, nextProps: P): boolean => {
  return isEqual(prevProps, nextProps);
};

/**
 * Memoize a component with deep comparison
 * @param Component The component to memoize
 * @returns The memoized component
 */
export function memoizeComponent<P extends object>(
  Component: ComponentType<P>
): MemoExoticComponent<ComponentType<P>> {
  return memo(Component, deepEqual);
}

/**
 * Memoize a component with custom comparison
 * @param Component The component to memoize
 * @param areEqual Custom equality function
 * @returns The memoized component
 */
export function memoizeComponentWithComparison<P extends object>(
  Component: ComponentType<P>,
  areEqual: (prevProps: P, nextProps: P) => boolean
): MemoExoticComponent<ComponentType<P>> {
  return memo(Component, areEqual);
}

/**
 * Memoize a component with prop keys to compare
 * @param Component The component to memoize
 * @param propKeys The prop keys to compare
 * @returns The memoized component
 */
export function memoizeComponentWithPropKeys<P extends object>(
  Component: ComponentType<P>,
  propKeys: (keyof P)[]
): MemoExoticComponent<ComponentType<P>> {
  return memo(Component, (prevProps, nextProps) => {
    return propKeys.every(key => prevProps[key] === nextProps[key]);
  });
}

/**
 * Memoize a value with deep comparison
 * @param value The value to memoize
 * @param deps The dependencies array
 * @returns The memoized value
 */
export function useMemoDeep<T>(value: T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => value, [...deps]);
}

/**
 * Memoize a callback with deep comparison
 * @param callback The callback to memoize
 * @param deps The dependencies array
 * @returns The memoized callback
 */
export function useCallbackDeep<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, [...deps]);
}

/**
 * Memoize a component with a display name
 * @param Component The component to memoize
 * @param displayName The display name for the component
 * @returns The memoized component with the display name
 */
export function memoizeWithDisplayName<P extends object>(
  Component: ComponentType<P>,
  displayName: string
): MemoExoticComponent<ComponentType<P>> {
  const MemoizedComponent = memo(Component);
  MemoizedComponent.displayName = displayName;
  return MemoizedComponent;
}

/**
 * Memoize a component with deep comparison and a display name
 * @param Component The component to memoize
 * @param displayName The display name for the component
 * @returns The memoized component with deep comparison and the display name
 */
export function memoizeDeepWithDisplayName<P extends object>(
  Component: ComponentType<P>,
  displayName: string
): MemoExoticComponent<ComponentType<P>> {
  const MemoizedComponent = memo(Component, deepEqual);
  MemoizedComponent.displayName = displayName;
  return MemoizedComponent;
}

/**
 * Create a selector function for a context
 * @param selector The selector function
 * @returns A memoized selector function
 */
export function createSelector<State, Selected>(
  selector: (state: State) => Selected
): (state: State) => Selected {
  let lastState: State | undefined;
  let lastSelected: Selected | undefined;

  return (state: State): Selected => {
    if (lastState === state) {
      return lastSelected as Selected;
    }

    const selected = selector(state);

    if (isEqual(selected, lastSelected)) {
      lastState = state;
      return lastSelected as Selected;
    }

    lastState = state;
    lastSelected = selected;
    return selected;
  };
}

/**
 * Create a selector hook for a context
 * @param useContext The context hook
 * @param selector The selector function
 * @returns A hook that returns the selected value from the context
 */
export function createSelectorHook<State, Selected>(
  useContext: () => State,
  selector: (state: State) => Selected
): () => Selected {
  const memoizedSelector = createSelector(selector);

  return () => {
    const state = useContext();
    return memoizedSelector(state);
  };
}