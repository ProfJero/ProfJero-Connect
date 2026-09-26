// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.
//
// RULE: no provider names in customer-facing copy. "Card payment" or
// "Mobile Money", never a gateway brand.

import {
  User,
  Building2,
  Lock,
  Bell,
  CreditCard,
  Code2,
  Sliders,
  type LucideIcon,
} from 'lucide-react';

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const settingsNavItems: SettingsNavItem[] = [
  { id: 'profile', label: 'Profile', icon: User, path: '/settings' },
  { id: 'organisation', label: 'Organisation', icon: Building2, path: '/settings/organisation' },
  { id: 'security', label: 'Security', icon: Lock, path: '/settings#security' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/settings#notifications' },
  { id: 'billing', label: 'Billing', icon: CreditCard, path: '/settings#billing' },
  { id: 'api', label: 'API', icon: Code2, path: '/settings#api' },
  { id: 'preferences', label: 'Preferences', icon: Sliders, path: '/settings#preferences' },
];

export const profileData = {
  fullName: 'Benjamin Amoako',
  email: 'benjamin@profjero.com',
  phone: '+233 24 123 4567',
  initials: 'BA',
};

export const organisationData = {
  name: 'GABS Organization',
  businessType: 'Education',
  address: 'Accra, Ghana',
  phone: '+233 24 123 4567',
  email: 'info@gabs.org',
};

export const businessTypeOptions = ['Education', 'Technology', 'Finance', 'Healthcare', 'Retail', 'Other'];

export interface SecurityItem {
  id: 'password' | 'sessions' | 'two-factor';
  label: string;
  description: string;
  comingSoon?: boolean;
}

export const securityItems: SecurityItem[] = [
  {
    id: 'password',
    label: 'Change Password',
    description: 'Update your password regularly to keep your account safe.',
  },
  {
    id: 'sessions',
    label: 'Active Sessions',
    description: 'View and manage your active login sessions.',
  },
  {
    id: 'two-factor',
    label: 'Two-factor authentication',
    description: 'Add an extra layer of security to your account.',
    comingSoon: true,
  },
];

export interface NotificationToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const notificationToggles: NotificationToggle[] = [
  {
    id: 'sms-alerts',
    label: 'SMS alerts',
    description: 'Receive notifications about your SMS activity.',
    enabled: true,
  },
  {
    id: 'payment-alerts',
    label: 'Payment alerts',
    description: 'Get notified about payments and wallet activity.',
    enabled: true,
  },
  {
    id: 'low-balance',
    label: 'Low balance alerts',
    description: 'Be notified when your balance is running low.',
    enabled: true,
  },
  {
    id: 'sender-id',
    label: 'Sender ID notifications',
    description: 'Get updates about your sender ID requests and status.',
    enabled: true,
  },
];

export const billingData = {
  paymentMethod: 'Mobile Money',
  status: 'Active' as const,
  nextBillingDate: 'Oct 15, 2025',
  billingCycle: 'Monthly subscription',
};

export const apiData = {
  status: 'Active' as const,
  description: 'Your API is ready to use.',
};