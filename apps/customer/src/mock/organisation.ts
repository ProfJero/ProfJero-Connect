// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.

export const orgIdentity = {
  name: 'GABS Organization',
  accountType: 'Business Account',
  accountId: 'PC-2025-0047',
  logoInitial: 'G',
  logoLabel: 'GABS',
  status: 'Active' as const,
  statusNote: 'Your account is active and all services are available.',
};

export interface OrgDetailRow {
  label: string;
  value: string;
  link?: string;
  icon?: 'location' | 'link';
}

export const orgDetails: OrgDetailRow[] = [
  { label: 'Business/Organisation Name', value: 'GABS Organization' },
  { label: 'Contact Person', value: 'Benjamin Amoako' },
  { label: 'Phone Number', value: '+233 24 123 4567' },
  { label: 'Email Address', value: 'benjamin@profjero.com' },
  { label: 'Location', value: 'Accra, Ghana', icon: 'location' },
  { label: 'Website', value: 'https://gabs.org', link: 'https://gabs.org', icon: 'link' },
];

export const orgAccountType = {
  type: 'Business',
  description:
    'Designed for businesses, organisations and institutions with multiple users and projects.',
};

export interface OrgStatCard {
  id: string;
  label: string;
  value: string;
  footnote: string;
  path: string;
  icon: 'team' | 'projects' | 'keys' | 'sender-ids' | 'wallet';
}

export const orgStatCards: OrgStatCard[] = [
  { id: 'team', label: 'Team Members', value: '2', footnote: 'Manage your team members', path: '/settings', icon: 'team' },
  { id: 'projects', label: 'Projects', value: '3', footnote: 'Manage your projects', path: '/projects', icon: 'projects' },
  { id: 'keys', label: 'API Keys', value: '2', footnote: 'View and manage API keys', path: '/api', icon: 'keys' },
  { id: 'sender-ids', label: 'Sender IDs', value: '2', footnote: 'Manage sender IDs', path: '/messaging/sender-ids', icon: 'sender-ids' },
  { id: 'wallet', label: 'Wallet Balance', value: 'GH₵ 250.00', footnote: 'Add funds or view transactions', path: '/wallet', icon: 'wallet' },
];