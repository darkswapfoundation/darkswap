import React, { memo, ComponentType } from 'react';
import { isEqual } from 'lodash';

/**
 * MemoizedComponent
 * 
 * A component that memoizes another component with custom comparison.
 * 
 * @param Component The component to memoize
 * @param propsAreEqual The function to compare props
 * @returns The memoized component
 */
export function MemoizedComponent<P extends object>(
  Component: ComponentType<P>,
  propsAreEqual: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean = isEqual
): React.MemoExoticComponent<ComponentType<P>> {
  return memo(Component, propsAreEqual);
}

/**
 * withMemo HOC
 * 
 * A higher-order component that wraps a component with memo.
 * 
 * @param Component The component to memoize
 * @param propsAreEqual The function to compare props
 * @returns The memoized component
 */
export function withMemo<P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<ComponentType<P>> {
  return MemoizedComponent(Component, propsAreEqual);
}

/**
 * arePropsEqual
 * 
 * A utility function to compare props by specified keys.
 * 
 * @param keys The keys to compare
 * @returns A function that compares props by the specified keys
 */
export function arePropsEqual<P extends object>(keys: (keyof P)[]): (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean {
  return (prevProps: Readonly<P>, nextProps: Readonly<P>): boolean => {
    return keys.every((key) => isEqual(prevProps[key], nextProps[key]));
  };
}

/**
 * arePropsShallowEqual
 * 
 * A utility function to shallow compare props.
 * 
 * @param prevProps The previous props
 * @param nextProps The next props
 * @returns Whether the props are shallow equal
 */
export function arePropsShallowEqual<P extends object>(prevProps: Readonly<P>, nextProps: Readonly<P>): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  
  return prevKeys.every((key) => {
    return prevProps[key as keyof P] === nextProps[key as keyof P];
  });
}

/**
 * withShallowMemo HOC
 * 
 * A higher-order component that wraps a component with memo using shallow comparison.
 * 
 * @param Component The component to memoize
 * @returns The memoized component
 */
export function withShallowMemo<P extends object>(
  Component: ComponentType<P>
): React.MemoExoticComponent<ComponentType<P>> {
  return memo(Component, arePropsShallowEqual);
}

/**
 * withKeyMemo HOC
 * 
 * A higher-order component that wraps a component with memo using key comparison.
 * 
 * @param Component The component to memoize
 * @param keys The keys to compare
 * @returns The memoized component
 */
export function withKeyMemo<P extends object>(
  Component: ComponentType<P>,
  keys: (keyof P)[]
): React.MemoExoticComponent<ComponentType<P>> {
  return memo(Component, arePropsEqual(keys));
}

export default {
  MemoizedComponent,
  withMemo,
  withShallowMemo,
  withKeyMemo,
  arePropsEqual,
  arePropsShallowEqual,
};