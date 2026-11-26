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
  Package,
  ShoppingBag,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export interface NavLeaf {
  label: string;
  icon: LucideIcon;
  path: string;
  /** Only these roles see the item (default: everyone). */
  roles?: string[];
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  /** Only these roles see the group (default: everyone). */
  roles?: string[];
  items: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

/**
 * Admin sidebar navigation.
 *
 * Groups keep the sidebar short as features grow: new SMS features go
 * inside Messaging, new providers inside Services, new financial views
 * inside Finance. Adding an item never lengthens the top level.
 */
export const navEntries: NavEntry[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },

  { label: 'Projects / Clients', icon: UsersRound, path: '/projects' },

  {
    label: 'Messaging',
    icon: MessageSquare,
    items: [
      { label: 'SMS Logs', icon: FileText, path: '/sms-logs' },
      { label: 'Sender IDs', icon: BadgeCheck, path: '/sender-ids' },
      // Future: Campaigns, Templates, Scheduled Sends
    ],
  },

  {
    label: 'Services',
    icon: Package,
    items: [
      { label: 'Providers', icon: Server, path: '/providers' },
      {
        label: 'Data Bundles',
        icon: Package,
        path: '/providers/data/bundles',
        roles: ['super_admin', 'admin', 'finance'],
      },
      {
        label: 'Data Orders',
        icon: ShoppingBag,
        path: '/providers/data/orders',
        roles: ['super_admin', 'admin', 'finance'],
      },
      { label: 'Pricing', icon: Tag, path: '/pricing' },
      // Future: Airtime, Voice
    ],
  },

  {
    label: 'Finance',
    icon: Wallet,
    items: [
      { label: 'Wallets & Units', icon: Wallet, path: '/wallets' },
      { label: 'Payments', icon: CreditCard, path: '/payments' },
      // Future: Refunds, Invoices
    ],
  },

  {
    label: 'Insights',
    icon: FileBarChart2,
    items: [
      { label: 'Reports', icon: FileBarChart2, path: '/reports' },
      {
        label: 'Monitoring',
        icon: Activity,
        path: '/monitoring',
        roles: ['super_admin', 'admin'],
      },
    ],
  },

  { label: 'Settings', icon: Settings, path: '/settings' },
];

/**
 * Flat list of every leaf, ignoring the group structure. Used to
 * compute which path is the "best match" for the current URL — the
 * longest prefix wins, so /providers/data/bundles beats /providers.
 */
export function flattenLeaves(entries: NavEntry[] = navEntries): NavLeaf[] {
  return entries.flatMap((entry) => (isGroup(entry) ? entry.items : [entry]));
}