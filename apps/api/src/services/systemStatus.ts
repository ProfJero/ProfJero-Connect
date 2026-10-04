import { firestoreGetDoc, firestoreUpdateDoc } from '../lib/firestore';
import type { Env } from '../types/env';

/**
 * Heartbeats for scheduled jobs, so the admin can see that background
 * recovery (reconciliation, cleanup, balance refresh) is actually running
 * and an alert fires when it stops. Stored in systemStatus/cron.
 */

export type JobName = 'reconciliation' | 'providerCleanup' | 'balanceRefresh' | 'dispatcher';

export interface JobRun {
  lastRunAt: string;
  ok: boolean;
  summary: string;
  durationMs: number;
}

export async function recordJobRun(env: Env, job: JobName, run: JobRun): Promise<void> {
  try {
    await firestoreUpdateDoc(env, 'systemStatus', 'cron', { [job]: run });
  } catch (err) {
    console.error(`[systemStatus] could not record ${job} run:`, err);
  }
}

export async function getJobRuns(env: Env): Promise<Partial<Record<JobName, JobRun>>> {
  const doc = await firestoreGetDoc(env, 'systemStatus', 'cron');
  return (doc?.data ?? {}) as Partial<Record<JobName, JobRun>>;
}
