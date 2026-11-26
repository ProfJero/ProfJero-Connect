// Static marketing copy for the Services page (not account data).
// The services themselves live in lib/services.ts.
//
// MTN, Telecel, AirtelTigo are mobile network operators — safe to show.
// No SMS provider names anywhere (see docs/customer-platform.md §11).

import {
  Layers,
  ShieldCheck,
  Zap,
  Globe,
  type LucideIcon,
} from 'lucide-react';

export interface WhyChooseItem {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export const whyChoose: WhyChooseItem[] = [
  {
    title: 'All-in-One Platform',
    description: 'Multiple services. One account.',
    icon: Layers,
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-[#1a6cf0] dark:text-blue-400',
  },
  {
    title: 'Secure & Reliable',
    description: 'Your data and transactions are always protected.',
    icon: ShieldCheck,
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'Fast & Easy',
    description: 'Get started in minutes.',
    icon: Zap,
    iconBg: 'bg-teal-50 dark:bg-teal-500/10',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    title: 'Built for Africa',
    description: 'Designed for Ghana and beyond.',
    icon: Globe,
    iconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
];
