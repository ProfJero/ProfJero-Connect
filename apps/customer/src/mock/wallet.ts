// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.
//
// RULE: no provider names (see docs/customer-platform.md §11).
// Payment rows say "Card payment" or "Bank transfer", never a gateway name.

export const walletBalance = {
  amount: 'GH₵ 250.00',
  status: 'Active' as const,
  purchasedUnits: '4,850',
  unitsLabel: 'SMS Units',
  lastTopupDate: 'Sep 15, 2025',
  lastTopupAmount: 'GH₵ 500.00',
};

export interface SpendingDay {
  day: string;
  sms: number;
  data: number;
  airtime: number;
  other: number;
}

export const spendingData: SpendingDay[] = [
  { day: 'Sep 15', sms: 90, data: 25, airtime: 10, other: 0 },
  { day: 'Sep 16', sms: 60, data: 20, airtime: 20, other: 0 },
  { day: 'Sep 17', sms: 45, data: 15, airtime: 25, other: 0 },
  { day: 'Sep 18', sms: 65, data: 25, airtime: 20, other: 0 },
  { day: 'Sep 19', sms: 55, data: 20, airtime: 20, other: 0 },
  { day: 'Sep 20', sms: 60, data: 25, airtime: 23, other: 0 },
  { day: 'Sep 21', sms: 90, data: 35, airtime: 35, other: 0 },
];

export type WalletActivityType =
  | 'SMS Purchase'
  | 'Data Purchase'
  | 'Wallet Top-up'
  | 'SMS Usage'
  | 'Refund'
  | 'Adjustment';

export interface WalletActivityRow {
  id: number;
  type: WalletActivityType;
  description: string;
  date: string;
  amount: string;
  amountPositive: boolean;
  balanceAfter: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

export const walletActivity: WalletActivityRow[] = [
  {
    id: 1,
    type: 'SMS Purchase',
    description: 'Bulk SMS (500 units)',
    date: 'Sep 21, 2025 09:42 AM',
    amount: '- GH₵ 50.00',
    amountPositive: false,
    balanceAfter: 'GH₵ 250.00',
    status: 'Completed',
  },
  {
    id: 2,
    type: 'Data Purchase',
    description: 'MTN 1GB Bundle',
    date: 'Sep 20, 2025 04:18 PM',
    amount: '- GH₵ 10.00',
    amountPositive: false,
    balanceAfter: 'GH₵ 300.00',
    status: 'Completed',
  },
  {
    id: 3,
    type: 'Wallet Top-up',
    description: 'Card payment',
    date: 'Sep 18, 2025 11:25 AM',
    amount: '+ GH₵ 500.00',
    amountPositive: true,
    balanceAfter: 'GH₵ 310.00',
    status: 'Completed',
  },
  {
    id: 4,
    type: 'SMS Usage',
    description: '10 SMS (SunnyTech)',
    date: 'Sep 17, 2025 10:12 AM',
    amount: '- GH₵ 5.00',
    amountPositive: false,
    balanceAfter: 'GH₵ 810.00',
    status: 'Completed',
  },
  {
    id: 5,
    type: 'Refund',
    description: 'Failed SMS refund',
    date: 'Sep 16, 2025 02:37 PM',
    amount: '+ GH₵ 20.00',
    amountPositive: true,
    balanceAfter: 'GH₵ 815.00',
    status: 'Completed',
  },
  {
    id: 6,
    type: 'Adjustment',
    description: 'System adjustment',
    date: 'Sep 14, 2025 03:18 PM',
    amount: '+ GH₵ 10.00',
    amountPositive: true,
    balanceAfter: 'GH₵ 795.00',
    status: 'Completed',
  },
];

export const walletPagination = {
  from: 1,
  to: 6,
  total: 45,
  pages: [1, 2, 3, 4, 5],
};

export const spendingPeriods = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days'];

export const activityTypeOptions = [
  'All Types',
  'SMS Purchase',
  'Data Purchase',
  'Wallet Top-up',
  'Refund',
  'Adjustment',
];