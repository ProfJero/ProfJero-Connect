import { reconcileUnknownRecords } from './reconciliation';
import type { Env } from '../types/env';

/**
 * Scheduled handler entry point. Cloudflare invokes this on each cron
 * expression configured in wrangler.toml. We route based on the expression.
 */
export async function handleScheduled(
  controller: ScheduledController,
  env: Env,
): Promise<void> {
  const cron = controller.cron;

  console.log(`[cron] trigger fired: ${cron} at ${new Date().toISOString()}`);

  if (cron === '*/15 * * * *') {
    await runReconciliation(env);
    return;
  }

  if (cron === '0 4 * * *') {
    await runProviderRequestCleanup(env);
    return;
  }

  console.warn(`[cron] no handler for expression: ${cron}`);
}

async function runReconciliation(env: Env): Promise<void> {
  try {
    const result = await reconcileUnknownRecords(env, {
      olderThanMinutes: 30,
      limit: 200,
      dryRun: false,
    });

    if (result.scanned === 0) {
      console.log('[cron] reconciliation: nothing to do');
      return;
    }

    console.log(
      `[cron] reconciliation: scanned=${result.scanned} confirmed=${result.confirmed} released=${result.released} keptUnknown=${result.keptUnknown} errors=${result.errors}`,
    );
  } catch (err) {
    console.error('[cron] reconciliation failed:', err);
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
  } catch (err) {
    console.error('[cron] provider cleanup failed:', err);
  }
}