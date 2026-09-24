// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.
//
// RULE: no provider names in customer-facing copy.

export const senderId = {
  value: 'SunnyTech',
  verified: true,
};

export interface RecipientTab {
  id: 'contacts' | 'manual' | 'upload';
  title: string;
  description: string;
}

export const recipientTabs: RecipientTab[] = [
  { id: 'contacts', title: 'Select Contacts', description: 'Choose from your contact list' },
  { id: 'manual', title: 'Enter Phone Numbers', description: 'Add numbers manually' },
  { id: 'upload', title: 'Upload Contacts', description: 'Import from file (CSV, XLSX)' },
];

export const selectedContacts = {
  count: 125,
  label: '125 contacts',
};

export const messageBody =
  'Hello valued customer,\n\nThank you for choosing SunnyTech! We appreciate your continued support.\n\nFor any enquiries, feel free to reach us.\n\nBest regards,\nSunnyTech Team';

export const messageMetrics = {
  characters: 157,
  maxCharacters: 160,
  segments: 1,
  segmentSize: 160,
  estimatedUnits: 125,
};

export const walletInfo = {
  balance: 4850,
  sufficient: true,
  required: 125,
};

export const messageDetails = {
  senderId: 'SunnyTech',
  messageLength: '157 characters',
  segments: '1 (160 characters)',
  estimatedUnits: '125',
};