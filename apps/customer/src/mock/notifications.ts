// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.

import {
  ShieldCheck,
  Wallet,
  MessageSquare,
  CreditCard,
  Code2,
  AlertOctagon,
  Settings2,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

export type NotificationCategory = 'account' | 'sms' | 'payments' | 'sender-ids' | 'system';

export interface NotificationItem {
  id: number;
  category: NotificationCategory;
  title: string;
  description: string;
  date: string;
  time: string;
  read: boolean;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export const notifications: NotificationItem[] = [
  {
    id: 1,
    category: 'sender-ids',
    title: 'Your Sender ID request has been approved.',
    description: 'The Sender ID "SUNNYTECH" has been approved and is now active.',
    date: 'Sep 21, 2025',
    time: '10:24 AM',
    read: false,
    icon: ShieldCheck,
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 2,
    category: 'payments',
    title: 'Your wallet balance is running low.',
    description: 'Your wallet balance is below GH₵ 50.00. Consider adding funds soon.',
    date: 'Sep 20, 2025',
    time: '04:18 PM',
    read: false,
    icon: Wallet,
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 3,
    category: 'sms',
    title: 'SMS batch completed successfully.',
    description: 'Your SMS batch (Ref: TXN-20250920-001) has been processed successfully.',
    date: 'Sep 20, 2025',
    time: '01:35 PM',
    read: true,
    icon: MessageSquare,
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    iconColor: 'text-[#1a6cf0] dark:text-blue-400',
  },
  {
    id: 4,
    category: 'payments',
    title: 'Your payment was received.',
    description: 'You received a payment of GH₵ 100.00 via Mobile Money.',
    date: 'Sep 19, 2025',
    time: '11:22 AM',
    read: true,
    icon: CreditCard,
    iconBg: 'bg-purple-100 dark:bg-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 5,
    category: 'system',
    title: 'API key created successfully.',
    description: 'Your new API key has been generated. Keep it secure.',
    date: 'Sep 18, 2025',
    time: '09:17 PM',
    read: true,
    icon: Code2,
    iconBg: 'bg-teal-100 dark:bg-teal-500/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    id: 6,
    category: 'sms',
    title: 'SMS delivery failed.',
    description: 'Some messages in batch (Ref: TXN-20250918-003) could not be delivered.',
    date: 'Sep 18, 2025',
    time: '08:03 AM',
    read: false,
    icon: AlertOctagon,
    iconBg: 'bg-rose-100 dark:bg-rose-500/20',
    iconColor: 'text-rose-500 dark:text-rose-400',
  },
  {
    id: 7,
    category: 'system',
    title: 'System maintenance reminder.',
    description: 'Scheduled maintenance will take place on Sep 25, 2025 from 1:00 AM to 4:00 AM.',
    date: 'Sep 17, 2025',
    time: '06:45 PM',
    read: true,
    icon: Settings2,
    iconBg: 'bg-sky-100 dark:bg-sky-500/20',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    id: 8,
    category: 'account',
    title: 'Account settings updated.',
    description: 'Your account information has been updated successfully.',
    date: 'Sep 16, 2025',
    time: '02:12 PM',
    read: true,
    icon: UserCheck,
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 9,
    category: 'account',
    title: 'Welcome to ProfJero Connect.',
    description: 'Your account was created successfully. Start by adding funds to your wallet.',
    date: 'Sep 14, 2025',
    time: '09:00 AM',
    read: true,
    icon: UserCheck,
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 10,
    category: 'sms',
    title: 'SMS campaign scheduled.',
    description: 'Your SMS campaign (Ref: TXN-20250913-002) has been scheduled for Sep 16.',
    date: 'Sep 13, 2025',
    time: '03:30 PM',
    read: true,
    icon: MessageSquare,
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    iconColor: 'text-[#1a6cf0] dark:text-blue-400',
  },
  {
    id: 11,
    category: 'payments',
    title: 'Wallet top-up successful.',
    description: 'Your wallet has been credited with GH₵ 500.00.',
    date: 'Sep 12, 2025',
    time: '11:45 AM',
    read: true,
    icon: Wallet,
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 12,
    category: 'sender-ids',
    title: 'New Sender ID request submitted.',
    description: 'Your request for Sender ID "SUNNYPROMO" is now pending review.',
    date: 'Sep 11, 2025',
    time: '02:20 PM',
    read: true,
    icon: ShieldCheck,
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
];

export interface NotificationFilter {
  id: 'all' | NotificationCategory;
  label: string;
}

export const notificationFilters: NotificationFilter[] = [
  { id: 'all', label: 'All' },
  { id: 'account', label: 'Account' },
  { id: 'sms', label: 'SMS' },
  { id: 'payments', label: 'Payments' },
  { id: 'sender-ids', label: 'Sender IDs' },
  { id: 'system', label: 'System' },
];

export const notificationsPagination = {
  from: 1,
  to: 8,
  total: 12,
};