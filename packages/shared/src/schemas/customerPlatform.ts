import { z } from 'zod';
import { SenderIdValueSchema } from './senderId';

/**
 * Request schemas for the customer platform surfaces added after CP1:
 * payments (CP3), SMS (CP4/CP5), Sender ID requests (CP6), notifications
 * (CP7), contacts + groups, and self-service API keys.
 *
 * Response shapes are customer-safe projections built in the routers —
 * never raw Firestore docs — so no provider detail can leak.
 */

// ─────────────────────────────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────────────────────────────

/** Either a package, or a custom unit count billed at the service rate. */
export const CustomerInitiatePaymentRequestSchema = z
  .object({
    packageId: z.string().min(1).optional(),
    units: z.number().int().positive().max(10_000_000).optional(),
    /** Pre-selects the checkout channel. Omit to offer every channel. */
    method: z.enum(['mobile_money', 'card']).optional(),
  })
  .refine((d) => (d.packageId ? 1 : 0) + (d.units !== undefined ? 1 : 0) === 1, {
    message: 'Provide either packageId or units (not both).',
  });
export type CustomerInitiatePaymentRequest = z.infer<
  typeof CustomerInitiatePaymentRequestSchema
>;

// ─────────────────────────────────────────────────────────────────────
// SMS
// ─────────────────────────────────────────────────────────────────────

/**
 * Recipients can come from three places, merged and de-duplicated
 * server-side: typed/uploaded numbers, individual contacts, and groups.
 * The merged list is capped at the same 1,000 recipients as /v1.
 */
export const CustomerSendSmsRequestSchema = z
  .object({
    senderId: z.string().min(1).max(11),
    message: z.string().min(1).max(1000),
    recipients: z.array(z.string().min(1).max(30)).max(1000).optional(),
    contactIds: z.array(z.string().min(1)).max(1000).optional(),
    groupIds: z.array(z.string().min(1)).max(50).optional(),
  })
  .refine(
    (d) =>
      (d.recipients?.length ?? 0) +
        (d.contactIds?.length ?? 0) +
        (d.groupIds?.length ?? 0) >
      0,
    { message: 'Add at least one recipient, contact, or group.' },
  );
export type CustomerSendSmsRequest = z.infer<
  typeof CustomerSendSmsRequestSchema
>;

// ─────────────────────────────────────────────────────────────────────
// Sender IDs
// ─────────────────────────────────────────────────────────────────────

export const SenderIdPurposeSchema = z.enum([
  'Business Notifications',
  'Marketing & Promotional',
  'Transactional & Alerts',
  'Authentication & OTP',
]);
export type SenderIdPurpose = z.infer<typeof SenderIdPurposeSchema>;

export const CustomerRequestSenderIdSchema = z.object({
  value: SenderIdValueSchema,
  purpose: SenderIdPurposeSchema,
  description: z.string().trim().min(10).max(500),
});
export type CustomerRequestSenderId = z.infer<
  typeof CustomerRequestSenderIdSchema
>;

// ─────────────────────────────────────────────────────────────────────
// Contacts + groups
// ─────────────────────────────────────────────────────────────────────

export const ContactInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(200).nullable().optional(),
  groupIds: z.array(z.string().min(1)).max(50).optional(),
});
export type ContactInput = z.infer<typeof ContactInputSchema>;

export const UpdateContactSchema = ContactInputSchema.partial().refine(
  (d) => Object.keys(d).length > 0,
  { message: 'At least one field must be provided.' },
);
export type UpdateContact = z.infer<typeof UpdateContactSchema>;

export const ImportContactsSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: z.string().trim().max(100).optional(),
        phone: z.string().trim().min(1).max(30),
        email: z.string().trim().max(200).nullable().optional(),
      }),
    )
    .min(1)
    .max(2000),
  /** Optional group every imported contact is added to. */
  groupId: z.string().min(1).optional(),
});
export type ImportContacts = z.infer<typeof ImportContactsSchema>;

export const ContactGroupColorSchema = z.enum([
  'blue',
  'emerald',
  'amber',
  'rose',
  'purple',
  'teal',
]);
export type ContactGroupColor = z.infer<typeof ContactGroupColorSchema>;

export const ContactGroupInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(200).nullable().optional(),
  color: ContactGroupColorSchema.optional(),
});
export type ContactGroupInput = z.infer<typeof ContactGroupInputSchema>;

export const UpdateContactGroupSchema = ContactGroupInputSchema.partial().refine(
  (d) => Object.keys(d).length > 0,
  { message: 'At least one field must be provided.' },
);

export const GroupMembershipSchema = z.object({
  contactIds: z.array(z.string().min(1)).min(1).max(2000),
});

// ─────────────────────────────────────────────────────────────────────
// API keys (self-service, secret keys only)
// ─────────────────────────────────────────────────────────────────────

export const CustomerCreateApiKeySchema = z.object({
  name: z.string().trim().min(1).max(60),
});

// ─────────────────────────────────────────────────────────────────────
// Wallet settings
// ─────────────────────────────────────────────────────────────────────

export const CustomerSetThresholdSchema = z.object({
  /** null disables low-balance alerts. */
  threshold: z.number().int().min(1).max(10_000_000).nullable(),
});

// ─────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────

export const NotificationTypeSchema = z.enum([
  'payment',
  'sender_id',
  'low_balance',
  'sms',
  'api_key',
  'account',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSeveritySchema = z.enum([
  'success',
  'info',
  'warning',
  'error',
]);
export type NotificationSeverity = z.infer<typeof NotificationSeveritySchema>;

export const CustomerNotificationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: NotificationTypeSchema,
  severity: NotificationSeveritySchema,
  title: z.string(),
  body: z.string(),
  /** In-app route to open, e.g. "/messaging/sender-ids". */
  link: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type CustomerNotification = z.infer<typeof CustomerNotificationSchema>;

export const UpdateNotificationPrefsSchema = z.object({
  emailNotifications: z.boolean(),
});
