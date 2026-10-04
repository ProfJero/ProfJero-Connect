import {
  LayoutDashboard,
  UsersRound,
  FileText,
  Wallet,
  CreditCard,
  Server,
  FileBarChart2,
  Settings,
  BadgeCheck,
  Tag,
  Activity,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  /** Only these roles see the item (default: everyone). */
  roles?: string[];
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Projects / Clients', icon: UsersRound, path: '/projects' },
  { label: 'Sender IDs', icon: BadgeCheck, path: '/sender-ids' },
  { label: 'Pricing', icon: Tag, path: '/pricing' },
  { label: 'SMS Logs', icon: FileText, path: '/sms-logs' },
  { label: 'Wallets & Units', icon: Wallet, path: '/wallets' },
  { label: 'Payments', icon: CreditCard, path: '/payments' },
  { label: 'Providers', icon: Server, path: '/providers' },
  { label: 'Reports', icon: FileBarChart2, path: '/reports' },
  { label: 'Monitoring', icon: Activity, path: '/monitoring', roles: ['super_admin', 'admin'] },
  { label: 'Settings', icon: Settings, path: '/settings' },
];