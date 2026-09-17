// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
// Content lifted from the approved Projects / Clients HTML.

export interface ProjectMetric {
  label: string;
  value: string;
  delta: { direction: 'up' | 'down'; value: string };
  footnote: string;
  iconBg: string;
  icon: 'briefcase' | 'users-round' | 'layers' | 'wallet' | 'alert-circle';
}

export const projectMetrics: ProjectMetric[] = [
  {
    label: 'Total Projects',
    value: '6',
    delta: { direction: 'up', value: '20%' },
    footnote: 'Active projects on the platform',
    iconBg: 'bg-blue-500',
    icon: 'briefcase',
  },
  {
    label: 'Active Projects',
    value: '5',
    delta: { direction: 'up', value: '25%' },
    footnote: 'Running and sending SMS',
    iconBg: 'bg-emerald-500',
    icon: 'users-round',
  },
  {
    label: 'Total SMS Sent',
    value: '78,420',
    delta: { direction: 'up', value: '18%' },
    footnote: 'Across all projects',
    iconBg: 'bg-indigo-600',
    icon: 'layers',
  },
  {
    label: 'Total Units Used',
    value: '45,230',
    delta: { direction: 'up', value: '22%' },
    footnote: 'From 62,500 available',
    iconBg: 'bg-amber-500',
    icon: 'wallet',
  },
  {
    label: 'Failed Messages',
    value: '523',
    delta: { direction: 'down', value: '40%' },
    footnote: '0.67% failure rate',
    iconBg: 'bg-red-500',
    icon: 'alert-circle',
  },
];

export interface Project {
  id: number;
  name: string;
  avatarBg: string;
  client: string;
  senderId: string;
  apiStatus: 'Active' | 'Suspended';
  units: string;
  smsSent: string;
  status: 'Active' | 'Suspended';
  lastActivityDate: string;
  lastActivityTime: string;
}

export const projects: Project[] = [
  {
    id: 1,
    name: 'GABS',
    avatarBg: 'bg-blue-600',
    client: 'GABS',
    senderId: 'GABS',
    apiStatus: 'Active',
    units: '1,250',
    smsSent: '12,480',
    status: 'Active',
    lastActivityDate: 'Sep 21, 2025',
    lastActivityTime: '10:24 AM',
  },
  {
    id: 2,
    name: 'DBI',
    avatarBg: 'bg-sky-600',
    client: 'Digital Bridge Initiative',
    senderId: 'DBI',
    apiStatus: 'Active',
    units: '8,200',
    smsSent: '8,760',
    status: 'Active',
    lastActivityDate: 'Sep 21, 2025',
    lastActivityTime: '09:17 AM',
  },
  {
    id: 3,
    name: 'Church A',
    avatarBg: 'bg-amber-500',
    client: 'Church Platform',
    senderId: 'CHURCH',
    apiStatus: 'Active',
    units: '1,100',
    smsSent: '2,340',
    status: 'Active',
    lastActivityDate: 'Sep 20, 2025',
    lastActivityTime: '07:52 PM',
  },
  {
    id: 4,
    name: 'Pharmacy',
    avatarBg: 'bg-blue-500',
    client: 'Pharmacy System',
    senderId: 'EDPHARMACY',
    apiStatus: 'Active',
    units: '3,500',
    smsSent: '6,920',
    status: 'Active',
    lastActivityDate: 'Sep 20, 2025',
    lastActivityTime: '04:36 PM',
  },
  {
    id: 5,
    name: 'School',
    avatarBg: 'bg-emerald-600',
    client: 'School Platform',
    senderId: 'SCHOOL',
    apiStatus: 'Suspended',
    units: '0',
    smsSent: '0',
    status: 'Suspended',
    lastActivityDate: 'Sep 18, 2025',
    lastActivityTime: '11:03 AM',
  },
  {
    id: 6,
    name: 'HealthPlus',
    avatarBg: 'bg-purple-600',
    client: 'Health Services',
    senderId: 'HEALTH',
    apiStatus: 'Active',
    units: '5,800',
    smsSent: '15,320',
    status: 'Active',
    lastActivityDate: 'Sep 21, 2025',
    lastActivityTime: '08:12 AM',
  },
];

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