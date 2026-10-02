import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * `?new=1` deep link (sidebar quick actions) → open a page's create
 * dialog. Derived from the URL, so no effect is needed; `dismiss` strips
 * the param when the dialog closes.
 */
export function useNewParam(): [boolean, () => void] {
  const [params, setParams] = useSearchParams();
  const requested = params.get('new') === '1';
  const dismiss = useCallback(() => {
    if (!requested) return;
    const next = new URLSearchParams(params);
    next.delete('new');
    setParams(next, { replace: true });
  }, [params, requested, setParams]);
  return [requested, dismiss];
}
