// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.

import {
  Users,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  Mail,
  type LucideIcon,
} from 'lucide-react';

export interface ContactGroupCard {
  id: string;
  name: string;
  contactCount: number;
  status: 'Active' | 'Inactive';
  lastUpdated: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export const contactGroups: ContactGroupCard[] = [
  {
    id: 'customers',
    name: 'Customers',
    contactCount: 248,
    status: 'Active',
    lastUpdated: 'Sep 21, 2025 09:42 AM',
    description:
      'Your customer contacts for product and service updates, promotions and communication.',
    icon: Users,
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'staff',
    name: 'Staff',
    contactCount: 86,
    status: 'Active',
    lastUpdated: 'Sep 20, 2025 04:18 PM',
    description:
      'Internal staff and team members. Used for workplace communication and updates.',
    icon: Briefcase,
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'students',
    name: 'Students',
    contactCount: 156,
    status: 'Active',
    lastUpdated: 'Sep 19, 2025 11:25 AM',
    description:
      'Students and learners. For school updates, announcements and educational messages.',
    icon: GraduationCap,
    iconBg: 'bg-purple-100 dark:bg-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'parents',
    name: 'Parents',
    contactCount: 124,
    status: 'Active',
    lastUpdated: 'Sep 18, 2025 02:37 PM',
    description:
      'Parents and guardians. For school communication, important notices and events.',
    icon: Heart,
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 'members',
    name: 'Members',
    contactCount: 98,
    status: 'Active',
    lastUpdated: 'Sep 17, 2025 10:12 AM',
    description:
      'Church and community members. For announcements, events and fellowship updates.',
    icon: Star,
    iconBg: 'bg-cyan-100 dark:bg-cyan-500/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'subscribers',
    name: 'Subscribers',
    contactCount: 67,
    status: 'Active',
    lastUpdated: 'Sep 16, 2025 09:45 AM',
    description:
      'Newsletter and marketing subscribers. For promotional messages and updates.',
    icon: Mail,
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
];