import { z } from 'zod';
import { AdminRoleSchema, AdminStatusSchema } from './admin';

/**
 * Platform settings, stored as fixed-ID docs in the `settings` collection
 * (settings/general, settings/sms, …). Every field has a default so a
 * fresh deployment works with no settings written; the API merges stored
 * values over these defaults on read.
 *
 * Each section is enforced somewhere real — see the comments.
 */

export const GeneralSettingsSchema = z.object({
  /** Shown in the admin + customer UI and in emails. */
  platformName: z.string().trim().min(1).max(60),
  /** Customer-facing support contact (customer sidebar, emails, signup). */
  supportEmail: z.string().trim().email().max(200).nullable(),
  supportPhone: z.string().trim().max(30).nullable(),
  address: z.string().trim().max(200).nullable(),
  /** IANA zone used for daily report boundaries in the admin UI. */
  timezone: z.string().trim().min(1).max(60),
});
export type GeneralSettings = z.infer<typeof GeneralSettingsSchema>;

export const SmsSettingsSchema = z.object({
  /** Units credited to every new customer signup. 0 = no free credit. */
  starterUnits: z.number().int().min(0).max(1000),
  /** Low-balance alert level given to new customer wallets. null = off. */
  defaultLowBalanceThreshold: z.number().int().min(1).max(10_000_000).nullable(),
  /** Hard cap on unique recipients per customer send. */
  maxRecipientsPerSend: z.number().int().min(1).max(10000),
  /** Shown to customers when they request a Sender ID. */
  senderIdReviewSla: z.string().trim().min(1).max(80),
});
export type SmsSettings = z.infer<typeof SmsSettingsSchema>;

export const PaymentSettingsSchema = z.object({
  /** Kill switch for customer top-ups (admin-initiated payments unaffected). */
  customerTopupsEnabled: z.boolean(),
  /** Shown on Add Funds while top-ups are disabled. */
  topupsDisabledMessage: z.string().trim().max(200).nullable(),
});
export type PaymentSettings = z.infer<typeof PaymentSettingsSchema>;

export const NotificationSettingsSchema = z.object({
  /** Operators who receive admin alert emails. */
  adminAlertEmails: z.array(z.string().trim().email()).max(10),
  emailOnSenderIdRequest: z.boolean(),
  emailOnNewCustomer: z.boolean(),
  emailOnPaymentReceived: z.boolean(),
  emailOnProviderLowBalance: z.boolean(),
  /** Provider credit level that raises an alert. null = no balance alert. */
  providerLowBalanceCredits: z.number().int().min(0).max(100_000_000).nullable(),
});
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;

export const SecuritySettingsSchema = z.object({
  /** Kill switch for new customer registrations. */
  customerSignupsEnabled: z.boolean(),
  /** Customer SMS sends (requests) allowed per minute, per account. */
  customerSendsPerMinute: z.number().int().min(1).max(600),
  /** Customer API calls allowed per minute, per account (all endpoints). */
  customerRequestsPerMinute: z.number().int().min(10).max(6000),
});
export type SecuritySettings = z.infer<typeof SecuritySettingsSchema>;

export const SETTINGS_SECTIONS = ['general', 'sms', 'payments', 'notifications', 'security'] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const SettingsSchemas = {
  general: GeneralSettingsSchema,
  sms: SmsSettingsSchema,
  payments: PaymentSettingsSchema,
  notifications: NotificationSettingsSchema,
  security: SecuritySettingsSchema,
} as const;

export interface PlatformSettings {
  general: GeneralSettings;
  sms: SmsSettings;
  payments: PaymentSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  general: {
    platformName: 'ProfJero Connect',
    supportEmail: null,
    supportPhone: null,
    address: null,
    timezone: 'Africa/Accra',
  },
  sms: {
    starterUnits: 3,
    defaultLowBalanceThreshold: null,
    maxRecipientsPerSend: 1000,
    senderIdReviewSla: 'up to 1 business day',
  },
  payments: {
    customerTopupsEnabled: true,
    topupsDisabledMessage: null,
  },
  notifications: {
    adminAlertEmails: [],
    emailOnSenderIdRequest: true,
    emailOnNewCustomer: true,
    emailOnPaymentReceived: false,
    emailOnProviderLowBalance: true,
    providerLowBalanceCredits: null,
  },
  security: {
    customerSignupsEnabled: true,
    customerSendsPerMinute: 30,
    customerRequestsPerMinute: 300,
  },
};

// ─────────────────────────────────────────────────────────────────────
// Team (admins)
// ─────────────────────────────────────────────────────────────────────

export const CreateAdminInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  displayName: z.string().trim().min(1).max(100),
  role: AdminRoleSchema,
});
export type CreateAdminInput = z.infer<typeof CreateAdminInputSchema>;

export const UpdateAdminInputSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).optional(),
    role: AdminRoleSchema.optional(),
    status: AdminStatusSchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update.' });
export type UpdateAdminInput = z.infer<typeof UpdateAdminInputSchema>;

export const UpdateMeInputSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
});

// ─────────────────────────────────────────────────────────────────────
// Audit log
// ─────────────────────────────────────────────────────────────────────

export const AuditLogSchema = z.object({
  id: z.string(),
  actorUid: z.string(),
  actorEmail: z.string().nullable(),
  actorRole: z.string().nullable(),
  action: z.string(),
  category: z.string(),
  targetId: z.string().nullable(),
  method: z.string(),
  path: z.string(),
  status: z.number().int(),
  summary: z.string(),
  details: z.record(z.unknown()).nullable(),
  requestId: z.string().nullable(),
  createdAt: z.string(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

// ─────────────────────────────────────────────────────────────────────
// Admin alerts (bell)
// ─────────────────────────────────────────────────────────────────────

export const AdminAlertSchema = z.object({
  id: z.string(),
  type: z.enum([
    'sender_id_requests',
    'low_balance_wallets',
    'provider_balance',
    'provider_error',
    'failed_payments',
    'stuck_messages',
    'new_customers',
    'cron_stale',
  ]),
  severity: z.enum(['info', 'warning', 'error']),
  title: z.string(),
  body: z.string(),
  link: z.string(),
  count: z.number().int().nonnegative(),
  /** Time of the newest event behind this alert. */
  latestAt: z.string(),
  unread: z.boolean(),
});
export type AdminAlert = z.infer<typeof AdminAlertSchema>;
