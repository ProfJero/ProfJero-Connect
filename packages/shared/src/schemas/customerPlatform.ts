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
    message: z.string().min(1).max(1600),
    recipients: z.array(z.string().min(1).max(30)).max(10000).optional(),
    contactIds: z.array(z.string().min(1)).max(10000).optional(),
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

/** Custom contact fields for personalised SMS, e.g. { "balance": "120" }. */
export const CustomFieldsSchema = z
  .record(z.string().trim().min(1).max(40), z.string().max(200))
  .refine((r) => Object.keys(r).length <= 20, { message: 'At most 20 custom fields per contact.' });

/** YYYY-MM-DD (date of birth), or null to clear. */
export const DateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.')
  .nullable();

const contactFields = {
  name: z.string().trim().max(100).optional(),
  firstName: z.string().trim().max(60).nullable().optional(),
  lastName: z.string().trim().max(60).nullable().optional(),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(200).nullable().optional(),
  dateOfBirth: DateOfBirthSchema.optional(),
  customFields: CustomFieldsSchema.optional(),
  groupIds: z.array(z.string().min(1)).max(50).optional(),
};

export const ContactInputSchema = z
  .object(contactFields)
  .refine((d) => !!(d.name?.trim() || d.firstName?.trim() || d.lastName?.trim()), {
    message: 'Enter a name (or a first name).',
    path: ['name'],
  });
export type ContactInput = z.infer<typeof ContactInputSchema>;

export const UpdateContactSchema = z
  .object(contactFields)
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided.' });
export type UpdateContact = z.infer<typeof UpdateContactSchema>;

export const ImportContactsSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: z.string().trim().max(100).optional(),
        firstName: z.string().trim().max(60).optional(),
        lastName: z.string().trim().max(60).optional(),
        phone: z.string().trim().min(1).max(30),
        email: z.string().trim().max(200).nullable().optional(),
        /** Any common date format; stored as YYYY-MM-DD when it parses. */
        dateOfBirth: z.string().trim().max(30).optional(),
        customFields: z.record(z.string().trim().min(1).max(40), z.string().max(200)).optional(),
      }),
    )
    .min(1)
    .max(5000),
  /** Optional group every imported contact is added to. */
  groupId: z.string().min(1).optional(),
  /** Existing contacts: overwrite their details with the file's (default: only fill blanks). */
  updateExisting: z.boolean().optional(),
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
