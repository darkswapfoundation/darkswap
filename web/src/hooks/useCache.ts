/**
 * useCache - React hook for using the CacheManager with React components
 * 
 * This hook provides a convenient way to use the CacheManager in React components,
 * with automatic cache invalidation when components unmount.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import CacheManager, { CacheOptions } from '../utils/CacheManager';

/**
 * Options for the useCache hook
 */
export interface UseCacheOptions<T> extends CacheOptions {
  /** Initial data to use if cache is empty */
  initialData?: T;
  /** Function to fetch data if cache is empty */
  fetcher?: () => Promise<T>;
  /** Whether to automatically fetch data if cache is empty */
  autoFetch?: boolean;
  /** Dependencies array for refetching (similar to useEffect) */
  deps?: any[];
}

/**
 * Hook for using the CacheManager in React components
 * @param key Cache key
 * @param options Cache options
 * @returns [data, setData, { isLoading, error, refetch, invalidate }]
 */
export function useCache<T>(
  key: string,
  options: UseCacheOptions<T> = {}
): [
  T | null,
  (data: T) => void,
  {
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<T | null>;
    invalidate: () => void;
  }
] {
  // Extract options
  const {
    initialData = null,
    fetcher,
    autoFetch = true,
    deps = [],
    ...cacheOptions
  } = options;

  // State
  const [data, setDataState] = useState<T | null>(() => {
    // Try to get data from cache first
    const cachedData = CacheManager.get<T>(key);
    return cachedData !== null ? cachedData : initialData;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoize the key to prevent unnecessary refetches
  const memoizedKey = useMemo(() => key, [key]);

  // Function to set data and update cache
  const setData = useCallback(
    (newData: T) => {
      CacheManager.set<T>(memoizedKey, newData, cacheOptions);
      setDataState(newData);
    },
    [memoizedKey, cacheOptions]
  );

  // Function to fetch data
  const fetchData = useCallback(async (): Promise<T | null> => {
    if (!fetcher) return null;

    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetcher();
      setData(newData);
      return newData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, setData]);

  // Function to invalidate cache
  const invalidate = useCallback(() => {
    CacheManager.remove(memoizedKey);
    setDataState(initialData);
  }, [memoizedKey, initialData]);

  // Auto fetch data if needed
  useEffect(() => {
    if (autoFetch && data === null && fetcher) {
      fetchData();
    }
  }, [autoFetch, data, fetcher, fetchData, ...deps]);

  return [
    data,
    setData,
    {
      isLoading,
      error,
      refetch: fetchData,
      invalidate,
    },
  ];
}

/**
 * Hook for using the CacheManager with multiple keys
 * @param keys Array of cache keys
 * @param options Cache options
 * @returns [dataMap, setDataMap, { isLoading, error, refetch, invalidate }]
 */
export function useCacheMap<T>(
  keys: string[],
  options: UseCacheOptions<T> = {}
): [
  Record<string, T | null>,
  (key: string, data: T) => void,
  {
    isLoading: boolean;
    error: Error | null;
    refetch: (key?: string) => Promise<Record<string, T | null>>;
    invalidate: (key?: string) => void;
  }
] {
  // Extract options
  const {
    initialData = null,
    fetcher,
    autoFetch = true,
    deps = [],
    ...cacheOptions
  } = options;

  // State
  const [dataMap, setDataMapState] = useState<Record<string, T | null>>(() => {
    // Try to get data from cache first
    const initialMap: Record<string, T | null> = {};
    keys.forEach((key) => {
      const cachedData = CacheManager.get<T>(key);
      initialMap[key] = cachedData !== null ? cachedData : initialData;
    });
    return initialMap;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoize the keys to prevent unnecessary refetches
  const memoizedKeys = useMemo(() => keys, [JSON.stringify(keys)]);

  // Function to set data for a specific key and update cache
  const setDataForKey = useCallback(
    (key: string, newData: T) => {
      CacheManager.set<T>(key, newData, cacheOptions);
      setDataMapState((prev) => ({
        ...prev,
        [key]: newData,
      }));
    },
    [cacheOptions]
  );

  // Function to fetch data for all keys or a specific key
  const fetchData = useCallback(
    async (specificKey?: string): Promise<Record<string, T | null>> => {
      if (!fetcher) return dataMap;

      const keysToFetch = specificKey ? [specificKey] : memoizedKeys;

      setIsLoading(true);
      setError(null);

      try {
        const newDataMap: Record<string, T | null> = { ...dataMap };

        // Fetch data for each key
        await Promise.all(
          keysToFetch.map(async (key) => {
            try {
              const newData = await fetcher();
              newDataMap[key] = newData;
              CacheManager.set<T>(key, newData, cacheOptions);
            } catch (err) {
              console.error(`Error fetching data for key ${key}:`, err);
            }
          })
        );

        setDataMapState(newDataMap);
        return newDataMap;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return dataMap;
      } finally {
        setIsLoading(false);
      }
    },
    [fetcher, dataMap, memoizedKeys, cacheOptions]
  );

  // Function to invalidate cache for all keys or a specific key
  const invalidate = useCallback(
    (specificKey?: string) => {
      const keysToInvalidate = specificKey ? [specificKey] : memoizedKeys;

      keysToInvalidate.forEach((key) => {
        CacheManager.remove(key);
      });

      setDataMapState((prev) => {
        const newMap = { ...prev };
        keysToInvalidate.forEach((key) => {
          newMap[key] = initialData;
        });
        return newMap;
      });
    },
    [memoizedKeys, initialData]
  );

  // Auto fetch data if needed
  useEffect(() => {
    if (autoFetch && fetcher) {
      const keysToFetch = memoizedKeys.filter((key) => dataMap[key] === null);
      if (keysToFetch.length > 0) {
        fetchData();
      }
    }
  }, [autoFetch, fetcher, fetchData, dataMap, memoizedKeys, ...deps]);

  return [
    dataMap,
    setDataForKey,
    {
      isLoading,
      error,
      refetch: fetchData,
      invalidate,
    },
  ];
}

export default useCache;