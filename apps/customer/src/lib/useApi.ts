import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

/**
 * Fetch a /customer/* resource.
 *
 * `loading` is derived (the last settled request key differs from the
 * current one) rather than set synchronously inside the effect, which keeps
 * React 19's set-state-in-effect rule happy and avoids an extra render.
 *
 * On refresh the previous data stays visible until the new response lands,
 * so lists don't flash to a skeleton after every action.
 *
 * Pass `null` as the path to skip fetching.
 */
export function useApi<T>(path: string | null) {
  const [nonce, setNonce] = useState(0);
  const key = path === null ? null : `${path}#${nonce}`;
  const [state, setState] = useState<{
    data: T | null;
    error: Error | null;
    settledKey: string | null;
  }>({ data: null, error: null, settledKey: null });

  useEffect(() => {
    if (path === null || key === null) return;
    let cancelled = false;
    api.get<T>(path).then(
      (data) => {
        if (!cancelled) setState({ data, error: null, settledKey: key });
      },
      (err: unknown) => {
        if (!cancelled)
          setState((s) => ({
            data: s.data,
            error: err instanceof Error ? err : new Error(String(err)),
            settledKey: key,
          }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [path, key]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (updater: (prev: T | null) => T | null) =>
      setState((s) => ({ ...s, data: updater(s.data) })),
    [],
  );

  const loading = key !== null && state.settledKey !== key;
  return {
    data: state.data,
    error: loading ? null : state.error,
    loading,
    refresh,
    setData,
  };
}

/**
 * Cursor-paginated list ("Load more"). `basePath` may already contain a
 * query string; `before=<cursor>` is appended for subsequent pages.
 */
export function useCursorList<T>(
  basePath: string | null,
  itemsKey: string,
) {
  const first = useApi<Record<string, unknown>>(basePath);
  const [extra, setExtra] = useState<{ forKey: unknown; items: T[]; cursor: string | null | undefined }>({
    forKey: null,
    items: [],
    cursor: undefined,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<Error | null>(null);

  // Extra pages belong to one specific first page; a refresh or filter
  // change (new `first.data` object) discards them.
  const current = extra.forKey === first.data ? extra : { items: [] as T[], cursor: undefined };
  const firstItems = (first.data?.[itemsKey] as T[] | undefined) ?? [];
  const cursor =
    current.cursor !== undefined
      ? current.cursor
      : ((first.data?.nextCursor as string | null | undefined) ?? null);

  const loadMore = useCallback(async () => {
    if (!basePath || !cursor || loadingMore) return;
    setLoadingMore(true);
    setMoreError(null);
    const sep = basePath.includes('?') ? '&' : '?';
    try {
      const res = await api.get<Record<string, unknown>>(
        `${basePath}${sep}before=${encodeURIComponent(cursor)}`,
      );
      setExtra({
        forKey: first.data,
        items: [...current.items, ...((res[itemsKey] as T[]) ?? [])],
        cursor: (res.nextCursor as string | null) ?? null,
      });
    } catch (err) {
      setMoreError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoadingMore(false);
    }
  }, [basePath, cursor, loadingMore, first.data, current.items, itemsKey]);

  return {
    items: [...firstItems, ...current.items],
    raw: first.data,
    loading: first.loading && !first.data,
    refreshing: first.loading,
    error: first.error ?? moreError,
    hasMore: cursor !== null,
    loadingMore,
    loadMore,
    refresh: first.refresh,
  };
}
