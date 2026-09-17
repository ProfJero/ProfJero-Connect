import {
  LayoutDashboard,
  UsersRound,
  FileText,
  Wallet,
  CreditCard,
  Layers,
  FileBarChart2,
  Settings,
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
  { label: 'SMS Logs', icon: FileText, path: '/sms-logs' },
  { label: 'Wallets & Units', icon: Wallet, path: '/wallets' },
  { label: 'Payments', icon: CreditCard, path: '/payments' },
  { label: 'Arkesel Account', icon: Layers, path: '/arkesel' },
  { label: 'Reports', icon: FileBarChart2, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];