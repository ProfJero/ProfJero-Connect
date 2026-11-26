import {
  EliteDataBalanceResponseSchema,
  EliteDataBundleListResponseSchema,
  EliteDataPurchaseResponseSchema,
  EliteDataVerifyNumberResponseSchema,
  EliteDataOrderStatusResponseSchema,
  type EliteDataBundle,
  type EliteDataOrder,
} from '@profjero/shared';
import type { Env } from '../types/env';

const DEFAULT_BASE_URL = 'https://elitedatagh.com';

export class EliteDataError extends Error {
  readonly status: number;
  readonly providerMessage: string;
  constructor(status: number, providerMessage: string) {
    super(`EliteData ${status}: ${providerMessage}`);
    this.name = 'EliteDataError';
    this.status = status;
    this.providerMessage = providerMessage;
  }
}

function baseUrl(env: Env): string {
  return (env.ELITEDATA_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function apiKey(env: Env): string {
  const key = env.ELITEDATA_API_KEY;
  if (!key) {
    throw new Error('ELITEDATA_API_KEY is not configured.');
  }
  return key;
}

async function call<T>(
  env: Env,
  method: 'GET' | 'POST',
  path: string,
  options: { body?: unknown; query?: Record<string, string> } = {},
): Promise<T> {
  const url = new URL(`${baseUrl(env)}${path}`);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${apiKey(env)}`,
      'Content-Type': 'application/json',
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(25_000),
  });

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // Non-JSON body — will fall through to the error path below.
    }
  }

  if (!res.ok) {
    const providerMessage =
      (json as { message?: string; error?: string } | null)?.message ??
      (json as { error?: string } | null)?.error ??
      (text.slice(0, 200) || `HTTP ${res.status}`);
    throw new EliteDataError(res.status, providerMessage);
  }

  return json as T;
}

export const elitedata = {
  async getBalance(env: Env) {
    const res = await call<unknown>(env, 'GET', '/api/v1/balance');
    return EliteDataBalanceResponseSchema.parse(res).data;
  },

  async listBundles(env: Env): Promise<EliteDataBundle[]> {
    const res = await call<unknown>(env, 'GET', '/api/v1/bundles');
    return EliteDataBundleListResponseSchema.parse(res).bundles;
  },

  /**
   * Buy a bundle. Returns the provider's order (id may be null if the
   * reply had none). A 2xx reply that says `success: false` is a refusal.
   */
  async purchaseBundle(
    env: Env,
    args: { bundleId: string; recipientNumber: string; clientReference: string },
  ): Promise<EliteDataOrder> {
    const res = await call<unknown>(env, 'POST', '/api/v1/purchase', {
      body: args,
    });
    const parsed = EliteDataPurchaseResponseSchema.safeParse(res);
    const body = parsed.success ? parsed.data : null;
    if (body?.success === false) {
      const msg = (res as { message?: string; error?: string } | null)?.message ?? (res as { error?: string } | null)?.error ?? 'Purchase refused';
      throw new EliteDataError(422, String(msg));
    }
    const order = body?.order ?? body?.data ?? null;
    // Accepted, but we couldn't read the order: treat as accepted and in
    // progress, keyed by our own reference (status checks fall back to it).
    return order ?? { id: null, clientReference: args.clientReference, status: 'PROCESSING' } as EliteDataOrder;
  },

  async verifyNumber(env: Env, number: string) {
    const res = await call<unknown>(env, 'GET', '/api/v1/verify-number', {
      query: { number },
    });
    return EliteDataVerifyNumberResponseSchema.parse(res);
  },

  /** One order by the provider's id. Null when the provider doesn't know it. */
  async getOrder(env: Env, orderId: string): Promise<EliteDataOrder | null> {
    try {
      const res = await call<unknown>(env, 'GET', '/api/v1/orders', { query: { id: orderId } });
      const body = EliteDataOrderStatusResponseSchema.parse(res);
      if (body.order) return body.order;
      if (body.data && !Array.isArray(body.data)) return body.data;
      const list = body.orders ?? (Array.isArray(body.data) ? body.data : []);
      return list.find((o) => o.id === orderId || o.clientReference === orderId) ?? null;
    } catch (err) {
      if (err instanceof EliteDataError && err.status === 404) return null;
      throw err;
    }
  },

  /** The provider's most recent orders (it returns its latest 10). */
  async listRecentOrders(env: Env): Promise<EliteDataOrder[]> {
    const res = await call<unknown>(env, 'GET', '/api/v1/orders');
    const body = EliteDataOrderStatusResponseSchema.parse(res);
    if (body.orders) return body.orders;
    if (Array.isArray(body.data)) return body.data;
    if (body.data) return [body.data];
    return body.order ? [body.order] : [];
  },
};
