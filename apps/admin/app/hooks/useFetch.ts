import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseFetchOptions {
  skip?: boolean;
  retries?: number;
  /**
   * Values that should trigger a refetch when they change, e.g. a page number or
   * search term. `fetchFn` is held in a ref and is deliberately not a dependency,
   * so without this the hook fetches once on mount and never again — which forces
   * callers to download everything up front and filter on the client.
   */
  deps?: unknown[];
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
    loading: !options?.skip,
    error: null,
  });

  const retryCountRef = useRef(0);
  const maxRetries = options?.retries ?? 1;
  const isMountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const performFetch = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const result = await fetchFnRef.current();
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
        setTimeout(() => performFetch(), delay);
      } else {
        setState({ data: null, loading: false, error: errorMessage });
      }
    }
  }, [maxRetries]);

  // Serialised so a fresh array literal each render does not retrigger the fetch.
  const depsKey = JSON.stringify(options?.deps ?? []);

  useEffect(() => {
    isMountedRef.current = true;

    if (options?.skip) {
      setState((current) => ({ ...current, loading: false }));
    } else {
      performFetch();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [options?.skip, performFetch, depsKey]);

  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    await performFetch();
  }, [performFetch]);

  return { ...state, refetch };
}
