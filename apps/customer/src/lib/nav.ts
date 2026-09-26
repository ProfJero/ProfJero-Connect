import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Store,
  Wallet,
  Receipt,
  Code2,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavChild {
  label: string;
  path: string;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path?: string;
  children?: NavChild[];
  badge?: number;
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  {
    label: 'Messaging',
    icon: MessageSquare,
    path: '/messaging',
    children: [
      { label: 'Send SMS', path: '/messaging/sms' },
      { label: 'Sender IDs', path: '/messaging/sender-ids' },
    ],
  },
  {
    label: 'Contacts',
    icon: Users,
    children: [
      { label: 'All Contacts', path: '/contacts' },
      { label: 'Contact Groups', path: '/contacts/groups' },
    ],
  },
  {
    label: 'Services',
    icon: Store,
    path: '/services',
    children: [
      { label: 'Data', path: '/services/data' },
      { label: 'Airtime', path: '/services/airtime' },
    ],
  },
  { label: 'Wallet', icon: Wallet, path: '/wallet' },
  { label: 'Transactions', icon: Receipt, path: '/transactions' },
  { label: 'API & Integrations', icon: Code2, path: '/api' },
  { label: 'Notifications', icon: Bell, path: '/notifications', badge: 3 },
  { label: 'Settings', icon: Settings, path: '/settings' },
];