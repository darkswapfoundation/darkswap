import { useState, useCallback } from 'react';

interface ApiOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  execute: () => Promise<T | null>;
}

/**
 * Custom hook for making API requests
 * @param url - The URL to fetch
 * @param options - API options
 * @returns API response object
 */
export function useApi<T>(
  url: string,
  options: ApiOptions = {}
): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { headers = {}, timeout = 30000 } = options;

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url, headers, timeout]);

  return { data, error, loading, execute };
}

/**
 * Custom hook for making POST API requests
 * @param url - The URL to fetch
 * @param options - API options
 * @returns API response object with post method
 */
export function usePostApi<T, D = unknown>(
  url: string,
  options: ApiOptions = {}
): ApiResponse<T> & { post: (data: D) => Promise<T | null> } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { headers = {}, timeout = 30000 } = options;

  const execute = useCallback(async (): Promise<T | null> => {
    // This is just a placeholder since we're using post instead
    return null;
  }, []);

  const post = useCallback(
    async (postData: D): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(postData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, headers, timeout]
  );

  return { data, error, loading, execute, post };
}

/**
 * Custom hook for making API requests with automatic execution
 * @param url - The URL to fetch
 * @param options - API options
 * @param autoExecute - Whether to execute the request automatically (default: true)
 * @returns API response object
 */
export function useAutoApi<T>(
  url: string,
  options: ApiOptions = {},
  autoExecute = true
): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(autoExecute);

  const { headers = {}, timeout = 30000 } = options;

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url, headers, timeout]);

  // Execute automatically if autoExecute is true
  useState(() => {
    if (autoExecute) {
      execute();
    }
  });

  return { data, error, loading, execute };
}