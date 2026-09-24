// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
// Content lifted from the approved Projects / Clients HTML.

export interface ActivityRow {
  date: string;
  project: string;
  action: string;
  actionColor: 'emerald' | 'amber' | 'blue' | 'rose';
  details: string;
}

export const recentProjectActivity: ActivityRow[] = [
  { date: 'Sep 21, 2025 10:24', project: 'GABS', action: 'SMS sent', actionColor: 'emerald', details: '1,250 messages' },
  { date: 'Sep 21, 2025 09:17', project: 'DBI', action: 'Units used', actionColor: 'amber', details: '500 units' },
  { date: 'Sep 20, 2025 19:52', project: 'Church A', action: 'Project updated', actionColor: 'blue', details: 'Sender ID changed' },
  { date: 'Sep 20, 2025 16:36', project: 'Pharmacy', action: 'API key regenerated', actionColor: 'blue', details: 'New key created' },
  { date: 'Sep 18, 2025 11:03', project: 'School', action: 'Project suspended', actionColor: 'rose', details: 'Manual action' },
];

export interface TopUsageRow {
  name: string;
  avatarBg: string;
  smsSent: string;
  unitsUsed: string;
  unitsBarPct: number;
}

export const topProjectsByUsage: TopUsageRow[] = [
  { name: 'GABS', avatarBg: 'bg-blue-600', smsSent: '12,480', unitsUsed: '15,200', unitsBarPct: 85 },
  { name: 'Pharmacy', avatarBg: 'bg-blue-500', smsSent: '6,920', unitsUsed: '8,400', unitsBarPct: 50 },
  { name: 'DBI', avatarBg: 'bg-sky-600', smsSent: '8,760', unitsUsed: '10,200', unitsBarPct: 60 },
  { name: 'HealthPlus', avatarBg: 'bg-purple-600', smsSent: '15,320', unitsUsed: '18,000', unitsBarPct: 95 },
  { name: 'Church A', avatarBg: 'bg-amber-500', smsSent: '2,340', unitsUsed: '3,000', unitsBarPct: 25 },
];

export const projectDetailsPanel = {
  name: 'GABS',
  avatarBg: 'bg-blue-600',
  client: 'GABS Organization',
  status: 'Active' as const,
  senderId: 'GABS',
  apiStatus: 'Active' as const,
  apiKeyMasked: 'sk_live_••••••••••••',
  unitsAvailable: '1,250',
  unitsConsumed: '15,200',
  unitsConsumedPct: 92,
  smsSent: '12,480',
  failedSms: '82',
  failedPct: '0.66%',
  monthlyLimit: '50,000',
  monthlyUsage: '24.96%',
  monthlyUsagePct: 24.96,
  projectName: 'GABS',
  clientLabel: 'GABS Organization',
  createdAt: 'Sep 15, 2025 10:24 AM',
  lastActivity: 'Sep 21, 2025 10:24 AM',
};