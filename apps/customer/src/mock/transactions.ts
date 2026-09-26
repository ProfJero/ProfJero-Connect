// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.
//
// RULE: no provider names in customer-facing copy.

import {
  Wallet,
  CalendarDays,
  MessageSquare,
  ShoppingBag,
  MessageCircle,
  Smartphone,
  Plus,
  ArrowDownToLine,
  Settings as SettingsIcon,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export interface TransactionMetric {
  label: string;
  value: string;
  footnote: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export const transactionMetrics: TransactionMetric[] = [
  {
    label: 'Total Spent',
    value: 'GH₵ 1,245.00',
    footnote: 'All time',
    icon: Wallet,
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-[#1a6cf0] dark:text-blue-400',
  },
  {
    label: 'This Month',
    value: 'GH₵ 420.00',
    footnote: 'Sep 1 – Sep 30, 2025',
    icon: CalendarDays,
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'SMS Usage',
    value: '1,250',
    footnote: 'This month',
    icon: MessageSquare,
    iconBg: 'bg-purple-50 dark:bg-purple-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    label: 'Service Purchases',
    value: '6',
    footnote: 'This month',
    icon: ShoppingBag,
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
];

export type TransactionType =
  | 'SMS Purchase'
  | 'Data Purchase'
  | 'Wallet Top-up'
  | 'SMS Usage'
  | 'Refund'
  | 'Adjustment'
  | 'Service Purchase'
  | 'Airtime Purchase';

export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface TransactionRow {
  id: number;
  date: string;
  reference: string;
  type: TransactionType;
  description: string;
  amount: string;
  amountPositive: boolean;
  status: TransactionStatus;
}

export const transactions: TransactionRow[] = [
  { id: 1, date: 'Sep 21, 2025 09:42 AM', reference: 'TXN-20250921-001', type: 'SMS Purchase', description: 'Bulk SMS (500 units)', amount: '- GH₵ 50.00', amountPositive: false, status: 'Completed' },
  { id: 2, date: 'Sep 20, 2025 04:18 PM', reference: 'TXN-20250920-002', type: 'Data Purchase', description: 'MTN 1GB Bundle', amount: '- GH₵ 10.00', amountPositive: false, status: 'Completed' },
  { id: 3, date: 'Sep 18, 2025 11:25 AM', reference: 'TXN-20250918-003', type: 'Wallet Top-up', description: 'Mobile Money Deposit', amount: '+ GH₵ 500.00', amountPositive: true, status: 'Completed' },
  { id: 4, date: 'Sep 17, 2025 10:12 AM', reference: 'TXN-20250917-004', type: 'SMS Usage', description: '10 SMS (SunnyTech)', amount: '- GH₵ 5.00', amountPositive: false, status: 'Completed' },
  { id: 5, date: 'Sep 16, 2025 02:37 PM', reference: 'TXN-20250916-005', type: 'Refund', description: 'Failed SMS refund', amount: '+ GH₵ 20.00', amountPositive: true, status: 'Completed' },
  { id: 6, date: 'Sep 14, 2025 03:18 PM', reference: 'TXN-20250914-006', type: 'Adjustment', description: 'System adjustment', amount: '+ GH₵ 10.00', amountPositive: true, status: 'Completed' },
  { id: 7, date: 'Sep 12, 2025 09:05 AM', reference: 'TXN-20250912-007', type: 'Service Purchase', description: 'API Access', amount: '- GH₵ 100.00', amountPositive: false, status: 'Completed' },
  { id: 8, date: 'Sep 10, 2025 01:22 PM', reference: 'TXN-20250910-008', type: 'Airtime Purchase', description: 'MTN Airtime (GH₵ 50)', amount: '- GH₵ 50.00', amountPositive: false, status: 'Completed' },
];

export const transactionsPagination = {
  from: 1,
  to: 8,
  total: 48,
  pages: [1, 2, 3, 4, 5],
};

export interface TypeStyle {
  bg: string;
  text: string;
  icon: LucideIcon;
}

export const TYPE_STYLES: Record<TransactionType, TypeStyle> = {
  'SMS Purchase': {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    icon: MessageSquare,
  },
  'Data Purchase': {
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    text: 'text-cyan-700 dark:text-cyan-400',
    icon: Smartphone,
  },
  'Wallet Top-up': {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: Plus,
  },
  'SMS Usage': {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-400',
    icon: MessageCircle,
  },
  Refund: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    icon: ArrowDownToLine,
  },
  Adjustment: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-400',
    icon: SettingsIcon,
  },
  'Service Purchase': {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    icon: ShoppingBag,
  },
  'Airtime Purchase': {
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    text: 'text-indigo-700 dark:text-indigo-400',
    icon: CreditCard,
  },
};

export const typeFilterOptions = [
  'All types',
  'SMS Purchase',
  'Data Purchase',
  'Wallet Top-up',
  'SMS Usage',
  'Refund',
  'Adjustment',
  'Service Purchase',
  'Airtime Purchase',
];

export const serviceFilterOptions = ['All services', 'SMS', 'Data', 'Airtime', 'API'];
export const statusFilterOptions = ['All status', 'Completed', 'Pending', 'Failed'];
export const dateFilterOptions = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'All time'];