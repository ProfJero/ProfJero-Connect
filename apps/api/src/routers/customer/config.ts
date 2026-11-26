import { Hono } from 'hono';
import { getSettings } from '../../services/settings';
import type { AuthVariables, Env } from '../../types/env';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/**
 * GET /customer/config — the platform settings a signed-in customer's UI
 * needs (Settings → General/SMS/Payments in the admin dashboard).
 */
router.get('/config', async (c) => {
  const s = await getSettings(c.env);
  return c.json({
    platformName: s.general.platformName,
    supportEmail: s.general.supportEmail,
    supportPhone: s.general.supportPhone,
    senderIdReviewSla: s.sms.senderIdReviewSla,
    maxRecipientsPerSend: s.sms.maxRecipientsPerSend,
    topupsEnabled: s.payments.customerTopupsEnabled,
    topupsDisabledMessage: s.payments.topupsDisabledMessage,
  });
});

export { router as customerConfigRouter };
