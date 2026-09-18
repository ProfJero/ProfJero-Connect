// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
// Content lifted from the approved Reports HTML.

import {
  MessageSquare,
  Package,
  DollarSign,
  X,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

export interface KpiCardData {
  label: string;
  value: string;
  delta: string;
  deltaColor: 'emerald' | 'red';
  icon: LucideIcon;
  iconBg: string;
}

export const kpiCards: KpiCardData[] = [
  { label: 'Total SMS Sent', value: '245,680', delta: '12%', deltaColor: 'emerald', icon: MessageSquare, iconBg: 'bg-blue-500' },
  { label: 'Units Consumed', value: '189,450', delta: '10%', deltaColor: 'emerald', icon: Package, iconBg: 'bg-emerald-600' },
  { label: 'Revenue (Units)', value: 'GHS 18,750.00', delta: '14%', deltaColor: 'emerald', icon: DollarSign, iconBg: 'bg-indigo-600' },
  { label: 'Failed SMS', value: '2,340', delta: '32%', deltaColor: 'red', icon: X, iconBg: 'bg-red-500' },
  { label: 'Gross Margin', value: '68.5%', delta: '6%', deltaColor: 'emerald', icon: TrendingUp, iconBg: 'bg-amber-500' },
];

export const smsAnalyticsData = [
  { day: 'Sep 15', total: 9000, successful: 8500, failed: 4800 },
  { day: 'Sep 16', total: 9200, successful: 8800, failed: 4900 },
  { day: 'Sep 17', total: 8500, successful: 8100, failed: 4850 },
  { day: 'Sep 18', total: 8700, successful: 8300, failed: 4900 },
  { day: 'Sep 19', total: 10500, successful: 10100, failed: 5100 },
  { day: 'Sep 20', total: 10200, successful: 9800, failed: 5050 },
  { day: 'Sep 21', total: 9500, successful: 9000, failed: 5000 },
];

export const smsAnalyticsSummary = [
  { label: 'Daily SMS', value: '8,240', delta: '15%', deltaColor: 'emerald' as const },
  { label: 'Weekly SMS', value: '52,730', delta: '12%', deltaColor: 'emerald' as const },
  { label: 'Monthly SMS', value: '245,680', delta: '10%', deltaColor: 'emerald' as const },
  { label: 'Units Consumed', value: '189,450', delta: '10%', deltaColor: 'emerald' as const },
  { label: 'Success Rate', value: '97.2%', delta: '1.3%', deltaColor: 'emerald' as const },
  { label: 'Failure Rate', value: '2.8%', delta: '1.3%', deltaColor: 'red' as const, deltaDirection: 'down' as const },
];

export interface ProjectPerfRow {
  name: string;
  avatarBg: string;
  smsVolume: string;
  unitsUsed: string;
  revenue: string;
  growth: string;
  failureRate: string;
}

export const projectPerformance: ProjectPerfRow[] = [
  { name: 'GABS', avatarBg: 'bg-blue-100 text-blue-600', smsVolume: '68,420', unitsUsed: '52,300', revenue: 'GHS 6,850.00', growth: '18%', failureRate: '2.4%' },
  { name: 'DBI', avatarBg: 'bg-teal-100 text-teal-600', smsVolume: '54,230', unitsUsed: '41,780', revenue: 'GHS 5,420.00', growth: '12%', failureRate: '3.1%' },
  { name: 'Church A', avatarBg: 'bg-orange-100 text-orange-600', smsVolume: '38,760', unitsUsed: '29,450', revenue: 'GHS 3,920.00', growth: '8%', failureRate: '1.8%' },
  { name: 'Pharmacy', avatarBg: 'bg-pink-100 text-pink-600', smsVolume: '31,500', unitsUsed: '24,600', revenue: 'GHS 2,980.00', growth: '6%', failureRate: '4.2%' },
  { name: 'School', avatarBg: 'bg-indigo-100 text-indigo-600', smsVolume: '22,770', unitsUsed: '17,320', revenue: 'GHS 2,100.00', growth: '5%', failureRate: '2.7%' },
];

export const smsVolumeTrendData = [
  { period: 'Sep 15 - 21', sent: 12800, consumed: 10500 },
  { period: 'Sep 8 - 14', sent: 10200, consumed: 8600 },
  { period: 'Sep 1 - 7', sent: 9400, consumed: 7100 },
  { period: 'Aug 25 - 31', sent: 13500, consumed: 11200 },
  { period: 'Aug 18 - 24', sent: 12700, consumed: 9800 },
  { period: 'Aug 11 - 17', sent: 10200, consumed: 11200 },
];

export const unitConsumptionData = [
  { name: 'GABS', value: 27.6, color: '#2563eb' },
  { name: 'DBI', value: 22.0, color: '#0d9488' },
  { name: 'Church A', value: 15.5, color: '#f59e0b' },
  { name: 'Pharmacy', value: 13.0, color: '#ec4899' },
  { name: 'School', value: 9.1, color: '#8b5cf6' },
  { name: 'Others', value: 12.8, color: '#64748b' },
];

export const totalUnitsUsed = '189,450';

export const revenueCostData = [
  { period: 'Sep 15 - 21', revenue: 18500, cost: 6750 },
  { period: 'Sep 8 - 14', revenue: 14200, cost: 5200 },
  { period: 'Sep 1 - 7', revenue: 16400, cost: 5900 },
  { period: 'Aug 25 - 31', revenue: 17600, cost: 6300 },
];

export interface FinancialCard {
  label: string;
  shortLabel: string;
  shortBg: string;
  value: string;
  delta: string;
}

export const financialCards: FinancialCard[] = [
  { label: 'Revenue from Units', shortLabel: 'R', shortBg: 'bg-blue-100 text-blue-600', value: 'GHS 18,750.00', delta: '14%' },
  { label: 'Estimated Arkesel Cost', shortLabel: 'E', shortBg: 'bg-amber-100 text-amber-600', value: 'GHS 6,750.00', delta: '11%' },
  { label: 'Gross Revenue', shortLabel: 'G', shortBg: 'bg-emerald-100 text-emerald-600', value: 'GHS 25,500.00', delta: '13%' },
  { label: 'Gross Margin', shortLabel: 'M', shortBg: 'bg-purple-100 text-purple-600', value: '68.5%', delta: '6%' },
  { label: 'Payment Volume', shortLabel: 'P', shortBg: 'bg-teal-100 text-teal-600', value: 'GHS 22,400.00', delta: '16%' },
  { label: 'Average Purchase', shortLabel: 'A', shortBg: 'bg-violet-100 text-violet-600', value: 'GHS 560.00', delta: '8%' },
];

export const usageTrendsData = [
  { day: 'Sep 15', sent: 5400, units: 4200 },
  { day: 'Sep 16', sent: 7800, units: 6100 },
  { day: 'Sep 17', sent: 9200, units: 7400 },
  { day: 'Sep 18', sent: 8500, units: 6900 },
  { day: 'Sep 19', sent: 10200, units: 8500 },
  { day: 'Sep 20', sent: 11400, units: 9200 },
  { day: 'Sep 21', sent: 11000, units: 8900 },
];

export interface ProviderActivityRow {
  time: string;
  label: string;
  tone: 'Normal' | 'Warning' | 'Info';
  icon: string;
  iconBg: string;
  iconColor: string;
}

export const providerActivityRows: ProviderActivityRow[] = [
  { time: 'Sep 21, 10:24 AM', label: 'API request successful (200)', tone: 'Normal', icon: '✓', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { time: 'Sep 21, 09:17 AM', label: 'SMS sent - 250 messages', tone: 'Normal', icon: '↑', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { time: 'Sep 20, 06:17 PM', label: 'API timeout error', tone: 'Warning', icon: '×', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  { time: 'Sep 19, 03:42 PM', label: 'Sender ID updated (PROFJERO)', tone: 'Info', icon: 'i', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { time: 'Sep 18, 11:26 AM', label: 'Balance check - GHS 220.00', tone: 'Info', icon: 'G', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
];