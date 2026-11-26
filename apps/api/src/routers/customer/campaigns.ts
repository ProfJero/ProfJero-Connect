import { Hono } from 'hono';
import { CampaignInputSchema, MessageTemplateInputSchema } from '@profjero/shared';
import {
  cancelCampaign,
  deleteCampaign,
  deleteTemplate,
  getOwnCampaign,
  listCampaigns,
  listTemplates,
  saveCampaign,
  saveTemplate,
  sendCampaignNow,
} from '../../services/campaigns';
import { durableLimit } from '../../lib/rateLimit';
import { parseBody } from './helpers';
import type { AuthVariables, Env } from '../../types/env';

/**
 * Scheduled campaigns (one-time, recurring, birthday) and saved message
 * templates. The per-minute dispatcher sends due campaigns.
 */
const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

router.get('/campaigns', async (c) => {
  return c.json({ campaigns: await listCampaigns(c.env, c.get('projectId')!) });
});

router.post('/campaigns', async (c) => {
  const projectId = c.get('projectId')!;
  const input = await parseBody(c, CampaignInputSchema);
  await durableLimit(c.env, `campaign:${projectId}`, 30, 3600, 'campaigns created');
  const campaign = await saveCampaign(c.env, projectId, input, `customer:${c.get('customer')!.uid}`);
  return c.json({ campaign }, 201);
});

router.get('/campaigns/:id', async (c) => {
  return c.json({ campaign: await getOwnCampaign(c.env, c.get('projectId')!, c.req.param('id')) });
});

router.put('/campaigns/:id', async (c) => {
  const input = await parseBody(c, CampaignInputSchema);
  const campaign = await saveCampaign(c.env, c.get('projectId')!, input, `customer:${c.get('customer')!.uid}`, c.req.param('id'));
  return c.json({ campaign });
});

router.post('/campaigns/:id/cancel', async (c) => {
  return c.json({ campaign: await cancelCampaign(c.env, c.get('projectId')!, c.req.param('id')) });
});

router.post('/campaigns/:id/send-now', async (c) => {
  return c.json({ campaign: await sendCampaignNow(c.env, c.get('projectId')!, c.req.param('id')) });
});

router.delete('/campaigns/:id', async (c) => {
  await deleteCampaign(c.env, c.get('projectId')!, c.req.param('id'));
  return c.json({ deleted: true });
});

router.get('/templates', async (c) => {
  return c.json({ templates: await listTemplates(c.env, c.get('projectId')!) });
});

router.post('/templates', async (c) => {
  const input = await parseBody(c, MessageTemplateInputSchema);
  return c.json({ template: await saveTemplate(c.env, c.get('projectId')!, input) }, 201);
});

router.put('/templates/:id', async (c) => {
  const input = await parseBody(c, MessageTemplateInputSchema);
  return c.json({ template: await saveTemplate(c.env, c.get('projectId')!, input, c.req.param('id')) });
});

router.delete('/templates/:id', async (c) => {
  await deleteTemplate(c.env, c.get('projectId')!, c.req.param('id'));
  return c.json({ deleted: true });
});

export { router as customerCampaignsRouter };
