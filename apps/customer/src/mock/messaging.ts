// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.
//
// Sender IDs are the customer's own (SunnyTech), not the admin platform's
// client names.

import {
  MessageSquare,
  Package,
  CheckCircle2,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

export interface MessagingStat {
  label: string;
  value: string;
  delta: string;
  deltaTone: 'emerald' | 'rose';
  footnote: string;
  icon: LucideIcon;
  iconBg: string;
}

export const messagingStats: MessagingStat[] = [
  {
    label: 'Messages Sent',
    value: '12,480',
    delta: '↑ 18%',
    deltaTone: 'emerald',
    footnote: 'vs. last 30 days',
    icon: MessageSquare,
    iconBg: 'bg-blue-500',
  },
  {
    label: 'Units Used',
    value: '8,240',
    delta: '↑ 22%',
    deltaTone: 'emerald',
    footnote: 'vs. last 30 days',
    icon: Package,
    iconBg: 'bg-teal-600',
  },
  {
    label: 'Successful',
    value: '7,860',
    delta: '↑ 20%',
    deltaTone: 'emerald',
    footnote: '94.7% delivery rate',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-500',
  },
  {
    label: 'Failed',
    value: '380',
    delta: '↑ 12%',
    deltaTone: 'rose',
    footnote: '4.6% failure rate',
    icon: AlertTriangle,
    iconBg: 'bg-rose-500',
  },
];

export type MessageStatus = 'Completed' | 'Submitted' | 'Partial' | 'Failed';

export interface RecentMessageRow {
  id: number;
  date: string;
  senderId: string;
  recipients: number;
  messagePreview: string;
  units: number;
  status: MessageStatus;
}

export const recentMessages: RecentMessageRow[] = [
  {
    id: 1,
    date: 'Sep 21, 2025 10:42 AM',
    senderId: 'SunnyTech',
    recipients: 245,
    messagePreview: 'Your verification code is 482931. Do not share i...',
    units: 245,
    status: 'Completed',
  },
  {
    id: 2,
    date: 'Sep 21, 2025 09:17 AM',
    senderId: 'SunnyTech Alerts',
    recipients: 1200,
    messagePreview: 'Thank you for your registration. Welcome to Sun...',
    units: 1200,
    status: 'Completed',
  },
  {
    id: 3,
    date: 'Sep 20, 2025 04:36 PM',
    senderId: 'SunnyTech',
    recipients: 87,
    messagePreview: 'Join us this Friday for our special product la...',
    units: 87,
    status: 'Submitted',
  },
  {
    id: 4,
    date: 'Sep 20, 2025 11:22 AM',
    senderId: 'SunnyTech Support',
    recipients: 560,
    messagePreview: 'Your prescription is ready for collection. Thank you.',
    units: 560,
    status: 'Completed',
  },
  {
    id: 5,
    date: 'Sep 19, 2025 03:15 PM',
    senderId: 'SunnyTech Promos',
    recipients: 430,
    messagePreview: 'Your order is ready for pickup. Thank you.',
    units: 430,
    status: 'Partial',
  },
  {
    id: 6,
    date: 'Sep 19, 2025 09:48 AM',
    senderId: 'SunnyTech',
    recipients: 250,
    messagePreview: 'Payment reminder: Please settle your invoice...',
    units: 250,
    status: 'Failed',
  },
  {
    id: 7,
    date: 'Sep 18, 2025 02:21 PM',
    senderId: 'SunnyTech Alerts',
    recipients: 1050,
    messagePreview: 'Monthly report is now available on your dashboard.',
    units: 1050,
    status: 'Completed',
  },
  {
    id: 8,
    date: 'Sep 18, 2025 10:12 AM',
    senderId: 'SunnyTech Promos',
    recipients: 320,
    messagePreview: 'New offers available. Check our latest promos...',
    units: 320,
    status: 'Completed',
  },
];

export const messagingPagination = {
  from: 1,
  to: 8,
  total: 124,
  pages: [1, 2, 3, 4, 5],
  lastPage: 16,
};

export const senderIdFilterOptions = [
  'All Senders',
  'SunnyTech',
  'SunnyTech Alerts',
  'SunnyTech Promos',
  'SunnyTech Support',
];