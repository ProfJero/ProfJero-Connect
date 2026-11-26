import {
  firestoreCreateDoc,
  firestoreListDocs,
} from '../lib/firestore';
import type { Env } from '../types/env';
import type {
  ProviderRequest,
  ProviderRequestOperation,
  ProviderRequestStatus,
} from '@profjero/shared';

const COLLECTION = 'providerRequests';
const TTL_DAYS = 7;

function parse(id: string, data: Record<string, unknown>): ProviderRequest {
  return {
    id,
    // New docs use providerId; fall back to old `provider` field for
    // backward compat with requests logged before C.19c.1.
    providerId: String(data.providerId ?? data.provider ?? ''),
    operation: data.operation as ProviderRequestOperation,
    status: data.status as ProviderRequestStatus,
    httpStatus:
      data.httpStatus === null || data.httpStatus === undefined
        ? null
        : Number(data.httpStatus),
    durationMs: Number(data.durationMs ?? 0),
    summary: String(data.summary ?? ''),
    error: (data.error as string | null) ?? null,
    createdAt: String(data.createdAt ?? new Date().toISOString()),
  };
}

export interface CreateProviderRequestArgs {
  providerId: string;
  operation: ProviderRequestOperation;
  status: ProviderRequestStatus;
  httpStatus: number | null;
  durationMs: number;
  summary: string;
  error: string | null;
}

export async function createProviderRequest(
  env: Env,
  args: CreateProviderRequestArgs,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  try {
    await firestoreCreateDoc(env, COLLECTION, {
      providerId: args.providerId,
      operation: args.operation,
      status: args.status,
      httpStatus: args.httpStatus,
      durationMs: args.durationMs,
      summary: args.summary,
      error: args.error,
      createdAt: now.toISOString(),
      expiresAt,
    });
  } catch (err) {
    console.error('[providerRequests] failed to log:', err);
  }
}

export async function listRecentProviderRequests(
  env: Env,
  providerId: string,
  limit = 50,
): Promise<ProviderRequest[]> {
  const { docs } = await firestoreListDocs(env, COLLECTION, {
    pageSize: 500,
  });
  return docs
    .map((d) => parse(d.id, d.data))
    .filter((r) => r.providerId === providerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}