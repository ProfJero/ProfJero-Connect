import type { NotificationSettings } from '@profjero/shared';
import { getSettings } from './settings';
import type { Env } from '../types/env';

/**
 * Operator emails (Settings → Notifications). Best-effort: never throws,
 * so a customer action can't fail because an admin email didn't send.
 * Gated by the per-event toggle and requires RESEND_API_KEY + EMAIL_FROM.
 */
export async function notifyAdmins(
  env: Env,
  event: keyof Pick<
    NotificationSettings,
    'emailOnSenderIdRequest' | 'emailOnNewCustomer' | 'emailOnPaymentReceived' | 'emailOnProviderLowBalance' | 'emailOnIncidents'
  >,
  subject: string,
  text: string,
): Promise<void> {
  try {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return;
    const { notifications } = await getSettings(env);
    if (!notifications[event] || notifications.adminAlertEmails.length === 0) return;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: notifications.adminAlertEmails,
        subject: `[Admin] ${subject}`,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`[adminNotify] Resend failed (${res.status}): ${await res.text()}`);
  } catch (err) {
    console.error('[adminNotify] failed:', err);
  }
}
