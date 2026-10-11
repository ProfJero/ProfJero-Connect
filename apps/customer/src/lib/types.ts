/**
 * Response shapes of the /customer/* API. These mirror the customer-safe
 * projections built in apps/api/src/routers/customer/*.ts — keep in sync.
 */

// ── Pricing (public /v1/pricing) ────────────────────────────────────

export interface PricingPackage {
  id: string;
  service: 'sms' | 'airtime' | 'data';
  name: string;
  units: number;
  priceGhs: number;
  effectiveRate: number;
  description: string | null;
  displayOrder: number;
}

export interface PricingService {
  service: 'sms' | 'airtime' | 'data';
  currency: 'GHS';
  unitPriceGhs: number | null;
  minPurchaseUnits: number | null;
  maxPurchaseUnits: number | null;
  active: boolean;
  packages: PricingPackage[];
}

export interface PricingCatalog {
  services: PricingService[];
}

// ── Payments ────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned' | 'refunded';

export interface CustomerPayment {
  reference: string;
  packageId: string | null;
  units: number;
  amountGhs: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
  walletCreditedAt: string | null;
  failureReason: string | null;
}

// ── SMS ─────────────────────────────────────────────────────────────

export type BatchStatus = 'queued' | 'submitting' | 'submitted' | 'partial' | 'completed' | 'failed';
export type RecordStatus =
  | 'queued'
  | 'submitting'
  | 'submitted'
  | 'delivered'
  | 'failed'
  | 'unknown'
  | 'released';

export interface SmsBatch {
  id: string;
  source: 'api' | 'dashboard';
  senderId: string | null;
  message: string;
  messageEncoding: 'GSM-7' | 'UCS-2' | null;
  messageSegments: number | null;
  status: BatchStatus;
  totalRecipients: number;
  totalUnitsReserved: number;
  totalUnitsCharged: number;
  totalUnitsReleased: number;
  submittedCount: number;
  deliveredCount: number;
  failedCount: number;
  unknownCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface SmsRecord {
  id: string;
  recipient: string;
  status: RecordStatus;
  unitsCharged: number;
  unitsReleased: number;
  error: string | null;
  updatedAt: string;
}

export interface BatchWithRecords {
  batch: SmsBatch;
  records: SmsRecord[];
}

export interface SmsTotals {
  batches: number;
  messages: number;
  unitsUsed: number;
  submitted: number;
  delivered: number;
  failed: number;
  pending: number;
}

export interface SmsStats {
  days: number;
  current: SmsTotals;
  previous: SmsTotals;
  bySource: { api: SmsTotals; dashboard: SmsTotals };
  topSenderIds: Array<{ senderId: string; messages: number }>;
  series: Array<{ date: string; messages: number; units: number; failed: number }>;
  lifetime: { batches: number };
}

// ── Sender IDs ──────────────────────────────────────────────────────

export type SenderIdStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export interface CustomerSenderId {
  value: string;
  status: SenderIdStatus;
  purpose: string | null;
  description: string | null;
  reason: string | null;
  requestedAt: string;
  decidedAt: string | null;
}

// ── Contacts ────────────────────────────────────────────────────────

export type GroupColor = 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'teal';

export interface Contact {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  email: string | null;
  /** YYYY-MM-DD */
  dateOfBirth: string | null;
  /** Personalisation fields, e.g. { balance: "GH₵ 50" } */
  customFields: Record<string, string>;
  groupIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  color: GroupColor;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  offset: number;
  limit: number;
  stats: { total: number; inGroups: number; withEmail: number; addedLast30Days: number };
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: Array<{ phone: string; reason: string }>;
}

// ── API keys ────────────────────────────────────────────────────────

export interface CustomerApiKey {
  id: string;
  name: string;
  kind: 'secret' | 'publishable';
  maskedKey: string;
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

// ── Notifications ───────────────────────────────────────────────────

export type NotificationType = 'payment' | 'sender_id' | 'low_balance' | 'sms' | 'api_key' | 'account';
export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error';

export interface CustomerNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: CustomerNotification[];
  count: number;
  nextCursor: string | null;
  total: number;
  unreadCount: number;
  counts: Partial<Record<NotificationType, number>>;
}
