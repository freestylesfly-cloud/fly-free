import { useState, useEffect, useCallback, useRef } from 'react';

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

  const retryCountRef = useRef(0);
  const maxRetries = options?.retries ?? 1;
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState({ data: null, loading: true, error: null });

    try {
      const result = await fetchFn();
      if (isMountedRef.current) {
        setState({ data: result, loading: false, error: null });
        retryCountRef.current = 0;
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';

      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        const delay = 1000 * retryCountRef.current;
        setTimeout(() => fetchData(), delay);
      } else {
        setState({ data: null, loading: false, error: errorMessage });
      }
    }
  }, [fetchFn, maxRetries]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!options?.skip) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchFn, options?.skip, fetchData]);

  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchData();
  }, [fetchData]);

  return { ...state, refetch };
}
