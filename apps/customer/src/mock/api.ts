// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.
//
// The API key shown is a *masked* public identifier. Real keys are issued
// through the backend and shown once at creation.

export const apiStatus = {
  state: 'Active' as const,
  live: true,
  description: 'Your API is operational and ready to use.',
};

export const apiKeyInfo = {
  // Masked only — real key never rendered in the browser in full.
  masked: 'pj_live_••••••••••',
  label: 'Public identifier',
  warning: 'Keep your API key secure. Do not share it publicly.',
};

export interface UsageMetric {
  label: string;
  value: string;
  delta: string;
  deltaTone: 'emerald' | 'rose';
  deltaDirection: 'up' | 'down';
  footnote: string;
  iconBg: string;
  iconColor: string;
  icon: 'swap' | 'sms' | 'alert';
}

export const usageMetrics: UsageMetric[] = [
  {
    label: 'Requests Today',
    value: '1,248',
    delta: '↑ 12%',
    deltaTone: 'emerald',
    deltaDirection: 'up',
    footnote: 'vs. yesterday',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    icon: 'swap',
  },
  {
    label: 'SMS Sent via API',
    value: '842',
    delta: '↑ 18%',
    deltaTone: 'emerald',
    deltaDirection: 'up',
    footnote: 'vs. yesterday',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-[#1a6cf0] dark:text-blue-400',
    icon: 'sms',
  },
  {
    label: 'API Errors',
    value: '3',
    delta: '↓ 75%',
    deltaTone: 'emerald',
    deltaDirection: 'down',
    footnote: 'vs. yesterday',
    iconBg: 'bg-rose-50 dark:bg-rose-500/10',
    iconColor: 'text-rose-500 dark:text-rose-400',
    icon: 'alert',
  },
];

export const usagePeriods = ['Last 7 days', 'Last 30 days', 'Last 90 days'];

export type IntegrationId = 'firebase' | 'nodejs' | 'php' | 'python' | 'rest';

export interface IntegrationCard {
  id: IntegrationId;
  name: string;
  description: string;
  guideUrl: string;
}

export const integrationCards: IntegrationCard[] = [
  {
    id: 'firebase',
    name: 'Firebase',
    description: 'Build powerful applications with real-time features and push notifications.',
    guideUrl: '#',
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    description: 'Create scalable backend services with Node.js and our SDK.',
    guideUrl: '#',
  },
  {
    id: 'php',
    name: 'PHP',
    description: 'Integrate with PHP using our easy-to-use library and examples.',
    guideUrl: '#',
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Build and automate with Python using our SDK and examples.',
    guideUrl: '#',
  },
  {
    id: 'rest',
    name: 'REST API',
    description: 'Use our REST API to integrate with any application or system.',
    guideUrl: '#',
  },
];