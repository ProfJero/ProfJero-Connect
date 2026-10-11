/**
 * Sends crashes to the API (POST /monitor/client-error) so they appear in
 * the admin Monitoring page. Fire-and-forget, deduplicated, and capped per
 * page load so a crash loop can't flood anything.
 */
const API_URL: string = import.meta.env.VITE_API_URL ?? '';
const seen = new Set<string>();
let sent = 0;

export function reportError(error: unknown, extra?: { componentStack?: string }): void {
  try {
    if (!API_URL || sent >= 10) return;
    const e = error instanceof Error ? error : new Error(String(error));
    const key = `${e.name}:${e.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    sent += 1;
    const body = JSON.stringify({
      app: 'customer',
      message: `${e.name}: ${e.message}`.slice(0, 500),
      stack: [e.stack, extra?.componentStack].filter(Boolean).join('\n').slice(0, 2000),
      url: location.pathname.slice(0, 300),
    });
    void fetch(`${API_URL}/monitor/client-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never let reporting throw */
  }
}

/** Uncaught errors and unhandled promise rejections. */
export function installErrorReporting(): void {
  window.addEventListener('error', (ev) => reportError(ev.error ?? ev.message));
  window.addEventListener('unhandledrejection', (ev) => reportError(ev.reason));
}
