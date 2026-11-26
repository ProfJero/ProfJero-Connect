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
  const [tick, setTick] = useState(0);
  // One key per request; results are tagged with the key they belong to, so
  // "loading" is derived (key not answered yet) rather than set in the effect.
  const key = path === null ? null : `${path}#${tick}`;
  const [result, setResult] = useState<{
    key: string | null;
    path: string | null;
    data: T | null;
    error: ApiError | Error | null;
  }>({ key: null, path: null, data: null, error: null });

  useEffect(() => {
    if (key === null || path === null) return;
    let cancelled = false;
    apiFetch<T>(path)
      .then((data) => {
        if (!cancelled) setResult({ key, path, data, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult((prev) => ({
            key,
            path,
            // Keep showing the last good data for the same path on a failed reload.
            data: prev.path === path ? prev.data : null,
            error: err instanceof Error ? err : new Error('Unknown error'),
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, path]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  if (path === null) return { data: null, loading: false, error: null, reload };
  const answered = result.key === key;
  return {
    // Stale data for the same path stays visible while reloading.
    data: result.path === path ? result.data : null,
    loading: !answered,
    error: answered ? result.error : null,
    reload,
  };
}
