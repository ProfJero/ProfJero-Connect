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

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await authHeaders()),
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
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
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
};