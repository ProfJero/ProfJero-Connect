import { LayoutDashboard, Users, Wallet, Bell, Settings, LayoutGrid, type LucideIcon } from 'lucide-react';
import { SERVICES } from './services';

export interface NavChild {
  label: string;
  path: string;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path?: string;
  children?: NavChild[];
  /** Live counter shown next to the item (resolved in CustomerSidebar). */
  badge?: 'unreadNotifications';
  /** Small label after the name ("New", "Soon"). */
  tag?: { label: string; tone: 'new' | 'soon' };
  /** Extra path prefixes that count as "inside" this item. */
  match?: string[];
}

export interface NavSection {
  /** Heading above the group; omitted for the top group. */
  heading?: string;
  /** Optional link at the end of the heading row. */
  action?: { label: string; path: string };
  items: NavItem[];
}

/** Services come straight from the catalogue, so new ones appear here automatically. */
const serviceItems: NavItem[] = SERVICES.filter((s) => s.kind === 'service').map((s) => ({
  label: s.name,
  icon: s.icon,
  path: s.home,
  children: s.pages.length > 0 ? s.pages : undefined,
  tag: s.status === 'soon' ? { label: 'Soon', tone: 'soon' } : s.tag ? { label: s.tag, tone: 'new' } : undefined,
  match: s.id === 'sms' ? ['/messaging'] : s.id === 'data' ? ['/services/data'] : undefined,
}));

const developer = SERVICES.find((s) => s.id === 'api')!;

export const navSections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'All services', icon: LayoutGrid, path: '/services' },
    ],
  },
  {
    heading: 'Services',
    items: serviceItems,
  },
  {
    heading: 'Workspace',
    items: [
      {
        label: 'Contacts',
        icon: Users,
        children: [
          { label: 'All contacts', path: '/contacts' },
          { label: 'Contact groups', path: '/contacts/groups' },
        ],
      },
      {
        label: 'Billing',
        icon: Wallet,
        children: [
          { label: 'SMS wallet', path: '/wallet' },
          { label: 'Buy SMS units', path: '/wallet/add-funds' },
          { label: 'Purchase history', path: '/transactions' },
        ],
        match: ['/wallet', '/transactions'],
      },
      {
        label: 'Developers',
        icon: developer.icon,
        children: developer.pages,
      },
      { label: 'Notifications', icon: Bell, path: '/notifications', badge: 'unreadNotifications' },
      { label: 'Settings', icon: Settings, path: '/settings' },
    ],
  },
];

/** Flat list (kept for callers that just need every item). */
export const navItems: NavItem[] = navSections.flatMap((s) => s.items);
