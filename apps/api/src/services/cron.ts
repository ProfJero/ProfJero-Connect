import { reconcileUnknownRecords } from './reconciliation';
import { recordJobRun } from './systemStatus';
import { refreshProviderBalances } from './providerBalance';
import { resumeStalledBatches } from './sms';
import { dispatchDueCampaigns } from './campaigns';
import type { Env } from '../types/env';

/**
 * Scheduled handler entry point. Cloudflare invokes this on each cron
 * expression configured in wrangler.toml. We route based on the expression.
 */
export { runReconciliation, runBalanceRefresh, runDispatcher };

export async function handleScheduled(
  controller: ScheduledController,
  env: Env,
): Promise<void> {
  const cron = controller.cron;

  console.log(`[cron] trigger fired: ${cron} at ${new Date().toISOString()}`);

  if (cron === '* * * * *') {
    await runDispatcher(env);
    return;
  }

  if (cron === '*/15 * * * *') {
    await runReconciliation(env);
    await runBalanceRefresh(env);
    return;
  }

  if (cron === '0 4 * * *') {
    await runProviderRequestCleanup(env);
    return;
  }

  console.warn(`[cron] no handler for expression: ${cron}`);
}

/**
 * Every minute: continue SMS deliveries whose background worker stopped,
 * and send scheduled campaigns that are due.
 */
async function runDispatcher(env: Env): Promise<void> {
  const started = Date.now();
  try {
    const { resumed } = await resumeStalledBatches(env);
    const { dispatched, failed } = await dispatchDueCampaigns(env);
    await recordJobRun(env, 'dispatcher', {
      lastRunAt: new Date().toISOString(),
      ok: failed === 0,
      summary: `resumedBatches=${resumed} campaignsSent=${dispatched} campaignsFailed=${failed}`,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    console.error('[cron] dispatcher failed:', err);
    await recordJobRun(env, 'dispatcher', { lastRunAt: new Date().toISOString(), ok: false, summary: String(err).slice(0, 300), durationMs: Date.now() - started });
  }
}

async function runBalanceRefresh(env: Env): Promise<void> {
  const started = Date.now();
  try {
    const summary = await refreshProviderBalances(env);
    await recordJobRun(env, 'balanceRefresh', { lastRunAt: new Date().toISOString(), ok: true, summary, durationMs: Date.now() - started });
  } catch (err) {
    console.error('[cron] balance refresh failed:', err);
    await recordJobRun(env, 'balanceRefresh', { lastRunAt: new Date().toISOString(), ok: false, summary: String(err).slice(0, 300), durationMs: Date.now() - started });
  }
}

async function runReconciliation(env: Env): Promise<void> {
  const started = Date.now();
  try {
    const result = await reconcileUnknownRecords(env, {
      olderThanMinutes: 30,
      limit: 200,
      dryRun: false,
    });

    const summary = `scanned=${result.scanned} confirmed=${result.confirmed} released=${result.released} keptUnknown=${result.keptUnknown} errors=${result.errors}`;
    console.log(`[cron] reconciliation: ${summary}`);
    await recordJobRun(env, 'reconciliation', { lastRunAt: new Date().toISOString(), ok: result.errors === 0, summary, durationMs: Date.now() - started });
  } catch (err) {
    console.error('[cron] reconciliation failed:', err);
    await recordJobRun(env, 'reconciliation', { lastRunAt: new Date().toISOString(), ok: false, summary: String(err).slice(0, 300), durationMs: Date.now() - started });
  }
}

async function runProviderRequestCleanup(env: Env): Promise<void> {
  try {
    const { firestoreListDocs, firestoreDeleteDoc } = await import(
      '../lib/firestore'
    );

    const { docs } = await firestoreListDocs(env, 'providerRequests', {
      pageSize: 500,
    });

    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let deleted = 0;
    let skipped = 0;

    for (const doc of docs) {
      const expiresAt = doc.data.expiresAt;
      if (typeof expiresAt === 'string') {
        if (new Date(expiresAt).getTime() < Date.now()) {
          await firestoreDeleteDoc(env, 'providerRequests', doc.id);
          deleted += 1;
        } else {
          skipped += 1;
        }
        continue;
      }

      // Older docs without expiresAt — fall back to createdAt.
      const createdAt = doc.data.createdAt;
      if (
        typeof createdAt === 'string' &&
        new Date(createdAt).getTime() < cutoff
      ) {
        await firestoreDeleteDoc(env, 'providerRequests', doc.id);
        deleted += 1;
      } else {
        skipped += 1;
      }
    }

    console.log(
      `[cron] provider cleanup: deleted=${deleted} skipped=${skipped}`,
    );
    await recordJobRun(env, 'providerCleanup', { lastRunAt: new Date().toISOString(), ok: true, summary: `deleted=${deleted} skipped=${skipped}`, durationMs: 0 });
  } catch (err) {
    console.error('[cron] provider cleanup failed:', err);
    await recordJobRun(env, 'providerCleanup', { lastRunAt: new Date().toISOString(), ok: false, summary: String(err).slice(0, 300), durationMs: 0 });
  }
}