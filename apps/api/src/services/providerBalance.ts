import { fetchBalance } from '../providers/arkeselClient';
import { createProvider, getProviderRecord, listProviderRecords, updateProvider } from '../repositories/providers';
import { elitedata } from '../providers/elitedataClient';
import { getSettings } from './settings';
import { notifyAdmins } from './adminNotify';
import type { Env } from '../types/env';

/**
 * Refresh cached balances for live SMS providers (cron, every 15 min) so
 * the admin sidebar and alerts reflect reality without anyone clicking
 * "refresh". Emails operators when a balance crosses below the alert level.
 */
export async function refreshProviderBalances(env: Env): Promise<string> {
  const parts: string[] = [];
  const all = await listProviderRecords(env);
  // Data provider wallet: at most hourly (one provider call + one write).
  const data = all.find((p) => p.driver === 'elitedata');
  if (env.ELITEDATA_API_KEY && data && (!data.balanceCheckedAt || Date.now() - new Date(data.balanceCheckedAt).getTime() > 55 * 60_000)) {
    try {
      const bal = await elitedata.getBalance(env);
      await updateProvider(env, data.id, { mainBalanceGhs: Math.max(0, bal.balance), balanceCheckedAt: new Date().toISOString() }, 'system:cron');
      parts.push(`${data.id}: GH₵${bal.balance.toFixed(2)}`);
      if (bal.balance < 50 && (data.mainBalanceGhs === null || data.mainBalanceGhs >= 50)) {
        await notifyAdmins(env, 'emailOnProviderLowBalance', `Data provider wallet is low`, `${data.id} has GH₵${bal.balance.toFixed(2)} left. Top it up so customer data orders don't fail.`);
      }
    } catch (err) {
      parts.push(`${data.id}: fetch failed`);
      console.error('[balance] data provider balance failed:', err);
    }
  }
  if (env.SMS_PROVIDER !== 'arkesel' || !env.ARKESEL_API_KEY) return parts.join('; ') || 'skipped (no live provider configured)';
  const { notifications } = await getSettings(env);
  const providers = all.filter((p) => p.driver === 'arkesel');
  for (const p of providers) {
    const balance = await fetchBalance(env, p.id);
    if (!balance) {
      parts.push(`${p.id}: fetch failed`);
      continue;
    }
    await updateProvider(
      env,
      p.id,
      { credits: balance.smsCredits, mainBalanceGhs: balance.mainBalanceGhs, balanceCheckedAt: new Date().toISOString() },
      'system:cron',
    );
    parts.push(`${p.id}: ${balance.smsCredits} credits`);
    const limit = notifications.providerLowBalanceCredits;
    const before = p.credits;
    if (limit !== null && balance.smsCredits < limit && (before === null || before >= limit)) {
      await notifyAdmins(
        env,
        'emailOnProviderLowBalance',
        `Provider ${p.id} credits are low`,
        `${p.id} has ${balance.smsCredits} SMS credits left (alert level ${limit}). Top up with the provider to avoid failed customer sends.`,
      );
    }
  }
  return parts.join('; ') || 'no live providers';
}

export const DATA_PROVIDER_ID = 'data_gw_01';

/** Create the data provider's record if it doesn't exist (idempotent). */
export async function ensureDataProvider(env: Env, actor: string): Promise<void> {
  if (await getProviderRecord(env, DATA_PROVIDER_ID)) return;
  try {
    await createProvider(env, { id: DATA_PROVIDER_ID, service: 'data', label: 'Data Gateway 01', driver: 'elitedata', status: 'active' }, actor);
  } catch (err) {
    // Created concurrently — fine.
    if (!(await getProviderRecord(env, DATA_PROVIDER_ID))) throw err;
  }
}
