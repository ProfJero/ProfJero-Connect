import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from './api';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | Error | null;
  reload: () => void;
}

/**
 * Tiny loading/error/data hook for GET endpoints.
 * Pass `null` as `path` to skip the fetch entirely (e.g. when a route param
 * is missing).
 */
export function useApi<T>(path: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (path === null) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<T>(path)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err : new Error('Unknown error'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, reload };
}