import type { Env } from '../types/env';

const PAYSTACK_BASE = 'https://api.paystack.co';

// ---------- Signature verification ----------

/**
 * Paystack signs webhooks with HMAC-SHA512 using the account's secret key.
 * The signature arrives in the `x-paystack-signature` header as a
 * lowercase hex string. We compute the same HMAC over the raw request body
 * and compare in constant time.
 *
 * The raw body matters — re-serialising the JSON would change byte length
 * and break the signature.
 */
export async function verifyPaystackSignature(
  rawBody: string,
  signature: string,
  secretKey: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const hex = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (hex.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) {
    diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

// ---------- Transaction initialize ----------

export interface InitializeArgs {
  email: string;
  amountPesewas: number;
  reference: string;
  currency?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  };
}

export async function initializeTransaction(
  env: Env,
  args: InitializeArgs,
): Promise<InitializeResult> {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: args.email,
      amount: args.amountPesewas,
      reference: args.reference,
      currency: args.currency ?? 'GHS',
      ...(args.callbackUrl ? { callback_url: args.callbackUrl } : {}),
      ...(args.metadata ? { metadata: args.metadata } : {}),
    }),
  });

  const text = await res.text();
  let body: PaystackInitResponse | null = null;
  try {
    body = text ? (JSON.parse(text) as PaystackInitResponse) : null;
  } catch {
    body = null;
  }

  if (!res.ok || !body?.status || !body.data?.authorization_url) {
    const detail = body?.message ?? `HTTP ${res.status}`;
    throw new Error(`Paystack initialize failed: ${detail}`);
  }

  return {
    authorizationUrl: body.data.authorization_url,
    accessCode: body.data.access_code ?? '',
    reference: body.data.reference ?? args.reference,
  };
}

// ---------- Transaction verify ----------

export interface VerifyResult {
  success: boolean;
  amountPesewas: number;
  currency: string;
  status: string;
  reference: string;
  paidAt: string | null;
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    paid_at?: string | null;
  };
}

export async function verifyTransaction(
  env: Env,
  reference: string,
): Promise<VerifyResult | null> {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  }

  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      },
    },
  );

  if (!res.ok) return null;

  const text = await res.text();
  let body: PaystackVerifyResponse | null = null;
  try {
    body = text ? (JSON.parse(text) as PaystackVerifyResponse) : null;
  } catch {
    body = null;
  }

  if (!body?.status || !body.data) return null;

  return {
    success: body.data.status === 'success',
    amountPesewas: Number(body.data.amount ?? 0),
    currency: String(body.data.currency ?? 'GHS'),
    status: String(body.data.status ?? 'unknown'),
    reference: String(body.data.reference ?? reference),
    paidAt: body.data.paid_at ?? null,
  };
}