import type { BadgeTone } from '../components/ui/Badge';
import type { DataOrder } from './types';

/** One status label per order, in the customer's words. */
export function dataOrderStatus(o: DataOrder): { label: string; tone: BadgeTone } {
  switch (o.orderStatus) {
    case 'delivered':
      return { label: 'Delivered', tone: 'success' };
    case 'refunded':
      return { label: 'Refunded', tone: 'neutral' };
    case 'failed':
      return { label: 'Refund in progress', tone: 'danger' };
    case 'payment_confirmed':
    case 'processing':
      return { label: 'Sending', tone: 'info' };
    case 'pending_payment':
      if (o.paymentStatus === 'failed') return { label: 'Payment failed', tone: 'danger' };
      if (o.paymentStatus === 'abandoned') return { label: 'Not paid', tone: 'neutral' };
      return { label: 'Awaiting payment', tone: 'warning' };
  }
}
