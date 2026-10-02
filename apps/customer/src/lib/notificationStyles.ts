import { CreditCard, AtSign, AlertTriangle, MessageSquare, KeyRound, UserRound, type LucideIcon } from 'lucide-react';
import type { NotificationSeverity, NotificationType } from './types';

export const NOTIFICATION_TYPES: Record<NotificationType, { label: string; icon: LucideIcon }> = {
  payment: { label: 'Payments', icon: CreditCard },
  sender_id: { label: 'Sender IDs', icon: AtSign },
  low_balance: { label: 'Balance', icon: AlertTriangle },
  sms: { label: 'Messages', icon: MessageSquare },
  api_key: { label: 'API', icon: KeyRound },
  account: { label: 'Account', icon: UserRound },
};

export const SEVERITY_STYLES: Record<NotificationSeverity, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  info: 'bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400',
  warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  error: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
};
