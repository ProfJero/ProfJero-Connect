// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
// Every value below was lifted verbatim from the approved HTML dashboard.

import type { LucideIcon } from 'lucide-react';
import {
  MessageSquare,
  MessageSquareOff,
  Coins,
  Wallet,
  Database,
  DollarSign,
  Users,
} from 'lucide-react';

export interface Stat {
  title: string;
  subtitle?: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  trend?: { direction: 'up' | 'down'; value: string; label: string };
  footnote?: string;
}

export const stats: Stat[] = [
  {
    title: 'Total SMS Sent',
    subtitle: '(Today)',
    value: '245',
    icon: MessageSquare,
    iconBg: 'bg-blue-600',
    trend: { direction: 'up', value: '12%', label: 'vs. yesterday' },
  },
  {
    title: 'Total SMS Sent',
    subtitle: '(This Month)',
    value: '8,450',
    icon: MessageSquare,
    iconBg: 'bg-emerald-500',
    trend: { direction: 'up', value: '18%', label: 'vs. last month' },
  },
  {
    title: 'Total Units Sold',
    value: '15,000',
    icon: Coins,
    iconBg: 'bg-indigo-600',
    trend: { direction: 'up', value: '22%', label: 'this month' },
  },
  {
    title: 'Units Remaining',
    subtitle: '(All Clients)',
    value: '6,550',
    icon: Wallet,
    iconBg: 'bg-amber-500',
    trend: { direction: 'up', value: '15%', label: 'across all projects' },
  },
  {
    title: 'Arkesel Balance',
    value: '12,000',
    icon: Database,
    iconBg: 'bg-blue-600',
    footnote: 'SMS Credits',
  },
  {
    title: 'Total Revenue',
    subtitle: '(SMS Units)',
    value: 'GHS 600',
    icon: DollarSign,
    iconBg: 'bg-emerald-600',
    trend: { direction: 'up', value: '20%', label: 'this month' },
  },
  {
    title: 'Failed Messages',
    value: '23',
    icon: MessageSquareOff,
    iconBg: 'bg-rose-500',
    trend: { direction: 'down', value: '40%', label: 'vs. last week' },
  },
  {
    title: 'Active Platforms',
    value: '4',
    icon: Users,
    iconBg: 'bg-teal-600',
    footnote: 'of 5 total',
  },
];

export const usageChartData = [
  { day: 'Sep 15', sms: 1300, units: 1200 },
  { day: 'Sep 16', sms: 950, units: 890 },
  { day: 'Sep 17', sms: 900, units: 850 },
  { day: 'Sep 18', sms: 930, units: 750 },
  { day: 'Sep 19', sms: 930, units: 820 },
  { day: 'Sep 20', sms: 1050, units: 920 },
  { day: 'Sep 21', sms: 1400, units: 1100 },
];

export const platformDonutData = [
  { name: 'GABS', value: 32, color: '#1976d2' },
  { name: 'DBI', value: 24, color: '#10b981' },
  { name: 'Church A', value: 18, color: '#f59e0b' },
  { name: 'Pharmacy', value: 15, color: '#8b5cf6' },
  { name: 'Others', value: 11, color: '#94a3b8' },
];

export interface ProjectRow {
  id: number;
  name: string;
  avatarBg: string;
  senderId: string;
  status: 'Active' | 'Suspended';
  units: string;
  smsSent: string;
}

export const projects: ProjectRow[] = [
  { id: 1, name: 'GABS', avatarBg: 'bg-blue-600', senderId: 'GABS', status: 'Active', units: '2,450', smsSent: '1,250' },
  { id: 2, name: 'DBI', avatarBg: 'bg-blue-700', senderId: 'DBI', status: 'Active', units: '8,200', smsSent: '800' },
  { id: 3, name: 'Church A', avatarBg: 'bg-amber-500', senderId: 'CHURCHA', status: 'Active', units: '1,100', smsSent: '2,400' },
  { id: 4, name: 'Pharmacy', avatarBg: 'bg-blue-500', senderId: 'EDPHARMACY', status: 'Active', units: '3,500', smsSent: '600' },
  { id: 5, name: 'School', avatarBg: 'bg-slate-700', senderId: 'SCHOOL', status: 'Suspended', units: '0', smsSent: '0' },
];

export interface SmsLogRow {
  date: string;
  platform: string;
  recipient: string;
  units: number;
  status: 'Sent' | 'Failed' | 'Pending';
}

export const recentSmsLogs: SmsLogRow[] = [
  { date: 'Sep 21, 2025 10:24', platform: 'GABS', recipient: '233XXXXXXXXX', units: 1, status: 'Sent' },
  { date: 'Sep 21, 2025 10:18', platform: 'DBI', recipient: '233XXXXXXXXX', units: 1, status: 'Sent' },
  { date: 'Sep 21, 2025 10:12', platform: 'Church A', recipient: '233XXXXXXXXX', units: 2, status: 'Failed' },
  { date: 'Sep 21, 2025 10:05', platform: 'GABS', recipient: '233XXXXXXXXX', units: 1, status: 'Sent' },
  { date: 'Sep 21, 2025 09:58', platform: 'Pharmacy', recipient: '233XXXXXXXXX', units: 1, status: 'Sent' },
];

export interface PaymentRow {
  ref: string;
  project: string;
  package: string;
  amount: string;
  status: 'Successful' | 'Pending' | 'Failed';
}

export const recentPayments: PaymentRow[] = [
  { ref: 'PJ001', project: 'GABS', package: '1,000 Units', amount: 'GHS 50.00', status: 'Successful' },
  { ref: 'PJ002', project: 'DBI', package: '500 Units', amount: 'GHS 22.00', status: 'Successful' },
  { ref: 'PJ003', project: 'Church A', package: '2,000 Units', amount: 'GHS 75.00', status: 'Pending' },
  { ref: 'PJ004', project: 'Pharmacy', package: '1,000 Units', amount: 'GHS 50.00', status: 'Successful' },
  { ref: 'PJ005', project: 'GABS', package: '500 Units', amount: 'GHS 22.00', status: 'Successful' },
];

export interface ActivityItem {
  type: 'payment' | 'sms' | 'units' | 'failed' | 'project';
  title: string;
  detail: string;
  time: string;
}

export const recentActivity: ActivityItem[] = [
  { type: 'payment', title: 'Payment received', detail: 'GABS - 1,000 Units (GHS 50.00)', time: '2 hours ago' },
  { type: 'sms', title: 'SMS sent', detail: 'To 233XXXXXXXXX - GABS', time: '3 hours ago' },
  { type: 'units', title: 'Units credited', detail: 'DBI - 500 Units', time: '5 hours ago' },
  { type: 'failed', title: 'Failed SMS', detail: 'To 233XXXXXXXXX - Church A', time: '6 hours ago' },
  { type: 'project', title: 'New project added', detail: 'Pharmacy', time: '1 day ago' },
];

export interface LowBalanceItem {
  project: string;
  units: number;
  severity: 'low' | 'critical';
}

export const lowBalanceAlerts: LowBalanceItem[] = [
  { project: 'Church A', units: 120, severity: 'low' },
  { project: 'Pharmacy', units: 0, severity: 'critical' },
  { project: 'DBI', units: 350, severity: 'low' },
];

export const quickStats = [
  { label: 'Avg. SMS Cost (Arkesel)', value: 'GHS 0.013', suffix: '/ SMS', iconBg: 'bg-blue-50 text-blue-600', icon: 'tag' as const },
  { label: 'Avg. Revenue per SMS', value: 'GHS 0.071', suffix: '', iconBg: 'bg-emerald-50 text-emerald-600', icon: 'trending-up' as const },
  { label: 'Success Rate', value: '99.7%', suffix: '', iconBg: 'bg-cyan-50 text-cyan-600', icon: 'check-circle-2' as const },
];

export const arkeselStatus = {
  availableCredits: '12,000',
  smsThisMonth: '8,450',
  estimatedCapacity: '12,000',
  connected: true,
};