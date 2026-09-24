import type { Env } from '../types/env';
import type { SmsProvider } from './sms';
import { mockSmsProvider } from './mockSms';
import { createArkeselSmsProvider } from './arkeselSms';

export function getSmsProvider(env: Env): SmsProvider {
  if (env.SMS_PROVIDER === 'arkesel') {
    if (!env.ARKESEL_API_KEY) {
      throw new Error(
        'SMS_PROVIDER=arkesel requires ARKESEL_API_KEY to be set.',
      );
    }
    const providerId = env.DEFAULT_SMS_PROVIDER_ID ?? 'sms_gw_01';
    return createArkeselSmsProvider(env, providerId);
  }
  return mockSmsProvider;
}