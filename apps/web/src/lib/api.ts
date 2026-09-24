import { firebaseAuth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

interface ApiErrorBody {
  error: { code: string; message: string; requestId: string };
}

export class ApiError extends Error {
  status: number;
  code: string;
  requestId: string | null;

  constructor(
    status: number,
    code: string,
    message: string,
    requestId: string | null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

/**
 * Fetch wrapper for our Worker API.
 *  - Attaches the current Firebase ID token (SDK refreshes it in the background)
 *  - Parses the { error: { code, message, requestId } } envelope on failures
 *  - Throws ApiError on anything non-2xx
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const fbUser = firebaseAuth.currentUser;
  if (!fbUser) {
    throw new ApiError(401, 'unauthenticated', 'Not signed in.', null);
  }

  const token = await fbUser.getIdToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = body as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      err?.error?.code ?? `http_${res.status}`,
      err?.error?.message ?? `Request failed (${res.status}).`,
      err?.error?.requestId ?? null,
    );
  }

  return body as T;
}