// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
// Content lifted from the approved Settings HTML.

import {
  Settings,
  MessageSquare,
  FolderCog,
  CreditCard,
  Bell,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface SettingsTab {
  label: string;
  icon: LucideIcon;
}

export const settingsTabs: SettingsTab[] = [
  { label: 'General', icon: Settings },
  { label: 'SMS Settings', icon: MessageSquare },
  { label: 'Project Settings', icon: FolderCog },
  { label: 'Payment Settings', icon: CreditCard },
  { label: 'Notifications', icon: Bell },
  { label: 'Security', icon: Shield },
  { label: 'Team / Admin Users', icon: Users },
];

export const platformInfo = {
  name: 'ProfJero SMS',
  description:
    'A central SMS infrastructure platform for managing SMS usage across multiple projects and clients.',
};

export const defaultSettings = {
  timezone: '(GMT) Greenwich Mean Time',
  currency: 'GHS - Ghana Cedi (₵)',
};

export const contactInfo = {
  email: 'support@profjerosms.com',
  phone: '+233 24 123 4567',
  supportPhone: '+233 24 000 1111',
  address: 'Accra, Ghana',
};

export const platformOverview = {
  plan: 'Professional',
  totalProjects: '5',
  totalApiKeys: '8',
  totalSmsUnits: '245,600',
  status: 'Active',
};

export interface QuickActionLink {
  label: string;
  description: string;
  icon: LucideIcon;
}

export const quickActionLinks: QuickActionLink[] = [
  {
    label: 'Manage Projects / Clients',
    description: 'View and manage all connected projects',
    icon: Users,
  },
  {
    label: 'View API Keys',
    description: 'Manage your API keys and credentials',
    icon: Shield,
  },
  {
    label: 'Check SMS Logs',
    description: 'View recent SMS activity and delivery status',
    icon: MessageSquare,
  },
];

export const platformPromo = {
  name: 'ProfJero SMS',
  tagline: 'One Platform. Multiple Projects.',
  description:
    'ProfJero SMS provides a reliable and scalable SMS infrastructure for businesses, organisations and developers. Manage your projects, track usage, handle payments and more — all from one powerful platform.',
  values: [
    { label: 'Secure', tone: 'blue' as const },
    { label: 'Reliable', tone: 'emerald' as const },
    { label: 'Scalable', tone: 'teal' as const },
    { label: '24/7 Support', tone: 'blue' as const },
  ],
};

export interface RecentActivityItem {
  title: string;
  detail: string;
  time: string;
  color: 'emerald' | 'blue' | 'amber';
}

export const recentActivity: RecentActivityItem[] = [
  {
    title: 'Settings updated',
    detail: 'General settings modified by Admin',
    time: '2 hours ago',
    color: 'emerald',
  },
  {
    title: 'New project added',
    detail: 'Church Platform (CHURCH-A)',
    time: '5 hours ago',
    color: 'emerald',
  },
  {
    title: 'API key created',
    detail: 'DBI Project - API Key #8',
    time: '1 day ago',
    color: 'blue',
  },
  {
    title: 'Payment received',
    detail: 'GHS 500.00 (Paystack)',
    time: '1 day ago',
    color: 'emerald',
  },
  {
    title: 'SMS units purchased',
    detail: '10,000 units',
    time: '2 days ago',
    color: 'amber',
  },
];