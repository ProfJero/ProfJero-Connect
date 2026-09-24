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
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
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
  { label: 'Settings', icon: Settings, path: '/settings' },
];