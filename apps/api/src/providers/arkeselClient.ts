import type { Env } from '../types/env';
import { logProviderRequest } from '../services/providerRequests';

const ARKESEL_BASE = 'https://sms.arkesel.com/api/v2';

export interface ArkeselMessageReport {
  id: string;
  status: string;
  recipient?: string;
  sender?: string;
  message?: string;
  messageCount?: number;
  sentAtTime?: string;
}

interface SingleReportResponse {
  status?: string;
  data?: {
    ID?: string;
    status?: string;
    recipient?: string;
    sender?: string;
    message?: string;
    message_count?: number;
    sent_at_time?: string;
  };
}

interface BatchReportResponse {
  status?: string;
  data?: Record<string, Record<string, unknown>>;
}

function normalizeReport(
  id: string,
  raw: Record<string, unknown> | undefined,
): ArkeselMessageReport {
  return {
    id: String(raw?.ID ?? id),
    status: String(raw?.status ?? 'UNKNOWN'),
    recipient: raw?.recipient as string | undefined,
    sender: raw?.sender as string | undefined,
    message: raw?.message as string | undefined,
    messageCount: raw?.message_count as number | undefined,
    sentAtTime: raw?.sent_at_time as string | undefined,
  };
}

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

export async function fetchMessageReport(
  env: Env,
  providerId: string,
  messageId: string,
): Promise<ArkeselMessageReport | null> {
  const started = Date.now();
  try {
    const res = await fetch(
      `${ARKESEL_BASE}/sms/${encodeURIComponent(messageId)}`,
      { headers: { 'api-key': env.ARKESEL_API_KEY! } },
    );
    const durationMs = Date.now() - started;

    if (!res.ok) {
      await logProviderRequest(env, {
        providerId,
        operation: 'message_report',
        status: 'error',
        httpStatus: res.status,
        durationMs,
        summary: '1 ID',
        error: `HTTP ${res.status}`,
      });
      return null;
    }
    const body = (await res.json()) as SingleReportResponse;
    if (!body.data) {
      await logProviderRequest(env, {
        providerId,
        operation: 'message_report',
        status: 'success',
        httpStatus: res.status,
        durationMs,
        summary: '1 ID (no data)',
        error: null,
      });
      return null;
    }
    await logProviderRequest(env, {
      providerId,
      operation: 'message_report',
      status: 'success',
      httpStatus: res.status,
      durationMs,
      summary: '1 ID',
      error: null,
    });
    return normalizeReport(messageId, body.data as Record<string, unknown>);
  } catch (err) {
    await logProviderRequest(env, {
      providerId,
      operation: 'message_report',
      status: 'error',
      httpStatus: null,
      durationMs: Date.now() - started,
      summary: '1 ID',
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function fetchBatchReports(
  env: Env,
  providerId: string,
  messageIds: string[],
): Promise<Map<string, ArkeselMessageReport>> {
  const out = new Map<string, ArkeselMessageReport>();
  if (messageIds.length === 0) return out;

  for (let i = 0; i < messageIds.length; i += 100) {
    const chunk = messageIds.slice(i, i + 100);
    const started = Date.now();
    try {
      const res = await fetch(`${ARKESEL_BASE}/sms/message-reports`, {
        method: 'POST',
        headers: {
          'api-key': env.ARKESEL_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ msg_ids: chunk }),
      });
      const durationMs = Date.now() - started;

      if (!res.ok) {
        await logProviderRequest(env, {
          providerId,
          operation: 'batch_reports',
          status: 'error',
          httpStatus: res.status,
          durationMs,
          summary: `${chunk.length} IDs`,
          error: `HTTP ${res.status}`,
        });
        continue;
      }

      const body = (await res.json()) as BatchReportResponse;
      const rawCount = body.data ? Object.keys(body.data).length : 0;
      if (body.data) {
        for (const [id, raw] of Object.entries(body.data)) {
          out.set(id, normalizeReport(id, raw));
        }
      }
      await logProviderRequest(env, {
        providerId,
        operation: 'batch_reports',
        status: 'success',
        httpStatus: res.status,
        durationMs,
        summary: `${chunk.length} IDs → ${rawCount} found`,
        error: null,
      });
    } catch (err) {
      await logProviderRequest(env, {
        providerId,
        operation: 'batch_reports',
        status: 'error',
        httpStatus: null,
        durationMs: Date.now() - started,
        summary: `${chunk.length} IDs`,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return out;
}

export interface ArkeselBalance {
  smsCredits: number;
  mainBalanceGhs: number;
}

interface BalanceResponse {
  status?: string;
  data?: {
    sms_balance?: string | number;
    main_balance?: string | number;
  };
}

export async function fetchBalance(
  env: Env,
  providerId: string,
): Promise<ArkeselBalance | null> {
  const started = Date.now();
  try {
    const res = await fetch(`${ARKESEL_BASE}/clients/balance-details`, {
      headers: { 'api-key': env.ARKESEL_API_KEY! },
    });
    const durationMs = Date.now() - started;

    if (!res.ok) {
      await logProviderRequest(env, {
        providerId,
        operation: 'balance_check',
        status: 'error',
        httpStatus: res.status,
        durationMs,
        summary: 'balance',
        error: `HTTP ${res.status}`,
      });
      return null;
    }

    const body = (await res.json()) as BalanceResponse;
    if (!body.data) {
      await logProviderRequest(env, {
        providerId,
        operation: 'balance_check',
        status: 'success',
        httpStatus: res.status,
        durationMs,
        summary: 'balance (no data)',
        error: null,
      });
      return null;
    }

    const smsCredits = Number(body.data.sms_balance ?? 0);
    const rawMain = body.data.main_balance;
    let mainBalanceGhs = 0;
    if (typeof rawMain === 'number') mainBalanceGhs = rawMain;
    else if (typeof rawMain === 'string') {
      const match = rawMain.match(/[\d.]+/);
      mainBalanceGhs = match ? Number(match[0]) : 0;
    }

    await logProviderRequest(env, {
      providerId,
      operation: 'balance_check',
      status: 'success',
      httpStatus: res.status,
      durationMs,
      summary: `${smsCredits.toLocaleString()} credits, GHS ${mainBalanceGhs.toFixed(2)}`,
      error: null,
    });

    return { smsCredits, mainBalanceGhs };
  } catch (err) {
    await logProviderRequest(env, {
      providerId,
      operation: 'balance_check',
      status: 'error',
      httpStatus: null,
      durationMs: Date.now() - started,
      summary: 'balance',
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ---------- Paystack (unchanged below) ----------

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
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
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
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` } },
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