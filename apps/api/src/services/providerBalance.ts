import { fetchBalance } from '../providers/arkeselClient';
import { listProviderRecords, updateProvider } from '../repositories/providers';
import { getSettings } from './settings';
import { notifyAdmins } from './adminNotify';
import type { Env } from '../types/env';

/**
 * Refresh cached balances for live SMS providers (cron, every 15 min) so
 * the admin sidebar and alerts reflect reality without anyone clicking
 * "refresh". Emails operators when a balance crosses below the alert level.
 */
export async function refreshProviderBalances(env: Env): Promise<string> {
  if (env.SMS_PROVIDER !== 'arkesel' || !env.ARKESEL_API_KEY) return 'skipped (no live provider configured)';
  const { notifications } = await getSettings(env);
  const providers = (await listProviderRecords(env)).filter((p) => p.driver === 'arkesel');
  const parts: string[] = [];
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
