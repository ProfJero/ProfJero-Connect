// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
// Content lifted from the approved Wallets & Units HTML.

import {
  Wallet,
  ShoppingCart,
  TrendingDown,
  Layers,
  Plus,
  Minus,
  RotateCcw,
  Sliders,
  Bell,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export interface WalletMetric {
  label: string;
  value: string;
  delta: string;
  footnote: string;
  icon: LucideIcon;
  iconBg: string;
}

export const walletMetrics: WalletMetric[] = [
  {
    label: 'Total Units',
    value: '31,850',
    delta: '12%',
    footnote: 'across 5 projects',
    icon: Wallet,
    iconBg: 'bg-blue-500',
  },
  {
    label: 'Units Sold',
    value: '42,600',
    delta: '18%',
    footnote: 'this month',
    icon: ShoppingCart,
    iconBg: 'bg-emerald-500',
  },
  {
    label: 'Units Consumed',
    value: '28,750',
    delta: '14%',
    footnote: 'this month',
    icon: TrendingDown,
    iconBg: 'bg-purple-600',
  },
  {
    label: 'Units Remaining',
    value: '13,850',
    delta: '22%',
    footnote: 'across all projects',
    icon: Layers,
    iconBg: 'bg-amber-500',
  },
];

export interface WalletRow {
  id: number;
  project: string;
  avatarBg: string;
  currentUnits: string;
  unitsPurchased: string;
  unitsUsed: string;
  unitsRefunded: string;
  lastTransactionDate: string;
  lastTransactionTime: string;
  status: 'Active' | 'Inactive';
  lowBalance: boolean;
}

export const walletRows: WalletRow[] = [
  {
    id: 1,
    project: 'GABS',
    avatarBg: 'bg-blue-600',
    currentUnits: '2,450',
    unitsPurchased: '3,500',
    unitsUsed: '1,250',
    unitsRefunded: '0',
    lastTransactionDate: 'Sep 21, 2025',
    lastTransactionTime: '10:24 AM',
    status: 'Active',
    lowBalance: false,
  },
  {
    id: 2,
    project: 'DBI',
    avatarBg: 'bg-blue-700',
    currentUnits: '8,200',
    unitsPurchased: '10,000',
    unitsUsed: '1,800',
    unitsRefunded: '0',
    lastTransactionDate: 'Sep 20, 2025',
    lastTransactionTime: '04:18 PM',
    status: 'Active',
    lowBalance: false,
  },
  {
    id: 3,
    project: 'Church A',
    avatarBg: 'bg-amber-500',
    currentUnits: '1,100',
    unitsPurchased: '2,400',
    unitsUsed: '1,300',
    unitsRefunded: '0',
    lastTransactionDate: 'Sep 19, 2025',
    lastTransactionTime: '11:42 AM',
    status: 'Active',
    lowBalance: true,
  },
  {
    id: 4,
    project: 'Pharmacy',
    avatarBg: 'bg-blue-800',
    currentUnits: '350',
    unitsPurchased: '1,000',
    unitsUsed: '650',
    unitsRefunded: '0',
    lastTransactionDate: 'Sep 18, 2025',
    lastTransactionTime: '02:17 PM',
    status: 'Active',
    lowBalance: true,
  },
  {
    id: 5,
    project: 'School',
    avatarBg: 'bg-blue-700',
    currentUnits: '6,750',
    unitsPurchased: '8,000',
    unitsUsed: '5,200',
    unitsRefunded: '0',
    lastTransactionDate: 'Sep 17, 2025',
    lastTransactionTime: '09:36 AM',
    status: 'Active',
    lowBalance: false,
  },
];

export interface LowBalanceProject {
  project: string;
  units: number;
  severity: 'Critical' | 'Low';
  avatarBg?: string;
}

export const lowBalanceProjects: LowBalanceProject[] = [
  { project: 'Pharmacy', units: 350, severity: 'Critical' },
  { project: 'Church A', units: 1100, severity: 'Low' },
  { project: 'DBI', units: 8200, severity: 'Low', avatarBg: 'bg-emerald-500' },
];

export interface UnitDistributionItem {
  name: string;
  value: number;
  color: string;
}

export const unitDistribution: UnitDistributionItem[] = [
  { name: 'GABS', value: 17.7, color: '#2563eb' },
  { name: 'DBI', value: 59.2, color: '#10b981' },
  { name: 'Church A', value: 7.9, color: '#f59e0b' },
  { name: 'Pharmacy', value: 2.5, color: '#8b5cf6' },
  { name: 'School', value: 12.7, color: '#94a3b8' },
];

export const totalRemainingUnits = '13,850';

export type TxType = 'Purchase' | 'Deduct' | 'Refund' | 'Adjust';

export interface TransactionRow {
  id: number;
  dateTime: string;
  project: string;
  type: TxType;
  units: string;
  unitsPositive: boolean;
  previousBalance: string;
  newBalance: string;
  reference: string;
  reason: string;
  performedBy: 'Admin' | 'System';
}

export const transactionRows: TransactionRow[] = [
  { id: 1, dateTime: 'Sep 21, 2025 10:24 AM', project: 'GABS', type: 'Purchase', units: '+1,000', unitsPositive: true, previousBalance: '1,450', newBalance: '2,450', reference: 'PUR-2025-091', reason: 'Monthly purchase', performedBy: 'Admin' },
  { id: 2, dateTime: 'Sep 20, 2025 04:18 PM', project: 'DBI', type: 'Purchase', units: '+2,000', unitsPositive: true, previousBalance: '6,200', newBalance: '8,200', reference: 'PUR-2025-090', reason: 'Additional units', performedBy: 'Admin' },
  { id: 3, dateTime: 'Sep 19, 2025 11:42 AM', project: 'Church A', type: 'Deduct', units: '-300', unitsPositive: false, previousBalance: '1,400', newBalance: '1,100', reference: 'DED-2025-089', reason: 'SMS campaign', performedBy: 'System' },
  { id: 4, dateTime: 'Sep 18, 2025 02:17 PM', project: 'Pharmacy', type: 'Deduct', units: '-650', unitsPositive: false, previousBalance: '1,000', newBalance: '350', reference: 'DED-2025-088', reason: 'Bulk SMS', performedBy: 'System' },
  { id: 5, dateTime: 'Sep 17, 2025 09:36 AM', project: 'School', type: 'Purchase', units: '+2,000', unitsPositive: true, previousBalance: '4,750', newBalance: '6,750', reference: 'PUR-2025-087', reason: 'Monthly purchase', performedBy: 'Admin' },
  { id: 6, dateTime: 'Sep 16, 2025 03:21 PM', project: 'GABS', type: 'Refund', units: '+250', unitsPositive: true, previousBalance: '1,200', newBalance: '1,450', reference: 'REF-2025-086', reason: 'Failed messages', performedBy: 'Admin' },
  { id: 7, dateTime: 'Sep 15, 2025 01:12 PM', project: 'DBI', type: 'Adjust', units: '+500', unitsPositive: true, previousBalance: '7,700', newBalance: '8,200', reference: 'ADJ-2025-085', reason: 'Balance adjustment', performedBy: 'Admin' },
  { id: 8, dateTime: 'Sep 15, 2025 10:05 AM', project: 'Church A', type: 'Deduct', units: '-200', unitsPositive: false, previousBalance: '1,600', newBalance: '1,400', reference: 'DED-2025-084', reason: 'Test SMS', performedBy: 'System' },
];

export const transactionPagination = {
  showingFrom: 1,
  showingTo: 8,
  total: 48,
  pages: [1, 2, 3, 4, 5],
};

export interface QuickAction {
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
}

export const quickActions: QuickAction[] = [
  { label: 'Add Units', description: 'Add units to a project wallet', icon: Plus, iconBg: 'bg-emerald-500' },
  { label: 'Deduct Units', description: 'Deduct units from a project', icon: Minus, iconBg: 'bg-rose-500' },
  { label: 'Refund Units', description: 'Refund units to a project', icon: RotateCcw, iconBg: 'bg-purple-600' },
  { label: 'Adjust Balance', description: 'Manual balance adjustment', icon: Sliders, iconBg: 'bg-amber-500' },
  { label: 'Set Low-Balance Threshold', description: 'Configure alerts for low balance', icon: Bell, iconBg: 'bg-blue-600' },
  { label: 'View Transaction History', description: 'Full unit transaction log', icon: FileText, iconBg: 'bg-purple-700' },
];