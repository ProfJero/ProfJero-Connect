// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.

export const requestFormDefaults = {
  senderId: 'SUNNYTECH',
  purpose: 'Business Notifications',
  organisationName: 'SunnyTech Solutions',
  description:
    'Customer notifications, service updates and general business messages for SunnyTech Solutions.',
};

export const senderIdMaxLength = 11;
export const descriptionMaxLength = 500;

export const purposeOptions = [
  'Business Notifications',
  'Marketing & Promotional',
  'Transactional & Alerts',
  'Authentication & OTP',
];

export interface RequirementItem {
  title: string;
  description: string;
}

export const senderIdRequirements: RequirementItem[] = [
  {
    title: 'Maximum 11 characters',
    description: 'Your Sender ID can be up to 11 characters long.',
  },
  {
    title: 'Must represent the business or organisation',
    description: 'Use a name that clearly identifies your business or organisation.',
  },
  {
    title: 'Cannot impersonate another organisation',
    description:
      'You cannot use names that are similar to existing brands or other organisations.',
  },
  {
    title: 'Approval is required before use',
    description:
      'All requests are reviewed by our team before activation.',
  },
];