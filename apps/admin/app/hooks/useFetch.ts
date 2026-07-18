import { useState, useEffect, useCallback } from 'react';

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseFetchOptions {
  skip?: boolean;
  retries?: number;
}

/**
 * Custom hook for data fetching with loading and error states
 * Centralizes data fetching logic to avoid duplication
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options?: UseFetchOptions
): UseFetchState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = options?.retries ?? 1;

  const fetchData = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const result = await fetchFn();
      setState({ data: result, loading: false, error: null });
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';

      if (retryCount < maxRetries) {
        setRetryCount(retryCount + 1);
        setTimeout(() => fetchData(), 1000 * (retryCount + 1));
      } else {
        setState({ data: null, loading: false, error: errorMessage });
      }
    }
  }, [fetchFn, retryCount, maxRetries]);

  useEffect(() => {
    if (!options?.skip) {
      fetchData();
    }
  }, [fetchData, options?.skip]);

  const refetch = useCallback(async () => {
    setRetryCount(0);
    await fetchData();
  }, [fetchData]);

  return { ...state, refetch };
}
