import { firebaseAuth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string;

  constructor(status: number, code: string, message: string, requestId: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

interface ApiErrorEnvelope {
  error: { code: string; message: string; requestId: string };
}

async function authHeaders(): Promise<Record<string, string>> {
  const user = firebaseAuth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export interface RequestOptions {
  /**
   * Sent as the Idempotency-Key header. Generate once per logical action
   * (newIdempotencyKey) and reuse it on retry so the server can dedupe.
   */
  idempotencyKey?: string;
}

// ── Short-lived GET cache ────────────────────────────────────────────
// Several widgets often ask for the same thing (e.g. the overview and the
// attention strip, or the wallet in the topbar and on a page). Sharing one
// response for a few seconds — and one in-flight request — saves database
// reads (free-tier quota) and makes navigation feel instant. Any write
// (POST/PUT/PATCH/DELETE) or sign-in change clears it, so data a customer
// just changed is never stale.
const GET_TTL_MS = 15_000;
const getCache = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

export function invalidateApiCache(): void {
  getCache.clear();
  inflight.clear();
}

async function cachedGet<T>(path: string, fresh: boolean): Promise<T> {
  if (!fresh) {
    const hit = getCache.get(path);
    if (hit && Date.now() - hit.at < GET_TTL_MS) return hit.data as T;
    const pending = inflight.get(path);
    if (pending) return pending as Promise<T>;
  }
  const p = request<T>('GET', path)
    .then((data) => {
      getCache.set(path, { at: Date.now(), data });
      return data;
    })
    .finally(() => {
      if (inflight.get(path) === p) inflight.delete(path);
    });
  inflight.set(path, p);
  return p;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await authHeaders()),
    ...(opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Network failure — no response at all.
    throw new ApiError(
      0,
      'network_error',
      'Network error. Check your connection and try again.',
      '',
    );
  }

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // Server returned non-JSON (probably a 500 from an edge case).
      throw new ApiError(
        res.status,
        `http_${res.status}`,
        text.slice(0, 200) || 'Request failed',
        '',
      );
    }
  }

  if (!res.ok) {
    const env = json as ApiErrorEnvelope | null;
    if (env?.error?.code) {
      throw new ApiError(
        res.status,
        env.error.code,
        env.error.message,
        env.error.requestId,
      );
    }
    throw new ApiError(
      res.status,
      `http_${res.status}`,
      'Request failed',
      '',
    );
  }

  return json as T;
}

export const api = {
  /** `fresh: true` skips the short cache (manual refresh, polling). */
  get: <T>(path: string, opts: { fresh?: boolean } = {}) => cachedGet<T>(path, opts.fresh ?? false),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, body, opts).finally(invalidateApiCache),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body).finally(invalidateApiCache),
  del: <T>(path: string) => request<T>('DELETE', path).finally(invalidateApiCache),
};

/** Fresh key for one logical, retry-safe action (e.g. one Send click). */
export function newIdempotencyKey(purpose: string): string {
  return `${purpose}-${crypto.randomUUID()}`;
}

/**
 * Message for display. Server errors carry a requestId — surfacing it lets
 * support correlate with Worker logs (customer-platform.md §12).
 */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.status >= 500 && err.requestId
      ? `${err.message} (ref: ${err.requestId.slice(0, 8)})`
      : err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}