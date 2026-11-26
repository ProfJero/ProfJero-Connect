import { z } from 'zod';

/**
 * Campaigns = scheduled sends.
 *
 *  - once:      send at `scheduledAt`.
 *  - recurring: send at `scheduledAt`, then every day/week/month after.
 *  - birthday:  every day at `sendTime` (platform time zone), to the
 *               selected contacts (or everyone) whose birthday is today.
 *
 * Units are not reserved when scheduling; they are reserved when the
 * campaign fires. If the wallet can't cover it then, the run fails with a
 * notification and nothing is sent.
 */
export const CampaignKindSchema = z.enum(['once', 'recurring', 'birthday']);
export type CampaignKind = z.infer<typeof CampaignKindSchema>;

export const CampaignRepeatSchema = z.enum(['daily', 'weekly', 'monthly']);
export type CampaignRepeat = z.infer<typeof CampaignRepeatSchema>;

export const CampaignStatusSchema = z.enum(['scheduled', 'sending', 'sent', 'failed', 'cancelled']);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

const audience = {
  recipients: z.array(z.string().min(1).max(30)).max(10000).optional(),
  contactIds: z.array(z.string().min(1)).max(10000).optional(),
  groupIds: z.array(z.string().min(1)).max(50).optional(),
};

export const CampaignInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    kind: CampaignKindSchema.default('once'),
    senderId: z.string().min(1).max(11),
    message: z.string().trim().min(1).max(1600),
    ...audience,
    /** ISO date-time (UTC) of the first run. Required for once/recurring. */
    scheduledAt: z.string().datetime().optional(),
    repeat: CampaignRepeatSchema.optional(),
    /** Stop repeating after this date-time (recurring only). */
    endsAt: z.string().datetime().nullable().optional(),
    /** "HH:mm" in the platform time zone (birthday only). */
    sendTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm, e.g. 08:00').optional(),
  })
  .superRefine((d, ctx) => {
    if (d.kind !== 'birthday' && !d.scheduledAt) {
      ctx.addIssue({ code: 'custom', path: ['scheduledAt'], message: 'Choose when to send.' });
    }
    if (d.kind === 'recurring' && !d.repeat) {
      ctx.addIssue({ code: 'custom', path: ['repeat'], message: 'Choose how often to repeat.' });
    }
    if (d.kind === 'birthday' && !d.sendTime) {
      ctx.addIssue({ code: 'custom', path: ['sendTime'], message: 'Choose the time of day to send.' });
    }
    const n = (d.recipients?.length ?? 0) + (d.contactIds?.length ?? 0) + (d.groupIds?.length ?? 0);
    if (d.kind !== 'birthday' && n === 0) {
      ctx.addIssue({ code: 'custom', path: ['recipients'], message: 'Add at least one recipient, contact, or group.' });
    }
  });
export type CampaignInput = z.infer<typeof CampaignInputSchema>;

export interface Campaign {
  id: string;
  projectId: string;
  name: string;
  kind: CampaignKind;
  status: CampaignStatus;
  senderId: string;
  message: string;
  recipients: string[];
  contactIds: string[];
  groupIds: string[];
  scheduledAt: string | null;
  repeat: CampaignRepeat | null;
  endsAt: string | null;
  sendTime: string | null;
  timezone: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastBatchId: string | null;
  lastError: string | null;
  runs: number;
  estimate: { recipients: number; units: number } | null;
  /** Per-number variables supplied via the API (phone → fields). */
  recipientFields?: Record<string, Record<string, string>> | null;
  createdAt: string;
  updatedAt: string;
}

export const MessageTemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  body: z.string().trim().min(1).max(1600),
});
export type MessageTemplateInput = z.infer<typeof MessageTemplateInputSchema>;

export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
