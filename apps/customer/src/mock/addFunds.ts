// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.
//
// RULE: no provider names in customer-facing copy.

import { Smartphone, CreditCard, type LucideIcon } from 'lucide-react';

export interface AmountPreset {
  id: string;
  amount: number;
  label: string;
  sublabel: string;
}

export const amountPresets: AmountPreset[] = [
  { id: 'a20', amount: 20, label: 'GH₵20', sublabel: 'Add GH₵20.00' },
  { id: 'a50', amount: 50, label: 'GH₵50', sublabel: 'Add GH₵50.00' },
  { id: 'a100', amount: 100, label: 'GH₵100', sublabel: 'Add GH₵100.00' },
  { id: 'a200', amount: 200, label: 'GH₵200', sublabel: 'Add GH₵200.00' },
  { id: 'a500', amount: 500, label: 'GH₵500', sublabel: 'Add GH₵500.00' },
];

export const minAmount = 5;
export const maxAmount = 10000;

export interface PaymentMethod {
  id: 'mobile-money' | 'card';
  name: string;
  description: string;
  icon: LucideIcon;
  telcos?: Array<{ label: string; tone: 'mtn' | 'telecel' | 'airteltigo' }>;
  cardBrands?: boolean;
}

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'mobile-money',
    name: 'Mobile Money',
    description: 'MTN, Telecel, AirtelTigo',
    icon: Smartphone,
    telcos: [
      { label: 'MTN', tone: 'mtn' },
      { label: 'Telecel', tone: 'telecel' },
      { label: 'AirtelTigo', tone: 'airteltigo' },
    ],
  },
  {
    id: 'card',
    name: 'Card',
    description: 'Visa, Mastercard, etc.',
    icon: CreditCard,
    cardBrands: true,
  },
];

export const processingNotice = {
  title: 'Processing Information',
  body: 'Payments are processed instantly. Your wallet will be credited immediately after successful payment.',
  shortLabel: 'Instant processing',
  shortDetail: 'Wallet credited immediately',
};

export const securityNotice = {
  title: 'Your Payment is Secure',
  body: 'We use industry-standard encryption and trusted payment partners to keep your information safe.',
};