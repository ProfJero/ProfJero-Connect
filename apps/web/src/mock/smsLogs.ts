// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
// Content lifted from the approved SMS Logs HTML.
//
// NOTE: "Delivered" in this mock is a provider-side label. Per Stage 2/3
// design, real delivery confirmation is a future capability — in production
// this column will initially show "Submitted" until Arkesel delivery receipts
// are wired in.

import { Mail, Check, X, Clock, Package, type LucideIcon } from 'lucide-react';

export interface SmsMetric {
  label: string;
  value: string;
  delta: { direction: 'up' | 'down'; value: string; color: 'emerald' | 'red' };
  footnote: string;
  icon: LucideIcon;
  iconBg: string;
}

export const smsMetrics: SmsMetric[] = [
  {
    label: 'Total Messages',
    value: '148,736',
    delta: { direction: 'up', value: '22%', color: 'emerald' },
    footnote: 'vs. previous 7 days',
    icon: Mail,
    iconBg: 'bg-blue-500',
  },
  {
    label: 'Successful Messages',
    value: '142,508',
    delta: { direction: 'up', value: '24%', color: 'emerald' },
    footnote: '95.7% delivery rate',
    icon: Check,
    iconBg: 'bg-emerald-500',
  },
  {
    label: 'Failed Messages',
    value: '4,892',
    delta: { direction: 'down', value: '18%', color: 'red' },
    footnote: '3.3% failure rate',
    icon: X,
    iconBg: 'bg-red-500',
  },
  {
    label: 'Pending Messages',
    value: '1,336',
    delta: { direction: 'up', value: '12%', color: 'emerald' },
    footnote: '0.9% pending',
    icon: Clock,
    iconBg: 'bg-amber-500',
  },
  {
    label: 'Total Units Consumed',
    value: '156,720',
    delta: { direction: 'up', value: '20%', color: 'emerald' },
    footnote: 'Avg. 1.05 units/message',
    icon: Package,
    iconBg: 'bg-purple-600',
  },
];

export type SmsStatus = 'Sent' | 'Failed' | 'Pending';
export type ProviderStatus = 'Delivered' | 'Rejected' | 'Pending';

export interface SmsLogRow {
  id: number;
  date: string;
  time: string;
  project: string;
  projectAvatarBg: string;
  senderId: string;
  recipient: string;
  messagePreview: string;
  units: number;
  status: SmsStatus;
  providerStatus: ProviderStatus;
  messageId: string;
}

export const smsLogs: SmsLogRow[] = [
  {
    id: 1,
    date: 'Sep 21, 2025',
    time: '10:24 AM',
    project: 'GABS',
    projectAvatarBg: 'bg-blue-600',
    senderId: 'GABS',
    recipient: '0244123456',
    messagePreview: 'Your verification code is 482931. Do not share it...',
    units: 1,
    status: 'Sent',
    providerStatus: 'Delivered',
    messageId: 'MSG-7F4A2B9C',
  },
  {
    id: 2,
    date: 'Sep 21, 2025',
    time: '10:17 AM',
    project: 'DBI',
    projectAvatarBg: 'bg-blue-700',
    senderId: 'DBI',
    recipient: '0245678910',
    messagePreview: 'Thank you for your registration. Welcome ...',
    units: 1,
    status: 'Sent',
    providerStatus: 'Delivered',
    messageId: 'MSG-3E8B1D7F',
  },
  {
    id: 3,
    date: 'Sep 21, 2025',
    time: '09:52 AM',
    project: 'Church A',
    projectAvatarBg: 'bg-amber-500',
    senderId: 'CHURCH',
    recipient: '0203456789',
    messagePreview: 'Join us this Sunday for our special service...',
    units: 2,
    status: 'Sent',
    providerStatus: 'Delivered',
    messageId: 'MSG-9C2D4E6A',
  },
  {
    id: 4,
    date: 'Sep 21, 2025',
    time: '09:31 AM',
    project: 'Pharmacy',
    projectAvatarBg: 'bg-purple-600',
    senderId: 'EDPHARMACY',
    recipient: '0267890123',
    messagePreview: 'Your prescription is ready for collection. Thank you.',
    units: 1,
    status: 'Sent',
    providerStatus: 'Delivered',
    messageId: 'MSG-4A6F8C2D',
  },
  {
    id: 5,
    date: 'Sep 21, 2025',
    time: '09:12 AM',
    project: 'School',
    projectAvatarBg: 'bg-emerald-600',
    senderId: 'SCHOOL',
    recipient: '0276543210',
    messagePreview: 'School fees reminder: Please make payment...',
    units: 1,
    status: 'Sent',
    providerStatus: 'Delivered',
    messageId: 'MSG-8D1E6F3B',
  },
  {
    id: 6,
    date: 'Sep 21, 2025',
    time: '08:47 AM',
    project: 'HealthPlus',
    projectAvatarBg: 'bg-purple-700',
    senderId: 'HEALTH',
    recipient: '0249876543',
    messagePreview: 'Your appointment is confirmed for Sep 23...',
    units: 1,
    status: 'Sent',
    providerStatus: 'Delivered',
    messageId: 'MSG-6B3C9D7E',
  },
  {
    id: 7,
    date: 'Sep 21, 2025',
    time: '08:21 AM',
    project: 'GABS',
    projectAvatarBg: 'bg-blue-600',
    senderId: 'GABS',
    recipient: '0234567890',
    messagePreview: 'Monthly report is now available on your dashboard.',
    units: 1,
    status: 'Sent',
    providerStatus: 'Delivered',
    messageId: 'MSG-2D9E5F1A',
  },
  {
    id: 8,
    date: 'Sep 21, 2025',
    time: '07:56 AM',
    project: 'DBI',
    projectAvatarBg: 'bg-blue-700',
    senderId: 'DBI',
    recipient: '0543210987',
    messagePreview: 'System maintenance will be carried out tonight...',
    units: 1,
    status: 'Failed',
    providerStatus: 'Rejected',
    messageId: 'MSG-7C6A3E9B',
  },
  {
    id: 9,
    date: 'Sep 21, 2025',
    time: '07:33 AM',
    project: 'Church A',
    projectAvatarBg: 'bg-amber-500',
    senderId: 'CHURCH',
    recipient: '0556789012',
    messagePreview: 'God bless you. Have a wonderful week ahead.',
    units: 1,
    status: 'Sent',
    providerStatus: 'Delivered',
    messageId: 'MSG-1F8D4B2C',
  },
  {
    id: 10,
    date: 'Sep 21, 2025',
    time: '07:18 AM',
    project: 'Pharmacy',
    projectAvatarBg: 'bg-purple-600',
    senderId: 'EDPHARMACY',
    recipient: '0598765432',
    messagePreview: 'Your medication is ready for pickup. Thank you.',
    units: 1,
    status: 'Pending',
    providerStatus: 'Pending',
    messageId: 'MSG-5E3A7D9F',
  },
];

// Details inspector — corresponds to the currently selected row (row 1)
export interface SmsDetail {
  messageId: string;
  statuses: Array<{ label: string; variant: 'success' | 'danger' | 'warning' }>;
  fullMessage: string;
  recipient: string;
  senderId: string;
  project: string;
  projectAvatarBg: string;
  unitsConsumed: number;
  requestTime: string;
  processingTime: string;
  deliveryStatus: { label: string; variant: 'success' | 'danger' | 'warning' };
  providerResponse: string;
  errorReason: string;
  referenceId: string;
}

export const smsDetail: SmsDetail = {
  messageId: 'MSG-7F4A2B9C',
  statuses: [
    { label: 'Sent', variant: 'success' },
    { label: 'Delivered', variant: 'success' },
  ],
  fullMessage: 'Your verification code is 482931. Do not share it with anyone.',
  recipient: '0244123456',
  senderId: 'GABS',
  project: 'GABS',
  projectAvatarBg: 'bg-blue-600',
  unitsConsumed: 1,
  requestTime: 'Sep 21, 2025 10:24 AM',
  processingTime: '2.4 seconds',
  deliveryStatus: { label: 'Delivered', variant: 'success' },
  providerResponse: '{ "status": "DELIVERED", "message": "Message delivered successfully" }',
  errorReason: '-',
  referenceId: 'TXN-8F2D3A9C',
};

export const totalLogCount = 148736;
export const currentPageStart = 1;
export const currentPageEnd = 10;
export const totalPages = 1487;