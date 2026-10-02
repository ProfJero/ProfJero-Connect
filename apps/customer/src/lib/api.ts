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
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, body, opts),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
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