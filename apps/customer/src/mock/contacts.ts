// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.

import {
  Users,
  UsersRound,
  CalendarPlus,
  Copy,
  type LucideIcon,
} from 'lucide-react';

export interface ContactStat {
  label: string;
  value: string;
  delta: string;
  deltaTone: 'emerald' | 'rose';
  deltaDirection: 'up' | 'down';
  footnote: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export const contactStats: ContactStat[] = [
  {
    label: 'Total Contacts',
    value: '1,248',
    delta: '-12%',
    deltaTone: 'emerald',
    deltaDirection: 'up',
    footnote: 'vs. last month',
    icon: Users,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-[#1a6cf0]',
  },
  {
    label: 'Active Groups',
    value: '12',
    delta: '+2',
    deltaTone: 'emerald',
    deltaDirection: 'up',
    footnote: 'vs. last month',
    icon: UsersRound,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Recently Added',
    value: '86',
    delta: '-34%',
    deltaTone: 'emerald',
    deltaDirection: 'up',
    footnote: 'vs. last month',
    icon: CalendarPlus,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-600',
  },
  {
    label: 'Duplicates',
    value: '23',
    delta: '-42%',
    deltaTone: 'rose',
    deltaDirection: 'down',
    footnote: 'vs. last month',
    icon: Copy,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
];

export type ContactRole = 'Customer' | 'Partner' | 'Supplier' | 'Staff' | 'Member';
export type ContactGroup =
  | 'Customers'
  | 'Partners'
  | 'Suppliers'
  | 'Staff'
  | 'Members';
export type ContactStatus = 'Active' | 'Inactive';

export interface ContactRow {
  id: number;
  initials: string;
  avatarBg: string;
  name: string;
  role: ContactRole;
  phone: string;
  group: ContactGroup;
  dateAdded: string;
  status: ContactStatus;
}

export const contacts: ContactRow[] = [
  { id: 1, initials: 'AS', avatarBg: 'bg-blue-600', name: 'Ama Serwaa', role: 'Customer', phone: '+233 24 567 8901', group: 'Customers', dateAdded: 'Sep 21, 2025 09:42 AM', status: 'Active' },
  { id: 2, initials: 'KB', avatarBg: 'bg-indigo-600', name: 'Kofi Boateng', role: 'Customer', phone: '+233 20 345 6789', group: 'Customers', dateAdded: 'Sep 20, 2025 04:18 PM', status: 'Active' },
  { id: 3, initials: 'FA', avatarBg: 'bg-teal-500', name: 'Felicity Asante', role: 'Partner', phone: '+233 50 789 0123', group: 'Partners', dateAdded: 'Sep 19, 2025 11:25 AM', status: 'Active' },
  { id: 4, initials: 'DK', avatarBg: 'bg-amber-500', name: 'David Kwadwo', role: 'Supplier', phone: '+233 26 456 7890', group: 'Suppliers', dateAdded: 'Sep 18, 2025 02:37 PM', status: 'Active' },
  { id: 5, initials: 'EB', avatarBg: 'bg-blue-500', name: 'Esi Brew', role: 'Customer', phone: '+233 55 123 4567', group: 'Customers', dateAdded: 'Sep 17, 2025 10:12 AM', status: 'Active' },
  { id: 6, initials: 'GM', avatarBg: 'bg-cyan-600', name: 'Grace Mensah', role: 'Staff', phone: '+233 24 987 6543', group: 'Staff', dateAdded: 'Sep 16, 2025 04:56 PM', status: 'Active' },
  { id: 7, initials: 'JA', avatarBg: 'bg-purple-700', name: 'Joseph K. Amponsah', role: 'Customer', phone: '+233 27 111 2233', group: 'Customers', dateAdded: 'Sep 15, 2025 09:21 AM', status: 'Active' },
  { id: 8, initials: 'IM', avatarBg: 'bg-slate-600', name: 'Irene Mensah', role: 'Customer', phone: '+233 24 333 4455', group: 'Customers', dateAdded: 'Sep 14, 2025 03:18 PM', status: 'Inactive' },
];

export const contactsPagination = {
  from: 1,
  to: 8,
  total: 1248,
  pages: [1, 2, 3, 4, 5],
  lastPage: 157,
};

export const GROUP_TONE: Record<ContactGroup, { bg: string; text: string; border: string }> = {
  Customers: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-500/20' },
  Partners: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-500/20' },
  Suppliers: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-500/20' },
  Staff: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-100 dark:border-cyan-500/20' },
  Members: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-500/20' },
};