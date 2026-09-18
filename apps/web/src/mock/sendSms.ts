// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
// Content lifted from the approved Send SMS HTML.
//
// NOTE: The HTML shows "97 characters, 2 units." Real GSM-7 calculation for
// 97 chars would be 1 unit. The mock preserves the HTML values for UI parity;
// the real segment calculation lives in the backend (see docs/state.md §7).

import { User, Users, Upload, FileText, type LucideIcon } from 'lucide-react';

export interface RecipientTab {
  label: string;
  icon: LucideIcon;
}

export const recipientTabs: RecipientTab[] = [
  { label: 'Single Recipient', icon: User },
  { label: 'Multiple Recipients', icon: Users },
  { label: 'Bulk Upload', icon: Upload },
  { label: 'Import from File', icon: FileText },
];

export const sendSmsForm = {
  selectedProject: {
    name: 'GABS',
    client: 'GABS',
    avatarBg: 'bg-blue-600',
  },
  selectedSenderId: {
    value: 'GABS',
    project: 'GABS',
  },
  phoneNumber: '+233 24 123 4567',
  messageBody:
    'Hello! This is a friendly reminder from GABS.\nYour appointment is scheduled for tomorrow at 9:00 AM.\nThank you!',
  charCount: 97,
  maxChars: 160,
  estimatedUnits: 2,
};

export const unitCalculation = {
  recipients: 1,
  perRecipient: 2,
  total: 2,
};

export const availableUnits = {
  balance: 2450,
  required: 2,
  sufficient: true,
};

export const summary = {
  project: 'GABS',
  projectClient: 'GABS',
  projectAvatarBg: 'bg-blue-600',
  senderId: 'GABS',
  recipientsCount: 245,
  messageUnits: 490,
};

export interface RecipientChip {
  initials: string;
  bg: string;
}

export const recipientChips: RecipientChip[] = [
  { initials: 'AA', bg: 'bg-blue-600' },
  { initials: 'BK', bg: 'bg-emerald-500' },
  { initials: 'CD', bg: 'bg-amber-500' },
  { initials: 'EF', bg: 'bg-cyan-500' },
  { initials: 'GH', bg: 'bg-purple-600' },
];

export const recipientOverflow = 240;