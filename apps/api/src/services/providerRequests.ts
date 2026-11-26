import { createProviderRequest } from '../repositories/providerRequests';
import type { Env } from '../types/env';
import type {
  ProviderRequestOperation,
  ProviderRequestStatus,
} from '@profjero/shared';

export interface LogArgs {
  providerId: string;
  operation: ProviderRequestOperation;
  status: ProviderRequestStatus;
  httpStatus: number | null;
  durationMs: number;
  summary: string;
  error: string | null;
}

export async function logProviderRequest(
  env: Env,
  args: LogArgs,
): Promise<void> {
  try {
    await createProviderRequest(env, args);
  } catch (err) {
    console.error('[logProviderRequest] unexpected:', err);
  }
}