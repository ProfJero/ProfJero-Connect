import type { BadgeTone } from '../components/ui/Badge';
import type { BatchStatus, PaymentStatus, RecordStatus, SenderIdStatus } from './types';

/**
 * Customer wording for SMS states. "Sent" means the network accepted the
 * message — not that the phone received it. "Delivered" is only shown when
 * a delivery receipt confirms it (state.md §7 "SMS statuses").
 */
export const BATCH_STATUS: Record<BatchStatus, { label: string; tone: BadgeTone }> = {
  queued: { label: 'Queued', tone: 'neutral' },
  submitting: { label: 'Sending', tone: 'info' },
  submitted: { label: 'Sent', tone: 'info' },
  completed: { label: 'Sent', tone: 'success' },
  partial: { label: 'Partially sent', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
};

export const RECORD_STATUS: Record<RecordStatus, { label: string; tone: BadgeTone; hint: string }> = {
  queued: { label: 'Queued', tone: 'neutral', hint: 'Waiting to be sent.' },
  submitting: { label: 'Sending', tone: 'info', hint: 'Being handed to the network.' },
  submitted: { label: 'Sent', tone: 'info', hint: 'Accepted by the network. Delivery not yet confirmed.' },
  delivered: { label: 'Delivered', tone: 'success', hint: 'Delivery confirmed by the network.' },
  failed: { label: 'Failed', tone: 'danger', hint: 'Not sent. Units were returned to your wallet.' },
  unknown: { label: 'Confirming', tone: 'warning', hint: 'Awaiting confirmation. Units stay reserved until it resolves.' },
  released: { label: 'Not sent', tone: 'neutral', hint: 'Units were returned to your wallet.' },
};

export const SENDER_ID_STATUS: Record<SenderIdStatus, { label: string; tone: BadgeTone }> = {
  approved: { label: 'Approved', tone: 'success' },
  pending: { label: 'Pending approval', tone: 'warning' },
  rejected: { label: 'Not approved', tone: 'danger' },
  revoked: { label: 'Inactive', tone: 'neutral' },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  success: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  abandoned: { label: 'Not completed', tone: 'neutral' },
  refunded: { label: 'Refunded', tone: 'purple' },
};
