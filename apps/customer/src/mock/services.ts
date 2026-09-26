// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.
//
// MTN, Vodafone, AirtelTigo are mobile network operators — safe to show.
// No SMS provider names anywhere (see docs/customer-platform.md §11).

import {
  Smartphone,
  PhoneCall,
  Code2,
  Users,
  Layers,
  ShieldCheck,
  Zap,
  Globe,
  type LucideIcon,
} from 'lucide-react';

export const featuredService = {
  badge: 'Featured Service',
  name: 'SMS',
  description: 'Send reliable bulk messages to your customers, members and contacts.',
  ctaLabel: 'Send SMS',
  ctaPath: '/messaging/sms',
  benefits: [
    'Bulk messaging',
    'Fast delivery',
    'Reliable network',
    'Real-time tracking',
  ],
  phonePreview: {
    time: '14:31',
    header: 'New Message',
    message:
      'Hello! Thank you for being part of our community. We appreciate your support.',
    counter: '160 / 1',
  },
};

export interface ServiceCardData {
  id: string;
  name: string;
  description: string;
  status: 'Available' | 'Coming Soon';
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  ctaLabel: string;
  ctaPath?: string;
  tags?: Array<{ label: string; tone?: 'blue' | 'slate' }>;
  telcos?: boolean;
}

export const serviceCards: ServiceCardData[] = [
  {
    id: 'data',
    name: 'Mobile Data',
    description: 'Purchase data bundles for supported networks.',
    status: 'Available',
    icon: Smartphone,
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-[#1a6cf0] dark:text-blue-400',
    ctaLabel: 'Buy Data',
    ctaPath: '/services/data',
    telcos: true,
  },
  {
    id: 'airtime',
    name: 'Airtime',
    description: 'Purchase airtime quickly from your wallet.',
    status: 'Available',
    icon: PhoneCall,
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    ctaLabel: 'Buy Airtime',
    ctaPath: '/services/airtime',
    telcos: true,
  },
  {
    id: 'api',
    name: 'API & Integrations',
    description: 'Connect your applications to ProfJero Connect.',
    status: 'Available',
    icon: Code2,
    iconBg: 'bg-purple-50 dark:bg-purple-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
    ctaLabel: 'Manage API',
    ctaPath: '/api',
    tags: [
      { label: 'REST API', tone: 'blue' },
      { label: 'Webhooks', tone: 'blue' },
      { label: 'Documentation', tone: 'blue' },
    ],
  },
  {
    id: 'voice',
    name: 'Voice Calls',
    description: 'Make and receive calls directly from your wallet.',
    status: 'Coming Soon',
    icon: Users,
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-400',
    ctaLabel: 'Get Notified',
    tags: [
      { label: 'Local & international', tone: 'slate' },
      { label: 'Competitive rates', tone: 'slate' },
    ],
  },
];

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

export const trustBadges = ['Secure', 'Reliable', 'Fast'];