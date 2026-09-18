// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
// Content lifted from the approved Arkesel Account HTML.

import {
  Link as LinkIcon,
  UserCheck,
  Send,
  Layers,
  Gauge,
  Mic,
  CalendarCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  type LucideIcon,
} from 'lucide-react';

export interface ProviderMetric {
  label: string;
  value: string;
  footnote: string;
  icon: LucideIcon;
  iconBg: string;
  valueColor?: 'emerald' | 'default';
  badge?: { label: string; tone: 'success' | 'danger' };
}

export const providerMetrics: ProviderMetric[] = [
  {
    label: 'Connection Status',
    value: 'Connected',
    footnote: 'API connection is active',
    icon: LinkIcon,
    iconBg: 'bg-emerald-500',
    valueColor: 'emerald',
  },
  {
    label: 'Arkesel Account Status',
    value: 'Active',
    footnote: 'Account is in good standing',
    icon: UserCheck,
    iconBg: 'bg-emerald-600',
    valueColor: 'emerald',
  },
  {
    label: 'Available SMS Credits',
    value: '12,000',
    footnote: 'Provider credits available',
    icon: Send,
    iconBg: 'bg-blue-600',
  },
  {
    label: 'SMS Sent',
    value: '233,XXX',
    footnote: 'Total SMS sent (all time)',
    icon: Layers,
    iconBg: 'bg-indigo-600',
  },
  {
    label: 'Estimated Remaining Capacity',
    value: '~ 4,800 SMS',
    footnote: 'Based on current usage pattern',
    icon: Gauge,
    iconBg: 'bg-teal-600',
  },
  {
    label: 'Voice SMS Status',
    value: 'Active',
    footnote: 'Voice SMS service enabled',
    icon: Mic,
    iconBg: 'bg-amber-500',
  },
  {
    label: 'Last Successful API Request',
    value: 'Sep 21, 2025 10:24 AM',
    footnote: '',
    icon: CalendarCheck,
    iconBg: 'bg-blue-500',
    badge: { label: '200 OK', tone: 'success' },
  },
  {
    label: 'Last Failed API Request',
    value: 'Sep 20, 2025 06:17 PM',
    footnote: 'Timeout',
    icon: AlertTriangle,
    iconBg: 'bg-rose-500',
  },
];

export interface SenderIdRow {
  id: number;
  value: string;
  project: string;
  status: 'Active' | 'Limited';
  usagePct: number;
  lastUsed: string;
}

export const senderIds: SenderIdRow[] = [
  { id: 1, value: 'PROFJERO', project: 'GABS', status: 'Active', usagePct: 68, lastUsed: 'Sep 21, 2025 09:42 AM' },
  { id: 2, value: 'DBI', project: 'DBI', status: 'Active', usagePct: 45, lastUsed: 'Sep 20, 2025 04:18 PM' },
  { id: 3, value: 'CHURCH', project: 'Church A', status: 'Active', usagePct: 32, lastUsed: 'Sep 19, 2025 11:12 AM' },
  { id: 4, value: 'PHARMACY', project: 'Pharmacy', status: 'Active', usagePct: 18, lastUsed: 'Sep 18, 2025 03:26 PM' },
  { id: 5, value: 'SCHOOL', project: 'School', status: 'Limited', usagePct: 12, lastUsed: 'Sep 17, 2025 10:05 AM' },
];

export interface ApiMonitorChip {
  label: string;
  value: string;
  footnote: string;
  icon?: LucideIcon;
  iconColor?: string;
  dotColor?: string;
  footnoteColor?: 'slate' | 'emerald' | 'rose';
}

export const apiMonitorChips: ApiMonitorChip[] = [
  {
    label: 'API Connection',
    value: 'Connected',
    footnote: 'Last activity: 2 min ago',
    dotColor: 'bg-emerald-500',
  },
  {
    label: 'Request Count',
    value: '3,482',
    footnote: 'Total requests',
    icon: FileText,
    iconColor: 'text-blue-500',
  },
  {
    label: 'Successful Requests',
    value: '3,421',
    footnote: '98.3% success rate',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    footnoteColor: 'emerald',
  },
  {
    label: 'Failed Requests',
    value: '61',
    footnote: '1.7% failure rate',
    icon: XCircle,
    iconColor: 'text-rose-500',
    footnoteColor: 'rose',
  },
  {
    label: 'Response Time',
    value: '320 ms',
    footnote: 'Average response time',
    icon: Clock,
    iconColor: 'text-indigo-500',
  },
  {
    label: 'Last API Activity',
    value: 'Sep 21, 2025 10:24 AM',
    footnote: 'Last successful request',
    icon: RotateCw,
    iconColor: 'text-blue-500',
  },
];

export interface ProviderEvent {
  date: string;
  label: string;
  icon: 'user-check' | 'sms' | 'x' | 'pen' | 'check';
  tone: 'emerald' | 'blue' | 'rose';
}

export const providerEvents: ProviderEvent[] = [
  { date: 'Sep 21, 2025 10:24 AM', label: 'API request successful (200)', icon: 'user-check', tone: 'emerald' },
  { date: 'Sep 21, 2025 09:17 AM', label: 'SMS sent - 250 messages', icon: 'sms', tone: 'blue' },
  { date: 'Sep 20, 2025 06:17 PM', label: 'API timeout error', icon: 'x', tone: 'rose' },
  { date: 'Sep 19, 2025 03:42 PM', label: 'Sender ID updated (PROFJERO)', icon: 'pen', tone: 'blue' },
  { date: 'Sep 18, 2025 11:26 AM', label: 'Balance check - GHS 220.00', icon: 'check', tone: 'emerald' },
];

export interface ApiError {
  date: string;
  error: string;
}

export const recentApiErrors: ApiError[] = [
  { date: 'Sep 20, 2025 06:17 PM', error: 'API timeout' },
  { date: 'Sep 19, 2025 02:14 PM', error: 'Invalid sender ID' },
  { date: 'Sep 18, 2025 09:32 AM', error: 'Rate limit exceeded' },
  { date: 'Sep 16, 2025 11:08 AM', error: 'Service unavailable' },
  { date: 'Sep 14, 2025 04:23 PM', error: 'Invalid credentials' },
];

export const providerBalance = {
  amount: 'GHS 220.00',
  lowBalanceThreshold: 'GHS 500.00',
};

export const secureSettings = {
  apiKey: '••••••••••••••••••••',
  apiSecret: '••••••••••••••••••••',
  accountId: 'ARK-123456',
};