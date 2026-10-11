import {
  EliteDataBalanceResponseSchema,
  EliteDataBundleListResponseSchema,
  EliteDataPurchaseResponseSchema,
  EliteDataVerifyNumberResponseSchema,
  EliteDataOrderStatusResponseSchema,
  type EliteDataBundle,
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

  async purchaseBundle(
    env: Env,
    args: { bundleId: string; recipientNumber: string; clientReference: string },
  ) {
    const res = await call<unknown>(env, 'POST', '/api/v1/purchase', {
      body: args,
    });
    return EliteDataPurchaseResponseSchema.parse(res).order;
  },

  async verifyNumber(env: Env, number: string) {
    const res = await call<unknown>(env, 'GET', '/api/v1/verify-number', {
      query: { number },
    });
    return EliteDataVerifyNumberResponseSchema.parse(res);
  },

  async getOrder(env: Env, orderId: string) {
    const res = await call<unknown>(env, 'GET', '/api/v1/orders', {
      query: { id: orderId },
    });
    return EliteDataOrderStatusResponseSchema.parse(res).order;
  },
};