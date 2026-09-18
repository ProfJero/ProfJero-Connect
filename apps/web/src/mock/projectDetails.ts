// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
// Content lifted from the approved Project Details HTML.

export const projectHeader = {
  id: 'proj_001',
  name: 'GABS',
  avatarBg: 'bg-blue-600',
  status: 'Active' as const,
  senderId: 'GABS',
  created: 'Aug 12, 2025',
};

export interface DetailMetric {
  label: string;
  value: string;
  valuePrefix?: string;
  delta: { direction: 'up' | 'down'; value: string; tone: 'emerald' | 'red' };
  footnote: string;
  iconBg: string;
  icon: 'units' | 'send' | 'alert' | 'percent' | 'calendar' | 'money' | 'clock';
}

export const detailMetrics: DetailMetric[] = [
  { label: 'Current Units', value: '2,450', delta: { direction: 'up', value: '12%', tone: 'emerald' }, footnote: 'Remaining balance', iconBg: 'bg-blue-50 text-blue-600', icon: 'units' },
  { label: 'SMS Sent', value: '12,480', delta: { direction: 'up', value: '18%', tone: 'emerald' }, footnote: 'Total messages', iconBg: 'bg-emerald-50 text-emerald-600', icon: 'send' },
  { label: 'Failed SMS', value: '23', delta: { direction: 'down', value: '40%', tone: 'red' }, footnote: 'Failed messages', iconBg: 'bg-red-50 text-red-500', icon: 'alert' },
  { label: 'Success Rate', value: '99.7%', delta: { direction: 'up', value: '0.3%', tone: 'emerald' }, footnote: 'Delivery success rate', iconBg: 'bg-purple-50 text-purple-600', icon: 'percent' },
  { label: 'Monthly Usage', value: '8,420', delta: { direction: 'up', value: '16%', tone: 'emerald' }, footnote: 'SMS this month', iconBg: 'bg-sky-50 text-sky-600', icon: 'calendar' },
  { label: 'Est. Monthly Cost', value: '168.40', valuePrefix: 'GH₵', delta: { direction: 'up', value: '', tone: 'emerald' }, footnote: 'Based on current rates', iconBg: 'bg-amber-50 text-amber-600', icon: 'money' },
  { label: 'Last Activity', value: '2 hours ago', delta: { direction: 'up', value: '', tone: 'emerald' }, footnote: 'SMS sent', iconBg: 'bg-emerald-50 text-emerald-600', icon: 'clock' },
];

export const usageChart = {
  days: [
    { day: 'Sep 15', smsHeight: 62, failedHeight: 5 },
    { day: 'Sep 16', smsHeight: 58, failedHeight: 4 },
    { day: 'Sep 17', smsHeight: 54, failedHeight: 6 },
    { day: 'Sep 18', smsHeight: 59, failedHeight: 8 },
    { day: 'Sep 19', smsHeight: 72, failedHeight: 5 },
    { day: 'Sep 20', smsHeight: 85, failedHeight: 9 },
    { day: 'Sep 21', smsHeight: 75, failedHeight: 8 },
  ],
  summary: {
    totalSmsSent: '12,480',
    totalUnitsUsed: '8,420',
    failedSms: '23',
    successRate: '99.7%',
  },
};

export const apiInfo = {
  status: 'Active' as const,
  keyMasked: 'pk_live_7f3a9e2c4d1b...',
  stats: {
    requestsToday: '1,248',
    requestsThisMonth: '8,420',
    failedRequests: '12',
  },
  lastActivity: '2 hours ago',
};

export const senderIdInfo = {
  value: 'GABS',
  status: 'Active' as const,
  verified: true,
};

export interface SmsActivityRow {
  date: string;
  recipient: string;
  preview: string;
  status: 'Sent' | 'Failed';
  units: number;
}

export const smsActivity: SmsActivityRow[] = [
  { date: 'Sep 21, 2025 09:42', recipient: '+233 24 123 4567', preview: 'Hello! This is a friendly reminder...', status: 'Sent', units: 1 },
  { date: 'Sep 21, 2025 09:30', recipient: '+233 55 987 6543', preview: 'Your appointment is scheduled...', status: 'Sent', units: 1 },
  { date: 'Sep 21, 2025 09:18', recipient: '+233 20 111 2222', preview: 'Thank you for your support!', status: 'Sent', units: 1 },
  { date: 'Sep 21, 2025 09:05', recipient: '+233 24 765 4321', preview: 'We look forward to seeing you...', status: 'Sent', units: 1 },
  { date: 'Sep 21, 2025 08:50', recipient: '+233 54 321 9876', preview: 'Your order has been confirmed...', status: 'Sent', units: 1 },
];

export const walletInfo = {
  currentBalance: '2,450',
  ghsEquivalent: 'GH₵ 490.00',
  transactions: [
    { date: 'Sep 20, 2025', type: 'Purchase' as const, units: '+5,000', balance: '2,450' },
    { date: 'Sep 18, 2025', type: 'Usage' as const, units: '-1,230', balance: '1,450' },
    { date: 'Sep 16, 2025', type: 'Purchase' as const, units: '+3,000', balance: '2,680' },
    { date: 'Sep 15, 2025', type: 'Usage' as const, units: '-860', balance: '1,680' },
    { date: 'Sep 14, 2025', type: 'Usage' as const, units: '-450', balance: '2,540' },
  ],
};

export const limitsInfo = {
  daily: { limit: '5,000', used: '1,248', percent: 25, usedLabel: '1,248 used (25%)' },
  monthly: { limit: '50,000', used: '8,420', percent: 17, usedLabel: '8,420 used (17%)' },
  remaining: { value: '41,580', percent: 83, label: '83% remaining' },
};

export interface ProjectEventRow {
  date: string;
  event: string;
  details: string;
  status: 'Success' | 'Info';
}

export const projectEvents: ProjectEventRow[] = [
  { date: 'Sep 21, 2025 09:15', event: 'SMS Sent', details: '245 messages sent', status: 'Success' },
  { date: 'Sep 21, 2025 14:32', event: 'Units Credited', details: '5,000 units purchased', status: 'Success' },
  { date: 'Sep 18, 2025 11:20', event: 'API Key Regenerated', details: 'API key was regenerated by admin', status: 'Info' },
  { date: 'Sep 16, 2025 16:05', event: 'Project Created', details: 'GABS project was created', status: 'Info' },
  { date: 'Sep 14, 2025 10:12', event: 'Sender ID Assigned', details: 'GABS assigned as sender ID', status: 'Success' },
];