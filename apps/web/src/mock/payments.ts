// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
// Content lifted from the approved Payments HTML.

import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Package,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

export interface PaymentMetric {
  label: string;
  value: string;
  valueSuffix?: string;
  trend?: { direction: 'up' | 'down'; value: string; color: 'emerald' | 'rose' };
  footnote: string;
  icon: LucideIcon;
  iconBg: string;
}

export const paymentMetrics: PaymentMetric[] = [
  {
    label: 'Total Revenue',
    value: 'GHS 12,480.00',
    trend: { direction: 'up', value: '18%', color: 'emerald' },
    footnote: 'from previous period',
    icon: CreditCard,
    iconBg: 'bg-[#1976d2]',
  },
  {
    label: 'Successful Payments',
    value: '48',
    trend: { direction: 'up', value: '20%', color: 'emerald' },
    footnote: 'out of 56 total',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-500',
  },
  {
    label: 'Pending Payments',
    value: '5',
    trend: { direction: 'down', value: '17%', color: 'rose' },
    footnote: 'awaiting confirmation',
    icon: Clock,
    iconBg: 'bg-amber-500',
  },
  {
    label: 'Failed Payments',
    value: '2',
    trend: { direction: 'down', value: '50%', color: 'rose' },
    footnote: 'needs attention',
    icon: XCircle,
    iconBg: 'bg-red-500',
  },
  {
    label: 'Refunded Payments',
    value: '1',
    trend: { direction: 'down', value: '67%', color: 'rose' },
    footnote: 'total refunds',
    icon: RotateCcw,
    iconBg: 'bg-purple-500',
  },
  {
    label: 'Units Sold',
    value: '42,600',
    trend: { direction: 'up', value: '18%', color: 'emerald' },
    footnote: 'from successful payments',
    icon: Package,
    iconBg: 'bg-emerald-500',
  },
  {
    label: 'Avg. Transaction Value',
    value: 'GHS 221.43',
    footnote: 'per payment',
    icon: BarChart3,
    iconBg: 'bg-sky-600',
  },
];

export type PaymentStatus = 'Successful' | 'Pending' | 'Failed' | 'Refunded';
export type PaymentMethod = 'Mobile Money' | 'Card' | 'Bank Transfer';

export interface PaymentRow {
  id: number;
  reference: string;
  date: string;
  time: string;
  project: string;
  projectAvatarBg: string;
  projectClient: string;
  package: string;
  units: string;
  amount: string;
  gateway: 'Paystack' | 'Bank';
  status: PaymentStatus;
  method: PaymentMethod;
  txnReference: string;
}

export const paymentRows: PaymentRow[] = [
  { id: 1, reference: 'PAY-2025-0912-001', date: 'Sep 21, 2025', time: '10:24 AM', project: 'GABS', projectAvatarBg: 'bg-blue-600', projectClient: 'GABS', package: '1,000 Units', units: '1,000', amount: 'GHS 50.00', gateway: 'Paystack', status: 'Successful', method: 'Mobile Money', txnReference: 'pay_7x3k9e2' },
  { id: 2, reference: 'PAY-2025-0912-002', date: 'Sep 20, 2025', time: '04:18 PM', project: 'DBI', projectAvatarBg: 'bg-blue-700', projectClient: 'DBI', package: '2,000 Units', units: '2,000', amount: 'GHS 100.00', gateway: 'Paystack', status: 'Successful', method: 'Card', txnReference: 'pay_8k1v4d6' },
  { id: 3, reference: 'PAY-2025-0912-003', date: 'Sep 19, 2025', time: '11:42 AM', project: 'Church A', projectAvatarBg: 'bg-amber-500', projectClient: 'Church A', package: '1,000 Units', units: '1,000', amount: 'GHS 50.00', gateway: 'Paystack', status: 'Pending', method: 'Bank Transfer', txnReference: 'pay_3m9t7q1' },
  { id: 4, reference: 'PAY-2025-0912-004', date: 'Sep 18, 2025', time: '02:17 PM', project: 'Pharmacy', projectAvatarBg: 'bg-blue-600', projectClient: 'EDPHARMACY', package: '3,500 Units', units: '3,500', amount: 'GHS 175.00', gateway: 'Paystack', status: 'Successful', method: 'Mobile Money', txnReference: 'pay_6f2n8b9' },
  { id: 5, reference: 'PAY-2025-0912-005', date: 'Sep 17, 2025', time: '09:36 AM', project: 'School', projectAvatarBg: 'bg-teal-600', projectClient: 'SCHOOL', package: '500 Units', units: '500', amount: 'GHS 25.00', gateway: 'Bank', status: 'Failed', method: 'Bank Transfer', txnReference: 'pay_d4h7c3k' },
  { id: 6, reference: 'PAY-2025-0911-006', date: 'Sep 16, 2025', time: '03:21 PM', project: 'GABS', projectAvatarBg: 'bg-blue-600', projectClient: 'GABS', package: '2,000 Units', units: '2,000', amount: 'GHS 100.00', gateway: 'Paystack', status: 'Successful', method: 'Card', txnReference: 'pay_z8q1f5v' },
  { id: 7, reference: 'PAY-2025-0911-007', date: 'Sep 16, 2025', time: '05:12 PM', project: 'DBI', projectAvatarBg: 'bg-blue-700', projectClient: 'DBI', package: '1,500 Units', units: '1,500', amount: 'GHS 75.00', gateway: 'Paystack', status: 'Successful', method: 'Mobile Money', txnReference: 'pay_9k4e6t2' },
  { id: 8, reference: 'PAY-2025-0911-008', date: 'Sep 15, 2025', time: '11:03 AM', project: 'Church A', projectAvatarBg: 'bg-amber-500', projectClient: 'Church A', package: '1,000 Units', units: '1,000', amount: 'GHS 50.00', gateway: 'Paystack', status: 'Refunded', method: 'Card', txnReference: 'pay_r6s2t9b' },
  { id: 9, reference: 'PAY-2025-0910-009', date: 'Sep 14, 2025', time: '04:27 PM', project: 'Pharmacy', projectAvatarBg: 'bg-blue-600', projectClient: 'EDPHARMACY', package: '2,500 Units', units: '2,500', amount: 'GHS 125.00', gateway: 'Paystack', status: 'Successful', method: 'Mobile Money', txnReference: 'pay_p3v8n1z' },
  { id: 10, reference: 'PAY-2025-0910-010', date: 'Sep 14, 2025', time: '01:15 PM', project: 'School', projectAvatarBg: 'bg-teal-600', projectClient: 'SCHOOL', package: '800 Units', units: '800', amount: 'GHS 40.00', gateway: 'Paystack', status: 'Successful', method: 'Card', txnReference: 'pay_t7g2m5k' },
];

export const paymentsPagination = {
  from: 1,
  to: 10,
  total: 56,
  pages: [1, 2, 3, 4, 5, 6],
};

export interface PaymentDetail {
  reference: string;
  status: PaymentStatus;
  project: string;
  projectClient: string;
  amount: string;
  unitsPurchased: string;
  gateway: string;
  gatewayReference: string;
  method: PaymentMethod;
  txnReference: string;
  dateTime: string;
  verification: { label: string; description: string };
  crediting: { label: string; description: string };
  timeline: Array<{
    label: string;
    time: string;
    color: 'emerald' | 'purple';
    icon: 'check' | 'record';
  }>;
}

export const paymentDetail: PaymentDetail = {
  reference: 'PAY-2025-0912-001',
  status: 'Successful',
  project: 'GABS',
  projectClient: 'GABS Project',
  amount: 'GHS 50.00',
  unitsPurchased: '1,000 units',
  gateway: 'Paystack',
  gatewayReference: 'pay_7x3k9e2',
  method: 'Mobile Money',
  txnReference: 'TXN-20250921-001',
  dateTime: 'Sep 21, 2025 10:24 AM',
  verification: {
    label: 'Verified',
    description: 'Payment confirmed by gateway and backend',
  },
  crediting: {
    label: 'Credited',
    description: 'Units successfully added to project wallet',
  },
  timeline: [
    { label: 'Payment Initiated', time: 'Sep 21, 2025 10:20 AM', color: 'emerald', icon: 'check' },
    { label: 'Gateway Confirmed', time: 'Sep 21, 2025 10:22 AM', color: 'emerald', icon: 'check' },
    { label: 'Backend Verified', time: 'Sep 21, 2025 10:23 AM', color: 'emerald', icon: 'check' },
    { label: 'Units Credited', time: 'Sep 21, 2025 10:24 AM', color: 'emerald', icon: 'check' },
    { label: 'Transaction Recorded', time: 'Sep 21, 2025 10:25 AM', color: 'purple', icon: 'record' },
  ],
};