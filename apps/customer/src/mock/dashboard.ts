// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.
// Content lifted from the approved ProfJero Connect Dashboard HTML.
//
// RULE: no provider names anywhere in customer-facing copy (see
// docs/customer-platform.md §11). Never write "Arkesel" or "Paystack" here.

import {
  Send,
  Smartphone,
  Phone,
  AtSign,
  Mail,
  Package,
  DollarSign,
  UsersRound,
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  type LucideIcon,
} from 'lucide-react';

export const welcome = {
  firstName: 'Benjamin',
  dateLabel: 'Sep 21, 2025',
  lastLogin: 'Last login: 2 hours ago',
};

export const balanceCard = {
  amount: 'GH₵ 250.00',
  smsUnits: '2,750',
  lastTransaction: 'Sep 21, 2025 • GH₵ 50.00',
};

export interface QuickAction {
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  hover: string;
  arrowColor: string;
}

export const quickActions: QuickAction[] = [
  {
    label: 'Send SMS',
    description: 'Send messages now',
    icon: Send,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-[#1a6cf0]',
    hover: 'hover:border-blue-200 hover:bg-blue-50/30',
    arrowColor: 'text-[#1a6cf0]',
  },
  {
    label: 'Buy Data',
    description: 'Get data bundles',
    icon: Smartphone,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
    hover: 'hover:border-emerald-200 hover:bg-emerald-50/30',
    arrowColor: 'text-emerald-600',
  },
  {
    label: 'Buy Airtime',
    description: 'Top up numbers',
    icon: Phone,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    hover: 'hover:border-amber-200 hover:bg-amber-50/30',
    arrowColor: 'text-amber-600',
  },
  {
    label: 'Add Sender ID',
    description: 'Request a sender ID',
    icon: AtSign,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-600',
    hover: 'hover:border-purple-200 hover:bg-purple-50/30',
    arrowColor: 'text-purple-600',
  },
];

export interface MetricCardData {
  label: string;
  value: string;
  delta: string;
  deltaTone: 'emerald' | 'slate';
  footer: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export const metricCards: MetricCardData[] = [
  {
    label: 'SMS Sent This Month',
    value: '12,480',
    delta: '↑ 18%',
    deltaTone: 'emerald',
    footer: 'vs. last month',
    icon: Mail,
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#1a6cf0]',
  },
  {
    label: 'SMS Units Consumed',
    value: '8,240',
    delta: '↑ 22%',
    deltaTone: 'emerald',
    footer: 'vs. last month',
    icon: Package,
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
  },
  {
    label: 'Total Spending',
    value: 'GH₵ 320.50',
    delta: '',
    deltaTone: 'slate',
    footer: 'vs. last month',
    icon: DollarSign,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Active Sender IDs',
    value: '3',
    delta: '',
    deltaTone: 'slate',
    footer: 'No change',
    icon: UsersRound,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
  },
];

export const smsUsageData = [
  { day: 'Sep 15', messages: 500, units: 380 },
  { day: 'Sep 16', messages: 1150, units: 900 },
  { day: 'Sep 17', messages: 1150, units: 900 },
  { day: 'Sep 18', messages: 900, units: 720 },
  { day: 'Sep 19', messages: 1080, units: 850 },
  { day: 'Sep 20', messages: 1350, units: 1080 },
  { day: 'Sep 21', messages: 1800, units: 1440 },
];

export type TxType = 'Wallet Funding' | 'SMS' | 'Data' | 'Airtime';

export interface TransactionRow {
  date: string;
  type: TxType;
  description: string;
  amount: string;
  amountPositive: boolean;
  status: 'Successful' | 'Pending' | 'Failed';
}

export const recentTransactions: TransactionRow[] = [
  { date: 'Sep 21, 2025 10:24 AM', type: 'Wallet Funding', description: 'Paystack payment', amount: '+ GH₵ 100.00', amountPositive: true, status: 'Successful' },
  { date: 'Sep 20, 2025 04:18 PM', type: 'SMS', description: 'Bulk SMS (GABS)', amount: '- GH₵ 50.00', amountPositive: false, status: 'Successful' },
  { date: 'Sep 19, 2025 11:32 AM', type: 'Data', description: 'MTN 2GB Bundle', amount: '- GH₵ 45.00', amountPositive: false, status: 'Successful' },
  { date: 'Sep 18, 2025 02:15 PM', type: 'Airtime', description: 'MTN 50.00', amount: '- GH₵ 50.00', amountPositive: false, status: 'Successful' },
  { date: 'Sep 17, 2025 09:48 AM', type: 'SMS', description: 'Notification Campaign', amount: '- GH₵ 25.00', amountPositive: false, status: 'Successful' },
];

export interface ServiceItem {
  name: string;
  description: string;
  status: 'Available' | 'Coming soon';
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export const serviceOverview: ServiceItem[] = [
  { name: 'SMS', description: '2,750 units', status: 'Available', icon: Mail, iconBg: 'bg-blue-100', iconColor: 'text-[#1a6cf0]' },
  { name: 'Data', description: 'Buy bundles', status: 'Available', icon: Smartphone, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { name: 'Airtime', description: 'Top up now', status: 'Available', icon: Phone, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { name: 'API', description: 'Integration ready', status: 'Available', icon: Send, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
];

export type NotificationTone = 'success' | 'info' | 'warning';

export interface NotificationItem {
  title: string;
  description: string;
  time: string;
  tone: NotificationTone;
  icon: LucideIcon;
}

export const recentNotifications: NotificationItem[] = [
  { title: 'Wallet funded successfully', description: 'GH₵ 100.00 has been added to your wallet.', time: '2 hours ago', tone: 'success', icon: CheckCircle2 },
  { title: 'Sender ID approved', description: 'GABS is now active and ready to use.', time: '4 hours ago', tone: 'info', icon: Info },
  { title: 'Low SMS balance', description: 'Your SMS balance is below 1,000 units.', time: '6 hours ago', tone: 'warning', icon: AlertTriangle },
  { title: 'Data purchase successful', description: '2GB bundle purchased on MTN.', time: '1 day ago', tone: 'success', icon: CheckCircle2 },
  { title: 'New API key created', description: 'GABS Production key has been created.', time: '1 day ago', tone: 'info', icon: Wallet },
];